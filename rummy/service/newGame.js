const Table = require("../model/table");
const Game = require("../model/game");
const Player = require("../model/user");
const staticValue = require("../../constant/staticValue");
let Transactions = require('../model/transaction');
const Bot_Details = require('../../model/bot_amounts');
const TransactionCommission = require("./../model/transactionCommission");


const {
	getNextActivePlayer
} = require("./common");
const Tossdeck = require("./tossDeck");
let mongoose = require("mongoose");
const {
	Deck1,
	Deck2,
	Deck3
} = require("./deck");
let CardInfo = require("../model/cardInfo");
let _ = require('underscore');
const {
	groupPointCounter,sortCards
} = require("./cardComparision");
const gameAuditService = require("./gameAudit");
const ScoreBoard = require("../model/scoreboard");
let playerService = require("../service/player");
let countDownTime = 5000;

const socketClient = require('../service/socketClient');

let startNewGameTime = {};
let startNewGamePlyerJoinTime = {};

const commonServices = require("../service/common");

var PlayerTimeOut = {};


//.................START NEW GAME WHEN 2 PLAYER JOIN...........
async function startNewGameOnPlayerJoin(tableId, sio ,sttt = "00") {

	
	//.........find table and table players.........
	let myTable1 = await Table.findOne({
		_id: tableId
	});

	console.log("unique idd : : : " , Math.random().toString(35).slice(2));


	let playersTTT = myTable1.players;
	for (let player in myTable1.players) {

		var table = myTable1;

		var userId = playersTTT[player].id;
		let user = await Player.findOne({
			_id: userId
		});


		if (user.forcedisconnect) {

			LeavePlayer(userId, table._id, sio, "Disconnect before start new")
		}

	}

	myTable1 = await Table.findOne({
		_id: tableId
	});

	let length = Object.keys(myTable1.players).length;
	


	let min;
	if (myTable1.maxPlayers == 2) {
		min = 2;
	} else {
		min = 2;
	}





	if(length == 1 && !myTable1.gameInit && myTable1.tableSubType != "private")
	{
		socketClient.joinTable(myTable1._id);
	}


	

	
    var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "rummy" });

	console.log("logg", Bot_Detailssss);
    if(Bot_Detailssss.onoff == "off"|| myTable1.tableSubType == "private")
    {
		socketClient.disconnect(myTable1._id);
	}



	if (length >= min && !myTable1.gameInit) {
		ClearTimer(tableId.toString());
		let randomm = parseInt( Math.random() * (15 - 5) + 5);
		await Table.update({
			_id: myTable1._id
		}, {
			$set: {
				gameInit: true,
				maxbotTurn : randomm
			}
		});

		// client.emit("gameCountDown", {
		// 	counter: 5
		// });

	
		//     console.log("close deck");

		sio.to(myTable1._id.toString()).emit("gameCountDown", {
			counter: 5
		});

		setTimeout(async function() {
			myTable1 = await Table.findOne({
				_id: myTable1._id
			});

			
			let length = Object.keys(myTable1.players).length;
			if(length >= 3 )
			{
				socketClient.disconnect(myTable1._id);
			}
		}, 4000);
		

		clearTimeout(startNewGameTime[tableId]);
		clearTimeout(startNewGamePlyerJoinTime[tableId]);

		startNewGamePlyerJoinTime[tableId] = setTimeout(async function() {

			let myTable = await Table.findById({
				_id: tableId
			});
			myTable.gameStarted = false;
			myTable.turnplayerId = "";
			let activePlayer = Object.keys(myTable.players).length;

			if (activePlayer >= 2 && !myTable.gameStarted) {
				await prepareStartGame(myTable, sio);

			} else if (myTable.players.length == 1 && !myTable.gameStarted) {

				// client.emit("notification", {
				// 	message: "Please wait for more players to join",
				// 	timeout: 4000,
				// });


				sio.to(myTable._id.toString()).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});



			}
		}, countDownTime);

	} else if (length < min && !myTable1.gameStarted) {


		sio.to(myTable1._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

	}
};

//.................PREPARE TABLE AND PLAYERS FOR START GAME...........
async function prepareStartGame(table, sio) {

	let myTable1 = await Table.findOne({
		_id: table._id
	});

	

	let playersTTT = myTable1.players;
	for (let player in myTable1.players) {

		var table = myTable1;

		var userId = playersTTT[player].id;
		let user = await Player.findOne({
			_id: userId
		});


		if (user.disconnect) {

			LeavePlayer(userId, table._id, sio, "Disconnect before start new")
		}

	}


	let isupdate = false; 

	for (let player in playersTTT) {
		if(playersTTT[player].playerInfo.Decrole == "RUSER")
		{
			if(playersTTT[player].playerInfo.chips <= (table.potLimit * 4))
			{
				isupdate = true;
				await User.update({ _id: playersTTT[player].id }, { $inc: { chips: 100000 } });
				let usersdeee = await User.findOne({_id:  playersTTT[player].id},{chips : 1});
				playersTTT[player].playerInfo.chips = usersdeee.chips;
			}
		}
		
	}

	if(isupdate)
	{
		await Table.update({
			_id: table._id
		}, {
			$set: {
				players : playersTTT
			}
		});
	}
	

	
	myTable1 = await Table.findOne({
		_id: table._id
	});


	let length = Object.keys(myTable1.players).length;

	if (length >= 2 && !myTable1.gameStarted) {

		let randomGameId = Math.floor(Math.random() * 1000000000);
		let game = await Game.create({
			tableId: table._id,
			gameId: randomGameId
		});
		let gameId = randomGameId;
		await gameAuditService.createAudit(table._id, '', '', game._id, "NEW_ROUND", 0, '', 'New Round start', table.amount, table.players, 0, '');


		await resetTable(table);
		let playerss = await resetAllPlayers(table.players);
		await Table.updateOne({
			_id: table._id
		}, {
			$set: {
				playerss
			}
		});
		let tablee = await Table.findOne({
			_id: table._id
		});

		Table.gameStarted = true;

		let updatedPlayersss = await decideTurn(playerss, table._id);


		let players = table.players;
		tablee = await Table.findOne({
			_id: tablee._id
		});
		await collectBootAmount(tablee, players, game);

		let cardInfo = await distribute13Cards(players, updatedPlayersss);



		let updatedPlayers = cardInfo.updatedPlayers;
		let openedCard = cardInfo.openedCard;
		table = await Table.findOne({
			_id: table._id
		});
		let joker = cardInfo.cardsInfo.joker;
		let leftCards = cardInfo.leftCards;

		delete cardInfo.cardsInfo.joker;
		delete cardInfo.leftCards;
		let info = {
			updatedPlayers,
			openedCard
		}
		cardInfo = await CardInfo.create({
			tableId: table._id,
			info: info,
			joker,
			deckCards: leftCards
		});

		game.cardInfoId = cardInfo._id;
		// game.players = table.players;
		game.players = updatedPlayers;
		await Game.updateOne({
			_id: game._id
		}, {
			$set: game
		});



		table.cardInfoId = cardInfo._id;

		table.lastGameId = game._id;



		table.gameStarted = true;


		let playersaa = table.players;

		for (let player in playersaa) {
			//table.turnplayerId = playersaa[player].id;
			playersaa[player].cardInfo = cardInfo._id;
			await gameAuditService.createAudit(table._id, cardInfo._id, playersaa[player].id, game._id, "CARDS", playersaa[player].playerInfo.chips, '', '', table.amount, playersaa, 0, '');
		}


		await Table.updateOne({
			_id: table._id
		}, {
			$set: table
		});


		let newInfo = {
			updatedPlayers: updatedPlayers,
			openedCard: openedCard
		}
		await CardInfo.updateOne({
			_id: cardInfo._id
		}, {
			$set: {
				info: newInfo
			}
		}, {
			upsert: true
		});

		let sentObj = {
			gameId,
			updatedPlayers,
			table,
			joker,
			openedCard
		
		};


		if (Object.keys(updatedPlayers).length >= 2) {
			sio.to(table._id.toString()).emit("startNew", sentObj);

			SetTimer(table.turnplayerId, table._id, sio);

		} else {
			await Table.updateOne({
				_id: table._id
			}, {
				$set: {
					gameStarted: false,
					slotUsed: 1,
					gameInit: false,
					players: playersaa,
					turnplayerId : ""
				},
			});
		}

	} else if (length < 2 && !myTable1.gameStarted) {


		sio.to(myTable1._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

	}

};



//.................RESET TABLES...........
async function resetTable(myTable) {
	let iBoot = myTable.boot || 1000;
	await Table.updateOne({
		_id: myTable._id
	}, {
		$set: {
			boot: iBoot,
			tableAmount: 0,
			showAmount: true,
			players: {}, //.......added
			cardInfoId: null,
			gameStarted: false,
			gameInit: false,
			botTurn : 0,
			turnplayerId : ""
		}
	});

};

//.................RESET ALL PLAYERS...........
async function resetAllPlayers(players) {
	let allPlayers = [];

	for (let player in players) {
		allPlayers.push(player);
	}
	await Player.updateMany({
		_id: {
			$in: allPlayers
		}
	}, {
		$set: {
			turn: false,
			active: true,
			packed: false,
			cardSet: {
				closed: true,
			},
			noOfTurn: 0
		},
	}, );

	for (let player in players) {
		delete players[player].winner;
		players[player].turn = false;
		players[player].active = true;
		players[player].lastAction = "start";
		players[player].round = 0;
		players[player].packed = false;
		players[player].cardSet = {
			closed: true,
		};
		players[player].noOfTurn = 0;
		players[player].wrongShow = false;
		players[player].dropped = false;
		players[player].newopenclosecard = {};
	}
	return players;
};

//................DECIDE TURN..............
async function decideTurn(players, tableId) {

	let updatedPlayers = await distributeTossCards(players);
	let highestPriority = updatedPlayers[Object.keys(updatedPlayers)[0]].tossCard[0].priority;

	for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		if (updatedPlayers[Object.keys(updatedPlayers)[i]].tossCard[0].priority > highestPriority) {
			highestPriority = updatedPlayers[Object.keys(updatedPlayers)[i]].tossCard[0].priority;
		}
	}

	for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].packed) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].packed = Boolean;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].packed = false;
		updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.packed = false;

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = [];
		}

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = null;
		}

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].winner) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].winner = Boolean;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
		updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].dropped) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = Boolean;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = false;

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = Boolean;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = false;

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = Boolean;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = false;

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].finisher) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].finisher = Boolean;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].finisher = false;


		if (updatedPlayers[Object.keys(updatedPlayers)[i]].tossCard[0].priority == highestPriority) {
			updatedPlayers[Object.keys(updatedPlayers)[i]].turn = true;
			await Table.update({
				_id: tableId
			}, {
				$set: {
					turnplayerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id,
				},
			});

			updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = true;
		} else {
			updatedPlayers[Object.keys(updatedPlayers)[i]].turn = false;
			updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.turn = false;
		}
		updatedPlayers[Object.keys(updatedPlayers)[i]].packed = false;

	}




	return updatedPlayers;
};


// .............COLLECT BOOT AMOUNT............
async function collectBootAmount(tableInfo, players, game) {
	let bootAmount = 0;
	let iBoot = tableInfo.boot;
	parseInt(iBoot);

	for (let player in players) {
		if (players[player].active == true) {
			bootAmount = bootAmount + iBoot;

			let ttttt = await Player.findOne({
				_id: players[player].id
			}, {
				"chips": 1,
				_id: 0
			});

			ttttt.chips -= iBoot;
			await Player.updateOne({
				_id: players[player].id,
			}, {
				$set: {
					chips: ttttt.chips,
				},
				$inc: {
				lostRummy:iBoot,
				gameRummy : 1
				}
				
			});



			players[player].playerInfo.chips = ttttt.chips;



			let tableData = await Table.findOne({
				_id: tableInfo._id
			});
			await gameAuditService.createAudit(tableInfo._id, '', players[player].id, game._id, "ANTE", players[player].playerInfo.chips, '', '', tableData.amount, tableData.players, 0, '');

		} else {}
	}

	await Table.updateOne({
		_id: tableInfo._id
	}, {
		$set: {
			tableAmount: bootAmount,
			players: players,
			gameStarted: true,
			gameInit: true

		},
	});

};

//........DISTRIBUTE TOSS CARDS...............
async function distributeTossCards(players) {
	Tossdeck.shuffle();
	let TossdeckCards = Tossdeck.getCards(),
		index = 0;
	let noOfCards = 1;

	for (let i = 0; i < noOfCards; i++) {
		for (let player in players) {

			if (players[player].active) {
				if (![players[player].id]) {
					players[player].id = {};
				}
				if (!players[player].tossCard) {
					players[player].tossCard = [];
				} else {
					players[player].tossCard.pop();
				}

				let jsonedTossCard = JSON.parse(JSON.stringify(TossdeckCards[index++]));
				// players[player].tossCard.push(jsonedTossCard);
				players[player].tossCard.unshift(jsonedTossCard);
			}
		}
	}
	return players;
};

//................DISTRIBUTE 13 CARDS................
async function distribute13Cards(players, updatedPlayers) {
	let cardsInfo = {};
	Deck1.shuffle();
	Deck2.shuffle();
	Deck3.shuffle();
	let Deck;

	// if (Object.keys(updatedPlayers).length <= 2) {
	// 	Deck = Deck1.getCards();
	// } else {
		Deck = Deck1.getCards().concat(Deck2.getCards(), Deck3.getCards());
	// }
	let deckCards = Deck;

	index = 0;
	let noOfCards = 13;

	for (let i = 0; i < noOfCards; i++) {
		for (let player in players) {
			if (players[player].active) {
				if (!cardsInfo[players[player].id]) {
					cardsInfo[players[player].id] = {};
				}
				if (!cardsInfo[players[player].id].cards) {
					cardsInfo[players[player].id].cards = [];
				}
				if (![players[player].id]) {
					players[player].id = {};
				}
				if (!players[player].cards) {
					players[player].cards = [];
				}

				let jsonedCard = JSON.parse(JSON.stringify(deckCards[index += 1]));
				cardsInfo[players[player].id].cards.push(jsonedCard);
				players[player].cards.push(jsonedCard);
				console.log("cards  : ", jsonedCard);

			}

		}
	}



	let cardssss = [{
		"type": "spade",
		"rank": 2,
		"name": "2",
		"priority": 2,
		"id2" : "2345",
		"id": 0.288935780696173
	},
	{
		"type": "spade",
		"rank": 3,
		"name": "3",
		"priority": 3,
		"id2" : "23451",
		"id": 0.134925588193503
	},
	{
		"type": "spade",
		"rank": 4,
		"name": "4",
		"priority": 4,
		"id2" : "23452",
		"id": 0.506731457736256
	},
	{
		"type": "spade",
		"rank": 5,
		"name": "5",
		"priority": 5,
		"id2" : "23453",
		"id": 0.266055269610382
	},
	{
		"type": "spade",
		"rank": 6,
		"name": "6",
		"priority": 6,
		"id2" : "23454",
		"id": 0.0679490071622124
	},
	{
		"type": "spade",
		"rank" : 1,
		"name" : "A",
		"priority" : 14,
		"id2" : "234511",
		"id": 0.614452813582459
	},
	{
		"type": "heart",
		"rank": 2,
		"name": "2",
		"priority": 2,
		"id2" : "234512",
		"id": 0.719606491967591
	},
	{
		"type": "heart",
		"rank": 3,
		"name": "3",
		"priority": 3,
		"id2" : "234513",
		"id": 0.962898058782506
	},
	{
		"type": "heart",
		"rank": 4,
		"name": "4",
		"priority": 4,
		"id2" : "234514",
		"id": 0.0843731514242354
	},
	{
		"type": "heart",
		"rank": 5,
		"name": "5",
		"priority": 5,
		"id2" : "234515",
		"id": 0.653679858524318
	},
	{
		"type": "heart",
		"rank": 6,
		"name": "6",
		"priority": 6,
		"id2" : "234516",
		"id": 0.482329018241967
	},
	{
		"type": "heart",
		"rank": 7,
		"name": "7",
		"priority": 7,
		"id2" : "234575",
		"id": 0.179595857379225
	},
	{
		"type": "heart",
		"rank": 8,
		"name": "8",
		"priority": 8,
		"id2" : "234519",
		"id": 0.544321156926503
	}
];


	// let cardssss = [{"type":"diamond","rank":6,"name":"6","priority":6,"id":0.16418521110479833},{"type":"diamond","rank":5,"name":"5","priority":5,"id":0.4512926899417602},{"type":"club","rank":1,"name":"A","priority":14,"id":0.01744296362826092},{"type":"heart","rank":3,"name":"3","priority":3,"id":0.973945150457181},{"type":"club","rank":2,"name":"2","priority":2,"id":0.7513724011455385},{"type":"spade","rank":4,"name":"4","priority":4,"id":0.14785666438550882},{"type":"spade","rank":12,"name":"Q","priority":12,"id":0.5701994953031226},{"type":"club","rank":11,"name":"J","priority":11,"id":0.42479374323168173},{"type":"club","rank":10,"name":"10","priority":10,"id":0.41554332261503135},{"type":"diamond","rank":4,"name":"4","priority":4,"id":0.6982092318009339},{"type":"club","rank":4,"name":"4","priority":4,"id":0.054706715606337886},{"type":"diamond","rank":8,"name":"8","priority":8,"id":0.9766059742454454}];


	if (players["650b06e54c13f3898c6d9cda"] != undefined) {
		players["650b06e54c13f3898c6d9cda"].cards = cardssss;
		cardsInfo["650b06e54c13f3898c6d9cda"].cards = cardssss;
	}


	if (players["650b06d64c13f3898c6d9cc3"] != undefined) {
		players["650b06d64c13f3898c6d9cc3"].cards = cardssss;
		cardsInfo["650b06d64c13f3898c6d9cc3"].cards = cardssss;
	}


	let joker = [];
	joker.push(JSON.parse(JSON.stringify(deckCards[0])));

	// joker[0].priority = 8;
	// joker[0].rank = 8;
	// joker[0].name = "8";
	// joker[0].type = "spade";

	cardsInfo.joker = joker;

	for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards);
		updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
		updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
		updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;
		if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
		updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
		updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = false;
		updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = false;
		updatedPlayers[Object.keys(updatedPlayers)[i]].newopenclosecard = {};
		await ScoreBoard.findOneAndUpdate({
			playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
		}, {
			$inc: {
				totalGames: 1
			}
		});
		

	};







	let openedCard = [];

	openedCard.push(deckCards[(Object.keys(updatedPlayers).length * 13) + 1])

	let leftCards = [];
	for (let i = 28; i < deckCards.length; i++) {
		leftCards.push(deckCards[i]);
	};
	leftCards =  shuffle(leftCards);
	


	for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {

	let sortedPlayer = sortCards(updatedPlayers[Object.keys(updatedPlayers)[i]]);
	sortedPlayer.cards = sortedPlayer.groupCard;
	delete sortedPlayer.groupCard;
	player = sortedPlayer;
	updatedPlayers[Object.keys(updatedPlayers)[i]] = sortedPlayer;

	//console.log("on sort players :  ", data.userId, "   points : ", updatedPlayers[data.userId].cardsetPoints);
  
	let groupData = groupPointCounter(updatedPlayers[Object.keys(updatedPlayers)[i]].cards, cardsInfo.joker);

	updatedPlayers[Object.keys(updatedPlayers)[i]].cards = groupData.cards;
	updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = groupData.cardsetPoints;
	updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = groupData.totalPoints;

	}

	let obj = {
		cardsInfo,
		updatedPlayers,
		openedCard,
		players,
		leftCards
	};
	return obj;
}


function shuffle(deckcards) {
		
	let len = deckcards.length;
	let tempVal;
	let randIdx;
	while (len !== 0) {
		randIdx = Math.floor(Math.random() * len);
		len--;
		deckcards[len].id = Math.random();
		deckcards[randIdx].id = Math.random();
		tempVal = deckcards[len];
		deckcards[len] = deckcards[randIdx];
		deckcards[randIdx] = tempVal;
	}
	return deckcards;
  }
  
  


async function LeavePlayer(userId, tableId, sio, remark) {


	let table = await Table.findById({
		_id: tableId
	});
	let user = await Player.findOne({
		_id: userId
	});
	let cardInfo = await CardInfo.findOne({
		_id: table.cardInfoId
	});

	if (table.players && table.players[user.id]) {


		await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, remark, 0, " ", remark, 0, table.players, 0, '');



		let availableSlots = {};
		table.slotUsedArray.forEach(function(f) {
			availableSlots["slot" + f] = "slot" + f;
		});


		if (table.gameStarted && isActivePlayer(user.id, table.players)) {

			let updatedPlayers = cardInfo.info.updatedPlayers;
			let maxPlayers = table.maxPlayers;
			let totalActivePlayers = 0;


			//await commonServices.packPlayer(user.id, table.players, availableSlots, maxPlayers, table._id)
			updatedPlayers = await commonServices.packPlayer(user.id, updatedPlayers, availableSlots, maxPlayers, table._id)
			//	updatedPlayers = await deactivatePlayerFromArray(user.id, updatedPlayers);
			let removedPlayer = await playerService.removePlayer(user.id, table.players, availableSlots, table.slotUsedArray, table);

			for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;

				if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == user._id) {
					//	updatedPlayers[Object.keys(updatedPlayers)[i]].active = false;
					//	updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;
					updatedPlayers[Object.keys(updatedPlayers)[i]].packed = true;
					updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.active = false;
					updatedPlayers[Object.keys(updatedPlayers)[i]].left = true;

					await ScoreBoard.findOneAndUpdate({
						playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
					}, {
						$inc: {
							gamesLost: 1
						}
					});

					if (updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints > 80)
						updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = 80;

					console.log("continus opackedddd : : ", updatedPlayers[Object.keys(updatedPlayers)[i]].contipack);
					if(updatedPlayers[Object.keys(updatedPlayers)[i]].contipack == 3)
						updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = 40;
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
							}
						});

					}

				}

				if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false) {
					totalActivePlayers += 1;
				}

			}


			let lastremove = cardInfo.info.lastremove;
			if (lastremove != null && lastremove != "")
				cardInfo.info.openedCard.unshift(lastremove);



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
			


			let opencard = cardInfo.info.openedCard;







			let tableInfo = await Table.findOne({
				_id: table._id
			});
			let players = tableInfo.players;

			if (getActivePlayers(players) == 1) {
				_.map(players, function(user) {
					user.turn = false;
					return user;
				});
			}





			for (let postion in opencard) {
				if (opencard[postion] == "") {
					opencard.splice(postion, 1);
				}

			}



			sio.to(table._id.toString()).emit("playerLeft", {
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				updatedPlayers: updatedPlayers,
				table: tableInfo,
				openedCard: opencard,
			});

			if (getActivePlayers(table.players) == 0) {

				await Table.updateOne({
					_id: table._id
				}, {
					$set: {
						gameStarted: false,
						gameInit: false,
						players: {},
						turnplayerId : ""
					},
				});

			} else if (getActivePlayers(table.players) == 1 && tableInfo.gameStarted) {

				console.log("remove player... 1111 ");
				let debitAmount;
				let disconnectPlayer;
				let lastPlayer = table.players[Object.keys(table.players)[0]];
				lastPlayer = await Player.findOne({
					_id: lastPlayer.id
				});
				cardInfo = await CardInfo.findOne({
					_id: table.cardInfoId
				});
				if (cardInfo != null)
					updatedPlayers = cardInfo.info.updatedPlayers;
				let totalActivePlayers = 0;
				if (user.noOfTurn <= 2) {
					debitAmount = table.boot - (20 * table.pointValue);
					if (debitAmount <= 0) {
						debitAmount = debitAmount * -1
					};
					disconnectPlayer = await Player.findOneAndUpdate({
						_id: user._id
					}, {
						$inc: {
							chips: -debitAmount,
							noOfTurn: -1
						}
					});
					lastPlayer = await Player.findOneAndUpdate({
						_id: lastPlayer._id
					}, {
						$inc: {
							chips: debitAmount,
							noOfTurn: -1
						}
					});

				} else if (user.noOfTurn > 2 && user.noOfTurn <= 7) {
					debitAmount = 40 * table.pointValue;
					if (debitAmount <= 0) {
						debitAmount = debitAmount * -1
					};
					disconnectPlayer = await Player.findOneAndUpdate({
						_id: user._id
					}, {
						$inc: {
							chips: -debitAmount,
							noOfTurn: -1
						}
					});
					lastPlayer = await Player.findOneAndUpdate({
						_id: lastPlayer._id
					}, {
						$inc: {
							chips: debitAmount,
							noOfTurn: -1
						}
					});

				} else {
					debitAmount = 80 * table.pointValue;
					if (debitAmount <= 0) {
						debitAmount = debitAmount * -1
					};
					disconnectPlayer = await Player.findOneAndUpdate({
						_id: user._id
					}, {
						$inc: {
							chips: -debitAmount,
							noOfTurn: -1
						}
					}, {
						upsert: true
					});
					lastPlayer = await Player.findOneAndUpdate({
						_id: lastPlayer._id
					}, {
						$inc: {
							chips: debitAmount,
							noOfTurn: -1
						}
					}, {
						upsert: true
					});

				}


				for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
					if (!updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared) {
						updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = Boolean;
					}
					updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
					if (updatedPlayers[Object.keys(updatedPlayers)[i]].id !== lastPlayer.id) {
						updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;
						console.log("wronge decl.. true .. 3");
						updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
						updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -debitAmount;

					} else {

						 let comm = Math.round((debitAmount * table.commission) / 100);
						 debitAmount -= comm;
						 debitAmount = Math.abs(debitAmount);
			
						

						updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
						updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
						updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = false;
						updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = debitAmount;
					}


					if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false) {
						totalActivePlayers += 1;
					}

				}


				let loossinggamout = 0;
				for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
					if (updatedPlayers[Object.keys(updatedPlayers)[i]].packed == true) {
						loossinggamout = updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount + loossinggamout;
					}
				}




				let commissionAmount = Math.round((loossinggamout * table.commission) / 100);
				loossinggamout -= commissionAmount;
				parseInt(loossinggamout);
			

				console.log("commission : ", commissionAmount);
				
			

				loossinggamout = Math.abs(loossinggamout);

				
				for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
					if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
						updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = loossinggamout;
					}
				}

				await Table.updateOne({
					_id: table._id
				}, {
					$set: {
						tableAmount: debitAmount,
						gameStarted: false,
						gameInit: false,
						turnplayerId : ""
					}
				});
				tableInfo.tableAmount = debitAmount;
				tableInfo.gameStarted = false;
				tableInfo.turnplayerId = "";
				tableInfo.gameInit = false;
				// client.emit("showWinner", {
				// 	message: "Player disconnected!",
				// 	placedBy: user._id,
				// 	players: players,
				// 	updatedPlayers: updatedPlayers,
				// 	table: tableInfo,
				// 	// packed: true,
				// 	totalActivePlayers: totalActivePlayers
				// });

				sio.to(table._id.toString()).emit("showWinner", {
					message: "Player disconnected!",
					placedBy: user._id,
					players: players,
					updatedPlayers: updatedPlayers,
					table: tableInfo,
					// packed: true,
					totalActivePlayers: totalActivePlayers
				});




				let availableSlots = {};
				table.slotUsedArray.forEach(function(d) {
					availableSlots["slot" + d] = "slot" + d;
				});



				ClearTimer(table._id.toString())
				startNewGameOnPlayerJoin(table._id, sio,"8");




			} else if (getActivePlayers(table.players) > 1 && tableInfo.gameStarted) {

				let tablee = await Table.findOne({
					_id: table._id
				});

				let cardInfo = await CardInfo.findById({
					_id: tablee.cardInfoId
				});
				let opencard = cardInfo.info.openedCard;

				for (let postion in opencard) {
					if (opencard[postion] == "") {
						opencard.splice(postion, 1);
					}

				}



				sio.to(table._id.toString()).emit("playerLeft", {
					removedPlayer: removedPlayer,
					placedBy: removedPlayer.id,
					// players : players,
					updatedPlayers: updatedPlayers,
					table: tablee,
					openedCard: opencard,
				});




			} else {

				let removedPlayer = await playerService.removePlayer(user.id, table.players, availableSlots, table.slotUsedArray, table);
				let tableInfo = await Table.findOne({
					_id: table._id
				});
				let players = tableInfo.players;
				let slot = getActivePlayers(players);
				
				await Table.updateOne({
					_id: table._id
				}, {
					$set: {
						tableAmount: debitAmount,
						gameStarted: false,
						gameInit: false,
						turnplayerId : ""
					}
				});

			
				ClearTimer(table._id.toString())

				// client.broadcast.to(table._id).emit("playerLeft", {
				//     removedPlayer: removedPlayer,
				//     placedBy: removedPlayer.id,
				//     updatedPlayers: updatedPlayers,
				//     table: tableInfo, 
				// });

			}
		} else {
			let maxPlayers = table.maxPlayers;
			// await commonServices.packPlayer(user.id, table.players, availableSlots, maxPlayers, table._id)
			let removedPlayer = await playerService.removePlayer(user.id, table.players, availableSlots, table.slotUsedArray, table);
			

			let tableInfo = await Table.findOne({
				_id: table._id
			});

			if(tableInfo.gameStarted == false)
			{
				tableInfo.turnplayerId = "";
			}
			
			var cardInfos = await CardInfo.findOne({
				_id: tableInfo.cardInfoId
			});

			let players = cardInfos.info.updatedPlayers;


			let cardInfo = await CardInfo.findOne({
				_id: tableInfo.cardInfoId
			});
			let opencard;
			if (cardInfo != null)
				opencard = cardInfo.info.openedCard;



			for (let postion in opencard) {
				if (opencard[postion] == "") {
					opencard.splice(postion, 1);
				}

			}

			

			console.log("player left ... 3333 ",tableInfo.turnplayerId);
			sio.to(table._id.toString()).emit("playerLeft", {
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				// players : players,
				// updatedPlayers: updatedPlayers,
				updatedPlayers: players,
				table: tableInfo,
				openedCard: opencard,
			});




			if (Object.keys(tableInfo.players).length < 2) {

				sio.to(table._id.toString()).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});

				ClearTimer(table._id.toString())

				startNewGameOnPlayerJoin(table._id, sio,"99");


				// let sentObj = {
				// 	players,
				// 	table: tableInfo
				// };
				// //client.emit("resetTable", sentObj);
				// //client.broadcast.to(table._id).emit("resetTable", sentObj);
				// sio.to(table._id.toString()).emit("resetTable", sentObj);

			}
		}

	}else{
		await Player.update({
			_id: userId
		}, {
			$set: {
				forcedisconnect: true,
				lasttableId: "",
				game : 0,
				isplaying: "no"
			}
		});

	}


}



function getActivePlayers(players) {
	let count = 0;
	for (let player in players) {
		if (players[player].active && !players[player].packed && !players[player].idle) {
			count++;
		}
	}
	return count;
}

function isActivePlayer(id, players) {
	return players[id] && players[id].active;
}

function deactivatePlayerFromArray(id, players) {
	for (let i = 0; i < Object.keys(players).length; i++) {
		if (players[Object.keys(players)[i]].id == id) {
			players[Object.keys(players)[i]].active = false;
		}
	}
	return players;
}



async function SetTimer(userId, tableId, sio, timeouttime = 14000, issideshow = false, playerid = "") {


	//	timeouttime = 16000000;



	let ttttt1 = await Table.findOne({
		_id: tableId
	}, {
		"turnTime": 1,
		"bonusTime": 1,
		_id: 0
	});
	timeouttime = parseInt(ttttt1.turnTime + ttttt1.bonusTime);
	//	timeouttime =50;
	timeouttime = timeouttime - 1;
	timeouttime = timeouttime * 1000;
	await Table.update({
		_id: tableId
	}, {
		timer: timeouttime / 1000
	});

	ClearTimer(tableId.toString());
	ClearTimer(tableId);

	let tabletimer =  timeouttime / 1000 - 3;
	PlayerTimeOut[tableId] = setInterval(async function() {

		let tablee = await Table.findOne({
			_id: tableId
		});
		let timer = tablee.timer - 1;
		let objectLength = Object.keys(PlayerTimeOut).length

	//	console.log("turn startttttttttttttttttttttttttttt : ", timer);
		console.log("turn :" , tableId , "  ", timer);
		await Table.update({
			_id: tableId
		}, {
			timer: timer
		});

		if(timer == tabletimer)
		{
			console.log("is computer player ? ");
			socketClient.iscomputerplayer(tablee);
		}
		if (timer <= 0) {
			console.log("turn table id " , tableId , "  ", timer);
			clearInterval(PlayerTimeOut[tableId]);

			ClearTimer(tableId);



			let table = await Table.findOne({
				_id: tableId
			});

			await Table.update({
				_id: tableId
			}, {
				timer: 16
			});

			clearInterval(PlayerTimeOut[tableId]);

			let user = await Player.findOne({
				_id: userId
			});


			var data = {
				table: '',
				updatedPlayers: '',
				openedCard: ''

			};

			data.table = table;

			let cardInfoId = table.cardInfoId;
			let cardInfo = await CardInfo.findById({
				_id: cardInfoId
			});
			let availableSlots = {};




			table.slotUsedArray.forEach(function(f) {
				availableSlots["slot" + f] = "slot" + f;
			});

			// if (!data.removedCard) {
			// 	data.removedCard = [];
			// }
			// data.removedCard = data.discardedCard;

			let updatedPlayers = cardInfo.info.updatedPlayers;
			let cardsss = updatedPlayers[userId].cards;
			let deckCards = cardInfo.deckCards;

			let contipck = updatedPlayers[userId].contipack + 1;
			updatedPlayers[userId].contipack = contipck;





			if (contipck > 2 || user.disconnect == true) {

				let Endgameobj = {
					id: updatedPlayers[userId].id,
					userName: updatedPlayers[userId].playerInfo.userName,
					message: "Not Active"
				};
				//client.emit("EndGame", Endgameobj);
				sio.to(table._id.toString()).emit("EndGame", Endgameobj);

				LeavePlayer(userId, table._id, sio, "from continus pack") ;

			} else {

				if (cardInfo.info.updatedPlayers[userId].newopenclosecard.type != undefined) {



					let discardedCard = updatedPlayers[userId].newopenclosecard;

					let abort = false;
					for (let position in cardsss) {
						for (let ii = 0; ii < cardsss[position].cards.length; ii++) {
							if (cardsss[position].cards[ii].id2 == updatedPlayers[userId].newopenclosecard.id2 ) {
								cardsss[position].cards.splice(ii, 1);
								abort = true;
								break
							}
						}
						if(abort)
						break;
					}


					


					updatedPlayers[userId].cards = cardsss;









					let groupData = groupPointCounter(updatedPlayers[userId].cards, cardInfo.joker);

					cardInfo.info.openedCard.unshift(discardedCard);
					if (!data.openedCard) {
						data.openedCard = [];
					}
					data.openedCard.unshift(discardedCard);

					updatedPlayers[userId].cards = groupData.cards;
					updatedPlayers[userId].cardsetPoints = groupData.cardsetPoints;
					updatedPlayers[userId].totalPoints = groupData.totalPoints;
					if(updatedPlayers[userId].totalPoints   > 80)
					updatedPlayers[userId].totalPoints   = 80;


				
					
					updatedPlayers[userId].noOfTurn += 1;
					updatedPlayers[userId].newopenclosecard = {};

					await Player.updateOne({
						_id: updatedPlayers[userId].id
					}, {
						$inc: {
							noOfTurn: 1
						}
					});


					if (cardInfo.info.openedCard.length > 5) {
						let lastCard = cardInfo.info.openedCard.pop();
						deckCards.push(lastCard);
					}


				}


				let groupData = groupPointCounter(updatedPlayers[userId].cards, cardInfo.joker);


				updatedPlayers[userId].cards = groupData.cards;
				updatedPlayers[userId].cardsetPoints = groupData.cardsetPoints;
				updatedPlayers[userId].totalPoints = groupData.totalPoints;


				if(	updatedPlayers[userId].totalPoints  > 80)
				updatedPlayers[userId].totalPoints  = 80;


		

				updatedPlayers[userId].noOfTurn += 1;
				updatedPlayers[userId].newopenclosecard = {};







				updatedPlayers = await commonServices.getNextSlotForTurn(userId, updatedPlayers, availableSlots, table.maxPlayers, table._id);

				let newInfo = {
					updatedPlayers: updatedPlayers,
					openedCard: cardInfo.info.openedCard
				}

				await gameAuditService.createAudit(table._id, cardInfo._id, userId, table.lastGameId, "USER_TURN", user.chips, " ", " ", table.amout, table.players, 0, '');


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

				table = await Table.findById({
					_id: tableId
				});
				data.table = table;
				sio.to(tableId.toString()).emit("changedTurn", data);



				SetTimer(table.turnplayerId, table._id, sio);

			}




		}

	}, 1000);


}

async function SetTimerFinish(userId, tableId, sio, timeouttime = 14000, issideshow = false, playerid = "") {






	let ttttt1 = await Table.findOne({
		_id: tableId
	}, {
		"turnTime": 1,
		"bonusTime": 1,
		_id: 0
	});
	timeouttime = parseInt(ttttt1.turnTime + ttttt1.bonusTime);
	timeouttime = timeouttime - 15;
	timeouttime = timeouttime * 1000;
	await Table.update({
		_id: tableId
	}, {
		timer: timeouttime / 1000
	});

	ClearTimer(tableId.toString());
	ClearTimer(tableId);

	let tabletimer =  timeouttime / 1000 - 3;
	PlayerTimeOut[tableId] = setInterval(async function() {

		let tablee = await Table.findOne({
			_id: tableId
		});
		let timer = tablee.timer - 1;
		let objectLength = Object.keys(PlayerTimeOut).length



		await Table.update({
			_id: tableId
		}, {
			timer: timer
		});

		if(timer == tabletimer)
		{
			socketClient.isFinishgame(tablee);
		}



		if (timer <= 0) {
			clearInterval(PlayerTimeOut[tableId]);

			ClearTimer(tableId);



			let table = await Table.findOne({
				_id: tableId
			});

			await Table.update({
				_id: tableId
			}, {
				timer: 16
			});
			let cardInfoId = table.cardInfoId;
			let cardInfo = await CardInfo.findById({
				_id: cardInfoId
			});



			let updatedplayersass = cardInfo.info.updatedPlayers;

			for (let i = 0; i < Object.keys(updatedplayersass).length; i++) {

				let players = updatedplayersass[Object.keys(updatedplayersass)[i]]
				if (players.playerDeclared == undefined)
					players.playerDeclared = false;

				if (players.playerDeclared == false && players.active == true && players.packed == false) {
					// cardInfo = await CardInfo.findById({
					// 	_id: cardInfoId
					// });

					let data = {

						updatedPlayers: cardInfo.info.updatedPlayers,
						userId: players.id,
						tableId: tableId

					}

					await FinishGame(data, sio);
				}




			}












		}

	}, 1000);


}




function ClearTimer(tableId) {
	//	var timername = playertimer + tableId;
	//clearTimeout(PlayerTimer[tableId]);
	//	clearTimeout(PlayerTimer[tableId]);
	//	clearTimeout(PlayerTimer[tableId]);
	//	clearTimeout(PlayerTimer[tableId]);

console.log("clear timer..................................................................................");
	clearInterval(PlayerTimeOut[tableId]);

	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);


}


async function FinishGame(data,sio,client)
{
	let tableId = data.tableId;

	let table = await Table.findById({
	  _id: tableId
	});
	console.warn("FinishGame : ",new Date(), " ui : ", data.userId, " gI : ", table.lastGameId);

	data.table = table;
	// let user = await Player.findOne({
	// 	clientId: client.id
	// })
	let user = await Player.findById({
	  _id: data.userId
	});
	let cardInfoId = table.cardInfoId;
	let cardInfo = await CardInfo.findById({
	  _id: cardInfoId
	});
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

	// let variation = await commissionService.calculateCommission(tableId,data.userId )    

	// console.log("variaotion--datat.....", variation);

	await gameAuditService.createAudit(table._id, '', user._id, table.lastGameId, "WINNER", user.chips, 'Winner', 'Winner', 0, table.players, 0, '');
	if (getActivePlayers(updatedPlayers) == 2) {
	  let winningAmount = 0;
	  let losingAmount;
	  console.log(".............Anu Log..........................................");

	  for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false) {

		  if (Object.keys(updatedPlayers)[i] == data.userId) {
			declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
			updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
			// declarePlayer.cards = staticCards;                  //.############################ STATIC CARDS #######################
			let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
			if (playerPoints.totalPoints == null) {
			  playerPoints.totalPoints = 0;
			}
			updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;

			if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
			updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
			
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
			if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
			updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
			updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;

		  }
		  if (updatedPlayers[Object.keys(updatedPlayers)[i]].active) {
			totalActivePlayers++;
		  }

		}

	  }

	  console.log("declarePlayer__detail=====........... " + declarePlayer.finisher);
	  console.log("declarePlayer__detail=====........... " + declarePlayer.totalPoints);

	  if (declarePlayer.finisher == true) {

		if (declarePlayer.totalPoints == 0) {
		  let isValidGroups = commonServices.isValidGroups(declarePlayer.cards)
		  if (isValidGroups) {
			declarePlayer.winner = true;
			declarePlayer.playerInfo.winner = true;
			declarePlayer.wrongDeclare = false;
			winner = declarePlayer;
			looser = opponentPlayer;

			console.log("losue--------r-----", looser);

			// console.log("winner---winner--nirav",winner);

			for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {

			  if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
				winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
				await ScoreBoard.findOneAndUpdate({
				  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
				}, {
				  $inc: {
					gamesWon: 1
				  }
				});

			  } else {
				updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
				await ScoreBoard.findOneAndUpdate({
				  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
				}, {
				  $inc: {
					gamesLost: 1
				  }
				});

				if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
				updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;

				losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * pointValue;
				winningAmount += losingAmount;

				console.log("winningAmount--------1-----", winningAmount);

				parseInt(winningAmount);
				parseInt(losingAmount);

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
					},
                    $inc: {
                    lostRummy:-substractAmount
                  }
				  });
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

			await Player.updateOne({
			  _id: winner.id
			}, {
			  $set: {
				chips: winner.playerInfo.chips
			  },
			  $inc: {
			  lostRummy:- (winningAmount + table.boot)
			}
			});

			await Player.findOneAndUpdate({
			  type: "admin"
			}, {
			  $inc: {
				chips: commissionAmount
			  }
			});
			await Table.findOneAndUpdate({
			  _id: tableId
			}, {
			  $set: {
				tableAmount: winningAmount
			  }
			});

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
			//   console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
			data.table.tableAmount = winningAmount;
			//   console.log("data.table in GAME  AFTER :: ", data.tableInfo);
			data.totalActivePlayers = totalActivePlayers;

			data.table.gameStarted = false;
			data.table.gameInit = false;
			data.table.turnplayerId = "";
			for (let postion in data.openedCard) {
			  if (data.openedCard[postion] == "") {
				data.openedCard.splice(postion, 1);
			  }

			}

			// console.log("UPDATED pLAYERS IN SHOW WINNER  111111111111 : ", updatedPlayers);

			// console.log(" SHOW WINNER EMITS FOR >>> 2 PLAYERS <<< ")0;

			console.log("showwinner..9");

			sio.to(tableId.toString()).emit("showWinner", data);

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

			let ssllll = checkPlayerDeclare(updatedPlayers);
			console.log("update L2: ",ssllll);
			if (ssllll == "true") {
			//   updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
			//   updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
			  await CardInfo.updateOne({
				_id: cardInfoId
			  }, {
				$set: {
				  info: newInfo
				}
			  }, {
				upsert: true
			  });
			  startNewGameOnPlayerJoin(tableId, sio , "1");
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
				//updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
				updatedPlayers[Object.keys(updatedPlayers)[i]].wrongShow = true;
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
				updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
				await ScoreBoard.findOneAndUpdate({
				  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
				}, {
				  $inc: {
					gamesLost: 1
				  }
				});

				losingAmount = 80 * pointValue;
				winningAmount += losingAmount;
				parseInt(winningAmount);
				parseInt(losingAmount);

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
					lostRummy:- (table.boot - losingAmount)
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
				winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
				updatedPlayers[Object.keys(updatedPlayers)[i]].winner = true;
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = true;
				await ScoreBoard.findOneAndUpdate({
				  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
				}, {
				  $inc: {
					gamesWon: 1
				  }
				});
			  }
			}

			let commissionAmount = Math.round((winningAmount * table.commission) / 100);
			winningAmount -= commissionAmount;
			parseInt(winningAmount);
			parseInt(commissionAmount);
			parseInt(table.boot);
			winner.playerInfo.chips += winningAmount;
			winner.winningAmount = (winningAmount + table.boot);

			await Player.updateOne({
			  _id: winner.id
			}, {
			  $set: {
				chips: winner.playerInfo.chips
			  },
			  $inc: {
			  winRummy:winningAmount
			}
			});

			await Table.findOneAndUpdate({
			  _id: tableId
			}, {
			  $set: {
				tableAmount: winningAmount
			  }
			});

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
			//    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
			data.table.tableAmount = winningAmount;

			data.table.gameStarted = false;
			data.table.gameInit = false;
			data.table.turnplayerId = "";
			//   console.log("data.table in GAME  AFTER :: ", data.tableInfo);
			data.totalActivePlayers = totalActivePlayers;

			// console.log("UPDATED pLAYERS IN SHOW WINNER 2222222222 : ", updatedPlayers);

			console.log("showwinner..6");

			sio.to(tableId.toString()).emit("showWinner", data);

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

			let ssllll = checkPlayerDeclare(updatedPlayers);

			if (ssllll == "true") {
			//   updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
			//   updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
			  await CardInfo.updateOne({
				_id: cardInfoId
			  }, {
				$set: {
				  info: newInfo
				}
			  }, {
				upsert: true
			  });
			  startNewGameOnPlayerJoin(tableId, sio,"9");
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
			//  updatedPlayers[Object.keys(updatedPlayers)[i]].dropped = true;
			  updatedPlayers[Object.keys(updatedPlayers)[i]].wrongShow = true;
			  looser = updatedPlayers[Object.keys(updatedPlayers)[i]];
			  await ScoreBoard.findOneAndUpdate({
				playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
			  }, {
				$inc: {
				  gamesLost: 1
				}
			  });

			} else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == opponentPlayer.id) {
			  updatedPlayers[Object.keys(updatedPlayers)[i]] = opponentPlayer;
			  updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;
			  winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
			  await ScoreBoard.findOneAndUpdate({
				playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
			  }, {
				$inc: {
				  gamesWon: 1
				}
			  });

			} else {
			  //         console.log("Something wrong with winnerId and opponentId");
			}

		  };

		  if (looser.totalPoints > 80) {
			losingAmount = 80 * pointValue;
			looser.totalPoints = 80;
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

		  await Player.findOneAndUpdate({
			type: "admin"
		  }, {
			$inc: {
			  chips: commissionAmount
			}
		  });

		  await Transactions.create({
			userName: user.userName,
			userId: mongoose.Types.ObjectId(winner.id),
			senderId: mongoose.Types.ObjectId(winner.id),
			receiverId: mongoose.Types.ObjectId('5ee4dbdb484c800bcc40bc04'),
			coins: commissionAmount,
			reason: 'rm_game',
			trans_type: 'Commission'
		  })

		  let transactionCommissionData = { // nirav code to store transaction records
			senderId: mongoose.Types.ObjectId(winner.id),
			// agentId: agent._id,
			// distributorId: distributor._id,
			adminId: staticValue.ADMIN_ID,
			tableId: table._id,
			gameId: table.lastGameId,
			// agentCommission: agentCommission,
			// distributorCommission: distributorCommission,
			adminCommission: commissionAmount,
			transType: "COMMISSION",
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
			transType: "COMMISSION",
		  })

		  for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {

			console.log("anothet >>.......transaction....222........");
			console.log("anothet >>.......winningAmount.........222...", winningAmount);

			if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == winner.id) {

			  console.log("anothet >>.......winningAmount.....before....222...", updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips);
			  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += parseInt(winningAmount + table.boot);
			  updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = winningAmount;

			  await Player.updateOne({
				_id: winner.id
			  }, {
				$set: {
				  chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
				},
				$inc: {
				winRummy: parseInt(winningAmount )
			  }
			  });

			} else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == looser.id) {
			  console.log("losingAmount.........---.....", losingAmount);
			  if (table.boot >= losingAmount) {
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += parseInt(table.boot - losingAmount);
				updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;

				await Player.updateOne({
				  _id: looser.id
				}, {
				  $set: {
					chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
				  },
				  $inc: {
					lostRummy:  -parseInt(table.boot - losingAmount)
				}
				});

			  } else {
				let substractAmount = table.boot - losingAmount;
				console.log("substractAmount---............", substractAmount);
				updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += parseInt(substractAmount);
				updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = losingAmount;

				await Player.updateOne({
				  _id: looser.id
				}, {
				  $set: {
					chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
				  },
				  $inc: {
					lostRummy:  -parseInt(substractAmount)
				}
				});

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

		  await Table.findOneAndUpdate({
			_id: tableId
		  }, {
			$set: {
			  tableAmount: winningAmount
			}
		  });

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
		  //    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
		  data.table.tableAmount = winningAmount;

		  data.table.gameStarted = false;
		  data.table.gameInit = false;
		  data.table.turnplayerId = "";
		  //  console.log("data.table in GAME  AFTER :: ", data.tableInfo);
		  data.totalActivePlayers = totalActivePlayers;

		  // console.log("UPDATED pLAYERS IN SHOW WINNER : 33333333333", updatedPlayers);

		  console.log("showwinner..8");

		  sio.to(tableId.toString()).emit("showWinner", data);

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

		

		  let ssllll = checkPlayerDeclare(updatedPlayers);

		  console.log("update L: ",ssllll);
		  if (ssllll == "true") {
			// for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {

			//   updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = false;
			// }

			startNewGameOnPlayerJoin(tableId, sio,"2");

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


		for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
			if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false) {
	
			  if (Object.keys(updatedPlayers)[i] == data.userId) {
				if(	updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  != 0)
					updatedPlayers[Object.keys(updatedPlayers)[i]].wrongDeclare = true;

			  }
			}
		}
		await Table.findOneAndUpdate({
		  _id: tableId
		}, {
		  $set: {
			tableAmount: winningAmount
		  }
		});

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
		//   console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
		data.table.tableAmount = winningAmount;

		data.table.gameStarted = false;
		data.table.gameInit = false;
		data.table.turnplayerId = "";
		//   console.log("data.table in GAME  AFTER :: ", data.tableInfo);
		data.totalActivePlayers = totalActivePlayers;

		// console.log('UPDATED PLAYERS 4444444444444444444444444 ::: ', updatedPlayers);
		console.log("showwinner..5");

		sio.to(tableId.toString()).emit("showWinner", data);

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

		let ssllll = checkPlayerDeclare(updatedPlayers);
		console.log("all declare : ss : ",ssllll);
		if (ssllll == "true") {
	
			console.log("all declare : ",checkPlayerDeclare(updatedPlayers));
		  await CardInfo.updateOne({
			_id: cardInfoId
		  }, {
			$set: {
			  info: newInfo
			}
		  }, {
			upsert: true
		  });
		  startNewGameOnPlayerJoin(tableId, sio,"3");
		}
	  }
	  // as of now testing on 2 Players
	} else if (getActivePlayers(updatedPlayers) > 2) {

	  console.log("---------------enter to here more than 2 updatedPlayers------------------");
	  let winningAmount = 0;
	  let losingAmount;
	  let updatedPlayers = cardInfo.info.updatedPlayers;

	  for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		if (Object.keys(updatedPlayers)[i] == data.userId) {
		  declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
		  // declarePlayer.cards = staticCards;                  //.############################ STATIC CARDS #######################
		  let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
		  if (playerPoints.totalPoints == null) {
			playerPoints.totalPoints = 0;
		  }
		  updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
		  if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
		  updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;
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

	  console.log("updatedPlayers--after-showwinner", updatedPlayers);

	  let isValidGroups = commonServices.isValidGroups(declarePlayer.cards)
	  if (declarePlayer.totalPoints == 0 && isValidGroups) {
		console.log("declarePlayer.totalPoints......................................................................................666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666", updatedPlayers);
		// console.log("POINTS == 0 AND VALIDGROUP == TRUE");
		declarePlayer.winner = true;
		declarePlayer.playerInfo.winner = true;
		declarePlayer.wrongDeclare = false;

		for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		  if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
			winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
			await ScoreBoard.findOneAndUpdate({
			  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
			}, {
			  $inc: {
				gamesWon: 1
			  }
			});
		  } else {
			await ScoreBoard.findOneAndUpdate({
			  playerId: updatedPlayers[Object.keys(updatedPlayers)[i]].id
			}, {
			  $inc: {
				gamesLost: 1
			  }
			});

			if(updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  > 80)
			updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints  = 80;

			losingAmount = updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints * pointValue;
			winningAmount += losingAmount;
			parseInt(winningAmount);
			parseInt(losingAmount);

			console.log(looser);
			if (table.boot >= losingAmount) {
			  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - losingAmount);
			  updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;

			  await Player.updateOne({
				_id: Object.keys(updatedPlayers)[i]
			  }, {
				$set: {
				  chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
				},
				$inc: {
				  lostRummy:  -(table.boot - losingAmount)
			  }
			  });
			} else {
			  let substractAmount = table.boot - losingAmount;
			  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
			  updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = -losingAmount;

			  await Player.updateOne({
				_id: Object.keys(updatedPlayers)[i]
			  }, {
				$set: {
				  chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
				},
				$inc: {
				  lostRummy:  -substractAmount
			  }
			  });

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

		await Player.updateOne({
		  _id: winner.id
		}, {
		  $set: {
			chips: winner.playerInfo.chips
		  },
		  $inc: {
			winRummy: winningAmount
		}
		});
		await Table.updateOne({
		  _id: tableId
		}, {
		  $set: {
			tableAmount: winningAmount
		  }
		});

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
		  transType: "COMMISSION",
		})

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
		await Table.findOneAndUpdate({
		  _id: tableId
		}, {
		  $set: {
			tableAmount: winningAmount
		  }
		});
		//    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
		data.table.tableAmount = winningAmount;

		data.table.gameStarted = false;
		data.table.gameInit = false;
		data.table.turnplayerId = "";
		//  console.log("data.table in GAME  AFTER :: ", data.tableInfo);
		data.totalActivePlayers = totalActivePlayers;
		console.log("showwinner..4");

		sio.to(tableId.toString()).emit("showWinner", data);

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

		
		await CardInfo.updateOne({
		  _id: cardInfoId
		}, {
		  $set: {
			info: newInfo
		  }
		}, {
		  upsert: true
		});

		let ssllll = checkPlayerDeclare(updatedPlayers);

		if (ssllll == "true") {
		  startNewGameOnPlayerJoin(tableId, sio,"4");
		}

	  } else {
		console.log("POINTS (NOT) !== 0 AND isValidGroups == FALSE");

		// game should be continue with remaining players
		// pack that player and continue the game with remaining players

		declarePlayer.winner = false;
		declarePlayer.playerInfo.winner = false;
		declarePlayer.wrongDeclare = true;

		declarePlayer.dropped = true;
		declarePlayer.wrongShow = true;

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

			await Player.updateOne({
			  _id: declarePlayer.id
			}, {
			  $set: {
				chips: updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips
			  },
			$inc: {
			lostRummy:-substractAmount
			}

			});

		  }
		  updatedPlayers[Object.keys(updatedPlayers)[i]].winner = false;
		  updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.winner = false;
		}

		await Table.findOneAndUpdate({
		  _id: tableId
		}, {
		  $inc: {
			tableAmount: winningAmount
		  }
		});
		await ScoreBoard.findOneAndUpdate({
		  playerId: declarePlayer.id
		}, {
		  $inc: {
			gamesLost: 1
		  }
		});

		let maxPlayers = table.maxPlayers;
		let players = await commonServices.packPlayer(declarePlayer.id, table.players, availableSlots, maxPlayers, table._id)
		updatedPlayers = await commonServices.packPlayer(declarePlayer.id, updatedPlayers, availableSlots, maxPlayers, table._id)
		table = await Table.updateOne({
		  _id: table._id
		}, {
		  $set: {
			players: players
		  }
		});

		let newInfo = {
		  updatedPlayers: updatedPlayers,
		  openedCard: openedCard
		}

		await CardInfo.findOneAndUpdate({
		  _id: cardInfoId
		}, {
		  $set: {
			info: newInfo
		  }
		}, {
		  upsert: true
		})

		data.updatedPlayers = updatedPlayers;
		//  console.log("data.table in GAME  BEFORE :: ", data.tableInfo);

		data.table.tableAmount = winningAmount;

		//  console.log("data.table in GAME  AFTER :: ", data.tableInfo);

		if (getActivePlayers(updatedPlayers) > 1) {

			let totalActivePlayers = 0;

			for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
			

				if (updatedPlayers[Object.keys(updatedPlayers)[i]].active == true && updatedPlayers[Object.keys(updatedPlayers)[i]].packed == false ) {
					totalActivePlayers += 1;
				}

			}


			data.updatedPlayers = updatedPlayers;
			data.openedCard = openedCard;
			//    console.log("data.table in GAME  BEFORE :: ", data.tableInfo);
			data.table.tableAmount = winningAmount;
  
			data.table.gameStarted = false;
			data.table.gameInit = false;
			data.table.turnplayerId = "";
			//  console.log("data.table in GAME  AFTER :: ", data.tableInfo);
			data.totalActivePlayers = totalActivePlayers;

			sio.to(data.table._id.toString()).emit("showWinner", data);
			


		//	table._id.toString()
		//   sio.to(data.table._id.toString()).emit("wrongDeclared", {
		// 	placedBy: data.player._id,
		// 	updatedPlayers: updatedPlayers,
		// 	table: table,
		//   });

		};

	  }

	}

}



function checkPlayerDeclare(updatedPlayers)
{
	console.log("checkl all player declare");
	let alldeclare = "true";
	console.warn("checkPlayerDeclare : ",new Date());

	for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
		

		if (!updatedPlayers[Object.keys(updatedPlayers)[i]].active || updatedPlayers[Object.keys(updatedPlayers)[i]].packed  )
		{

		}else{
			if(updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared == false)
			{
				alldeclare = "false";
				break;
			}
		}
	}

	console.log("checkl all player declare :  : ",alldeclare);
	return alldeclare;
}
module.exports = {
	startNewGameOnPlayerJoin,

	LeavePlayer,
	SetTimer,
	ClearTimer,
	SetTimerFinish,
	FinishGame
};