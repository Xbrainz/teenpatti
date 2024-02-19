// var fs = require('fs');
// var hskey = fs.readFileSync('/etc/letsencrypt/live/skt-dev.deckheros.com/privkey.pem');
// var hscert = fs.readFileSync('/etc/letsencrypt/live/skt-dev.deckheros.com/fullchain.pem');
// var optionsSSL = {
//     key: hskey,
//     cert: hscert
// };
const connectedUserSocket = new Map();
const Sentry = require('@sentry/node');
const SentryTracing = require("@sentry/tracing");
const connectedUserDevice = new Map();
const logger = require("tracer").colorConsole();
let io = require("socket.io");
const https = require('https');
const express = require('express');
let _ = require("underscore");
let mongoose = require("mongoose");
let Table = require("../model/table");
let User = require("../model/user");
let newGameService = require("../service/newGame");
var App_Web = "app";
let playerService = require("../service/player");
let gameAuditService = require("../service/gameAudit");
const commonServices = require("../service/common");
const ScoreBoard = require("../model/scoreboard");
let FocusTimerout = {};
const socketClient = require('../service/socketClient');
const Player = require("../model/user");
const Game = require("../model/game");

let {
  SetTimer,
  ClearTimer,FinishGame,SetTimerFinish
} = require("../service/newGame");

let commissionService = require('../service/commision')
let Transactions = require('../model/transaction')
const TransactionCommission = require("./../model/transactionCommission");

const {
  sortCards,
  groupPointCounter,
  addCardToHand
} = require("../service/cardComparision");
const CardInfo = require("../model/cardInfo");

const Card = require("../service/card");
//const playerService = require("../service/player");
const staticValue = require("../../constant/staticValue");
const { warn } = require('console');




let staticCards = [
  {
      cards: [{
          "type": "spade",
          "rank": 5,
          "name": "5",
          "priority": 5,
      },
      {
          "type": "spade",
          "rank": 6,
          "name": "6",
          "priority": 6,
      },
      {
          "type": "spade",
          "rank": 7,
          "name": "7",
          "priority": 7,
      },
      {
          "type": "spade",
          "rank": 8,
          "name": "8",
          "priority": 8,
      }
      ],
      msg: "Pure Sequence"
  },
  {
      cards: [{
          "type": "heart",
          "rank": 12,
          "name": "Q",
          "priority": 12,
      },
      {
          "type": "heart",
          "rank": 13,
          "name": "K",
          "priority": 13,
      },
      {
          "type": "heart",
          "rank": 1,
          "name": "A",
          "priority": 14,
      }],
      msg: "Pure Sequence"
  },
  {
      cards: [{
          "type": "heart",
          "rank": 3,
          "name": "3",
          "priority": 3,
      },
      {
          "type": "spade",
          "rank": 3,
          "name": "3",
          "priority": 3,
      },
      {
          "type": "club",
          "rank": 3,
          "name": "3",
          "priority": 3,
      }],
      msg: "Proper Set."
  },
  {
      cards: [{
          "type": "heart",
          "rank": 10,
          "name": "10",
          "priority": 10,
      },
      {
          "type": "spade",
          "rank": 10,
          "name": "10",
          "priority": 10,
      },
      {
          "type": "club",
          "rank": 10,
          "name": "10",
          "priority": 10,
      }],
      msg: "Proper Set."
  },
  {
      cards: [],
  },
  {
      cards: [],
  }
];


function code() {
  return {
    init: function (server) {

      let options = {
        cors: [
          "http://localhost:5050",
          "http://35.154.207.34/",

        ],
        allowEIO3: true,
        pingInterval: 2000,
        pingTimeout: 5000,
        reconnectInterval: 5000,

      };

      const sio = require("socket.io")(server, options);

      // sio.configure('development', function(){
      // 	sio.set('transports', ['xhr-polling']);
      //   });

      // client connection starts from here..
      sio.use(async function (socket, next) {

        if (socket.handshake.query && socket.handshake.query.token) {

          //	var device = socket.handshake.query.deviceid;

          var usernameFromDecodedToken = await gt_usr(socket.handshake.query.token);

          usernameFromDecodedToken = usernameFromDecodedToken.id;

          if (usernameFromDecodedToken == "")
            next(new Error('user is login in another device'));

          if (usernameFromDecodedToken == null)
            next(new Error('Invalid Token, Login Again'));

          try {

            let users = await User.findOne({
              _id: usernameFromDecodedToken
            });

            // if (users.jwtToken != socket.handshake.query.token) {
            // 	next(new Error('user is login in another device'));
            // //next();
            // } else {

            next();
            // }
          } catch (error) {

            next(new Error('user is login in another device'));
          }

        } else {

          next(new Error('Authentication error'));
        }

      }).on("connection", (client) => {

        //	var device = client.device;
        var username = client.username;
        connectedUserSocket.set(username, client);
        //	connectedUserDevice.set(device, device);

        client.on("FocusUpdate", async function (args) {

          if (App_Web == "app")
            args = JSON.parse(args);

          try {

            await User.update({
              _id: args.userId
            }, {
              $set: {
                userFocus: args.userFocus
              }
            });

            if (args.userFocus == "Out") {

              clearTimeout(FocusTimerout[args.userId]);
              FocusTimerout[args.userId] = setTimeout(async function () {

                let user = await User.findOne({
                  _id: args.userId
                });
                let tablesss = await Table.findOne({
                  _id: args.tableId
                });

                if (tablesss.players != null && tablesss.players[user._id] && user.userFocus == "Out") {

                  let Endgameobj = {
                    id: args.userId,
                    userName: user.userName,
                    message: "You are not active in game."
                  };
                  client.emit("EndGame", Endgameobj);
                  sio.to(tablesss._id.toString()).emit("EndGame", Endgameobj);

                  newGameService.LeavePlayer(args.userId, args.tableId, sio, "focusout");

                }

              }, 100000 * 60 * 6);
            }

          } catch (error) {
            console.log(error);
          }

        });

        client.on("OwnChips", async function (args) {

          if (App_Web == "app")
            args = JSON.parse(args);
          let chips = 0;

          let user = await User.findOne({
            _id: args.userId
          });
          chips = user.chips;

          client.emit("OwnChipsSend", {
            chips: chips,
            userId: args.userId,
            potLimit: args.potLimit

          });

        });


        
        client.on("getUserInfo", async function (args) {

          if (App_Web == "app")
            args = JSON.parse(args);
      

          let user = await User.findOne({
            _id: args.userId
          },{ userName : 1 , profilePic : 1, displayName : 1,isComputer : 1,chips:1 ,gameTp : 1,lostTp :1,winTp :1,gamePoker:1,lostPoker:1,winPoker :1 , gameRummy:1 ,lostRummy:1,winRummy:1,gameLudo:1 , lostLudo:1 , winLudo:1});
          user.displayName = args.name;
          client.emit("userInfo", {
            user: user
           
          });

        });




        client.on("WildCard_EndGame", async function(args) {
					args = JSON.parse(args);
          
					let roleofplayer = await User.findOne({
						_id: args.own_userId
					});
					if (roleofplayer.Decrole == "SUSER") {
						let Endgameobj = {
							id: args.userId,
							userName: args.userName,
							message: "You've been Kicked out by Administrator",
						};
					//	client.emit("EndGame", Endgameobj);
						sio.to(args.tableId).emit("EndGame", Endgameobj);
						
						socketClient.disconnectRobo(args.tableId,args.userId);

						await User.update({
							_id:  args.userId
						}, {
							$set: {
								clientId: "",
								forcedisconnect: true
							}
						});

					}



				});


        client.on("watchTable", async function (args) {
          if (App_Web == "app")
            args = JSON.parse(args);
          
          console.warn("watchTable : ",new Date(), " ui : ", args.userId, " tI : ", args.tableId);	

          let roleofplayer = await User.findOne({
            _id: args.userId
          });

          let inId = args.tableId;
          let lasttableiddd = roleofplayer.lasttableId;

          const table_length = await Table.findOne({
            _id: args.tableId
          }).count();
          if (table_length <= 0) {
            await User.update({
              _id: args.userId
            }, {
              $set: {
                lasttableId: "",
                game : 0
              }
            });
            let Endgameobj = {
              id: args.userId,
              userName: lasttableiddd.userName,
              message: "Table is not available",
            };
            //	client.emit("EndGame", Endgameobj);
            sio.to(args.tableId).emit("EndGame", Endgameobj);

          } else {

            let table = await Table.findOne({
              _id: inId
            });

            client.join(inId);

            client.join(args.tableId, async function () {});

            await User.update({
              _id: args.userId
            }, {
              $set: {
                lasttableId: args.tableId,
                tableId: args.tableId,
                game : table.gameType,
                clientId: client.id,
                isplaying: "yes"
              }
            });
            if (table.players == null) {
              table.players = {};
            }

            let playersss = JSON.parse(JSON.stringify(table.players));

            for (let plll in playersss) {
              playersss[plll].playerInfo.chips = 0;
              playersss[plll].playerInfo.userName = "***";
            }

            let tablll = JSON.parse(JSON.stringify(table));
            tablll.players = [];

            client.emit("watchTable", {
              players: playersss,
              table: tablll,
              role: roleofplayer.Decrole
            });

            await gameAuditService.createAudit(args.tableId, '', args.userId, table.lastGameId, "WatchTable", 0, " ", "", 0, table.players, 0, '');

          }

          //   }
        });

        client.on("joinTable", async function (args) {

          try{
            if (App_Web == "app")
            args = JSON.parse(args);

          }catch(error)
          {

          }
         
          let delay = Number(Math.random(0, 1000));
          setTimeout(async function () {

            let table = await Table.findOne({
              _id: args.tableId
            });
            let playersLength;

            console.warn("watchTable : ",new Date(), " ui : ", args.userId, " gI : ", table.lastGameId);	

            if (table.players == null) {
              playersLength = 0;
            } else {
              playersLength = Object.keys(table.players).length;
            }
            if (playersLength < table.maxPlayers) {
              let sit = 0;

              let roleofplayer = await User.findOne({
                _id: args.userId
              });
              console.log("roleofplayer. ", roleofplayer.lasttableId);

              await User.update({
                _id: args.userId
              }, {
                $set: {
                  clientId: client.id,
                  isplaying: "yes"
                }
              });

              let myData = await User.findOne({
                _id: args.userId
              });

            
              let daaataaa = {
                chips: myData.chips,
                userName: myData.userName,
                displayName: getDotDotName(myData.displayName),
                Decrole: myData.Decrole,
                deviceType: myData.deviceType,
                clientIp: myData.clientIp,
                profilePic : myData.profilePic,
                _id: myData._id
              }



              sit = args.sit;
              if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {

                console.log("jointable.. 111");
                let player = {
                  id: args.userId,
                  playerInfo: daaataaa,
                };
                table.slotUsedArray.sort(function (a, b) {
                  return a - b;
                });

                var lasttableiddd = roleofplayer.lasttableId;
                if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0) {

                  var lasttable = await Table.findOne({
                    _id: lasttableiddd
                  });

                  if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {

                    let table = lasttable;
                    let player = roleofplayer;
                    if (table.players != null && table.players[player._id]) {

                      newGameService.LeavePlayer(player._id, table._id, sio, "from jointable");

                    }

                  }

                }

                await playerService.addPlayer(table, player, client, sit, async function (addedPlayer, avialbleSlots) {
                  if (addedPlayer == null) {

                    let tableLength = table;

                    let arrtable = await Table.aggregate([{
                        $project: {
                          "_id": 1,
                          "gameType": 1,
                          "tableSubType": 1,
                          "boot": 1,
                          "GameStatus": 1,
                          PlayerCount: {
                            $size: {
                              "$objectToArray": "$players"
                            }
                          },
                        }
                      },
                      {
                        $match: {
                          tableSubType: "public",
                          boot: tableLength.boot,
                          gameType: tableLength.gameType,
                          _id: {
                            $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
                          },
                          GameStatus: 1,
                          PlayerCount: {
                            $in: [1, 2, 3, 4]
                          }
                        }
                      },
                      {
                        $sample: {
                          size: 1
                        }
                      }
                    ]);

                    if (arrtable.length == 0) {

                      arrtable = await Table.aggregate([{
                          $project: {
                            "_id": 1,
                            "gameType": 1,
                            "tableSubType": 1,
                            "boot": 1,
                            "GameStatus": 1,
                            PlayerCount: {
                              $size: {
                                "$objectToArray": "$players"
                              }
                            },
                          }
                        },
                        {
                          
                          $match: {
                            tableSubType: "public",
                            boot: tableLength.boot,
                            gameType: tableLength.gameType,

                            GameStatus: 1,
                            PlayerCount: {
                              $in: [0, 1, 2, 3, 4]
                            },
                            _id: {
                              $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
                            }
                          }
                        },
                        {
                          $sample: {
                            size: 1
                          }
                        }
                      ]);

                    }

                    await joinAgain(arrtable[0]._id, args.userId, client, sio, args, args.tableId);

                  } else {

                    let myTable = await Table.findOne({
                      _id: args.tableId
                    });

                    await gameAuditService.createAudit(args.tableId, '', args.userId, myTable.lastGameId, "JOIN_TABLE", 0, " ", "", 0, myTable.players, 0, '');

                    let tablll = JSON.parse(JSON.stringify(myTable));
                    let playersss = tablll.players;

                    // for (let plll in playersss) {
                    //   playersss[plll].playerInfo.chips = 0;
                    //   playersss[plll].playerInfo.userName = "***";
                    // }
                    tablll.players = playersss;

                    console.log("tablejoined .. 244");
                    client.emit("tableJoined", {
                      table: myTable,
                      slot: addedPlayer.slot,
                      userId: addedPlayer.id
                    });
                    sio.to(args.tableId.toString()).emit("newPlayerJoined", {
                      table: myTable,
                      userId: addedPlayer.id
                    });

                    await User.update({
                      _id: args.userId
                    }, {
                      $set: {
                        lasttableId: args.tableId,
                        tableId: args.tableId,
                        game : myTable.gameType,
                        clientId: client.id,
                        isplaying: "yes"
                      }
                    });
                    newGameService.startNewGameOnPlayerJoin(myTable._id, sio);
                  }
                });
              }

            } else {

              let Endgameobj = {
                id: args.userId,
                userName: table.players.playerInfo.userName,
                message: "Sorry ! Table Full",
              };
              client.emit("EndGame", Endgameobj);
              sio.to(args.tableId.toString()).emit("EndGame", Endgameobj);
            }
          }, delay * 1000);

          //}
        });

        client.on("joinOther", async function (args) {

          if (App_Web == "app")
            args = JSON.parse(args);

          let tableLength = await Table.findOne({
            _id: args.tableId
          });
          if (tableLength.players == null) {
            playersLength = 0;
          } else {
            playersLength = Object.keys(tableLength.players).length;
          }

          if (playersLength == 5 && !tableLength.players[args.userId]) {

            let arrtable = await Table.aggregate([{
                $project: {
                  "_id": 1,
                  "gameType": 1,
                  "tableSubType": 1,
                  "boot": 1,
                  "GameStatus": 1,
                  PlayerCount: {
                    $size: {
                      "$objectToArray": "$players"
                    }
                  },
                }
              },
              {
                $match: {
                  tableSubType: "public",
                  boot: tableLength.boot,
                  gameType: tableLength.gameType,
                  _id: {
                    $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
                  },
                  GameStatus: 1,
                  PlayerCount: {
                    $in: [1, 2, 3, 4]
                  }
                }
              },
              {
                $sample: {
                  size: 1
                }
              }
            ]);

            if (arrtable.length == 0) {
              arrtable = await Table.aggregate([{
                  $project: {
                    "_id": 1,
                    "gameType": 1,
                    "tableSubType": 1,
                    "boot": 1,
                    "GameStatus": 1,
                    PlayerCount: {
                      $size: {
                        "$objectToArray": "$players"
                      }
                    },
                  }
                },
                {
                  $match: {
                    tableSubType: "public",
                    boot: tableLength.boot,
                    gameType: tableLength.gameType,

                    GameStatus: 1,
                    PlayerCount: {
                      $in: [0, 1, 2, 3, 4]
                    },
                    _id: {
                      $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
                    }
                  }
                },
                {
                  $sample: {
                    size: 1
                  }
                }
              ]);

            }

            await joinAgain(arrtable[0]._id, args.userId, client, sio, args, args.tableId);

          } else {

          }

        });

        client.on("connectttt", async function (args) {
          client.emit("connectionSuccess", {
            id: client.id,
          });
        });

        client.on("reconnectt", async function (args) {

          if (App_Web == "app")
            args = JSON.parse(args);


          //	try {
          let roleofplayer = await User.findOne({
            _id: args.userId
          });

          const table_length = await Table.findOne({
            _id: args.tableId
          }).count();
          if (table_length <= 0) {

            await User.update({
              _id: args.userId
            }, {
              $set: {
                lasttableId: "",
                game : 0
              }
            });
            let Endgameobj = {
              id: args.userId,
              userName: roleofplayer.userName,
              message: "Table is not available",
            };
            //	client.emit("EndGame", Endgameobj);
            sio.to(args.tableId).emit("EndGame", Endgameobj);

          } else {


          


            var lasttableiddd = roleofplayer.lasttableId;
            //clearTimeout(SetTimeoutDisconnect);
            client.join(args.tableId, async function () {});
            client.join(args.tableId);
            let table = await Table.findOne({
              _id: args.tableId
            });

            console.warn("reconnectt : ",new Date(), " ui : ", args.userId, " gI : ", table.lastGameId);

            await User.update({
              _id: args.userId
            }, {
              $set: {
                lasttableId: args.tableId,
                tableId: args.tableId,
                game : table.gameType,
                clientId: client.id,
                isplaying: "yes",
                forcedisconnect : false,
                disconnect: false
              }
            });

          
         

            if (table.players != null) {
              if (table.players[args.userId]) {
                table.players[args.userId].disconnect = false;

                await Table.update({
                  _id: args.tableId
                }, {
                  $set: {
                    players: table.players,
                  },
                });
              } else {
                let Endgameobj = {
                  id: args.userId,
                  userName: "",
                  message: "Internet Disconnected",
                };
                //    client.emit("EndGame", Endgameobj);
                //     sio.to(tableInfo1._id).emit("EndGame", Endgameobj);
              }
            }

            //  let table = await Table.findOne({ _id: args.tableId });

            let card = await CardInfo.findOne({
              _id: table.cardInfoId
            });
            let jokerscard = "";
          


            let joker = "";
            let updatedPlayers = "";
            let openedCard = "";

            if (card != null) {

              joker = card.joker;
              updatedPlayers = card.info.updatedPlayers;
              openedCard = card.info.openedCard;
              //jokerscard = card.jokers;

            }

            let tablesss = table;

            for (let plll in tablesss.players) {
              tablesss.players[plll].playerInfo.chips = 0;
              tablesss.players[plll].playerInfo.userName = "***";
            }

            for (let postion in openedCard) {
              if (openedCard[postion] == "") {
                openedCard.splice(postion, 1);
              }
            }
            console.log("turn  player : : " + tablesss.turnplayerId);
            client.emit("reconnectttt", {
              table: tablesss,
              table2: "to new movie",
              joker: joker,
              openedCard: openedCard,
              updatedPlayers

            });

            // sio.to(args.tableId).emit("reconnectttt", {
            // 	table,
            // 	role: roleofplayer.Decrole,
            // 	jokers : card.jokers
            // });

            // sio.to("63632768e6813ae15408fc4e").emit("reconnectttt", {
            // 	table,
            // 	role: roleofplayer.Decrole,
            // 	jokers : card.jokers
            // });

            await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "Reconnect", 0, " ", "", 0, table.players, 0, '');

            if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0) {

              var lasttable = await Table.findOne({
                _id: lasttableiddd
              });

              if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {

                // leave players

                let table = lasttable;

                newGameService.LeavePlayer(args.userId, table._id, sio, "from jointable");

              }

            }

          }

          // } catch (error) {

          // 	console.log("error .. ",error );
          // }
        });

        /*
        				client.on("disconnect", async function() {


        					console.log("disconnectrtt");
        					let query = [{
        							$match: {
        								clientId: client.id
        							}
        						},
        						{
        							$lookup: {
        								from: "rm_tables",
        								localField: "tableId",
        								foreignField: "_id",
        								as: "table",
        							},
        						},
        						{
        							$unwind: "$table"
        						},
        					];
        					let data = await User.aggregate(query);

        					if (data.length > 0) {


        						let player = data[0];
        						let table = player.table;

        						await User.update({
        							_id: player._id
        						}, {
        							$set: {
        								isplaying: "no",
        								forcedisconnect: true
        							}
        						});
        						console.log("table find .. 7");


        						// setTimeout(async function() {

        							let tableData = await Table.findOne({
        								_id: table._id
        							});
        							if (tableData.players != null && tableData.players[player._id]) {
        								tableData.players[player._id].disconnect = true;
        								await User.update({
        									_id: player._id
        								}, {
        									$set: {
        										clientId: ""
        									}
        								});
        								console.log("table update .. 7");
        								await Table.update({
        									_id: tableData._id
        								}, {
        									$set: {
        										players: tableData.players,
        									},
        								});
        								if (!tableData.gameStarted && tableData.players != null && tableData.players[player._id]) {

        									setTimeout(async function() {
        										table = await Table.findOne({
        											_id: table._id
        										});
        										//  console.log("dissssss :  ", table.players[player._id] );
        										if (table.players[player._id] != undefined) {
        											//   console.log("dissssss :  ", table.players[player._id] );
        											if (table.players[player._id].disconnect == true)

        												newGameService.LeavePlayer(player._id, table._id, client, sio, "Disconnect");
        										}

        									}, 6000);



        								}



        							}


        						// }, 1000);



        					}

        				});

        */

        client.on("disconnect", async function () {

          console.log("disconnectrtt");
          let query = [{
              $match: {
                clientId: client.id
              }
            },
            {
              $lookup: {
                from: "rm_tables",
                localField: "tableId",
                foreignField: "_id",
                as: "table",
              },
            },
            {
              $unwind: "$table"
            },
          ];
          let data = await User.aggregate(query);

          if (data.length > 0) {

            let player = data[0];
            let table = player.table;

            await User.update({
              _id: player._id
            }, {
              $set: {
                isplaying: "no",
                forcedisconnect: true
              }
            });
            console.log("table find .. 7");

            let tableData = await Table.findOne({
              _id: table._id
            });

            if (!tableData.gameStarted && tableData.players != null && tableData.players[player._id]) {

              setTimeout(async function () {
                table = await Table.findOne({
                  _id: table._id
                });

                if (table.players[player._id] != undefined) {

                  let user = await Player.findById({
                    _id: player._id
                  });

                  if (user.disconnect == true)

                    newGameService.LeavePlayer(player._id, table._id, sio, "Disconnect");
                }

              }, 6000);

            }

          }

        });

        client.on("Forcedisconnect", async function (args) {

          try{
            if (App_Web == "app")
            args = JSON.parse(args);
          }catch(error)
          {

          }
         
          // let player = await User.findOne({ _id: args.userId });

          // let table = await Table.findOne({ _id: args.tableId });

          await User.update({
            _id: args.userId
          }, {
            $set: {
              disconnect: true
            }
          });

          console.log("forcedisconnect......................................................................................................",args);
          newGameService.LeavePlayer(args.userId, args.tableId, sio, "ForceDisconnect");

        });

        //standup from table and watch game only
        client.on("standUp", async function (args) {

          if (App_Web == "app")
            args = JSON.parse(args);
          const exe_start = Date.now();

          await User.update({
            _id: args.userId
          }, {
            $set: {
              disconnect: true
            }
          });

          console.log("standup......................................................................................................");
          await newGameService.LeavePlayer(args.userId, args.tableId, sio, "standup");

          let table = await Table.findOne({
            _id: args.tableId
          });

          let playersss8 = JSON.parse(JSON.stringify(table.players));

          for (let plll in playersss8) {
            playersss8[plll].playerInfo.chips = 0;
            playersss8[plll].playerInfo.userName = "***";
          }

          let tabllll8 = JSON.parse(JSON.stringify(table));
          tabllll8.players = playersss8;

          sio.to(args.tableId).emit("standUp", {

            table: tabllll8,
            userId: args.userId
          });

          client.emit("standUp_Own", {

            table: tabllll8,
            userId: args.userId,

          });

          const exe_stop = Date.now();
          let timess = exe_stop - exe_start;

        });

        client.on("sortCards", async function (args) {
          console.log("------------------- On sortCards ----------------------");

          let data = JSON.parse(args);

          let player;

          let table = await Table.findById({
            _id: data.tableId
          },{_id : 1 , cardInfoId : 1});
          data.table = table;
          let cardInfoId = table.cardInfoId;
          let cardsInfo = await CardInfo.findOne({
            _id: cardInfoId
          },{ info : 1,joker : 1});
          let openedCard = cardsInfo.info.openedCard;

          let updatedPlayers = cardsInfo.info.updatedPlayers;

        
        

              let sortedPlayer = sortCards(updatedPlayers[data.userId]);
              sortedPlayer.cards = sortedPlayer.groupCard;
              delete sortedPlayer.groupCard;
              player = sortedPlayer;
              updatedPlayers[data.userId] = sortedPlayer;

              console.log("on sort players :  ", data.userId, "   points : ", updatedPlayers[data.userId].cardsetPoints);
            
              let groupData = groupPointCounter(updatedPlayers[data.userId].cards, cardsInfo.joker);

              updatedPlayers[data.userId].cards = groupData.cards;
              updatedPlayers[data.userId].cardsetPoints = groupData.cardsetPoints;
              updatedPlayers[data.userId].totalPoints = groupData.totalPoints;

     
          let newInfo = {
            updatedPlayers: updatedPlayers,
            openedCard: openedCard
          }
          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo
            }
          });
          data.updatedPlayers = updatedPlayers;

        
       

       //   client.emit("cardsSorted", player);
        });

        client.on("openedDeckCard", async function (args) {


          console.log("------------------- On openedDeckCard ----======0000000----------------------");


            //  console.log(args);
            let data = JSON.parse(args);
            console.log("data-----", data);
            let tableId = data.tableId;
            let table = await Table.findById({
              _id: tableId
            });
            data.table = table;
            console.warn("openedDeckCard : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);
         
            let cardInfoId = table.cardInfoId;
            let cardInfo = await CardInfo.findById({
              _id: cardInfoId
            });



         
          //  let removedOpenCard = cardInfo.info.openedCard.shift();
          
  
            // if( cardInfo.info.openedCard.length == 1)
            // {
             // let removedOpenCard = cardInfo.info.openedCard[0];
            // }
            let removedOpenCard =   cardInfo.info.openedCard.shift();
            console.log("open deck cardsds : ",    cardInfo.info.openedCard);
            data.openedCard = cardInfo.info.openedCard
            let updatedPlayers = cardInfo.info.updatedPlayers;
  
  

            let objForAddCard = {
              cards: updatedPlayers[data.userId].cards,
              removedOpenCard: removedOpenCard
            }
            console.log("removeopencard jj  : ", removedOpenCard);
            let addedCardData = await addCardToHand(objForAddCard);
            let groupData = groupPointCounter(addedCardData, cardInfo.joker);

            updatedPlayers[data.userId].cards = groupData.cards;
            updatedPlayers[data.userId].cardsetPoints = groupData.cardsetPoints;
            updatedPlayers[data.userId].totalPoints = groupData.totalPoints;

            if(updatedPlayers[data.userId].totalPoints  > 80)
            updatedPlayers[data.userId].totalPoints  = 80;

            updatedPlayers[data.userId].newopenclosecard = removedOpenCard;
            data.player = updatedPlayers[data.userId];
            
  
            // for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
            //   if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
            //     let objForAddCard = {
            //       cards: updatedPlayers[Object.keys(updatedPlayers)[i]].cards,
            //       removedOpenCard: removedOpenCard
            //     }
  
            //     let addedCardData = await addCardToHand(objForAddCard);
            //     let groupData = groupPointCounter(addedCardData, cardInfo.joker);
  
            //     updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
            //     updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
            //     updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
  
            //     if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
            //     updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
  
            //     updatedPlayers[Object.keys(updatedPlayers)[i]].newopenclosecard = removedOpenCard;
            //     data.player = updatedPlayers[Object.keys(updatedPlayers)[i]];
  
            //   }
            // }

            let newInfo = {
              updatedPlayers: updatedPlayers,
              openedCard: cardInfo.info.openedCard,
              lastremove: removedOpenCard,
            }
           
            data.updatedPlayers = updatedPlayers;
            data.removedOpenCard = removedOpenCard;


            let tablessss = {
              turnplayerId : data.table.turnplayerId
            };
         
            let updated = {};
            for (let i = 0; i < Object.keys(data.updatedPlayers).length; i++) {
              let cc = {
                cards : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cards,
                cardsetPoints : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cardsetPoints,
                slot : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].slot,
                dropped : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].dropped,
                packed : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].packed,
                playerInfo : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].playerInfo
              }
              updated[Object.keys(data.updatedPlayers)[i]] =  cc;
            }

            
  
            let data2 = {
              updatedPlayers : updated,
              openedCard :  data.openedCard,
              table : tablessss,
              removedOpenCard :  data.removedOpenCard
            }


  
            sio.to(tableId.toString()).emit("cardOpenedDeck", data2);

            await gameAuditService.createAudit( data.tableId, cardInfo._id, data.userId, table.lastGameId, "CLICK_OPEN_DECK", 0, 'Open_deck', 'Open_deck', 0, table.players, 0, '');

            await CardInfo.updateOne({
              _id: cardInfoId
            }, {
              $set: {
                info: newInfo
              }
            }, {
              upsert: true
            });














          // //  console.log(args);
          // let data = JSON.parse(args);
          // console.log("data-----", data);
          // let tableId = data.tableId;
          // let table = await Table.findById({
          //   _id: tableId
          // });
          // data.table = table;

          // let user = await Player.findById({
          //   _id: data.userId
          // });
          // let cardInfoId = table.cardInfoId;
          // let cardInfo = await CardInfo.findById({
          //   _id: cardInfoId
          // });
          // let removedOpenCard = cardInfo.info.openedCard.shift();
          // console.log("OpenedCard ==>> ", removedOpenCard);

          // if (!data.openedCard) {
          //   data.openedCard = [];
          // }
          // data.openedCard = cardInfo.info.openedCard
          // let updatedPlayers = cardInfo.info.updatedPlayers;


          

          // for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
          //   if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
          //     let objForAddCard = {
          //       cards: updatedPlayers[Object.keys(updatedPlayers)[i]].cards,
          //       removedOpenCard: removedOpenCard
          //     }

          //     let addedCardData = await addCardToHand(objForAddCard);
          //     let groupData = groupPointCounter(addedCardData, cardInfo.joker);

          //     updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
          //     updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
          //     updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;

          //     if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
          //     updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;

          //     updatedPlayers[Object.keys(updatedPlayers)[i]].newopenclosecard = removedOpenCard;
          //     data.player = updatedPlayers[Object.keys(updatedPlayers)[i]];

          //   }
          // }
          // let newInfo = {
          //   updatedPlayers: updatedPlayers,
          //   openedCard: cardInfo.info.openedCard,
          //   lastremove: removedOpenCard,
          // }

          // await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, "CLICK_OPEN_DECK", user.chips, 'Open_deck', 'Open_deck', 0, table.players, 0, '');
          // await CardInfo.updateOne({
          //   _id: cardInfoId
          // }, {
          //   $set: {
          //     info: newInfo
          //   }
          // }, {
          //   upsert: true
          // });
          // data.updatedPlayers = updatedPlayers;
          // data.removedOpenCard = removedOpenCard;

          // sio.to(tableId.toString()).emit("cardOpenedDeck", data);

        });

        client.on("closedDeckCard", async function (args) {

          console.log("----------------------- On closedDeckCard000-------------------------");
          // console.log(args);
          let data = args ;
          try{
             data = JSON.parse(args);
          }catch(error)
          {

          }

       //   console.log("data : ", data);
       
          let tableId = data.tableId;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("closedDeckCard : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);

          data.table = table;
          var user = await Player.findById({
            _id: data.userId
          });
          //  var user = await Player.findById({ _id: data.player._id});
         // console.log("usersss  " + user);
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findById({
            _id: cardInfoId
          });
          let deckCards = cardInfo.deckCards;
         // deckCards =  shuffle(deckCards);

        
          let randomCard = deckCards.shift();
          randomCard.id2 = Math.random().toString(35).slice(2);
           console.log("randomCard : ", randomCard);
          if (!data.randomCard) {
            data.randomCard = randomCard;
          }

       
          data.randomCard = randomCard;
          let updatedPlayers = cardInfo.info.updatedPlayers;

          
          
          //   if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {


       
          if(updatedPlayers[data.userId].id != null)
          {

      
            
              let objForAddCard = {
                cards: updatedPlayers[data.userId].cards,
                removedOpenCard: randomCard
              }
              let addedCardData = await addCardToHand(objForAddCard);
              let groupData = groupPointCounter(addedCardData, cardInfo.joker);
              console.log("new cardss : ", updatedPlayers[data.userId].newopenclosecard);

              updatedPlayers[data.userId].cards = groupData.cards;
              updatedPlayers[data.userId].cardsetPoints = groupData.cardsetPoints;
              updatedPlayers[data.userId].totalPoints = groupData.totalPoints;

              if(updatedPlayers[data.userId].totalPoints  > 80)
              updatedPlayers[data.userId].totalPoints  = 80;

              updatedPlayers[data.userId].newopenclosecard = randomCard;
              data.player = updatedPlayers[data.userId];

             
           

            }

          //   }
          // }

          let newInfo = {
            updatedPlayers: updatedPlayers,
            openedCard: cardInfo.info.openedCard
          }
         
          await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, "CLICK_CLOSE_DECK", user.chips, 'Close_deck', 'Close_deck', 0, table.players, 0, '');

          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo,
              deckCards: deckCards
            }
          }, {
            upsert: true
          });
          data.updatedPlayers = updatedPlayers;
          data.openedCard = cardInfo.info.openedCard;

          for (let postion in data.openedCard) {
            if (data.openedCard[postion] == "") {
              data.openedCard.splice(postion, 1);
            }

          }

      
          // let tablll444 = JSON.parse(JSON.stringify(data.table));
          // tablll444.players = [];
          // delete  tablll444.players;
          // delete  tablll444.betRoundCompleted;
          // delete  tablll444.slotUsedArray;
          // delete  tablll444.slotUsed;

          let tablessss = {
            turnplayerId : data.table.turnplayerId
          };
       
          let updated = {};
          for (let i = 0; i < Object.keys(data.updatedPlayers).length; i++) {
            let cc = {
              cards : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cards,
              cardsetPoints : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cardsetPoints,
              slot : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].slot,
              dropped : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].dropped,
              packed : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].packed,
              playerInfo : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].playerInfo
            }
            updated[Object.keys(data.updatedPlayers)[i]] =  cc;
          }


          


          let data2 = {
            updatedPlayers : updated,
            openedCard :  data.openedCard,
            table : tablessss,
            randomCard : data.randomCard
          }
          sio.to(tableId.toString()).emit("cardClosedDeck", data2);

        });

        client.on("discardCard", async function (args) {

          console.log("------------------- On discardCard ----------------------");
          //console.log(args);
          let data = args;
          try{
             data = JSON.parse(args);
          }catch(error)
          {

          }
         
          let tableId = data.tableId;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("discardCard : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);
          data.table = table;
          console.log("useriddd ;' ", data.userId);
          let user = await Player.findById({
            _id: data.userId
          });
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findById({
            _id: cardInfoId
          });
          let discardedCard = data.discardedCard;
          let openedCard = cardInfo.info.openedCard;
          let deckCards = cardInfo.deckCards;
          let availableSlots = {};
          table.slotUsedArray.forEach(function (f) {
            availableSlots["slot" + f] = "slot" + f;
          });

          // console.log("discsrdTuser----===",user._id);
          //  console.log("cardInfo----===",cardInfo._id);

          if (!data.removedCard) {
            data.removedCard = [];
          }
          data.removedCard = data.discardedCard;

          let updatedPlayers = cardInfo.info.updatedPlayers;


          
          updatedPlayers[data.userId].contipack = 0;

          let cardsss = updatedPlayers[data.userId].cards;
         // console.log("cardss: ",cardsss );
          
         console.log("cardss : ", data.removedCard.id2 );
         let abort = false;
					for (let position in cardsss) {
            console.log("cardss: " + position + " : ",cardsss[position] );
						for (let ii = 0; ii < cardsss[position].cards.length ; ii++) {
							if (cardsss[position].cards[ii].id2 ==   data.removedCard.id2 ) {
								cardsss[position].cards.splice(ii, 1);
                abort = true;
                break
							}
						}
            if(abort)
            break;
					}


					updatedPlayers[data.userId].cards = cardsss;
          updatedPlayers[data.userId].round = updatedPlayers[data.userId].round + 1;



          // for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
          //   console.log("on discard : ",Object.keys(updatedPlayers)[i] ,"  points : ",updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints);
            if (updatedPlayers[data.userId].id == data.userId) {
              updatedPlayers[data.userId].cards = cardsss;

              let groupData = groupPointCounter(updatedPlayers[data.userId].cards, cardInfo.joker);

              cardInfo.info.openedCard.unshift(discardedCard);
              if (!data.openedCard) {
                data.openedCard = [];
              }
              data.openedCard.unshift(discardedCard);

              updatedPlayers[data.userId].cards = groupData.cards;
              updatedPlayers[data.userId].cardsetPoints = groupData.cardsetPoints;
              updatedPlayers[data.userId].totalPoints = groupData.totalPoints;
              if(updatedPlayers[data.userId].totalPoints  > 80)
              updatedPlayers[data.userId].totalPoints  = 80;

              updatedPlayers[data.userId].noOfTurn += 1;
              updatedPlayers[data.userId].newopenclosecard = {};

              await Player.updateOne({
                _id: updatedPlayers[data.userId].id
              }, {
                $inc: {
                  noOfTurn: 1
                }
              });

            }
          // }

          if (cardInfo.info.openedCard.length > 5) {
            let lastCard = cardInfo.info.openedCard.pop();
            deckCards.push(lastCard);
          }

          updatedPlayers = await commonServices.getNextSlotForTurn(data.userId, updatedPlayers, availableSlots, table.maxPlayers, table._id);

      
          let removedOpenCard = "";
          let newInfo = {
            updatedPlayers: updatedPlayers,
            openedCard: cardInfo.info.openedCard,
            lastremove: removedOpenCard,

          }

          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo,
              deckCards: deckCards
            }
          }, {
            upsert: true
          });

          await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, "DISCARD", user.chips, 'Discard', 'Discard', 0, table.players, 0, '');
          
          data.updatedPlayers = updatedPlayers;

          table = await Table.findById({
            _id: tableId
          });
          data.table = table;


          let tablessss = {
            turnplayerId : data.table.turnplayerId
          };
       
          let updated = {};
          for (let i = 0; i < Object.keys(data.updatedPlayers).length; i++) {
           
            let cc = {
              cards : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cards,
              cardsetPoints : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cardsetPoints,
              slot : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].slot,
              dropped : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].dropped,
              packed : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].packed,
              playerInfo : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].playerInfo
            }
            updated[Object.keys(data.updatedPlayers)[i]] =  cc;
          }

          let data2 = {
            updatedPlayers : updated,
            openedCard :  data.openedCard,
            table : tablessss,
           
          }


          sio.to(tableId.toString()).emit("cardDiscard", data2);

          SetTimer(data.table.turnplayerId, data.table._id, sio);

        });

        client.on("turnChanged", async function (args) {

          console.log("------------------- On turnChanged ----------------------");
          //   console.log(args);
          let data = JSON.parse(args);
          let tableId = data.tableId;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("turnChanged : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);

          data.table = table;
          let user = await Player.findById({
            _id: data.userId
          });
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findById({
            _id: cardInfoId
          });
          let availableSlots = {};
          table.slotUsedArray.forEach(function (f) {
            availableSlots["slot" + f] = "slot" + f;
          });

          if (!data.removedCard) {
            data.removedCard = [];
          }
          data.removedCard = data.discardedCard;

          let updatedPlayers = cardInfo.info.updatedPlayers;
          updatedPlayers = await commonServices.getNextSlotForTurn(data.userId, updatedPlayers, availableSlots, table.maxPlayers, table._id);

          let newInfo = {
            updatedPlayers: updatedPlayers,
            openedCard: cardInfo.info.openedCard
          }

          await gameAuditService.createAudit(table._id, cardInfo._id, data.userId, table.lastGameId, "USER_TURN", user.chips, " ", " ", data.table.amout, table.players, 0, '');

          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo
            }
          }, {
            upsert: true
          });
          data.updatedPlayers = updatedPlayers;
          data.openedCard = cardInfo.info.openedCard;

          table = await Table.findById({
            _id: tableId
          });
          data.table = table;
          sio.to(tableId.toString()).emit("changedTurn", data);
          SetTimer(table.turnplayerId, table._id, sio);
        });

        client.on("groupCards", async function (args) {

          console.log("------------------- On groupCards ----------------------");
          //  console.log(args);
          let data = JSON.parse(args);
          let tableId = data.tableId;;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("groupCards : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);
          data.table = table;
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findOne({
            _id: cardInfoId
          });
          let openedCard = cardInfo.info.openedCard;

          let updatedPlayers = cardInfo.info.updatedPlayers;
          // for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
          //   if (Object.keys(updatedPlayers)[i] == data.userId) {
              updatedPlayers[data.userId].cards = data.cards;

              let groupData = groupPointCounter(updatedPlayers[data.userId].cards, cardInfo.joker);

              updatedPlayers[data.userId].cards = groupData.cards;
              updatedPlayers[data.userId].cardsetPoints = groupData.cardsetPoints;
              updatedPlayers[data.userId].totalPoints = groupData.totalPoints;
              if(updatedPlayers[data.userId].totalPoints  > 80)
              updatedPlayers[data.userId].totalPoints  = 80;

              //							data.player.cards = groupData.cards;
         //   }
        //  }

          let newInfo = {
            updatedPlayers: updatedPlayers,
            openedCard: openedCard
          }
          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo
            }
          }, {
            upsert: true
          });
          data.updatedPlayers = updatedPlayers;


          let tablessss = {
            turnplayerId : data.table.turnplayerId
          };
       
          let updated = {};
          // for (let i = 0; i < Object.keys(data.updatedPlayers).length; i++) {
            let cc = {
              cards : data.updatedPlayers[data.userId].cards,
              cardsetPoints : data.updatedPlayers[data.userId].cardsetPoints,
              slot : data.updatedPlayers[data.userId].slot,
              dropped : data.updatedPlayers[data.userId].dropped,
              packed : data.updatedPlayers[data.userId].packed,
              playerInfo : data.updatedPlayers[data.userId].playerInfo
            }
            updated[data.userId] =  cc;
          // }

          let data2 = {
            updatedPlayers : updated,
       
            table : tablessss,
           
          }


          client.emit("cardsGroup", data2);
        });

        client.on("dragCard", async function (args) {

          let data = JSON.parse(args);
          console.log("drag : ", data);

          if(data.selectcard.type != undefined)
          {

          let tableId = data.tableId;;
          let table = await Table.findById({
            _id: tableId
          });

          console.warn("dragCard : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);


          data.table = table;
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findOne({
            _id: cardInfoId
          });
          let openedCard = cardInfo.info.openedCard;


     
          console.log("removed cardssss::::::::::::" ,data.selectcard.type);
        
          
       
       
          
      
            
            let updatedPlayers = cardInfo.info.updatedPlayers;

            let checkcardsize = 13;

            if (cardInfo.info.updatedPlayers[data.userId].newopenclosecard.type != undefined)
            checkcardsize = 14;
            else
            checkcardsize = 13;


            let removedcard = data.selectcard;
            let removedmaincard = data.selectcard;
            
            let cardsssaa = updatedPlayers[data.userId].cards;

            let abort = false;
            for (let position in cardsssaa) {
              for (let ii = 0; ii < cardsssaa[position].cards.length; ii++) {
                if (cardsssaa[position].cards[ii].id2 == removedcard.id2) {
                  removedmaincard = cardsssaa[position].cards[ii];
                  cardsssaa[position].cards.splice(ii, 1);
                  abort = true;
                  break
                }

              }
              if(abort)
              break;
              
            }




          

            console.log("replace selectgroup : ", data.selectgroup);

            if(data.selectgroup == "Group0")
            {
              data.selectgroup = 0;
            }else if(data.selectgroup == "Group1")
            {
              data.selectgroup = 1;
            }else if(data.selectgroup == "Group2")
            {
              data.selectgroup = 2;
            }else if(data.selectgroup == "Group3")
            {
              data.selectgroup = 3;
            }else if(data.selectgroup == "Group4")
            {
              data.selectgroup = 4;
            }else if(data.selectgroup == "Group5")
            {
              data.selectgroup = 5;
            }else if(data.selectgroup == "Group6")
            {
              data.selectgroup = 6;
            }

            if(data.selectgroup == "new")
            {
              for (let position in cardsssaa) {
              
                if(cardsssaa[position].cards.length == 0)
                {
                  cardsssaa[position].cards.push(removedmaincard);
                  break;
                }
                    
              }
            }else{
              for (let position in cardsssaa) {
              
                if(position==(data.selectgroup) )
                {
                  console.log("replace card : ", data.selectgroup , "  : removedmaincard  :    ", removedmaincard);
                //  cardsssaa[position].cards.push(removedmaincard);
                  //cardsssaa[position].cards[data.selectgroupindex-1] = removedmaincard;

                  cardsssaa[position].cards.splice(data.selectgroupindex-1, 0,removedmaincard);

                  console.log("length : ",cardsssaa[position].cards.length);
                  break;
                }
                    
              }
            }
           

            console.log("data.cardsssaa.length : ",cardsssaa.length , "  : selectedgropup  :    ", data.selectgroup);
    
            updatedPlayers[data.userId].cards = cardsssaa;

         
              let groupData = groupPointCounter(updatedPlayers[data.userId].cards, cardInfo.joker);

              updatedPlayers[data.userId].cards = groupData.cards;
              updatedPlayers[data.userId].cardsetPoints = groupData.cardsetPoints;
              updatedPlayers[data.userId].totalPoints = groupData.totalPoints;

              if(updatedPlayers[data.userId].totalPoints  > 80)
                  updatedPlayers[data.userId].totalPoints  = 80;

              ////data.player.cards = groupData.cards;
          //   }
          // }

          let newInfo = {
            updatedPlayers: updatedPlayers,
            openedCard: openedCard
          }
          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo
            }
          }, {
            upsert: true
          });
          data.updatedPlayers = updatedPlayers;

        //  console.log("carddragged : ", data);


          let tablessss = {
            turnplayerId : data.table.turnplayerId
          };
       
          let updated = {};
          // for (let i = 0; i < Object.keys(data.updatedPlayers).length; i++) {
            let cc = {
              cards : data.updatedPlayers[data.userId].cards,
              cardsetPoints : data.updatedPlayers[data.userId].cardsetPoints,
              slot : data.updatedPlayers[data.userId].slot,
              playerInfo : data.updatedPlayers[data.userId].playerInfo,
              dropped : data.updatedPlayers[data.userId].dropped,
              packed : data.updatedPlayers[data.userId].packed
            }
          

            updated[data.userId] =  cc;
          // }

          let data2 = {
            updatedPlayers : updated,
       
            table : tablessss,
           
          }



          client.emit("cardDragged", data2);
        }
        // }else{


        //   client.emit("resetCards", {updatedPlayers : updatedPlayers});

        // }
        });

        client.on("finishGame", async function (args) {

          console.log("------------------- On finishGame ----------------------");
          //  console.log(args);
          let data = args ;
          try{
             data = JSON.parse(args);
          }catch(error)
          {

          }

          let tableId = data.tableId;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("finishGame : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);

          data.table = table;
          // let user = await Player.findOne({
          // 	clientId: client.id
          // });
          let user = await Player.findById({
            _id: data.userId
          });
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findById({
            _id: cardInfoId
          });
          let openedCard = cardInfo.info.openedCard;
          let finishCard = data.finishCard;
          let declarePlayer;
          let availableSlots = {};
          table.slotUsedArray.forEach(function (f) {
            availableSlots["slot" + f] = "slot" + f;
          });

          let updatedPlayers = cardInfo.info.updatedPlayers;
       
          let cardsss = updatedPlayers[data.userId].cards;
          let abort = false;
					for (let position in cardsss) {
						for (let ii = 0; ii < cardsss[position].cards.length; ii++) {
							if (cardsss[position].cards[ii].id2 ==   data.finishCard.id2 ) {
								cardsss[position].cards.splice(ii, 1);
                abort = true;
                break
							}
						}
            if(abort)
            break;
					}

        



					updatedPlayers[data.userId].cards = cardsss;

          
          //	console.log(updatedPlayers);
          for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
              declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
              updatedPlayers[Object.keys(updatedPlayers)[i]].cards = cardsss;
              updatedPlayers[Object.keys(updatedPlayers)[i]].finisher = true;

              let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards, cardInfo.joker);
              // console.log("FINISH GAME >> CARDSET POINTS ::: ", groupData.cardsetPoints);

              updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
              updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;

              if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
              updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;

              updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
              declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
            }
          }
          await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, "FINISH", user.chips, 'Finish', 'Finish', 0, table.players, 0, '');

          // &*&*&*&*&*&*&*&* if someOne finish the game &*&*&*&*&*&*&&*	
          if (getActivePlayers(updatedPlayers) == 2) {

            ClearTimer(tableId.toString());
            SetTimerFinish(table.turnplayerId, tableId,  sio);
            
            let isValidGroups = commonServices.isValidGroups(declarePlayer.cards);

            console.log("valide groupssssss : " + declarePlayer.totalPoints + "   :  isValidGroups :   " + isValidGroups);

            if (declarePlayer.totalPoints == 0 && isValidGroups) {

              ClearTimer(tableId.toString());
              console.log("===00 valide");
              // console.log(" (*)*(*)*(*)*(*)*(*)*(*) TOTAL POINTS === 0 AND ALSO ALL GROUP ARE VALID (*)*(*)*(*)*(*)*(*)*(*)*");	

              for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
                } else {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                }
              }

              let newInfo = {
                updatedPlayers: updatedPlayers,
                openedCard: openedCard,
                finishCard: finishCard
              }
              // await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, auditType.FINISH, user.chips, 'Finish', 'Finish', 0, '', 0, '');

              await CardInfo.updateOne({
                _id: cardInfoId
              }, {
                $set: {
                  info: newInfo
                }
              }, {
                upsert: true
              })
              data.updatedPlayers = updatedPlayers;
              data.openedCard = openedCard;
              //   console.log("Data ... UPDATEDPLAYERS In finish Game (TOTALPOINTS == 0 && VALIDGROUP == TRUE):: ", data.updatedPlayers);

              sio.to(tableId.toString()).emit("gameFinished", data);

            } else {


           
              console.log("===2");
              let newInfo = {
                updatedPlayers: updatedPlayers,
                openedCard: openedCard,
                finishCard: finishCard
              }
              await CardInfo.updateOne({
                _id: cardInfoId
              }, {
                $set: {
                  info: newInfo
                }
              }, {
                upsert: true
              })

              data.updatedPlayers = updatedPlayers;
              data.openedCard = openedCard;

              for (let postion in data.openedCard) {
                if (data.openedCard[postion] == "") {
                  data.openedCard.splice(postion, 1);
                }

              }
              sio.to(tableId.toString()).emit("gameFinished", data);
            }
          } else if (getActivePlayers(updatedPlayers) > 2) {

            console.log(">>2");

            let isValidGroups = commonServices.isValidGroups(declarePlayer.cards);

            console.log("valide groupssssss" + declarePlayer.totalPoints + isValidGroups);

            if (declarePlayer.totalPoints == 0 && isValidGroups) {

              ClearTimer(tableId.toString());
              SetTimerFinish(table.turnplayerId, tableId,  sio);

              console.log("===00");
              // console.log(" (*)*(*)*(*)*(*)*(*)*(*) TOTAL POINTS === 0 AND ALSO ALL GROUP ARE VALID (*)*(*)*(*)*(*)*(*)*(*)*");	

              for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
                } else {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                }
              }

              let newInfo = {
                updatedPlayers: updatedPlayers,
                openedCard: openedCard,
                finishCard: finishCard
              }
              // await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, auditType.FINISH, user.chips, 'Finish', 'Finish', 0, '', 0, '');

              await CardInfo.updateOne({
                _id: cardInfoId
              }, {
                $set: {
                  info: newInfo
                }
              }, {
                upsert: true
              })
              data.updatedPlayers = updatedPlayers;
              data.openedCard = openedCard;
              //   console.log("Data ... UPDATEDPLAYERS In finish Game (TOTALPOINTS == 0 && VALIDGROUP == TRUE):: ", data.updatedPlayers);

              sio.to(tableId.toString()).emit("gameFinished", data);

            } else {
              //	 console.log("===5");

              // console.log("finishGameDone : ", "data");
              // client.emit("finishGameDone", data);

              for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
               //   updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].wrongShow = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].packed = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.packed = true;
                  await ScoreBoard.findOneAndUpdate({
                    playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                  }, {
                    $inc: {
                      gamesLost: 1
                    }
                  });

                  if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
                  updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;


                  losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * table.pointValue;
                  await Table.findOneAndUpdate({
                    _id: tableId
                  }, {
                    $inc: {
                      tableAmount: losingAmount
                    }
                  });
                  if (table.boot >= losingAmount) {
                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                    updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;

                    await Player.updateOne({
                      _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                    }, {
                      $set: {
                        chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                      },
                      $inc: {
                        lostRummy:-(table.boot - losingAmount)
                      }
                    });

                  } else {
                    let substractAmount = table.boot - losingAmount;
                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                    updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                    await Player.updateOne({
                      _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                    }, {
                      $set: {
                        chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                      } ,
                      $inc: {
                        lostRummy: -substractAmount
                      }

                    });
                  }

                } else {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
                }

              }

              let maxPlayers = table.maxPlayers;

              let players = await commonServices.packPlayer(data.userId, table.players, availableSlots, maxPlayers, table._id)
              updatedPlayers = await commonServices.packPlayer(data.userId, updatedPlayers, availableSlots, maxPlayers, table._id)

              for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].turn == true) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
                }
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
                }
              }

              let newInfo = {
                updatedPlayers: updatedPlayers,
                openedCard: cardInfo.info.openedCard,
              }
              await CardInfo.findOneAndUpdate({
                _id: table.cardInfoId
              }, {
                $set: {
                  info: newInfo
                }
              }, {
                upsert: true
              });
              await Table.updateOne({
                _id: table._id
              }, {
                $set: {
                  players: players
                }
              });
              await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, "wrongShow", user.chips, 'wrongShow', 'wrongShow', 0, table.players, 0, '');

              data.updatedPlayers = updatedPlayers;
              data.openedCard = openedCard;

              console.log("Player Droppeddd ... 3");

              table = await Table.findById({
                _id: tableId
              });


              let tablessss = {
                turnplayerId : table.turnplayerId
              };
           
              let updated = {};
              for (let i = 0; i < Object.keys(data.updatedPlayers).length; i++) {
                let cc = {
                  cards : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cards,
                  cardsetPoints : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].cardsetPoints,
                  slot : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].slot,
                  dropped : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].dropped,
                  packed : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].packed,
                  wrongShow : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].wrongShow,
                  active : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].active,
                  playerInfo : data.updatedPlayers[Object.keys(data.updatedPlayers)[i]].playerInfo
                }
                updated[Object.keys(data.updatedPlayers)[i]] =  cc;
              }



              sio.to(table._id.toString()).emit("wrongShow", {
                removedPlayer: data.player,
                placedBy: data.userId,
                updatedPlayers: updated,
                table: tablessss,
                openedCard: data.openedCard,
              });

              SetTimer(table.turnplayerId, table._id, sio);

              //client.broadcast.to(tableId).emit("gameFinished", data);	

              // console.log(" &*(&*(&*(&*(&*(&*(&*(&*(&*( TOTAL POINTS !!!!!!!!=== 0  &*)&*)&*)&)&*)&*)&*)&*)");	
              //    console.log("UPDATED PLAYERS before WRONG DECLARATION :: ", updatedPlayers);

              //   client.broadcast.to(tableId).emit("gameFinished", data);	

              /*
                                          for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                              if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].packed = true;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.packed = true;
                                                  await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesLost : 1}});
                  
                                                  losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * table.pointValue;
                                                  await Table.findOneAndUpdate({ _id: tableId }, { $inc : { tableAmount : losingAmount }});
                                                  if (table.boot >= losingAmount)   {
                                                      updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                                                      updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                                      await Player.findOneAndReplace({ _id: data.userId }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                                  } else {
                                                      let substractAmount = table.boot - losingAmount;
                                                      updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                                      updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                                      await Player.findOneAndReplace({ _id: data.userId }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                                  }
                                              } else {
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
                                              }

                                          }
                  
                  
                                          let maxPlayers = table.maxPlayers;
                                          
                                          let players = await commonServices.packPlayer(data.userId, table.players, availableSlots, maxPlayers, table._id)
                                          updatedPlayers = await commonServices.packPlayer(data.userId, updatedPlayers, availableSlots, maxPlayers, table._id)
                  
                                          for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                              if (updatedPlayers[Object.keys(updatedPlayers)[i]].turn == true) {
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
                                              }
                                              if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                                                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
                                              }
                                          }
                  
                                          let newInfo = {
                                              updatedPlayers : updatedPlayers,
                                              openedCard : cardInfo.info.openedCard,
                                          }
                                          await CardInfo.findOneAndUpdate({ _id : table.cardInfoId }, { $set : { info : newInfo }}, { upsert : true });
                                          await Table.updateOne({ _id: table._id }, { $set: { players: players } });
                  
                                          data.updatedPlayers = updatedPlayers;
                                          data.openedCard = openedCard;
                                          
                                     //     console.log("UPDATED PLAYERS AFTER WRONG DECLARATION :: ", updatedPlayers);

                                          client.emit("playerPacked", {	
                                              removedPlayer : data.player,
                                              placedBy: data.player._id,	
                                              updatedPlayers : updatedPlayers,	
                                              table: table,
                                          });	
                                          client.broadcast.to(table._id).emit("playerPacked", {	
                                              removedPlayer : data.player,
                                              placedBy: data.player._id,	
                                              updatedPlayers : updatedPlayers,	
                                              table: table,
                                          });	
              							
              							*/
            }
          }
        });

        client.on("replaceCards", async function (args) {

          console.log("::::::::::::::::::::::::::::INSIDE replaceCards SOCKET ::::::::::::::::::::: ");
          let data = args ;
          try{
             data = JSON.parse(args);
          }catch(error)
          {

          }
          let tableId = data.tableId;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("replaceCards : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);

          data.table = table;
          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findById({
            _id: cardInfoId
          });
          let openedCard = cardInfo.info.openedCard;
          let pointValue = table.pointValue;
          let winningAmount;
          let declarePlayer;
          let opponentPlayer;
          let winner;
          let looser;

          let availableSlots = {};
          table.slotUsedArray.forEach(function (d) {
            availableSlots["slot" + d] = "slot" + d;
          });

          let updatedPlayers = cardInfo.info.updatedPlayers;
          for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
            if (Object.keys(updatedPlayers)[i] == data.userId) {
              declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
              declarePlayer.cards = staticCards; //.############################ STATIC CARDS #######################
              let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
              if (playerPoints.totalPoints == null) {
                playerPoints.totalPoints = 0;
              }
              updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;

              if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
              updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
              updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;

            } else {
              opponentPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
              let playerPoints = groupPointCounter(opponentPlayer.cards, cardInfo.joker);
              updatedPlayers[Object.keys(updatedPlayers)[i]].cards = playerPoints.cards;
              updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
              updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;

              if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
              updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
            }
          }

          if (declarePlayer.totalPoints == 0) {
            declarePlayer.winner = true;
            declarePlayer.playerInfo.winner = true;
            opponentPlayer.winner = false;
            opponentPlayer.playerInfo.winner = false;
          } else {
            declarePlayer.winner = false;
            declarePlayer.playerInfo.winner = false;
            opponentPlayer.playerInfo.winner = true;
            opponentPlayer.winner = true;
            declarePlayer.wrongDeclare = true;
         //   declarePlayer.dropped = true;
            declarePlayer.wrongShow = true;
          }

          for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == declarePlayer.id) {
              updatedPlayers[Object.keys(updatedPlayers)[i]] = declarePlayer;
            } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == opponentPlayer.id) {
              updatedPlayers[Object.keys(updatedPlayers)[i]] = opponentPlayer;
            } else {
              //        console.log("Something wrong with winnerId and opponentId");
            }

            if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
              winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
            } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == false) {
              looser = updatedPlayers[Object.keys(updatedPlayers)[i]];
            }
          };

          if (looser.totalPoints > 80) {
            winningAmount = 80 * pointValue;
            looser.totalPoints = 80;
          } else if (looser.totalPoints <= 80 && looser.totalPoints >= 0) {
            winningAmount = looser.totalPoints * pointValue;
          }

          let commissionAmount = Math.round((winningAmount * table.commission) / 100);
          winningAmount = winningAmount - commissionAmount;
          parseInt(winningAmount);
          parseInt(table.boot);
          parseInt(commissionAmount);

          for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == winner.id) {
              updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (winningAmount + table.boot);

              await Player.updateOne({
                _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
              }, {
                $set: {
                  chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                },
                $inc: {
                  winRummy: (winningAmount)
                }
              });

            } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == looser.id) {
              if (table.boot > (winningAmount + commissionAmount)) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - winningAmount - commissionAmount);
                await Player.updateOne({
                  _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                }, {
                  $set: {
                    chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                  } ,$inc: {
                    lostRummy: -(table.boot - winningAmount - commissionAmount)
                  }
                });
              } else {
                let substractAmount = table.boot - (winningAmount + commissionAmount);
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;

                await Player.updateOne({
                  _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                }, {
                  $set: {
                    chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                  },$inc: {
                    lostRummy: -substractAmount
                  }
                });

              }
            }
          };

          let newInfo = {
            updatedPlayers: updatedPlayers,
            winner: winner
          }
          await CardInfo.updateOne({
            _id: cardInfoId
          }, {
            $set: {
              info: newInfo
            }
          }, {
            upsert: true
          });
          data.updatedPlayers = updatedPlayers;
          data.openedCard = openedCard;

          for (let postion in data.openedCard) {
            if (data.openedCard[postion] == "") {
              data.openedCard.splice(postion, 1);
            }

          }

          sio.to(tableId.toString()).emit("cardReplace", data);

        });

        client.on("decideWinner", async function (args) {





         // let data = JSON.parse(args,sio,client);

          let data = args ;
          try{
             data = JSON.parse(args);
          }catch(error)
          {

          }




         await FinishGame(data,sio);

         
        });

        client.on("playerDropped", async function (args) {

          let data = args;
          try{
            data = JSON.parse(args);
          }catch(error)
          {

          }
   
          let tableId = data.tableId;
          let table = await Table.findById({
            _id: tableId
          });
          console.warn("playerDropped : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);
          data.table = table;
          // let user = await Player.findOne({
          // 	clientId: client.id
          // });
          let user = await Player.findById({
            _id: data.userId
          });

          let cardInfoId = table.cardInfoId;
          let cardInfo = await CardInfo.findById({
            _id: cardInfoId
          });
          let openedCard = cardInfo.info.openedCard;
          let losingAmount;
          let dropPlayer;
          let opponentPlayer;
          let availableSlots = {};
          table.slotUsedArray.forEach(function (f) {
            availableSlots["slot" + f] = "slot" + f;
          });

          if (!data.openedCard) {
            data.openedCard = [];
          }

          let updatedPlayers = cardInfo.info.updatedPlayers;




          if (getActivePlayers(updatedPlayers) == 2) {
            let winningAmount = 0;
            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {

              if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false) {
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
                  dropPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true) {
                  opponentPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                }
              }
            }

            if (table.gameStarted == true && table.playersLeft > 0) {
              losingAmount = dropPlayer.totalPoints * table.pointValue;
              let winningAmount;

              // if (dropPlayer.totalPoints > 80) {
              //   winningAmount = 80 * table.pointValue;
              //   dropPlayer.totalPoints = 80;
              
              // } else if (dropPlayer.totalPoints <= 80 && dropPlayer.totalPoints >= 0) {
              //   winningAmount = dropPlayer.totalPoints * table.pointValue;

              //   if(dropPlayer.totalPoints == 0)
              //       winningAmount = 80;
              //   console.log("in ***  ", winningAmount , "  point va;ue" , table.pointValue) ;
              // }

             if(updatedPlayers[data.userId].round ==0)
             {
              dropPlayer.totalPoints = 20;
              winningAmount = 20 * table.pointValue;

             }else if(updatedPlayers[data.userId].round !=0)
             {
              dropPlayer.totalPoints = 40;
              winningAmount = 40 * table.pointValue;

             }





              losingAmount = winningAmount;

              console.log("wiinning chipssss: : : loossinggamout : ", losingAmount , " ", dropPlayer.totalPoints ) ;

              let commissionAmount = Math.round((winningAmount * table.commission) / 100);
              winningAmount = winningAmount - commissionAmount;
              parseInt(winningAmount);
              parseInt(table.boot);
              parseInt(commissionAmount);
              parseInt(losingAmount);


              await Transactions.create({
                userName: opponentPlayer.playerInfo.userName,
                userId: mongoose.Types.ObjectId(opponentPlayer.id),
                receiverId: mongoose.Types.ObjectId(opponentPlayer.id),
                coins: winningAmount,
                reason: 'rm_game',
                trans_type: 'win'
              });
          
              await Transactions.create({
                userName: opponentPlayer.playerInfo.userName,
                userId: mongoose.Types.ObjectId(opponentPlayer.id),
                senderId: mongoose.Types.ObjectId(opponentPlayer.id),
                receiverId: mongoose.Types.ObjectId('5ee4dbdb484c800bcc40bc04'),
                coins: winningAmount,
                reason: 'rm_game',
                trans_type: 'Commission'
              });
          
              await TransactionCommission.create({
                senderId: mongoose.Types.ObjectId(opponentPlayer.id),
                // agentId: agent._id,
                // distributorId: distributor._id,
                adminId: staticValue.ADMIN_ID,
                tableId: table._id,
                gameId: table.lastGameId,
                // agentCommission: agentCommission,
                // distributorCommission: distributorCommission,
                adminCommission: commissionAmount,
                transType: "COMMISSION",
              });

              let loossinggamout = 0;
                for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                  if (updatedPlayers[Object.keys(updatedPlayers)[i]].packed == true ) {
                    loossinggamout = updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount + loossinggamout;
                    console.log("wiinning chipssss: : : loossinggamout", loossinggamout ,"  ::player:;  " , updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount ) ;
                 }
                }
                loossinggamout = Math.abs( loossinggamout ) + winningAmount;

              for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == opponentPlayer.id) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (loossinggamout + table.boot);
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = loossinggamout;

                  updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = false;

                  console.log("player point : ", updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips);
                  console.log("player point win amount : ", (loossinggamout + table.boot));

                  await Player.updateOne({
                    _id: Object.keys(updatedPlayers)[i]
                  }, {
                    $set: {
                      chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                    },
                    $inc: {
                      winRummy: (loossinggamout)
                    }
                  });

                } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == dropPlayer.id) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;

                  updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].packed = true;
                  if (table.boot >= losingAmount) {
                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                    updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;

                    console.log("player point a : ", updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips);
                    console.log("player point a win amount : ", (table.boot - losingAmount) + "  : " +losingAmount );

                    await Player.updateOne({
                      _id: Object.keys(updatedPlayers)[i]
                    }, {
                      $set: {
                        chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                      },
                      $inc: {
                      lostRummy: -(table.boot - losingAmount)
                    }
                    });

                  } else {
                    let substractAmount = table.boot - losingAmount;
                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                    updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;

                    console.log("player point b : ", updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips);
                    console.log("player point b win amount : ", substractAmount);

                    await Player.updateOne({
                      _id: Object.keys(updatedPlayers)[i]
                    }, {
                      $set: {
                        chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                      },
                      $inc: {
                      lostRummy: -substractAmount
                    }
                    });

                  }

                }

              };

            }

            await Table.findOneAndUpdate({
              _id: tableId
            }, {
              $set: {
                tableAmount: winningAmount
              }
            });
            await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, "DROP", user.chips, 'Drop', 'Drop', 2, table.players, winningAmount, '');

            let newInfo = {
              updatedPlayers: updatedPlayers,
              openedCard: cardInfo.info.openedCard
            }
            await CardInfo.updateOne({
              _id: cardInfoId
            }, {
              $set: {
                info: newInfo
              }
            }, {
              upsert: true
            });
            data.updatedPlayers = updatedPlayers;
            data.table.tableAmount = winningAmount;

            let opencard = cardInfo.info.openedCard;

            data.openedCard = opencard;

            sio.to(tableId.toString()).emit("droppedPlayer", data);

            await Table.updateOne({
              _id: tableId
            }, {
              $set: {
                gameStarted: false,
                gameInit: false,
                turnplayerId : ""
              }
            }, {
              upsert: true
            });
            if (updatedPlayers[Object.keys(updatedPlayers)[0]].dropped == true || updatedPlayers[Object.keys(updatedPlayers)[1]].dropped == true) {
              updatedPlayers[Object.keys(updatedPlayers)[0]].dropped == false;
              updatedPlayers[Object.keys(updatedPlayers)[1]].dropped == false;
              await CardInfo.updateOne({
                _id: cardInfoId
              }, {
                $set: {
                  info: newInfo
                }
              }, {
                upsert: true
              });
              newGameService.startNewGameOnPlayerJoin(tableId, sio);
            }

          } else if (getActivePlayers(updatedPlayers) > 2) {
            console.log("Player Droppeddd ... 2");
            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
              if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
                updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
                updatedPlayers[Object.keys(updatedPlayers)[i]].packed = true;
                updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.packed = true;
                await ScoreBoard.findOneAndUpdate({
                  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                }, {
                  $inc: {
                    gamesLost: 1
                  }
                });

                if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
                  updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;

                losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * table.pointValue;
                await Table.findOneAndUpdate({
                  _id: tableId
                }, {
                  $inc: {
                    tableAmount: losingAmount
                  }
                });
                if (table.boot >= losingAmount) {
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                  updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;

                  await Player.updateOne({
                    _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                  }, {
                    $set: {
                      chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                    },
                    $inc: {
                    lostRummy: -(table.boot - losingAmount)
                  }
                  });

                } else {
                  let substractAmount = table.boot - losingAmount;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                  updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;

                  await Player.updateOne({
                    _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id
                  }, {
                    $set: {
                      chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
                    },
                    $inc: {
                    lostRummy:-substractAmount
                  }
                  });

                }

              } else {
                updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
              }

            }

            let maxPlayers = table.maxPlayers;

            let players = await commonServices.packPlayer(data.userId, table.players, availableSlots, maxPlayers, table._id)
            updatedPlayers = await commonServices.packPlayer(data.userId, updatedPlayers, availableSlots, maxPlayers, table._id)

            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
              if (updatedPlayers[Object.keys(updatedPlayers)[i]].turn == true) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
              }
              if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.userId) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
              }
            }

            let newInfo = {
              updatedPlayers: updatedPlayers,
              openedCard: cardInfo.info.openedCard,
            }
            await CardInfo.findOneAndUpdate({
              _id: table.cardInfoId
            }, {
              $set: {
                info: newInfo
              }
            }, {
              upsert: true
            });
            await Table.updateOne({
              _id: table._id
            }, {
              $set: {
                players: players
              }
            });
            await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, "DROP", user.chips, 'Drop', 'Drop', 0, table.players, 0, '');

            data.updatedPlayers = updatedPlayers;
            data.openedCard = openedCard;

            console.log("Player Droppeddd ... 3");

            table = await Table.findById({
              _id: tableId
            });

            sio.to(table._id.toString()).emit("droppedPlayer", {
              removedPlayer: data.player,
              placedBy: data.userId,
              updatedPlayers: updatedPlayers,
              table: table,
              openedCard: data.openedCard,
            });

            SetTimer(table.turnplayerId, table._id, sio);
          }

        });

      });
    },
  };

}

function isPotLimitExceeded(tableInfo) {
  if (tableInfo.amount) {
    return tableInfo.amount > tableInfo.potLimit;
  }
  return false;
}

function getDotDotName(str) {
  // var strFirstThree = str.substring(0, 2);
  // strFirstThree = "*****";
//  return "******";
   return str;
}

function getActivePlayersOriginal(players) {
  var count = 0;
  for (var player in players) {

    count++;

  }
  return count;
}

async function gt_usr(tn) {

  if (tn != null && tn != 'undefined' && tn != undefined) {

    try {
      return JSON.parse(Buffer.from(tn.split('.')[1], 'base64').toString());
    } catch (error) {
      return "";
    }

  } else {
    return null
  }
};

function getActivePlayers(players) {
  let count = 0;
  for (let player in players) {
    if (players[player].active && !players[player].packed && !players[player].idle) {
      count++;
    }
  }
  return count;
}

function isActivePlayerforseemycard(player, players) {
  return players[player] && players[player].active && !players[player].packed && !players[player].idle;
}

function getOnlyActivePlayerswithdisconnect(players) {
  let count = 0;
  for (let player in players) {
    if (players[player].active && !players[player].idle && !players[player].disconnect) {
      count++;
    }
  }
  return count;
}

function getOnlyActivePlayers(players) {
  let count = 0;
  for (let player in players) {
    if (players[player].active && !players[player].idle) {
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function joinAgain(tableId, userId, client, sio, args, oldtable) {
  console.log(" join again table id ", tableId);
  let tableLength = await Table.findOne({
    _id: tableId
  });

  let playersLength;
  if (tableLength.players == null) {
    playersLength = 0;
  } else {
    playersLength = Object.keys(tableLength.players).length;
  }

  if (playersLength < 5) {
    let delay = Number(Math.random(0, 1000));
    //   delay =0;
    setTimeout(async function () {

      let sit = 1;

      let table = await Table.findOne({
        _id: tableId
      });
      let myData = await User.findOne({
        _id: userId
      });
      myData.userId = userId;
      myData.clientId = client.id;

      let lasttableiddd = myData.lasttableId;

      if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0 && lasttableiddd != tableId) {

        var lasttable = await Table.findOne({
          _id: lasttableiddd
        });

        if (lasttable.players != null && lasttable.players[args.userId]) {

          let table = lasttable;
          let player = myData;

          // leave players

          newGameService.LeavePlayer(player._id, table._id, sio, "from jointable");

        }

      }

      if (table.players == null || table.players[userId] == null || table.players[userId] == undefined) {

        let daaataaa = {
          chips: myData.chips,
          userName: myData.userName,
          displayName: getDotDotName(myData.displayName),
          Decrole: myData.Decrole,
          deviceType: myData.deviceType,
          clientIp: myData.clientIp,
          profilePic : myData.profilePic,
          _id: myData._id
        }

        let player = {
          id: userId,
          cardSet: {
            closed: true,
          },
          playerInfo: daaataaa,
        };

        await playerService.addPlayer(table, player, client, sit, async function (addedPlayer, avialbleSlots, myTable) {

          if (addedPlayer == null) {

            // 	let Endgameobj = {
            // 		id: args.userId,
            // 		userName: player.playerInfo.userName,
            // 		message: "Sorry ! Table Full 1",
            // 	};
            // //	client.emit("EndGame", Endgameobj);
            // 	sio.to(args.tableId).emit("EndGame", Endgameobj);

            let arrtable = await Table.aggregate([{
                $project: {
                  "_id": 1,
                  "gameType": 1,
                  "tableSubType": 1,
                  "boot": 1,
                  "GameStatus": 1,
                  PlayerCount: {
                    $size: {
                      "$objectToArray": "$players"
                    }
                  },
                }
              },
              {
                $match: {
                  tableSubType: "public",
                  boot: tableLength.boot,
                  gameType: tableLength.gameType,
                  _id: {
                    $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
                  },
                  GameStatus: 1,
                  PlayerCount: {
                    $in: [1, 2, 3, 4]
                  }
                }
              },
              {
                $sample: {
                  size: 1
                }
              }
            ]);

            if (arrtable.length == 0) {
              arrtable = await Table.aggregate([{
                  $project: {
                    "_id": 1,
                    "gameType": 1,
                    "tableSubType": 1,
                    "boot": 1,
                    "GameStatus": 1,
                    PlayerCount: {
                      $size: {
                        "$objectToArray": "$players"
                      }
                    },
                  }
                },
                {
                  $match: {
                    tableSubType: "public",
                    boot: tableLength.boot,
                    gameType: tableLength.gameType,

                    GameStatus: 1,
                    PlayerCount: {
                      $in: [0, 1, 2, 3, 4]
                    },
                    _id: {
                      $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
                    }
                  }
                },
                {
                  $sample: {
                    size: 1
                  }
                }
              ]);

            }

            await joinAgain(arrtable[0]._id, userId, client, sio, args, oldtable);

          } else {

            if (addedPlayer !== null) {

              if (args.remark == undefined || args.remark == null)
                args.remark = "no remark";
              await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, "JOIN_TABLE", 0, 0, addedPlayer.playerInfo.chips, 'join again', args.remark.toString(), 0, table.players, 0, '');

              let playersss = JSON.parse(JSON.stringify(myTable.players));
              let chipsss = playersss[args.userId].playerInfo.chips;
              // for (let plll in playersss) {
              //   playersss[plll].playerInfo.chips = 0;
              //   playersss[plll].playerInfo.userName = "***";
              // }

              let tablll5 = JSON.parse(JSON.stringify(myTable));
              tablll5.players = [];

              let newPlayer = {
                id: userId,
                tableId: tableId,
                slot: addedPlayer.slot,
                turn: false,
                active: addedPlayer.active,
                winner: null,
                packed: addedPlayer.packed,

                //	playerInfo: args,
                lastAction: "",
                lastBet: "",
                cardSet: addedPlayer.cardSet,
                otherPlayers: playersss,
                table: myTable,
              };

              let newPlayer_own = {
                id: userId,
                tableId: tableId,
                slot: addedPlayer.slot,
                turn: false,
                active: addedPlayer.active,
                winner: null,
                packed: addedPlayer.packed,

                //	playerInfo: args,
                lastAction: "",
                lastBet: "",
                cardSet: addedPlayer.cardSet,
                otherPlayers: playersss,
                table: myTable,
                chips: chipsss
              };

              console.log("tablejoined .. 1");
              sio.to(oldtable.toString()).emit("ChangeTable", newPlayer);
              client.emit("tableJoined", newPlayer_own);
              sio.to(tableId.toString()).emit("newPlayerJoined", newPlayer);
              //newGameService.SwitchTables(args.tableId, client, sio);
              let tableGG = await Table.findOne({
                _id: myTable._id
              });
              await User.update({
                _id: userId
              }, {
                $set: {
                  lasttableId: tableId,
                  tableId: tableId,
                  game : tableGG.gameType,
                  clientId: client.id
                }
              });

              
              let slorrrr = [1, 2, 3, 4, 5];
              for (var playeraaa in tableGG.players) {
                let slotttofplayer = tableGG.players[playeraaa].slot;
                var slotuu = slotttofplayer.slice(-1);;
                for (var i = 0; i < slorrrr.length; i++) {
                  if (slorrrr[i] == slotuu) {
                    slorrrr.splice(i, 1);
                  }
                }
              }
              await Table.update({
                _id: myTable._id
              }, {
                $set: {
                  slotUsedArray: slorrrr
                }
              });

              await User.update({
                _id: args.userId
              }, {
                $set: {
                  forcedisconnect: false
                }
              });

              newGameService.startNewGameOnPlayerJoin(myTable._id, sio);

            }
          }
        });
      }
      // });
    }, delay * 1000);
  } else {

    let arrtable = await Table.aggregate([{
        $project: {
          "_id": 1,
          "gameType": 1,
          "tableSubType": 1,
          "boot": 1,
          "GameStatus": 1,
          PlayerCount: {
            $size: {
              "$objectToArray": "$players"
            }
          },
        }
      },
      {
        $match: {
          tableSubType: "public",
          boot: tableLength.boot,
          gameType: tableLength.gameType,
          _id: {
            $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
          },
          GameStatus: 1,
          PlayerCount: {
            $in: [1, 2, 3, 4]
          }
        }
      },
      {
        $sample: {
          size: 1
        }
      }
    ]);

    if (arrtable.length == 0) {
      arrtable = await Table.aggregate([{
          $project: {
            "_id": 1,
            "gameType": 1,
            "tableSubType": 1,
            "boot": 1,
            "GameStatus": 1,
            PlayerCount: {
              $size: {
                "$objectToArray": "$players"
              }
            },
          }
        },
        {
          $match: {
            tableSubType: "public",
            boot: tableLength.boot,
            gameType: tableLength.gameType,

            GameStatus: 1,
            PlayerCount: {
              $in: [0, 1, 2, 3, 4]
            },
            _id: {
              $ne: new mongoose.Types.ObjectId(tableLength._id.toString())
            }
          }
        },
        {
          $sample: {
            size: 1
          }
        }
      ]);

    }

    await joinAgain(arrtable[0]._id, userId, client, sio, args, oldtable);

    // 	let myData = await User.findOne({
    // 		_id: args.userId
    // 	});
    // 	let Endgameobj = {
    // 		id: args.userId,
    // 		userName: myData.userName,
    // 		message: "Sorry ! Table Full 2",
    // 	};
    // //	client.emit("EndGame", Endgameobj);
    // 	sio.to(args.tableId).emit("EndGame", Endgameobj);

  }

}

module.exports = new code();