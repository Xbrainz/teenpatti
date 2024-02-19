let _ = require("underscore");
let mongoose = require("mongoose");

let Table = require("../model/table");
let CardInfo = require("../model/cardInfo");
let Game = require("../model/game");
let User = require("../model/user");
let TransactionChalWin = require("../model/transactionChalWin");
const socketClient = require('../service/socketClient');
let gameAuditService = require("../service/gameAudit");

let deck = require("./deck");
let { getNextActivePlayer } = require("./common");
let gameType = require('../constant/gametype');
let transactionType = require('../constant/transactionType');
let auditType = require("../constant/audittype");
const audittype = require("../constant/audittype");

let startNewGameTime;
let startNewGamePlyerJoinTime;

async function startNewGameOnPlayerJoin(client, tableId, avialbleSlots, args) {
	let myTable1 = await Table.findOne({
		_id: tableId
	});
	let length = Object.keys(myTable1.players).length;
	if (length >= 2 && !myTable1.gameStarted) {
		client.emit("gameCountDown", { counter: 4 });
		client.broadcast.to(myTable1._id).emit("gameCountDown", { counter: 4 });

		clearTimeout(startNewGameTime);
		clearTimeout(startNewGamePlyerJoinTime);
		startNewGamePlyerJoinTime = setTimeout(async function() {
			let myTable = await Table.findOne({ _id: tableId });
			let activePlayer = Object.keys(myTable.players).length;
			if (activePlayer >= 2 && !myTable.gameStarted) {
				await prepareStartGame(client, myTable, avialbleSlots, length);
			} else if (myTable.players.length == 1 && !myTable.gameStarted) {
			//	console.log("Disconnect computer");
				
			
				//	socketClient.disconnect(table._id);
					
				client.emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
				client.broadcast.to(myTable._id).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
			}
		}, 6000);
	} else if (length == 1 && !myTable1.gameStarted) {
		
	//	console.log("Disconnect computer");
				
		socketClient.disconnect(myTable1._id);
		
		client.emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
		client.broadcast.to(myTable1._id).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
	}
}

async function startNewGame(client, tableId, avialbleSlots) {
	let myTable1 = await Table.findOne({
		_id: tableId
	});
	let length = Object.keys(myTable1.players).length;

	if (length >= 2 && !myTable1.gameStarted) {
		client.emit("gameCountDown", { counter: 4 });
		client.broadcast.to(myTable1._id).emit("gameCountDown", { counter: 4 });

		startNewGameTime = setTimeout(async function() {
			let myTable = await Table.findOne({ _id: tableId });
			let activePlayer = Object.keys(myTable.players).length;

			if (activePlayer >= 2 && !myTable.gameStarted) {
				await prepareStartGame(client, myTable, avialbleSlots, length);
			} else if (myTable.players.length == 1) {
			//	console.log("Disconnect computer");
				
			
				//	socketClient.disconnect(table._id);
				
				client.emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
				client.broadcast.to(myTable._id).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
				let sentObj = {
					players: myTable.players,
					table: myTable,
				};
				client.emit("resetTable", sentObj);
				client.broadcast.to(myTable._id).emit("resetTable", sentObj);
			}
		}, 6000);
	} else if (length == 1) {
	//	console.log("Disconnect computer");
				
			
		socketClient.disconnect(myTable1._id);
		client.emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
		client.broadcast.to(myTable1._id).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

		let sentObj = {
			players: myTable1.players,
			table: myTable1,
		};
		client.emit("resetTable", sentObj);
		client.broadcast.to(myTable1._id).emit("resetTable", sentObj);
	}
}

async function prepareStartGame(client, table, avialbleSlots, playersleft) {
	let game = await Game.create({ tableId: table._id });
	await gameAuditService.createAudit(table._id, '', '', game._id, auditType.NEW_ROUND, 0, 0, 0, '', 'New Round start', table.amount, table.players, 0, '');

    let cardInfo = await startGame(table, avialbleSlots, game);
    table = await Table.findOne({ _id: table._id }); 
    
    let joker = cardInfo.joker;
    let jokers = cardInfo.jokers;
	delete cardInfo.jokers;
	delete cardInfo.joker;
    cardInfo = await CardInfo.create({ tableId: table._id, info: cardInfo, joker, jokers });

	game.cardInfoId = cardInfo._id;
	game.players = table.players
	await Game.update({ _id: game._id }, { $set: game });

    table.cardinfoId = cardInfo._id;
    table.lastGameId = game._id;
    table.playersleft = playersleft;

    await Table.update({ _id: table._id }, { $set: table });
    let players = table.players;

    for (let player in players) {
        players[player].cardInfo = cardInfo._id;
		await gameAuditService.createAudit(table._id, cardInfo._id, players[player].id, game._id, auditType.CARDS, 0, 0, players[player].playerInfo.chips, '', '', table.amount, table.players, 0, '');
    }

    let sentObj = { players, table, joker, jokers };

    let count = await Table.findOne({ _id: table._id }, { playersLeft: 1 });
    if (count.playersLeft > 1) {
		
		console.log(".................................................................."+Date.now());
		console.log(sentObj);
        client.emit("startNew", sentObj);
        client.broadcast.to(table._id).emit("startNew", sentObj);
    } else {
        await Table.update({ _id: table._id }, {
            $set: {
                gameStarted: false,
                slotUsed: 1,
                players: players,
            },
        });
    }
}

async function startGame(table, avialbleSlots, game) {
    cardsInfo = {};
	let oldTablee = await Table.findOne({ _id: table._id });
    await resetTable(table);
    let players = await resetAllPlayers(table.players);
    await Table.update({ _id: table._id }, { $set: { players } });
    let tablee = await Table.findOne({ _id: table._id });
    
    Table.gameStarted = true;
    players = decideDeal(players, avialbleSlots, tablee.maxPlayers);
    players = decideTurn(players, avialbleSlots, tablee.maxPlayers, oldTablee.players);

console.log("...................................................................................");
    tablee.gameStarted = true;
    tablee.isShowAvailable = Object.keys(players).length === 2;
    tablee.isSideShowAvailable = true;

    await collectBootAmount(tablee, players, game);
    tablee = await Table.findOne({ _id: tablee._id });
    players = table.players;

    return distributeCards(players, tablee);
}

async function resetTable(myTable) {
	let iBoot = myTable.boot || 1000;
	let lastBet = iBoot;
	if (myTable.gameType == gameType.TwoXBoot) {
		lastBet = (iBoot * 2);
	} else if (myTable.gameType == gameType.FourXBoot) {
		lastBet = (iBoot * 4);
	} 
	await Table.update(
		{ _id: myTable._id },
		{
			$set: {
				boot: iBoot,
				lastBet: lastBet,
				lastBlind: true,
				showAmount: true,
				amount: 0,
				betRoundCompleted: 0
			},
        }
    );
};

async function resetAllPlayers(players) {
	let allPlayers = [];

	for (let player in players) {
		allPlayers.push(player);
    }
    
	await User.update(
		{ _id: { $in: allPlayers } },
		{
			$set: {
				turn: false,
				active: true,
				deal: false,
				packed: false,
				show: false,
				isSideShowAvailable: false,
				lastBet: '',
				lastAction: '',
				cardSet: {
					closed: true,
				},
				noOfTurn: 0,
				totalChalAmount: 0,
				cardSeen: false
			},
        },
    );
		
    for (let player in players) {
       delete players[player].winner;
        players[player].turn = false;
        players[player].active = true;
        players[player].show = false;
        players[player].packed = false;
		players[player].idle = false;
		players[player].idle_amount = 0;
        players[player].isSideShowAvailable = false;
        players[player].cardSet = {
            closed: true,
        };
        players[player].lastBet = '';
        players[player].lastAction = '';
        players[player].noOfTurn = 0;
		players[player].totalChalAmount = 0;
		players[player].cardSeen = false;
    }

	return players;
};

function decideDeal(players, avialbleSlots, maxPlayer) {
	let firstPlayer = null,
		dealFound = false,
		isFirst = true,
		dealPlayer;
	for (let player in players) {
		players[player].deal = false;
		if(players[player].winner)
		{
			players[player].deal = true;	
			
		}else{
			
			if (players[player].active) {
				if (isFirst) {
					firstPlayer = player;
					isFirst = false;
				}
				if (players[player].deal === true) {
					players[player].deal = false;
					dealPlayer = players[player];
					dealFound = true;
				}
			}
		}
	}
	
/*	if (!dealFound) {
		players[firstPlayer].deal = true;
	} else {
		console.log('in decide deal');
		let nextPlayer = getNextActivePlayer(dealPlayer.id, players, avialbleSlots, maxPlayer);
		players[nextPlayer.id].deal = true;
    }
	*/
	
    return players;
};

function decideTurn(players, avialbleSlots, maxPlayer, oldPlayers) {
	let firstPlayer = null,
		dealFound = false,
		isFirst = true,
		isWinner = false,
		winPlayer = null,
		dealPlayer;
	for(let player in oldPlayers) {
		if (oldPlayers[player].winner) {
			console.log("last winner : " + oldPlayers[player].slot);
			if (!isWinner) {
				winPlayer = players[player];
				isWinner = true;
			}
		}
	}
	if(!isWinner) {
		for (let player in players) {
			if (players[player].active) {
				if (isFirst) {
					firstPlayer = player;
					isFirst = false;
				}
				if (players[player].deal === true) {
					dealPlayer = players[player];
					dealFound = true;
				}
			}
		}
		if (!dealFound) {
			console.log('first player turn');
			players[firstPlayer].turn = true;
		} else {
			let nextPlayer = getNextActivePlayer(dealPlayer.id, players, avialbleSlots, maxPlayer)
			console.log(nextPlayer +'deal player turn');
			players[nextPlayer.id].turn = true;
		}
	} else {
		console.log('yes in');
		console.log('winner : ' + winPlayer.slot);
		let nextPlayer = [];
		nextPlayer = getNextActivePlayer(winPlayer.id, players, avialbleSlots, maxPlayer)
		console.log('next player' + nextPlayer.id);
		players[nextPlayer.id].turn = true;
	}
	
    return players;
};

async function collectBootAmount(tableInfo, players, game) {
	let bootAmount = 0;
	let iBoot = tableInfo.boot;
	if (tableInfo.gameType == gameType.TwoXBoot) {
		iBoot = (tableInfo.boot * 2);
	} else if (tableInfo.gameType == gameType.FourXBoot) {
		iBoot = (tableInfo.boot * 4);
	}
	for (let player in players) {
        if (players[player].active) {
			players[player].totalChalAmount = iBoot;
            players[player].lastBet = iBoot;
			players[player].idle = false;
            players[player].lastAction = '';
            bootAmount = bootAmount + iBoot;
            players[player].playerInfo.chips -= iBoot;
            
            await TransactionChalWin.create({
                userId: mongoose.Types.ObjectId(players[player].id),
				tableId: tableInfo._id,
				gameId: game._id,
                coins: iBoot,
                transType: transactionType.BOOT	
            });
            
            await User.update(
                {
                    _id: players[player].id,
                },
                {
                    $set: {
                        chips: players[player].playerInfo.chips,
                    },
                }
            );

			let tableData = await Table.findOne({ _id: tableInfo._id });
			await gameAuditService.createAudit(tableInfo._id, '', players[player].id, game._id, audittype.ANTE, 0, 0, players[player].playerInfo.chips, '', '', tableData.amount, tableData.players, 0, '');
        }
    }
    
    await Table.update( { _id: tableInfo._id },
        {
            $set: {
                amount: bootAmount,
				players: players,
				gameStarted: true
            },
        }
    );
}

function distributeCards(players, table) {
	let cardsInfo = {};
	deck.shuffle();
	let deckCards = deck.getCards(),
	index = 0;
	let noOfCards = 3;
	if (table.gameType == gameType.FourCard) {
		noOfCards = 4;
	}
	console.log("deckCards: ", deckCards.length);
	for (let i = 0; i < noOfCards; i++) {
		for (let player in players) {
			if (players[player].active) {
				if (!cardsInfo[players[player].id]) {
					cardsInfo[players[player].id] = {};
				}
				if (!cardsInfo[players[player].id].cards) {
					cardsInfo[players[player].id].cards = [];
				}
				cardsInfo[players[player].id].cards.push(deckCards[index++]);
			}
		}
	}

	// Three Jokers
	deck.shuffle();
	deckCards = deck.getCards(),
	index = 0;
	for (let i = 0; i < 3; i++) {
		if (!cardsInfo.jokers) {
			cardsInfo.jokers = [];
		}
		cardsInfo.jokers.push(deckCards[index++]);
	}

	// Single Joker
	deck.shuffle();
    cardsInfo.joker = deck.getCards()[0];

	return cardsInfo;
}

module.exports = {
	startNewGameOnPlayerJoin,
	startNewGame
}