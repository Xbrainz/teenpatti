let io = require("socket.io");
let _ = require("underscore");
let mongoose = require("mongoose");

let Table = require("../model/table");
let CardInfo = require("../model/cardInfo");
let User = require("../model/user");

let TransactionGiftTip = require("../model/transactionGiftTip");
let transactionType = require("../constant/transactionType");
let newGameService = require("../service/newGame");
let winnerService = require('../service/winner');
let playerService = require('../service/player');
let sideShowService = require('../service/sideShow');
let betService = require('../service/bet');
let userTableInOutService = require("../service/userTableInOut");
let gameAuditService = require("../service/gameAudit");
let seeMyCardService = require("../service/seeMyCard")

const staticValue = require("../constant/staticValue");
const auditType = require("../constant/audittype");

function isPotLimitExceeded(tableInfo) {
  if (tableInfo.amount) {
    return tableInfo.amount > tableInfo.potLimit;
  }
  return false;
}

function getActivePlayers(players) {
  let count = 0;
  for (let player in players) {
    if (players[player].active && !players[player].packed) {
      count++;
    }
  }
  return count;
}

function getOnlyActivePlayers(players) {
  let count = 0;
  for (let player in players) {
    if (players[player].active) {
      count++;
    }
  }
  return count;
}

function resetSideShowTurn(players) {
  for (let player in players) {
    players[player].sideShowTurn = false;
  }
  return players;
}

function isActivePlayer(id, players) {
  return players[id] && players[id].active;
}

function sideShowDenied(id, players) {
  players[id].lastAction = "Denied";
  return players;
}

let startNewGameTime;
let startNewGamePlyerJoinTime;

function code() {
  return {
    init: function (server) {
      let objServ = io.listen(server, {
        pingInterval: 20000,
        pingTimeout: 60000,
      });
      let ios = objServ.sockets;
      ios.on("connection", function (client) {
        client.on("watchTable", async function (args) {
			
		  //args = JSON.parse(args);
          let inId = args.tableId;
          let table = await Table.findOne({ _id: inId });
          client.join(inId, async function () {
            console.log("watch table: "+ inId);
          });
          
          client.emit("watchTable", { players: table.players, table });

          //client.broadcast.to(inId).emit("watchTable", { players: table.players, table });
        });

        client.on("joinTable", async function (args) {
          console.log("joined table" );
		   
		  args = JSON.parse(args);
		  console.log(args.tableId + " aa");
          await userTableInOutService.tableInOut(args.tableId, args.userId, 'In');
          let inId = args.tableId;
          let tableLength = await Table.findOne({ _id: args.tableId });
          let playersLength;
          if (tableLength.players == null) {
            playersLength = 0;
          } else {
            playersLength = Object.keys(tableLength.players).length;
          }
          if (playersLength <= 5) {
            let delay = Number(Math.random(0, 1000));
            setTimeout(function () {
              client.join(inId, async function () {
                await User.update({ _id: args.userId }, { $set: { tableId: args.tableId, clientId: client.id } });
                let table = await Table.findOne({ _id: args.tableId });
                let myData = await User.findOne({ _id: args.userId });
                myData.userId = args.userId;
                myData.clientId = args.clientId;
                if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {
                  let player = { 
                    id: args.userId,
                    cardSet: {
                      closed: true,
                    },
                    playerInfo: myData,
                  };
                  table.slotUsedArray.sort(function (a, b) {
                    return a - b;
                  });
                  await playerService.addPlayer(table, player, client, async function (addedPlayer, avialbleSlots) {
                    console.log(addedPlayer.slot);
                    let myTable = await Table.findOne({ _id: args.tableId });
                    if (addedPlayer !== null) {
                      let newPlayer = {
                        id: args.userId,
                        tableId: args.tableId,
                        slot: addedPlayer.slot,
                        turn: false,
                        active: addedPlayer.active,
                        winner: null,
                        packed: addedPlayer.packed,
                        playerInfo: args,
                        lastAction: "",
                        lastBet: "",
                        cardSet: addedPlayer.cardSet,
                        otherPlayers: myTable.players,
                      };
                      await Table.update({ _id: args.tableId }, { $inc: { playersLeft: 1 } });
                      client.emit("tableJoined", newPlayer);
                      client.broadcast.to(args.tableId).emit("newPlayerJoined", newPlayer);
                      newGameService.startNewGameOnPlayerJoin(client, myTable, avialbleSlots, args.tableId);
                    }
                  });
                }
              });
            }, delay * 1000);
          }
        });

        client.emit("connectionSuccess", {
          id: client.id,
        });

        client.on("seeAllCards", async function (args) {
		  args = JSON.parse(args);
          let user = [];
          let adminUser = [];
          let playerss = Object.values(args.players);

          for (let j = 0; playerss.length > j; j++) {
            let admin = playerss[j].playerInfo;
            if (admin.isAdmin === true) {
              adminUser.push(admin);
            }
          }

          for (let i = 0; playerss.length > i; i++) {
            let players = playerss[i];
            let cardInfos = await CardInfo.findOne({ _id: players.cardInfo });
            let cards = Object.entries(cardInfos.info);

            cards.forEach(([key, value]) => {
              if (players.id === key) {
                user.push(new Array(players, value));
              }
            });
          }
          client.emit("allCards", user, adminUser);
        });

        client.on("ReplaceCard", async function (args) {
			args = JSON.parse(args);
          let replaceArray = [];
          const cardInfo = await CardInfo.findById(args.current.cardInfo);
          let cards = Object.entries(cardInfo.info);

          cards.forEach(([key, value]) => {
            if (args.playerid === key) {
              cardInfo.info[args.playerid].cards.length = 0;
              cardInfo.info[args.playerid].cards.push.apply(
                cardInfo.info[args.playerid].cards,
                args.cards
              );
              replaceArray.push({ player: args.playerid, value });
            }
          });

          replaceArray[0].value.cards.length = 0;
          replaceArray[0].value.cards.push.apply(
            replaceArray[0].value.cards,
            args.cards
          );

          const cardInfos = await CardInfo.replaceOne(
            {
              _id: mongoose.Types.ObjectId(args.current.cardInfo),
            },
            {
              tableId: mongoose.Types.ObjectId(args.tableId),
              info: cardInfo.info,
              joker: cardInfo.joker,
              jokers: cardInfo.jokers,
              updatedAt: cardInfo.createdAt,
              createdAt: cardInfo.updatedAt,
            }
          );
          client.emit("doneReplaceCards", replaceArray);
        });

        client.on("SendGift", async function (args) {
			args = JSON.parse(args);
          const newUser = await User.update(
            { _id: mongoose.Types.ObjectId(args.fromId) },
            { $inc: { chips: -args.price } }
          );
          const adminUser = await User.update(
            { _id: mongoose.Types.ObjectId(staticValue.ADMIN_ID) },
            { $inc: { chips: args.price } }
          );

          const user = await User.findOne({ _id: args.fromId });
          const transaction = await TransactionGiftTip.create({
            senderId: mongoose.Types.ObjectId(args.fromId),
            receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
            tableId:  mongoose.Types.ObjectId(args.tableId),
            coins: args.price,
            transType: transactionType.GIFT,
          });

          let tableData = await Table.findOne({ _id: args.tableId });
          let players = tableData.players;
          players[args.fromId].playerInfo.chips = user.chips;

          await Table.update(
            { _id: args.tableId },
            { $set: { players: players } }
          );

          await gameAuditService.createAudit(tableData._id, tableData.cardinfoId, args.fromId, tableData.lastGameId, auditType.GIFT, 0, args.price, user.chips, 'GIFT', 'Gift', tableData.amount, tableData.players, 0, '');

          client.emit("GiftSended", {
            args,
            user,
            players
          });

          client.broadcast.to(args.tableId).emit("GiftSended", {
            args,
            user,
            players
          });
        });

        client.on("TipToGirl", async function (args) {
			console.log("TipToGirl" );
			args = JSON.parse(args);
          const newUser = await User.update(
            { _id: mongoose.Types.ObjectId(args.fromId) },
            { $inc: { chips: -args.tip } }
          );
          const adminUser = await User.update(
            { _id: mongoose.Types.ObjectId(staticValue.ADMIN_ID) },
            { $inc: { chips: args.tip } }
          );
          const user = await User.findOne({ _id: args.fromId });
          const transaction = await TransactionGiftTip.create({
            senderId: mongoose.Types.ObjectId(args.fromId),
            receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
            tableId:  mongoose.Types.ObjectId(args.tableId),
            coins: args.tip,
            transType: transactionType.TIP,
          });

          let tableData = await Table.findOne({ _id: args.tableId });
          let players = tableData.players;
          players[args.fromId].playerInfo.chips = user.chips;

          await Table.update(
            { _id: args.tableId },
            { $set: { players: players } }
          );

          await gameAuditService.createAudit(tableData._id, tableData.cardinfoId, args.fromId, tableData.lastGameId, auditType.TIP, 0, args.tip, user.chips, 'TIP', 'Tip', tableData.amount, tableData.players, 0, '');

          client.emit("sendTips", {
            message: `Sending Tip By ${user.displayName}`,
            tip: args.tip,
            player: args.fromId,
            user,
            players,
          });

          client.broadcast.to(args.tableId).emit("sendTips", {
            message: `Sending Tip By ${user.displayName}`,
            tip: args.tip,
            player: args.fromId,
            user,
            players,
          });
        });

        client.on("seeMyCards", async function (args) {
			args = JSON.parse(args);
          let table = await Table.findOne({ _id: args.tableId });
          let avialbleSlots = {};
          table.slotUsedArray.forEach(function (d) {
            avialbleSlots["slot" + d] = "slot" + d;
          });

          let getCardInfo = await CardInfo.findOne({ _id: args.current.cardInfo });
          let cardsInfo = getCardInfo.info[args.current.id].cards;
          let players = await sideShowService.updateSideShow(args.current.id, table.players, avialbleSlots, table.maxPlayers);
          
          players[args.current.id].cardSeen = true;
          await Table.update({ _id: args.tableId },{ $set: { players: players } });
          
          let userData = await User.findById({ _id: args.current.id });
          let cardsInfoNew = seeMyCardService.convertSetsForAK47AndJoker(table, args.current.id, getCardInfo);

          await gameAuditService.createAudit(table._id, getCardInfo._id, args.current.id, table.lastGameId, auditType.SEE_BTN_CLICK, 0, 0, userData.chips, 'SEE', '', table.amount, table.players, 0, '');

          client.emit("cardsSeen", {cardsInfo, players, table, cardsInfoNew});
          client.broadcast.to(args.tableId).emit("playerCardSeen", { id: args.current.id, players, table});
                    
        });

        client.on("selectGame", async function (args) {
			args = JSON.parse(args);
          await Table.update({ _id: args.tableId }, { type: args.type, gameType: parseInt(args.gameType) });
          client.emit("selectGame", "game selected");
          client.broadcast.emit("selectGame", "game selected");
        });

        client.on("placePack", async function (args) {
			args = JSON.parse(args);
          let table = args.table;
          let tablee = await Table.findOne({ _id: table._id });
          
          if(tablee.players && tablee.players[args.player.id])
          {
            let avialbleSlots = {};
            tablee.slotUsedArray.forEach(function (d) {
              avialbleSlots["slot" + d] = "slot" + d;
            });
            
            let maxPlayers = table.maxPlayers;
            
            let players = await betService.packPlayer(args.player.id, tablee.players, avialbleSlots, maxPlayers, tablee._id);
            let tabler = await Table.update({ _id: tablee._id }, { $set: { players: players } });
            
            let userData = await User.findById({ _id: args.player.id });
            await gameAuditService.createAudit(tablee._id, tablee.cardinfoId, args.player.id, tablee.lastGameId, auditType.USER_TURN, 0, 0, userData.chips, 'Pack', 'Packed', tablee.amount, tablee.players, 0, '');
            
            if (getActivePlayers(players) === 1) {
                        
              winnerService.decideWinner(table, players, tablee.cardinfoId, false, "", async function (message, players3) {
                client.emit("playerPacked", {
                  bet: args.bet,
                  placedBy: args.player.id,
                  players: players,
                  table: table,
                });

                client.broadcast.to(table._id).emit("playerPacked", {
                  bet: args.bet,
                  placedBy: args.player.id,
                  players: players,
                  table: table,
                });

                client.emit("showWinner", {
                  message,
                  bet: args.bet,
                  placedBy: args.player.id,
                  players: players3,
                  table: table,
                  packed: true,
                  activePlayerCount : 1,
                });

                client.broadcast.to(table._id).emit("showWinner", {
                  message,
                  bet: args.bet,
                  placedBy: args.player.id,
                  players: players3,
                  table: table,
                  packed: true,
                  activePlayerCount : 1,
                });

                await Table.update({ _id: table._id }, { $set: { gameStarted: false, players: players3 } });
                              
                newGameService.startNewGame(client, table._id, avialbleSlots);
              });
            } else {
              client.emit("playerPacked", {
                bet: args.bet,
                placedBy: args.player.id,
                players: players,
                table: table,
              });
              client.broadcast.to(args.table._id).emit("playerPacked", {
                bet: args.bet,
                placedBy: args.player.id,
                players: players,
                table: table,
              });
            }
          }
        });


        client.on("placeBet", async function (args) {
			args = JSON.parse(args);
		console.log("placeBet" );
		
          let tablee = await Table.findOne({ _id: args.tableInfo._id });
          let avialbleSlots = {};
          tablee.slotUsedArray.forEach(function (d) {
            avialbleSlots["slot" + d] = "slot" + d;
          });
          
          await betService.placeBet(args.player.id, args.bet.amount, args.bet.blind, args.player.playerInfo._id,
              tablee.players, tablee, avialbleSlots, tablee.maxPlayers, args.bet.show);
              
          let table = await Table.findOne({ _id: args.tableInfo._id });
          console.log("placeBet ..2 " );
          if (args.bet.show || isPotLimitExceeded(table)) {
            let showPlayerId = "";
            if(args.bet.show) {
              showPlayerId = args.player.id;
            }
            args.bet.show = true;
            winnerService.decideWinner(table, table.players, tablee.cardinfoId, args.bet.show, showPlayerId, async function (winmsg, players3) {
              let msg = winmsg;

              client.broadcast.to(args.tableInfo._id).emit("betPlaced", {
                bet: args.bet,
                placedBy: args.player.id,
                players: table.players,
                table: table,
              });

              client.emit("showWinner", {
                message: msg,
                bet: args.bet,
                placedBy: args.player.id,
                players: players3,
                table: table,
                potLimitExceeded: isPotLimitExceeded(table)
              });

              client.broadcast.to(args.tableInfo._id).emit("showWinner", {
                message: msg,
                bet: args.bet,
                placedBy: args.player.id,
                players: players3,
                table: table,
                potLimitExceeded: isPotLimitExceeded(table)
              });

              await Table.update(
                { _id: table._id },
                { $set: { gameStarted: false, players: players3 } }
              );

              newGameService.startNewGame(client, table._id, avialbleSlots);
    
            });
          } else {
			  
			 
			
			console.log("placeBet ..3 " );
            client.emit("betPlaced", {
              bet: args.bet,
              placedBy: args.player.id,
              players: table.players,
              table: table,
            });
			console.log("placeBet ..5 " );
            client.broadcast.to(args.tableInfo._id).emit("betPlaced", {
              bet: args.bet,
              placedBy: args.player.id,
              players: table.players,
              table: table,
            });
			
			  
          }
        });

        client.on("respondSideShow", async function (args) {
			args = JSON.parse(args);
          let table = await Table.findOne({ _id: args.tableId });
          let avialbleSlots = {};
          table.slotUsedArray.forEach(function (d) {
            avialbleSlots["slot" + d] = "slot" + d;
          });
          let players1 = table.players, msg = "";
          let playerss = resetSideShowTurn(players1);
          if (args.lastAction === "Denied") {
            let players3 = playerService.setNextPlayerTurn(playerss, avialbleSlots, table._id);
            let players = sideShowDenied(args.player.id, players3);

            let remark = "with "+ players[args.placedTo].playerInfo.userName
            await gameAuditService.createAudit(table._id, table.cardinfoId, args.player.id, table.lastGameId, auditType.USER_TURN, 0, 0, players[args.player.id].playerInfo.chips, 'Denied', remark, table.amount, players, 0, '');
            
            let newPlayers = await Table.update(
              { _id: args.tableId },
              { $set: { players: players } }
            );
            msg = [
              args.player.playerInfo.displayName,
              " has denied side show",
            ].join("");
            client.emit("sideShowResponded", {
              message: msg,
              placedBy: args.player.id,
              players: players,
              placeTo: args.placedTo,
              bet: args.bet,
              table: table,
            });
            client.broadcast.to(args.tableId).emit("sideShowResponded", {
              message: msg,
              bet: args.bet,
              placeTo: args.placedTo,
              placedBy: args.player.id,
              players: players,
              table: table,
            });
          } else if (args.lastAction === "Accepted") {
            let players3 = playerService.setNextPlayerTurn(playerss, avialbleSlots, table._id);
            sideShowService.sideShowAccepted(
              args.player.id,
              args.placedTo,
              playerss,
              table,
              avialbleSlots,
              function (message, player, cardsToShow, players) {
                client.emit("sideShowResponded", {
                  message: message,
                  placedBy: args.player.id,
                  placeTo: args.placedTo,
                  player: player,
                  bet: args.bet,
                  players: players,
                  table: table,
                  cardsToShow: cardsToShow,
                });
                client.broadcast
                  .to(args.tableId)
                  .emit("sideShowResponded", {
                    message: message,
                    bet: args.bet,
                    placeTo: args.placedTo,
                    player: player,
                    placedBy: args.player.id,
                    players: players,
                    table: table,
                    cardsToShow: cardsToShow,
                  });
              }
            );
          }
        });

        client.on("placeSideShow", async function (args) {
			args = JSON.parse(args);
          let table = await Table.findOne({ _id: args.tableId });
          let sideShowMessage = "";
          let players = await sideShowService.placeSideShow( args.player.id, args.bet.amount, args.bet.blind, table.players, table, args.placedTo);
          sideShowMessage = [players[args.player.id].playerInfo.displayName, ' asking for side show'].join('');
          if (isPotLimitExceeded(table)) {
            args.bet.show = true;
            winnerService.decideWinner(table, players, table.cardinfoId, args.bet.show, true, "", async function (msg, players1) {
              await Table.update({ _id: table._id }, { $set: { gameStarted: false } });
                      
              client.emit("showWinner", {
                message: msg,
                bet: args.bet,
                placedBy: args.player.id,
                placedTo: args.placedTo,
                players: players1,
                table: table,
                potLimitExceeded: isPotLimitExceeded(table)
              });
              client.broadcast.to(args.tableId).emit("showWinner", {
                message: msg,
                bet: args.bet,
                placedBy: args.player.id,
                placedTo: args.placedTo,
                players: players1,
                table: table,
                potLimitExceeded: isPotLimitExceeded(table)
              });
              let avialbleSlots = {};
              table.slotUsedArray.forEach(function (d) {
                avialbleSlots["slot" + d] = "slot" + d;
              });
              newGameService.startNewGame(client, table._id, avialbleSlots);
            });
          } else {
            client.emit("sideShowPlaced", {
              message: sideShowMessage,
              bet: args.bet,
              placedBy: args.player.id,
              placedTo: args.placedTo,
              players: players,
              table: table,
            });
            client.broadcast.to(args.tableId).emit("sideShowPlaced", {
              message: sideShowMessage,
              bet: args.bet,
              placedBy: args.player.id,
              placedTo: args.placedTo,
              players: players,
              table: table,
            });
          }
        });

        client.on("disconnect", function () {
          console.log("vacent");
          const delay = Number(Math.random(0, 1000));
          setTimeout(async function () {
            let query = [
              { $match: { clientId: client.id } },
              {
                $lookup: {
                  from: "tables",
                  localField: "tableId",
                  foreignField: "_id",
                  as: "table",
                },
              },
              { $unwind: "$table" },
            ];
            let data = await User.aggregate(query);
            if (data.length > 0) {
              let player = data[0];
              let table = player.table;
              if(table.players && table.players[player._id])
              {
                let user = await User.findOne(player._id);
                await userTableInOutService.tableInOut(table._id, player._id, 'Out');

                await gameAuditService.createAudit(table._id, '', player._id, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect', 'Disconnect', 0, '', 0, '');

                let avialbleSlots = {};
                table.slotUsedArray.forEach(function (f) {
                  avialbleSlots["slot" + f] = "slot" + f;
                });
                
                if (table.gameStarted && isActivePlayer(user.id, table.players)) {
                  let maxPlayers = 5;
                  let players1 = await betService.packPlayer(user.id, table.players, avialbleSlots, maxPlayers, table._id);
                  let removedPlayer = await playerService.removePlayer(user.id, players1, avialbleSlots, table.slotUsedArray, table);
                  await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });
                  let tableInfo = await Table.findOne({ _id: table._id });
                  let players = tableInfo.players;
                  if (getActivePlayers(players) == 1) {
                    _.map(players, function (player) {
                      player.turn = false;
                      return player;
                    });
                  }
                  client.broadcast.to(table._id).emit("playerLeft", {
                    bet: {
                      lastAction: "Packed",
                      lastBet: "",
                    },
                    removedPlayer: removedPlayer,
                    placedBy: removedPlayer.id,
                    players: players,
                    table: tableInfo,
                  });
                  let playerLength = Object.keys(players).length;
                  if (playerLength == 1 && tableInfo.gameStarted) {
                    winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function (message, players) {
                      client.emit("showWinner", {
                        message,
                        bet: {
                          lastAction: "Packed",
                          lastBet: "",
                        },
                        placedBy: removedPlayer.id,
                        players: players,
                        table: tableInfo,
                        packed: true,
                        activePlayerCount : 1,
                      });
                      client.broadcast.to(table._id).emit("showWinner", {
                        message,
                        bet: {
                          lastAction: "Packed",
                          lastBet: "",
                        },
                        placedBy: removedPlayer.id,
                        players: players,
                        table: tableInfo,
                        packed: true,
                        activePlayerCount : 1,
                      });
                      await Table.update({ _id: table._id }, {
                        $set: {
                          gameStarted: false,
                          slotUsed: 1,
                          players: players,
                        },
                      });
                      let avialbleSlots = {};
                      table.slotUsedArray.forEach(function (d) {
                        avialbleSlots["slot" + d] = "slot" + d;
                      });
                      newGameService.startNewGame(client, table._id, avialbleSlots);
                    });
                  } else if (playerLength && !tableInfo.gameStarted) {
                    client.emit("notification", {
                      message:
                        "Please wait for more players to join",
                      timeout: 4000,
                    });
                    client.broadcast.to(table._id).emit("notification", {
                      message:
                        "Please wait for more players to join",
                      timeout: 4000,
                    });
                    let sentObj = { players, table: tableInfo };
                    client.emit("resetTable", sentObj);
                    client.broadcast.to(table._id).emit("resetTable", sentObj);
                  } else if (getActivePlayers(players) == 0 && tableInfo.gameStarted) {
                    await Table.update({ _id: table._id }, {
                      $set: {
                        gameStarted: false,
                        slotUsed: 0,
                        players: {},
                      },
                    });
                  } 
                } else {
                  let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
                  let tableInfo = await Table.findOne({ _id: table._id });
                  let players = tableInfo.players;
                  let slot = getActivePlayers(players);
                  await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });
                  
                  client.broadcast.to(table._id).emit("playerLeft", {
                    bet: {
                      lastAction: "Packed",
                      lastBet: "",
                    },
                    removedPlayer: removedPlayer,
                    placedBy: removedPlayer.id,
                    players: players,
                    table: tableInfo,
                  });
                  let playerLength = Object.keys(players).length;
                  if (playerLength == 1 && table.gameStarted) {
                    winnerService.decideWinner(table, players, table.cardinfoId, false, "", async function (message, players1) {
                      client.emit("showWinner", {
                        message,
                        bet: {
                          lastAction: "Packed",
                          lastBet: "",
                        },
                        placedBy: removedPlayer.id,
                        players: players1,
                        table: tableInfo,
                        packed: true,
                        activePlayerCount : 1,
                      });
                      client.broadcast.to(table._id).emit("showWinner", {
                        message,
                        bet: {
                          lastAction: "Packed",
                          lastBet: "",
                        },
                        placedBy: removedPlayer.id,
                        players: players1,
                        table: tableInfo,
                        packed: true,
                        activePlayerCount : 1,
                      });

                      await Table.update({ _id: table._id }, {
                        $set: {
                          gameStarted: false,
                          slotUsed: 1,
                          players: players1,
                        },
                      });
                      let avialbleSlots = {};
                      table.slotUsedArray.forEach(function (d) {
                        avialbleSlots["slot" + d] = "slot" + d;
                      });
                      newGameService.startNewGame(client, table._id, avialbleSlots);
                    });
                  } else if (playerLength == 1 && !tableInfo.gameStarted) {
                    client.emit("notification", {
                      message:
                        "Please wait for more players to join",
                      timeout: 4000,
                    });
                    client.broadcast.to(tableInfo._id).emit("notification", {
                      message:
                        "Please wait for more players to join",
                      timeout: 4000,
                    });
                    let sentObj = { players, table: tableInfo };
                    await Table.update({ _id: tableInfo._id }, {
                      $set: {
                        gameStarted: false,
                        slotUsed: 1,
                        players: players,
                      },  
                    });
                  } else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
                    await Table.update({ _id: table._id }, {
                      $set: {
                        gameStarted: false,
                        slotUsed: 0,
                        players: {},
                      },
                    });
                  }    
                }
              }
            }
          }, delay * 1000);
        });
      });
    },
  };
}
module.exports = new code();
