let io = require("socket.io");
let _ = require("underscore");
const Table = require("../model/table");
const Player = require("../model/player");
const Game = require("../model/game");
const mongoose = require("mongoose")
const playerService = require("../service/player");
let newGameService = require("../service/newGame");
let commissionService = require('../service/commision')
let Transactions = require('../model/transaction')
const TransactionCommission = require("../model/transactionCommission");

const { sortCards, groupPointCounter, addCardToHand } = require("../service/cardComparision");
const CardInfo = require("../model/cardInfo");
const auditType = require("../constant/auditType");
const gameAuditService = require("../service/gameAudit");
const commonServices = require("../service/common");
const ScoreBoard = require("../model/scoreboard");
const { update } = require("../model/table");
const { use } = require("browser-sync");
const { object } = require("underscore");
const Card = require("../service/card");
//const playerService = require("../service/player");
const staticValue = require("../constant/staticValue");
const transactionType = require("../constant/transactionType");

function getActivePlayers(players) {
    let count = 0;
    for (let player in players) {
        if (players[player].active && !players[player].packed) {
            count++;
        }
    }
    return count;
};

function isActivePlayer(id, players) {
    return players[id] && players[id].active;
};

function deactivatePlayerFromArray(id, players) {
    for (let i = 0; i < Object.keys(players).length; i++) {
        if (players[Object.keys(players)[i]].id == id) {
            players[Object.keys(players)[i]].active = false;
        }
    }
    return players;
}

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
            let objServ = io.listen(server, {
                pingInterval: 2000,
                pingTimeout: 5000,
            });

            let ios = objServ.sockets;
            ios.on("connection", function (client) {
                console.log("connection estlablished!");
                client.emit("connectionSuccess", { id: client.id });

                client.on("watchTable", async function (args) {
                    // console.log("WATCHTABLE EMITS :: ");
                    let data = JSON.parse(args);
                    // let tableId = data.tableInfo._id
                    let inId = data.tableId;
                    let table = await Table.findOne({ _id: inId });
                   
                    
                    client.join(inId, async function () {
                        // console.log("WATCH TABLE : ", inId);
                    });
                    client.emit("watchTable", { players: table.players, table });
                });

                client.on('joinTable', async function (args) {

                    console.log("------------------- On JoinTable ----------------------");
                    
                    try {
                        args = JSON.parse(args);
                        console.log("args------", args);
                        let inId = args.tableId;
                        let table = await Table.findOne({ _id: inId });
                        let tableId = args.tableId;
                       
                        // ...........checking how many players are available in table......
                        let tableLength = await Table.findOne({ _id: args.tableId });
                       
                        let playersLength;

                        if (tableLength.players == null) {
                            playersLength = 0;
                        
                        } else {
                            playersLength = Object.keys(tableLength.players).length;
                            // if (tableLength.gameStarted) {
                            //     client.emit("watchTable", { tableId : tableLength._id });
                            // }
                        }
                        
                        // ...........checking about is there is slot available or not .......
                        // let minEntry = 2;
                        let minEntry = 2;
                        if (playersLength <= minEntry || playersLength >= minEntry) {
                            console.log("playersLength:",playersLength);
                            if (args.chips >= tableLength.boot) {
                                let delay = Number(Math.random(0, 1000));
                                setTimeout(async function () {

                                    let sit = 0;

                                    client.join(tableId, async function () {
                                        //.............updating user's tableId and clientId.................
                                        await Player.updateOne({ _id: args.userId }, { $set: { tableId: args.tableId, clientId: client.id } });
                                        //.............target that table and user.............
                                        let table = await Table.findOne({ _id: args.tableId });
                                        let myData = await Player.findOne({ _id: args.userId });
                                        myData.userId = args.userId;
                                        myData.clientId = args.clientId;

                                        // for sit in given slot
                                        let sit = args.sit;
                                        // console.log("SSSSIIIITTTT ::: &&&&****&&&& ::: ", sit);

                                        //...........checking if any player is not available than this condition will run.........
                                        if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {
                                            let player = {
                                                id: args.userId,
                                                playerInfo: myData
                                            };
                                            // ..........sorting array when inserting new player into it..........
                                            table.slotUsedArray.sort(function (a, b) {
                                                return a - b;
                                            });
                                            //.........MAIN FUNCTION FOR ADD PLAYER IN GAME GOES FROM HERE.........
                                            await playerService.addPlayer(table, player, client, sit, async function (addedPlayer, availableSlots) {

                                                let myTable = await Table.findOne({ _id: args.tableId });
                                                // ..........if there is no players in game than......
                                                if (addedPlayer !== null) {
                                                    let newPlayer = {
                                                        id: args.userId,
                                                        tableId: args.tableId,
                                                        slot: addedPlayer.slot,
                                                        turn: false,
                                                        active: addedPlayer.active,
                                                        winner: null,
                                                        playerInfo: args,
                                                        otherPlayers: myTable.players
                                                    };

                                                    await Table.updateOne({ _id: args.tableId }, { $inc: { playersLeft: 1 } });

                                                    client.emit("tableJoined", newPlayer);
                                                    client.broadcast.to(args.tableId).emit("newPlayerJoined", newPlayer);
												//	console.log("myTable.gameStarted---",myTable);
                                                    if(myTable.gameStarted){ // game started True nd new player join
                                                        console.log("game started True nd new player join");
                                                    }else{
                                                        let myTableId = myTable._id.toString();
                                                        newGameService.startNewGameOnPlayerJoin(client, myTableId, availableSlots, args.tableId);    
                                                    }
                                                }

                                            })
                                        }
                                    })
                                }, delay * 1000);
                            } else {
                               console.log("player doesn't have enough chips to play. !!!!!");
                            }


                        }

                    }
                    catch (err) {
                        console.log(err);
                    }

                });


                  

                client.on("sortCards", async function (args) {
                   console.log("------------------- On sortCards ----------------------");

                    let data = JSON.parse(args);

                    let player = data.player;
                    let tableId = player.playerInfo.tableId;
                    let table = await Table.findById({ _id: tableId });
                    let cardInfoId = table.cardInfoId;
                    let cardsInfo = await CardInfo.findOne({ _id: cardInfoId });
                    let openedCard = cardsInfo.info.openedCard;
                    
                    let updatedPlayers = cardsInfo.info.updatedPlayers;

                    console.log("ytable--=====",table);
                     
                    await Transactions.create({
                        userId: mongoose.Types.ObjectId(data.userId),
                        tableId: table._id,
                        coins: table.boot,
                        gameId:table.lastGameId,
                        trans_type: transactionType.BOOT
                    })

                    for (let i = 0; i <= Object.keys(updatedPlayers).length; i++) {
                        if (Object.keys(updatedPlayers)[i] == player.id) {
                            let sortedPlayer = sortCards(updatedPlayers[Object.keys(updatedPlayers)[i]]);
                            sortedPlayer.cards = sortedPlayer.groupCard;
                            delete sortedPlayer.groupCard;
                            player = sortedPlayer;
                            updatedPlayers[Object.keys(updatedPlayers)[i]] = sortedPlayer;
                        }
                    }
                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: openedCard
                    }
                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;
                    client.emit("cardsSorted", player);
                });

                client.on("openedDeckCard", async function (args) {
                    console.log("------------------- On openedDeckCard ----======0000000----------------------");
                  //  console.log(args);
                    let data = JSON.parse(args);
                    console.log("data-----",data);
                    let tableId = data.tableInfo._id;
                    let table = await Table.findById({ _id: tableId });
                    let user = await Player.findOne({ clientId: client.id });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
                    let removedOpenCard = cardInfo.info.openedCard.shift();
                    console.log("OpenedCard ==>> ", removedOpenCard);


                    if (!data.openedCard) {
                        data.openedCard = [];
                    }
                    data.openedCard = cardInfo.info.openedCard
                    let updatedPlayers = cardInfo.info.updatedPlayers;

                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
                            let objForAddCard = {
                                cards: updatedPlayers[Object.keys(updatedPlayers)[i]].cards,
                                removedOpenCard: removedOpenCard
                            }

                            let addedCardData = await addCardToHand(objForAddCard);
                            let groupData = groupPointCounter(addedCardData, cardInfo.joker);

                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
                            data.player = updatedPlayers[Object.keys(updatedPlayers)[i]];

                        }
                    }
                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: cardInfo.info.openedCard,
                        lastremove : removedOpenCard,
                    }









                    await gameAuditService.createAudit(table._id, cardInfo._id , user._id, table.lastGameId, auditType.CLICK_OPEN_DECK, user.chips, 'Open_deck', 'Open_deck', 0, table.players, 0, '');
                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;
                    data.removedOpenCard = removedOpenCard;

                    client.emit("cardOpenedDeck", data);
                    client.broadcast.to(tableId).emit("cardOpenedDeck", data);
                });

                client.on("closedDeckCard", async function (args) {
                    console.log("------------------- On closedDeckCard000---3-3-3-3- ----------------------");
                   // console.log(args);
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id;
                    let table = await Table.findById({ _id: tableId });
                    var user = await Player.findOne({ clientId: client.id });
                  //  var user = await Player.findById({ _id: data.player._id});
                    console.log("usersss  " + user);
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
                    let deckCards = cardInfo.deckCards;
                    let randomCard = deckCards.shift();
                 // console.log("randomCard : ", randomCard);
                    if (!data.randomCard) {
                        data.randomCard = randomCard;
                    } 

                    console.log("tableDataclosedDeckCard-------",table);
                    console.log("userclosedDeckCard-----ddd",user);
                    data.randomCard = randomCard;
                    let updatedPlayers = cardInfo.info.updatedPlayers;

                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {

                            let objForAddCard = {
                                cards: updatedPlayers[Object.keys(updatedPlayers)[i]].cards,
                                removedOpenCard: randomCard
                            }
                            let addedCardData = await addCardToHand(objForAddCard);
                            let groupData = groupPointCounter(addedCardData, cardInfo.joker);

                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
                            data.player = updatedPlayers[Object.keys(updatedPlayers)[i]];

                        }
                    }

                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: cardInfo.info.openedCard
                    }
                    await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, auditType.CLICK_CLOSE_DECK, user.chips, 'Close_deck', 'Close_deck', 0, table.players, 0, '');

                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo, deckCards : deckCards } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;
                    data.openedCard = cardInfo.info.openedCard;

                    client.emit("cardClosedDeck", data);
                    client.broadcast.to(tableId).emit("cardClosedDeck", data);
                });

                client.on("discardCard", async function (args) {
                    console.log("------------------- On discardCard ----------------------");
                    //console.log(args);
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id
                    let table = await Table.findById({ _id: tableId });
                    let user = await Player.findOne({ clientId: client.id });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
                    let discardedCard = data.discardedCard;
                    let openedCard = cardInfo.info.openedCard;
                    let deckCards = cardInfo.deckCards;
                    let availableSlots = {};
                    table.slotUsedArray.forEach(function (f) {
                        availableSlots["slot" + f] = "slot" + f;
                    });

                    console.log("discsrdTable----===",table._id);
                   // console.log("discsrdTuser----===",user._id);
                  //  console.log("cardInfo----===",cardInfo._id);


                    if (!data.removedCard) {
                        data.removedCard = [];
                    }
                    data.removedCard = data.discardedCard;
                    
                    let updatedPlayers = cardInfo.info.updatedPlayers;
                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = data.cards	

                            let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards, cardInfo.joker);	
                            
                            cardInfo.info.openedCard.unshift(discardedCard);
                            if (!data.openedCard) {
                                data.openedCard = [];                                
                            }
                            data.openedCard.unshift(discardedCard); 
                            
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].noOfTurn += 1;
                            await Player.updateOne({ _id: updatedPlayers[Object.keys(updatedPlayers)[i]].id }, { $inc: { noOfTurn: 1 } }, { upsert: true });
                        }
                    }

                    if (cardInfo.info.openedCard.length > 5) {
                        let lastCard = cardInfo.info.openedCard.pop();
                        deckCards.push(lastCard);
                    }

                    updatedPlayers = commonServices.getNextSlotForTurn(data.player.id, updatedPlayers, availableSlots, table.maxPlayers);
                    await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, auditType.DISCARD, user.chips, 'Discard', 'Discard', 0, table.players, 0, '');
                    let removedOpenCard= "";
                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: cardInfo.info.openedCard,
                        lastremove : removedOpenCard,
                        
                    }
                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo, deckCards: deckCards } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;

                    client.emit("cardDiscard", data);
                    client.broadcast.to(tableId).emit("cardDiscard", data);
                });

                client.on("turnChanged", async function (args) {
                    console.log("------------------- On turnChanged ----------------------");
                 //   console.log(args);
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id
                    let table = await Table.findById({ _id: tableId });
                    let user = await Player.findOne({ clientId: client.id });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
                    let availableSlots = {};
                    table.slotUsedArray.forEach(function (f) {
                        availableSlots["slot" + f] = "slot" + f;
                    });

                    if (!data.removedCard) {
                        data.removedCard = [];
                    }
                    data.removedCard = data.discardedCard;

                    let updatedPlayers = cardInfo.info.updatedPlayers;
                    updatedPlayers = commonServices.getNextSlotForTurn(data.player.id, updatedPlayers, availableSlots, table.maxPlayers);

                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: cardInfo.info.openedCard
                    }
                    await gameAuditService.createAudit(table._id, cardInfo._id, user._id, table.lastGameId, auditType.USER_TURN, user.chips, 'User_turn', 'User_turn', 0, table.players, 0, '');

                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;
                    data.openedCard = cardInfo.info.openedCard;

                    client.emit("changedTurn", data);
                    client.broadcast.to(tableId).emit("changedTurn", data);
                });

                client.on("groupCards", async function (args) {
                    console.log("------------------- On groupCards ----------------------");
                  //  console.log(args);
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id;
                    let table = await Table.findById({ _id: tableId });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findOne({ _id: cardInfoId });
                    let openedCard = cardInfo.info.openedCard;

                    let updatedPlayers = cardInfo.info.updatedPlayers;
                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (Object.keys(updatedPlayers)[i] == data.player.id) {
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = data.cards;

                            let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards, cardInfo.joker);

                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
                            data.player.cards = groupData.cards;
                        }
                    }

                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: openedCard
                    }
                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;

                    client.emit("cardsGroup", data);
                });

                client.on("dragCard", async function (args) {
                    console.log("------------------- On dragCard ----------------------");
                  //  console.log(args);
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id;
                    let table = await Table.findById({ _id: tableId });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findOne({ _id: cardInfoId });
                    let openedCard = cardInfo.info.openedCard;

                    let updatedPlayers = cardInfo.info.updatedPlayers;
                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (Object.keys(updatedPlayers)[i] == data.player.id) {
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = data.cards;

                            let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards, cardInfo.joker);

                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
                            data.player.cards = groupData.cards;
                        }
                    }

                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        openedCard: openedCard
                    }
                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;

                    client.emit("cardDragged", data);
                });

                client.on("finishGame", async function (args) {
                    console.log("------------------- On finishGame ----------------------");
                  //  console.log(args);
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id
                    let table = await Table.findById({ _id: tableId });
                    let user = await Player.findOne({ clientId: client.id });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
                    let openedCard = cardInfo.info.openedCard;
                    let finishCard = data.finishCard;
                    let declarePlayer;
                    let availableSlots = {};	
                    table.slotUsedArray.forEach(function (f) {	
                        availableSlots["slot" + f] = "slot" + f;	
                    });

                    let updatedPlayers = cardInfo.info.updatedPlayers;
				//	console.log(updatedPlayers);
                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id)
						{
                            declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = data.cards
                            updatedPlayers[Object.keys(updatedPlayers)[i]].finisher = true;
                            
                            let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards, cardInfo.joker);
                            // console.log("FINISH GAME >> CARDSET POINTS ::: ", groupData.cardsetPoints);

                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;	
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
                            declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                        }
                    }
                    await gameAuditService.createAudit(table._id,cardInfo._id, user._id, table.lastGameId, auditType.FINISH, user.chips, 'Finish', 'Finish', 0, table.players, 0, '');

                    // &*&*&*&*&*&*&*&* if someOne finish the game &*&*&*&*&*&*&&*	
                    if (getActivePlayers(updatedPlayers)== 2) {	
					 console.log("===2");
                        let newInfo = {	
                            updatedPlayers: updatedPlayers,	
                            openedCard: openedCard,	
                            finishCard: finishCard	
                        }	
                        await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true })	

                        data.updatedPlayers = updatedPlayers;	
                        data.openedCard = openedCard;	
    	
                        client.emit("gameFinished", data);	
                        client.broadcast.to(tableId).emit("gameFinished", data);

                    } else if (getActivePlayers(updatedPlayers) > 2) {	
					
					 console.log(">>2");

                        let isValidGroups = commonServices.isValidGroups(declarePlayer.cards);
                        
                        console.log("valide groupssssss" + declarePlayer.totalPoints + isValidGroups);


                    if (declarePlayer.totalPoints == 0 && isValidGroups) {	
						
						 console.log("===00");
                            // console.log(" (*)*(*)*(*)*(*)*(*)*(*) TOTAL POINTS === 0 AND ALSO ALL GROUP ARE VALID (*)*(*)*(*)*(*)*(*)*(*)*");	

                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
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

                            await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true })	
                            data.updatedPlayers = updatedPlayers;	
                            data.openedCard = openedCard;	
                         //   console.log("Data ... UPDATEDPLAYERS In finish Game (TOTALPOINTS == 0 && VALIDGROUP == TRUE):: ", data.updatedPlayers);
        	
                            client.emit("gameFinished", data);	
                            client.broadcast.to(tableId).emit("gameFinished", data);	

                     } else {	
					//	 console.log("===5");
						 
						 
					  console.log("finishGameDone : ", "data");
					   client.emit("finishGameDone", data);	
						//client.broadcast.to(tableId).emit("gameFinished", data);	
						   
						   
						   
                            // console.log(" &*(&*(&*(&*(&*(&*(&*(&*(&*( TOTAL POINTS !!!!!!!!=== 0  &*)&*)&*)&)&*)&*)&*)&*)");	
                        //    console.log("UPDATED PLAYERS before WRONG DECLARATION :: ", updatedPlayers);
						
						
                        //   client.broadcast.to(tableId).emit("gameFinished", data);	
						
/*
                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
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
                                        await Player.findOneAndReplace({ _id: data.player.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                    } else {
                                        let substractAmount = table.boot - losingAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                        await Player.findOneAndReplace({ _id: data.player.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                    }
                                } else {
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
                                }

                            }
    
    
                            let maxPlayers = table.maxPlayers;
                            
                            let players = await commonServices.packPlayer(data.player.id, table.players, availableSlots, maxPlayers, table._id)
                            updatedPlayers = await commonServices.packPlayer(data.player.id, updatedPlayers, availableSlots, maxPlayers, table._id)
    
                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].turn == true) {
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
                                }
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
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
                    // console.log("INSIDE REPLACE SOCKET :: ");
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id
                    let table = await Table.findById({ _id: tableId });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
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
                        if (Object.keys(updatedPlayers)[i] == data.player.id) {
                            declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                            declarePlayer.cards = staticCards;                  //.############################ STATIC CARDS #######################
                            let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
                            if (playerPoints.totalPoints == null) {
                                playerPoints.totalPoints = 0;
                            }
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;
                            

                        } else {
                            opponentPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                            let playerPoints = groupPointCounter(opponentPlayer.cards, cardInfo.joker);
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = playerPoints.cards;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
                            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;
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
                    } else if (looser.totalPoints <= 80 && looser.totalPoints >= 0) {
                        winningAmount = looser.totalPoints * pointValue;
                    }

                    let commissionAmount =  Math.round((winningAmount * table.commission) / 100) ;
                    winningAmount = winningAmount - commissionAmount;
                    parseInt(winningAmount);
                    parseInt(table.boot);
                    parseInt(commissionAmount);


                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == winner.id) {
                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (winningAmount + table.boot);
                            await Player.findOneAndReplace({ _id: winner.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                        } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == looser.id) {
                            if (table.boot > (winningAmount + commissionAmount)) {
                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - winningAmount - commissionAmount);
                                await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                            } else {
                                let substractAmount = table.boot - (winningAmount + commissionAmount);
                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                            }
                        }
                    };

                    let newInfo = {
                        updatedPlayers: updatedPlayers,
                        winner: winner
                    }
                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                    data.updatedPlayers = updatedPlayers;
                    data.openedCard = openedCard;

                    client.emit("cardReplace", data);
                    client.broadcast.to(tableId).emit("cardReplace", data);

                });

                client.on("decideWinner", async function (args) {
					console.log("Decide Winner");
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id
                    let table = await Table.findById({ _id: tableId });
                    let user = await Player.findOne({clientId: client.id })
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
                    let openedCard = cardInfo.info.openedCard;
                    let pointValue = table.pointValue;
                    let declarePlayer;
                    let opponentPlayer;
                    let winner;
                    let looser;         
                    let totalActivePlayers = 0;    

                    let availableSlots = {};
                    table.slotUsedArray.forEach(function (d) {
                        availableSlots["slot" + d] = "slot" + d;
                    });

                    console.log("---------Winner Winner ----------------")
                    let updatedPlayers = cardInfo.info.updatedPlayers;
					//  console.log("get playersss-------=====----",updatedPlayers );

                    // let variation = await commissionService.calculateCommission(tableId,data.player.id )    
                    
                    // console.log("variaotion--datat.....", variation);

               
                    await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, auditType.WINNER, user.chips, 'Winner', 'Winner', 0, table.players, 0, '');
                    if (getActivePlayers(updatedPlayers) == 2 ) {   
                        let winningAmount = 0;
                        let losingAmount;
                        console.log(".............Anu Log..........................................");
						
							
                        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false) {


                                if (Object.keys(updatedPlayers)[i] == data.player.id) {
                                    declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                                    // declarePlayer.cards = staticCards;                  //.############################ STATIC CARDS #######################
                                    let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
                                    if (playerPoints.totalPoints == null) {
                                        playerPoints.totalPoints = 0;
                                    }
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;

                                    //	console.log("1 Players Id", Object.keys(updatedPlayers)[i]);
                                    //	console.log("1 Players Pointsss", playerPoints);

                                } else {
                                    opponentPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                    let playerPoints = groupPointCounter(opponentPlayer.cards, cardInfo.joker);
                                    if (playerPoints.totalPoints == null) {
                                        playerPoints.totalPoints = 0;
                                    }
                                //    updatedPlayers[Object.keys(updatedPlayers)[i]].cards = playerPoints.cards;
                                //    updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
                                //    updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;


                                    updatedPlayers[Object.keys(updatedPlayers)[i]].cards = playerPoints.cards;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;

                                  
                                }
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].active) {
                                    totalActivePlayers++;
                                }

                            }
							
							

                        }
console.log("declarePlayer__detail=====........... " + declarePlayer.finisher );
console.log("declarePlayer__detail=====........... " + declarePlayer.totalPoints );

                        if (declarePlayer.finisher == true) {
                     
                            if (declarePlayer.totalPoints == 0) {
                                let isValidGroups = commonServices.isValidGroups(declarePlayer.cards)
                                if (isValidGroups) {
                                    declarePlayer.winner = true;
                                    declarePlayer.playerInfo.winner = true;
                                    declarePlayer.wrongDeclare = false;
                                    winner = declarePlayer;
                                    looser = opponentPlayer;

                                    console.log("losue--------r-----",looser); 

                                    // console.log("winner---winner--nirav",winner);

                                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                        
                                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
                                            winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                            await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesWon : 1}});
                                            
                                        } else {
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                                            await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesLost : 1}});	
                                            losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * pointValue;
                                            winningAmount += losingAmount;

                                            
                                    console.log("winningAmount--------1-----",winningAmount); 


                                            parseInt(winningAmount);
                                            parseInt(losingAmount);
    
                                        

                                            if (table.boot >= losingAmount) {
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                                await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                            } else {
                                                let substractAmount = table.boot - losingAmount;
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                                await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                            }
                                        }
                                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].active) {
                                            totalActivePlayers++;
                                        }
                                    } 
                                   
                                   
                                    console.log("winner--------1--rerer---", winner); 

                                    let commissionAmount = Math.round((winningAmount * table.commission) / 100);
                                    winningAmount -= commissionAmount;
           


                                    console.log("commissionAmount--------2-----", commissionAmount); 
                                    console.log("winningAmount--------2-----", winningAmount); 
                                    parseInt(winningAmount);
                                    parseInt(commissionAmount);
                                    winner.playerInfo.chips += (winningAmount + table.boot);
                                    winner.winningAmount = winningAmount;
                                    await Player.findOneAndReplace({ _id: winner.id }, winner.playerInfo);
                                    await Player.findOneAndUpdate({ type : "admin"}, { $inc : { chips : commissionAmount }});
                                    await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});
    
                                    await Transactions.create({
                                        userName: user.userName,
                                        userId: mongoose.Types.ObjectId(winner.id),
                                        receiverId: mongoose.Types.ObjectId(winner.id),
                                        coins: winningAmount,
                                        reason: 'rm_game',
                                        trans_type: 'win'
                                    })


                                    await Transactions.create({
                                        userName: user.userName,
                                        userId: mongoose.Types.ObjectId(winner.id),
                                        senderId: mongoose.Types.ObjectId(winner.id),
                                        receiverId: mongoose.Types.ObjectId('5ee4dbdb484c800bcc40bc04'),
                                        coins: commissionAmount,
                                        reason: 'rm_game',
                                        trans_type: 'Commission'
                                    })

                                    let newInfo = {
                                        updatedPlayers: updatedPlayers,
                                        winner: winner
                                    }
                                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                                    data.updatedPlayers = updatedPlayers;
                                    data.openedCard = openedCard;
                                 //   console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
                                    data.tableInfo.tableAmount = winningAmount;
                                 //   console.log("data.table in GAME  AFTER :: ", data.tableInfo);
                                    data.totalActivePlayers = totalActivePlayers;
                                    

                                    
                                    // console.log("UPDATED pLAYERS IN SHOW WINNER  111111111111 : ", updatedPlayers);
    
                                    // console.log(" SHOW WINNER EMITS FOR >>> 2 PLAYERS <<< ")0;
									
									console.log("showwinner..9");
                                    client.emit("showWinner", data);
                                    client.broadcast.to(tableId).emit("showWinner", data);
    
                                    await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
                                
                                    if (updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared == true && updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared == true) {
                                        updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
                                        updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
                                        await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                                        newGameService.startNewGame(client, tableId, availableSlots);
                                    }
                                } else {

                                    console.log("not valid---------group=====----------");
                                    // player have 0 points but he is not winner legally
                                    declarePlayer.winner = false;
                                    declarePlayer.playerInfo.winner = false;
                                    winner = opponentPlayer;
                                    looser = declarePlayer;
    
                                    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == declarePlayer.id) {
                                            // updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = 80;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                                            await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesLost : 1}});
    
                                            losingAmount = 80 * pointValue;
                                            winningAmount += losingAmount;
                                            parseInt(winningAmount);
                                            parseInt(losingAmount);
    
                                            if (table.boot >= losingAmount) {
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                                await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                            } else {
                                                let substractAmount = table.boot - losingAmount;
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                                await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                            }
    
                                        } else {
                                            winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
                                            await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesWon : 1}});
                                        }
                                    }
    
                                    let commissionAmount = Math.round((winningAmount * table.commission) / 100);
                                    winningAmount -= commissionAmount;
                                    parseInt(winningAmount);
                                    parseInt(commissionAmount);
                                    parseInt(table.boot);
                                    winner.playerInfo.chips += winningAmount;
                                    winner.winningAmount = (winningAmount + table.boot);

                                    await Player.findOneAndReplace({ _id: winner.id }, winner.playerInfo);
                                    await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});
        
                                    let newInfo = {
                                        updatedPlayers: updatedPlayers,
                                        winner: winner
                                    }
                                    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                                    data.updatedPlayers = updatedPlayers;
                                    data.openedCard = openedCard;
                                //    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
                                    data.tableInfo.tableAmount = winningAmount;
                                 //   console.log("data.table in GAME  AFTER :: ", data.tableInfo);
                                    data.totalActivePlayers = totalActivePlayers;

                                    // console.log("UPDATED pLAYERS IN SHOW WINNER 2222222222 : ", updatedPlayers);
    
	console.log("showwinner..6");
                                    client.emit("showWinner", data);
                                    // console.log("{{{{{{{{{ SHOW WINNER EMITS }}}}}}}}");
                                     console.log("DATA IN NORMAL SHOW WINNER :: ", data);
                                    client.broadcast.to(tableId).emit("showWinner", data);
    
                                    await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
                                
                                    if (updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared == true && updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared == true) {
                                        updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
                                        updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
                                        await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                                        newGameService.startNewGame(client, tableId, availableSlots);
                                    }
    
                                }
                            } else {


                                console.log("so herre coming-=.........................f.ff........");
                                declarePlayer.winner = false;
                                declarePlayer.playerInfo.winner = false;
                                opponentPlayer.winner = true;
                                opponentPlayer.playerInfo.winner = true;
        
                                for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                    if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == declarePlayer.id) {
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;
                                        looser = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                        await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesLost : 1}});
    
                                    } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == opponentPlayer.id) {
                                        updatedPlayers[Object.keys(updatedPlayers)[i]] = opponentPlayer;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                                        winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                        await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesWon : 1}});
    
                                    } else {
                               //         console.log("Something wrong with winnerId and opponentId");
                                    }
        
                                };
        
                                if (looser.totalPoints > 80) {
                                    losingAmount = 80 * pointValue;
                                } else if (looser.totalPoints <= 80 && looser.totalPoints >= 0) {
                                    losingAmount = looser.totalPoints * pointValue;
                                }
    
                                winningAmount += losingAmount;
                              console.log("winningAmount----43444444", winningAmount);

                         

                              
                                let commissionAmount = Math.round((winningAmount * table.commission) / 100);
                                winningAmount = winningAmount - commissionAmount;
                                // winningAmount = winningAmount.toFixed(0);


                                parseInt(winningAmount);
                                parseInt(losingAmount);
                                parseInt(table.boot);
                                parseInt(commissionAmount);

                                await Transactions.create({
                                    userName: user.userName,
                                    userId: mongoose.Types.ObjectId(winner.id),
                                    receiverId: mongoose.Types.ObjectId(winner.id),
                                    coins: winningAmount,
                                    reason: 'rm_game',
                                    trans_type: 'win'
                                })
        
                                await Player.findOneAndUpdate({ type : "admin"}, { $inc : { chips : commissionAmount }});

                                await Transactions.create({
                                    userName: user.userName,
                                    userId: mongoose.Types.ObjectId(winner.id),
                                    senderId:mongoose.Types.ObjectId(winner.id),
                                    receiverId: mongoose.Types.ObjectId('5ee4dbdb484c800bcc40bc04'),
                                    coins: commissionAmount,
                                    reason: 'rm_game',
                                    trans_type: 'Commission'
                                })

                                let transactionCommissionData = {                       // nirav code to store transaction records
                                    senderId: mongoose.Types.ObjectId(winner.id),
                                    // agentId: agent._id,
                                    // distributorId: distributor._id,
                                    adminId: staticValue.ADMIN_ID,
                                    tableId: table._id,
                                    gameId: table.lastGameId,
                                    // agentCommission: agentCommission,
                                    // distributorCommission: distributorCommission,
                                    adminCommission: commissionAmount,
                                    transType: transactionType.COMMISSION,
                                }
                                console.log("transactionCommissionData-------", transactionCommissionData);
                                // const newTransactionCommission = new TransactionCommission(transactionCommissionData);
                                // await newTransactionCommission.save();
                                
                                await TransactionCommission.create({
                                    senderId: mongoose.Types.ObjectId(winner.id),
                                    // agentId: agent._id,
                                    // distributorId: distributor._id,
                                    adminId: staticValue.ADMIN_ID,
                                    tableId: table._id,
                                    gameId: table.lastGameId,
                                    // agentCommission: agentCommission,
                                    // distributorCommission: distributorCommission,
                                    adminCommission: commissionAmount,
                                    transType: transactionType.COMMISSION,
                                })
                

                                for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {

                                    console.log("anothet >>.......transaction............");
                                    console.log("anothet >>.......winningAmount............", winningAmount);

                                    if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == winner.id) {
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += parseInt(winningAmount + table.boot);
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = winningAmount;
                                        await Player.findOneAndReplace({ _id: winner.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                       
                                       
    
                                    } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == looser.id) {
                                        console.log("losingAmount.........---.....",losingAmount);
                                        if (table.boot >= losingAmount) {
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += parseInt(table.boot - losingAmount);
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                            await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                        } else {
                                            let substractAmount = table.boot - losingAmount;
                                            console.log("substractAmount---............",substractAmount);
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += parseInt(substractAmount);
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                            await Player.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                        }
                                    }
    
                                    if (updatedPlayers[Object.keys(updatedPlayers)[i]].active) {
                                        totalActivePlayers++;
                                    }
                                };

                                // await Transactions.create({
                                //     userName: user.userName,
                                //     userId: mongoose.Types.ObjectId(winner.id),
                                //     receiverId: mongoose.Types.ObjectId(winner.id),
                                //     coins: winningAmount,
                                //     reason: 'rm_game',
                                //     trans_type: 'win'
                                // })

                                await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});
        
                                let newInfo = {
                                    updatedPlayers: updatedPlayers,
                                    winner: winner
                                }
                                await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                                data.updatedPlayers = updatedPlayers;
                                data.openedCard = openedCard;
                            //    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
                                data.tableInfo.tableAmount = winningAmount;
                              //  console.log("data.table in GAME  AFTER :: ", data.tableInfo);
                                data.totalActivePlayers = totalActivePlayers;

                                // console.log("UPDATED pLAYERS IN SHOW WINNER : 33333333333", updatedPlayers);
        
        
		console.log("showwinner..8");
                                client.emit("showWinner", data);
                                // console.log("{{{{{{{{{ SHOW WINNER EMITS }}}}}}}}");
                                // console.log("DATA IN NORMAL SHOW WINNER :: ", data);
                                client.broadcast.to(tableId).emit("showWinner", data);
        
                                await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
								
								
								let allplayerdec = false;
								for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
									 
									  if (updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared == true && updatedPlayers[Object.keys(updatedPlayers)[i]].active == true  && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false )
									  {
										allplayerdec = true;
									  }										  
								}
								
								
								if(allplayerdec)
								{
								for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
									 
									   updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = false;									  
								}
								
								newGameService.startNewGame(client, tableId, availableSlots);

								
        
                             //   if (updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared == true && updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared == true) {
                               //     updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
                               //     updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
                               //     await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                              //  }
								
								}
                            }
                        } else {

                         //   if (declarePlayer.totalPoints !== 0) {
                         //       declarePlayer.wrongDeclare = true;
                         //   }

                            await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});

                            let newInfo = {
                                updatedPlayers: updatedPlayers,
                                winner: winner
                            }
                            await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                            data.updatedPlayers = updatedPlayers;
                            data.openedCard = openedCard;
                         //   console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
                            data.tableInfo.tableAmount = winningAmount;
                         //   console.log("data.table in GAME  AFTER :: ", data.tableInfo);
                            data.totalActivePlayers = totalActivePlayers;

                            // console.log('UPDATED PLAYERS 4444444444444444444444444 ::: ', updatedPlayers);
console.log("showwinner..5");
                            client.emit("showWinner", data);
                            // console.log("{{{{{{{{{ SHOW WINNER EMITS }}}}}}}}");
                            // console.log("DATA IN NORMAL SHOW WINNER :: ", data);
                            client.broadcast.to(tableId).emit("showWinner", data);

                            await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
                        
                            if (updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared == true && updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared == true) {
                                updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
                                updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
                                await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                                newGameService.startNewGame(client, tableId, availableSlots);
                            }
                        }
// as of now testing on 2 Players
                    } else if (getActivePlayers(updatedPlayers) > 2) {


                        console.log("---------------enter to here more than 2 updatedPlayers------------------");
                        let winningAmount = 0;
                        let losingAmount;
                        let updatedPlayers = cardInfo.info.updatedPlayers;

                        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                            if (Object.keys(updatedPlayers)[i] == data.player.id) {
                                declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                // declarePlayer.cards = staticCards;                  //.############################ STATIC CARDS #######################
                                let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
                                if (playerPoints.totalPoints == null) {
                                    playerPoints.totalPoints = 0;
                                }
                                updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
                                updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;
                                if (!updatedPlayers[Object.keys(updatedPlayers)[i]].winner) {
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winner = Boolean;
                                }
                                if (!updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared) {
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = Boolean;
                                }
                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;

                                break;
                            } 
                        }


console.log("log from showwiner");

console.log("updatedPlayers--after-showwinner",updatedPlayers);


                        let isValidGroups = commonServices.isValidGroups(declarePlayer.cards)
                        if (declarePlayer.totalPoints == 0 && isValidGroups) {
                            console.log("declarePlayer.totalPoints......................................................................................666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666",updatedPlayers);
                            // console.log("POINTS == 0 AND VALIDGROUP == TRUE");
                            declarePlayer.winner = true;
                            declarePlayer.playerInfo.winner = true;
                            declarePlayer.wrongDeclare = false;

                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
                                    winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
                                    await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesWon : 1}});
                                } else {
                                    await ScoreBoard.findOneAndUpdate({ playerId : updatedPlayers[Object.keys(updatedPlayers)[i]].id}, { $inc : {gamesLost : 1}});
                                    losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * pointValue;
                                    winningAmount += losingAmount;
                                    parseInt(winningAmount);
                                    parseInt(losingAmount);

                                    console.log(looser);
                                    if (table.boot >= losingAmount) {
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                        await Player.findOneAndReplace({ _id: Object.keys(updatedPlayers)[i] }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                    } else {
                                        let substractAmount = table.boot - losingAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                        await Player.findOneAndReplace({ _id: Object.keys(updatedPlayers)[i] }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                    }
                                }
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].active) {
                                    totalActivePlayers++;
                                }
                            } 
                            let commissionAmount = Math.round((winningAmount * table.commission) / 100);
                            winningAmount -= commissionAmount;
                            parseInt(winningAmount);
                            winner.playerInfo.chips += winningAmount;
                            winner.winningAmount = winningAmount;
                            await Player.findOneAndReplace({ _id: winner.id }, winner.playerInfo);
                            await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});
                            

                            await Transactions.create({
                                userName: user.userName,
                                userId: mongoose.Types.ObjectId(winner.id),
                                receiverId: mongoose.Types.ObjectId(winner.id),
                                coins: winningAmount,
                                reason: 'rm_game',
                                trans_type: 'win'
                            })


                            await Transactions.create({
                                userName: user.userName,
                                userId: mongoose.Types.ObjectId(winner.id),
                                senderId: mongoose.Types.ObjectId(winner.id),
                                receiverId: mongoose.Types.ObjectId('5ee4dbdb484c800bcc40bc04'),
                                coins: winningAmount,
                                reason: 'rm_game',
                                trans_type: 'Commission'
                            })

                            await TransactionCommission.create({
                                senderId: mongoose.Types.ObjectId(winner.id),
                                // agentId: agent._id,
                                // distributorId: distributor._id,
                                adminId: staticValue.ADMIN_ID,
                                tableId: table._id,
                                gameId: table.lastGameId,
                                // agentCommission: agentCommission,
                                // distributorCommission: distributorCommission,
                                adminCommission: commissionAmount,
                                transType: transactionType.COMMISSION,
                            })

                            

                            let newInfo = {
                                updatedPlayers: updatedPlayers,
                                winner: winner
                            }

                            await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                            data.updatedPlayers = updatedPlayers;
                            data.openedCard = openedCard;
                            await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});
                        //    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
                            data.tableInfo.tableAmount = winningAmount;
                          //  console.log("data.table in GAME  AFTER :: ", data.tableInfo);
                            data.totalActivePlayers = totalActivePlayers;
console.log("showwinner..4");
                            client.emit("showWinner", data);
                            // console.log(" => SHOW WINNER EMITS FOR > 2 PLAYERS <= ");
                            client.broadcast.to(tableId).emit("showWinner", data);
                            await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
                        
                            let allDeclared;
                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared == true) {
                                    allDeclared = true;
                                    continue;
                                } else {
                                    allDeclared = false;
                                    break;
                                }
                            };
                            await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });

                            if (allDeclared == true) {
                                newGameService.startNewGame(client, tableId, availableSlots);
                            }
							
							

                            
                        } else {
                            console.log("POINTS (NOT) !== 0 AND isValidGroups == FALSE");

                            // game should be continue with remaining players
                            // pack that player and continue the game with remaining players

                            declarePlayer.winner = false;
                            declarePlayer.playerInfo.winner = false;
                            declarePlayer.wrongDeclare = true;

                            losingAmount = 80 * table.pointValue;
                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) { 
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == declarePlayer.id) {

                                    if (table.boot >= losingAmount) {
                                        let substractAmount = table.boot - losingAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                        
                                    } else {
                                        let substractAmount = table.boot - losingAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;

                                    }
                                    await Player.findOneAndReplace({ _id: declarePlayer.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);

                                }
                                updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
                            }

                            
                            await Table.findOneAndUpdate({ _id: tableId }, { $inc : { tableAmount : winningAmount }});
                            await ScoreBoard.findOneAndUpdate({ playerId : declarePlayer.id}, { $inc : {gamesLost : 1}});

                            let maxPlayers = table.maxPlayers;
                            let players = await commonServices.packPlayer(declarePlayer.id, table.players, availableSlots, maxPlayers, table._id)
                            updatedPlayers = await commonServices.packPlayer(declarePlayer.id, updatedPlayers, availableSlots, maxPlayers, table._id)
                            table = await Table.updateOne({ _id: table._id }, { $set: { players: players } });

                            let newInfo = {
                                updatedPlayers: updatedPlayers,
                                openedCard : openedCard
                            }

                            await CardInfo.findOneAndUpdate({ _id: cardInfoId }, { $set : { info : newInfo }}, {upsert : true})

                            data.updatedPlayers = updatedPlayers;
                        //  console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
                        
                            data.tableInfo.tableAmount = winningAmount;
                        
                        //  console.log("data.table in GAME  AFTER :: ", data.tableInfo);


                            if (getActivePlayers(updatedPlayers) > 1) {
                                client.emit("wrongDeclared", {
                                    placedBy: data.player._id,
                                    updatedPlayers: updatedPlayers,
                                    table: table,
                                });
                                client.broadcast.to(table._id).emit("wrongDeclared", {
                                    placedBy: data.player._id,
                                    updatedPlayers: updatedPlayers,
                                    table: table,
                                });
                            };

                        }

                    }   
                    
                });

                client.on("playerDropped", async function (args) {
					console.log("Player Droppeddd");
                    let data = JSON.parse(args);
                    let tableId = data.tableInfo._id
                    let table = await Table.findById({ _id: tableId });
                    let user = await Player.findOne({ clientId: client.id });
                    let cardInfoId = table.cardInfoId;
                    let cardInfo = await CardInfo.findById({ _id: cardInfoId });
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

                    console.log("updatedPlayers------",updatedPlayers) 

                 //   console.log("Object.keys(updatedPlayers).length IN playerDropped :: ", Object.keys(updatedPlayers).length);
                    console.log("table------",table) 
                    console.log("userre------",user) 

                    if (getActivePlayers(updatedPlayers) == 2) {
                        let winningAmount = 0;
                        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
							
							if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false )
							 {
                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
                                updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
                                dropPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                            } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true) {
                                opponentPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
                            }
							 }
                        }

                        if (table.gameStarted == true && table.playersLeft > 0) {
                            losingAmount = dropPlayer.totalPoints * table.pointValue;
                            let winningAmount = losingAmount;
                            // console.log("WINNING AMOUNT : >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", winningAmount);
                            let commissionAmount = Math.round((winningAmount * table.commission) / 100);
                            winningAmount = winningAmount - commissionAmount;
                            parseInt(winningAmount);
                            parseInt(table.boot);
                            parseInt(commissionAmount);
                            parseInt(losingAmount);
    


                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == opponentPlayer.id) {
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (winningAmount + table.boot);
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = winningAmount;
    
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = false;
                                    await Player.findOneAndReplace({ _id: opponentPlayer.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
    
                                } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == dropPlayer.id) {
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
    
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
									updatedPlayers[Object.keys(updatedPlayers)[i]].packed = true;
                                    if (table.boot >= losingAmount)   {
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;
                                        await Player.findOneAndReplace({ _id: dropPlayer.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                    } else {
                                        let substractAmount = table.boot - losingAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                        updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                        await Player.findOneAndReplace({ _id: dropPlayer.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                    }

                                }
                                
                                

                            };
                            
    
                        }

                        await Table.findOneAndUpdate({ _id: tableId }, { $set : { tableAmount : winningAmount }});
                      await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, auditType.DROP, user.chips, 'Drop', 'Drop', 2, table.players, winningAmount, '');
                        
                        let newInfo = {
                            updatedPlayers: updatedPlayers,
                            openedCard: cardInfo.info.openedCard
                        }
                        await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                        data.updatedPlayers = updatedPlayers;
                        data.tableInfo.tableAmount = winningAmount;
						
						let opencard = cardInfo.info.openedCard;
						
						data.openedCard = opencard;
        
                        client.emit("droppedPlayer", data);
                        client.broadcast.to(tableId).emit("droppedPlayer", data);
    
                        await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
                        if (updatedPlayers[Object.keys(updatedPlayers)[0]].dropped == true || updatedPlayers[Object.keys(updatedPlayers)[1]].dropped == true) {
                            updatedPlayers[Object.keys(updatedPlayers)[0]].dropped == false;
                            updatedPlayers[Object.keys(updatedPlayers)[1]].dropped == false;
                            await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
                            newGameService.startNewGame(client, tableId, availableSlots);                
                        }

                    } else if (getActivePlayers(updatedPlayers) > 2) {	
					console.log("Player Droppeddd ... 2");
                        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
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
                                    await Player.findOneAndReplace({ _id: data.player.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                } else {
                                    let substractAmount = table.boot - losingAmount;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                                    updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;
                                    await Player.findOneAndReplace({ _id: data.player.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
                                }

                            } else {
                                updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
                            }
                            
                        }


                        let maxPlayers = table.maxPlayers;
                        
                        let players = await commonServices.packPlayer(data.player.id, table.players, availableSlots, maxPlayers, table._id)
                        updatedPlayers = await commonServices.packPlayer(data.player.id, updatedPlayers, availableSlots, maxPlayers, table._id)

                        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].turn == true) {
                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
                            }
                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == data.player.id) {
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
                     await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, auditType.DROP, user.chips, 'Drop', 'Drop', 0, table.players, 0, '');

                        data.updatedPlayers = updatedPlayers;
                        data.openedCard = openedCard;
                        
						console.log("Player Droppeddd ... 3");

                        client.emit("droppedPlayer", {	
                            removedPlayer : data.player,
                            placedBy: data.player._id,	
                            updatedPlayers : updatedPlayers,	
                            table: table,	
							openedCard: data.openedCard,
                        });	
                        client.broadcast.to(table._id).emit("droppedPlayer", {	
                            removedPlayer : data.player,
                            placedBy: data.player._id,	
                            updatedPlayers : updatedPlayers,	
                            table: table,	
							openedCard: data.openedCard,
                        });	
                        
                    }

                    
                });

                client.on("disconnect", function () {
                    console.log("Player Disconnected.");

                    const delay = Number(Math.random(0, 1000));
                    setTimeout(async function () {

                        const query = [
                            { $match: { clientId: client.id } },
                            {
                                $lookup: {
                                    from: 'rm_tables',
                                    localField: 'tableId',
                                    foreignField: '_id',
                                    as: 'table',
                                },
                            },
                            { $unwind: '$table' },
                        ];

                        const data = await Player.aggregate(query);
					//	console.log("dataaaa");
						//	console.log(query);
                        if (data.length > 0) {
                            const player = data[0];
                            let table = player.table;
                            table = await Table.findById({ _id : table._id });
                            let user = await Player.findOne({ clientId: client.id });
                            let cardInfo = await CardInfo.findOne({ _id : table.cardInfoId });
					//console.log("Player tableees.");
                            if (table.players && table.players[user.id]) {
                                {
									
								//	console.log("Player tableees. 2");
                                    await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, auditType.DISCONNECT, user.chips, 'Disconnect', 'Disconnect', 0, table.players, 0, '');

                                    let availableSlots = {};
                                    table.slotUsedArray.forEach(function (f) {
                                        availableSlots["slot" + f] = "slot" + f;
                                    });

                                    // console.log("table.gameStarted : ", table.gameStarted);
                                    // console.log("isActivePlayer : ", isActivePlayer(user.id, table.players));
                                    if (table.gameStarted && isActivePlayer(user.id, table.players)) {

                                        let updatedPlayers = cardInfo.info.updatedPlayers;
                                        let maxPlayers = table.maxPlayers;
                                        let totalActivePlayers = 0;

                                        
                                        await commonServices.packPlayer(user.id, table.players, availableSlots, maxPlayers, table._id)
                                        updatedPlayers = await commonServices.packPlayer(user.id, updatedPlayers, availableSlots, maxPlayers, table._id)
                                        updatedPlayers = await deactivatePlayerFromArray(user.id, updatedPlayers);
                                        let removedPlayer = await playerService.removePlayer(user.id, table.players, availableSlots, table.slotUsedArray, table);

                                        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;

                                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == player._id) {
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].active = false;
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.active = false;
                                            }

                                            if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true) {
                                                totalActivePlayers += 1;
                                            }
                                            
                                        }

                                    //    console.log("totalActivePlayers  AFTER  USER  disconnect ::: ", totalActivePlayers);

                                    let lastremove = cardInfo.info.lastremove;
                                    if(lastremove!= null)
                                    cardInfo.info.openedCard.unshift(lastremove);


                                    console.log("last card updatedddd lastremove..................................");
                                        let newInfo = {
                                            updatedPlayers : updatedPlayers,
                                            openedCard : cardInfo.info.openedCard,
                                        }
                                        await CardInfo.findOneAndUpdate({ _id : table.cardInfoId }, { $set : { info : newInfo }}, { upsert : true });
                                        await Table.updateOne({ _id: table._id }, { $inc: { playersLeft: -1 } });


										let opencard = cardInfo.info.openedCard;


                                        
                                     



                                        let tableInfo = await Table.findOne({ _id: table._id });
                                        let players = tableInfo.players;

                                        if (getActivePlayers(players) == 1) {
                                            _.map(players, function (user) {
                                                user.turn = false;
                                                return user;
                                            });
                                        }


                                        console.log("open cardfss 1" , opencard);

                                        client.broadcast.to(table._id).emit("playerLeft", {
                                            removedPlayer: removedPlayer,
                                            placedBy: removedPlayer.id,
                                            updatedPlayers: updatedPlayers,
                                            table: tableInfo,
											openedCard : opencard,
                                        });


                                        if (getActivePlayers(table.players) == 0) {
                                            // console.log("11111");
                                            await Table.updateOne({ _id: table._id }, {
                                                $set: {
                                                  gameStarted: false,
                                                  slotUsed: 0,
                                                  players: {},
                                                },
                                            });
                                            console.log("there is no player left in table <><><><><><><><><> ");
    
                                        } else if (getActivePlayers(table.players) == 1 && tableInfo.gameStarted) {
                                            // console.log("22222");
                                            let debitAmount;
                                            let disconnectPlayer;
                                            let lastPlayer = table.players[Object.keys(table.players)[0]];
                                            lastPlayer = await Player.findOne({ _id: lastPlayer.id });  
                                            cardInfo = await CardInfo.findOne({ _id : table.cardInfoId });
                                            updatedPlayers = cardInfo.info.updatedPlayers;                                
											let totalActivePlayers = 0;
                
                                            if (user.noOfTurn <= 2) {
                                                debitAmount = table.boot - (20 * table.pointValue);
                                                if (debitAmount <= 0) { debitAmount = debitAmount * -1 };
                                                // console.log("DEBIT AMOUNT : >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", debitAmount);
                                                disconnectPlayer = await Player.findOneAndUpdate({ _id: user._id }, { $inc: { chips: -debitAmount, noOfTurn: -player.noOfTurn } }, { upsert: true });
                                                lastPlayer = await Player.findOneAndUpdate({ _id: lastPlayer._id }, { $inc: { chips: debitAmount, noOfTurn: -lastPlayer.noOfTurn } }, { upsert: true });
            
                                            } else if (user.noOfTurn > 2 && user.noOfTurn <= 7) {
                                                debitAmount = 40 * table.pointValue;
                                                if (debitAmount <= 0) { debitAmount = debitAmount * -1 };
                                                // console.log("DEBIT AMOUNT : >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", debitAmount);
                                                disconnectPlayer = await Player.findOneAndUpdate({ _id: user._id }, { $inc: { chips: -debitAmount, noOfTurn: -player.noOfTurn } }, { upsert: true });
                                                lastPlayer = await Player.findOneAndUpdate({ _id: lastPlayer._id }, { $inc: { chips: debitAmount, noOfTurn: -lastPlayer.noOfTurn } }, { upsert: true });
            
                                            } else {
                                                debitAmount = 80 * table.pointValue;
                                                if (debitAmount <= 0) { debitAmount = debitAmount * -1 };
                                                // console.log("DEBIT AMOUNT : >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", debitAmount);
                                                disconnectPlayer = await Player.findOneAndUpdate({ _id: user._id }, { $inc: { chips: -debitAmount, noOfTurn: -player.noOfTurn } }, { upsert: true });
                                                lastPlayer = await Player.findOneAndUpdate({ _id: lastPlayer._id }, { $inc: { chips: debitAmount, noOfTurn: -lastPlayer.noOfTurn } }, { upsert: true });
            
                                            }
            

                                            for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
                                                if (!updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared) {
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = Boolean;
                                                }
                                                updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
                                                if (updatedPlayers[Object.keys(updatedPlayers)[i]].id !== lastPlayer.id) {
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -debitAmount;
                                                    
                                                } else {
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = false;
                                                    updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = debitAmount;
                                                }
                                                 if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true) {
                                                    totalActivePlayers += 1;
                                                }
                                            }
                                            
                                            await Table.updateOne({ _id: table._id }, { $set: { tableAmount : debitAmount }});
                                            tableInfo.tableAmount = debitAmount;
console.log("showwinner..2");
                                            client.emit("showWinner", {
                                                message : "Player disconnected!",
                                                placedBy: user._id,
                                                players : players,
                                                updatedPlayers: updatedPlayers,
                                                table: tableInfo,
                                                // packed: true,
                                                totalActivePlayers: totalActivePlayers
                                            });
											console.log("showwinner..1");
                                            client.broadcast.to(table._id).emit("showWinner", {
                                                message : "Player disconnected!",
                                                placedBy: user._id,
                                                players : players,
                                                updatedPlayers: updatedPlayers,
                                                table: tableInfo,
                                                // packed: true,
                                                totalActivePlayers: totalActivePlayers
                                            });


											await Table.updateOne({ _id: table._id }, {
                                                $set: {
                                                  gameStarted: false,
                                                  
                                                },
                                            });
											
												let availableSlots = {};
												table.slotUsedArray.forEach(function (d) {
												availableSlots["slot" + d] = "slot" + d;
												});



												newGameService.startNewGame(client, table._id , availableSlots);
 
 

    
                                        } else if (getActivePlayers(table.players) > 1 && tableInfo.gameStarted) { 
                                            // console.log("444444");                

                                            let tablee = await Table.findOne({ _id : table._id });
											
											 let cardInfo = await CardInfo.findById({ _id: tablee.cardInfoId });
											let opencard = cardInfo.info.openedCard	;

                                            client.broadcast.to(table._id).emit("playerLeft", {
                                                removedPlayer: removedPlayer,
                                                placedBy: removedPlayer.id,
                                                // players : players,
                                                updatedPlayers: updatedPlayers,
                                                table: tablee,
												openedCard : opencard,
                                            });
											
											
											

                                        } else {
                                            // console.log("55555  THIS COULD NOT HAPPEN.  ERROR ");
                                            let removedPlayer = await playerService.removePlayer(user.id, table.players, availableSlots, table.slotUsedArray, table);
                                            let tableInfo = await Table.findOne({ _id : table._id });
                                            let players = tableInfo.players;
                                            let slot = getActivePlayers(players);
                                            await Table.updateOne({ _id : table._id }, { $inc : { playersLeft : -1 }});
    
                                            // client.broadcast.to(table._id).emit("playerLeft", {
                                            //     removedPlayer: removedPlayer,
                                            //     placedBy: removedPlayer.id,
                                            //     updatedPlayers: updatedPlayers,
                                            //     table: tableInfo, 
                                            // });
    
                                        }
                                    } else {
                                        let maxPlayers = table.maxPlayers;
                                        await commonServices.packPlayer(user.id, table.players, availableSlots, maxPlayers, table._id)
                                        let removedPlayer = await playerService.removePlayer(user.id, table.players, availableSlots, table.slotUsedArray, table);
                                        await Table.updateOne({ _id: table._id }, { $inc: { playersLeft: -1 } });
                                        let tableInfo = await Table.findOne({ _id: table._id });
                                        let players = tableInfo.players;
                                        // console.log("PLAYER LEFT WHEN gameStarted == false  ::   tableInfo.players => ", tableInfo.players);
										
										let cardInfo = await CardInfo.findOne({ _id : tableInfo.cardInfoId });
										
										let opencard = cardInfo.info.openedCard;

                                        client.broadcast.to(table._id).emit("playerLeft", {
                                            removedPlayer: removedPlayer,
                                            placedBy: removedPlayer.id,
                                            // players : players,
                                            // updatedPlayers: updatedPlayers,
                                            updatedPlayers : players,
                                            table: tableInfo, 
											openedCard : opencard,
                                        });

										if(getActivePlayers(players) < 2)
										{
                                        client.emit("notification", {
                                            message : "Please wait for more players to join",
                                            timeout : 4000,
                                        });
                                        
                                        client.broadcast.to(table._id).emit("notification", {
                                            message: "Please wait for more players to join",
                                            timeout: 4000,
                                        });

                                        
                                        let sentObj = { players , table : tableInfo};
                                        client.emit("resetTable", sentObj);
                                        client.broadcast.to(table._id).emit("resetTable", sentObj);
										}
                                    }
                                }
                            }
                        }

                        //....commented code



                    }, delay * 1000)

                });

            });
        }
    }
}

module.exports = new code();