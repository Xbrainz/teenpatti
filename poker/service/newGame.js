let _ = require("underscore");
let mongoose = require("mongoose");
let logger = require("tracer").colorConsole();

let deck = require("./deck");
let Table = require("../model/po_table");
let CardInfo = require("../model/cardInfo");
let Game = require("../model/game");
let User = require("../model/User");
let Transactions = require("../model/transaction");
let TransactionChalWin = require("../model/transactionChalWin");
let winnerService = require('../service/winner');

let {
	getNextActivePlayer,
	getLastActivePlayer,
	getNextActivePlayerForTurnChange
} = require("../service/common");


let constant = require("../core/constant");
let betService = require('../service/bet');
let playerService = require('../service/player');
let gameAuditService = require("./gameAudit");
let startNewGameTime = {};
let startNewGamePlyerJoinTime = {};
//var PlayerTimer = {};
var PlayerTimeOut = {};
const socketClient = require('../service/socketClient');
const Bot_Details = require('../../model/bot_amounts');

async function startNewGameOnPlayerJoin(client, tableId, avialbleSlots, sio) {

	// logger.info("Inside startNewGameOnPlayerJoin - tableId:"+ tableId + " avialbleSlots:" + avialbleSlots);
	let myTable1 = await Table.findOne({
		_id: tableId
	});



	let players = myTable1.players;



	for (let player in players) {

		var userId = players[player].id;
		var user = await User.findOne({
			_id: userId
		});

		if (players[player].disconnect || players[player].forcedisconnect || user.forcedisconnect) {

			LeavePlayer(myTable1._id, userId, client, sio, "start gamecount down");

		}
	}
	myTable1 = await Table.findOne({
		_id: tableId
	});
	let length = Object.keys(myTable1.players).length;



	if(length == 1 && !myTable1.gameInit && myTable1.tableSubType != "private")
	{
		socketClient.joinTable(myTable1._id);
	}



	var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "poker" });

	console.log("logg", Bot_Detailssss);
	if(Bot_Detailssss.onoff == "off" || myTable1.tableSubType == "private")
	{
		socketClient.disconnect(myTable1._id);
	}
			


	if (length >= constant.gameStartOnMinPlayer && !myTable1.gameStarted) {
			ClearTimer(tableId);

			
		sio.to(myTable1._id.toString()).emit("gameCountDown", {
			counter: 10
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
		
		

		clearTimeout(startNewGameTime);
		clearTimeout(startNewGamePlyerJoinTime);
		startNewGamePlyerJoinTime = setTimeout(async function() {
			let myTable = await Table.findOne({
				_id: tableId
			});
			let activePlayer = Object.keys(myTable.players).length;
			if (activePlayer >= constant.gameStartOnMinPlayer && !myTable.gameStarted) {
				await prepareStartGame(client, myTable, avialbleSlots, length, sio);
			} else if (activePlayer < constant.gameStartOnMinPlayer && !myTable.gameStarted) {

				sio.to(myTable._id.toString()).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
			}
		}, 10000);
	} else if (length < constant.gameStartOnMinPlayer && !myTable1.gameStarted) {

		sio.to(myTable1._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
	}
	//logger.info("Leaving startNewGameOnPlayerJoin");
}

async function startNewGame(client, tableId, avialbleSlots, sio) {
	ClearTimer(tableId);
	//	logger.info("Inside startNewGame - tableId:" + tableId + " avialbleSlots:" + avialbleSlots);
	let myTable1 = await Table.findOne({
		_id: tableId
	});

	let players = myTable1.players;
	for (let position in players) {

		if (players[position].remove) {
			await playerService.removePlayer(players[position].id, myTable1.players, myTable1);

		}
	}
	let myTable = await Table.findOne({
		_id: tableId
	});


	if (Object.keys(myTable1.players).length >= constant.gameStartOnMinPlayer && !myTable1.gameStarted) {

		sio.to(myTable1._id.toString()).emit("gameCountDown", {
			counter: 10
		});

		startNewGameTime = setTimeout(async function() {


			let players = myTable1.players;
			for (let position in players) {

				if (players[position].remove) {
					await playerService.removePlayer(players[position].id, myTable1.players, myTable1);

				}
			}

			let myTable = await Table.findOne({
				_id: tableId
			});

			let activePlayer = Object.keys(myTable.players).length;

			if (activePlayer >= constant.gameStartOnMinPlayer && !myTable.gameStarted) {
				await prepareStartGame(client, myTable, avialbleSlots, length, sio);
			} else if (myTable.players.length < constant.gameStartOnMinPlayer) {

				sio.to(myTable._id.toString()).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});


				
				let tablesss3s = JSON.parse(JSON.stringify(myTable));

				// for (let plll in tablesss3s.players) {
				// 	tablesss3s.players[plll].playerInfo.chips = 0;
				// 	tablesss3s.players[plll].playerInfo.userName = "***14";
				// }

				let sentObj = {
					players: tablesss3s.players,
					table: tablesss3s,
				};

				sio.to(myTable._id.toString()).emit("resetTable", sentObj);
			}
		}, 10000);
	} else if (Object.keys(myTable1.players).length < constant.gameStartOnMinPlayer && !myTable.gameStarted) {

		sio.to(myTable1._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

	}


}

async function prepareStartGame(client, table, avialbleSlots, playersleft, sio) {
	//   logger.info("Inside prepareStartGame - avialbleSlots:"+ avialbleSlots + " playersleft:"+ playersleft);

	table = await Table.findOne({
		_id: table._id
	});

	let playerss = table.players;

	for (let player in playerss) {

		var userId = playerss[player].id;
		var user = await User.findOne({
			_id: userId
		});

		if (playerss[player].disconnect || playerss[player].forcedisconnect || user.forcedisconnect) {

			LeavePlayer(table._id, userId, client, sio, "start game");

		}
	}


	let isupdate = false; 

	for (let player in playerss) {
		if(playerss[player].playerInfo.Decrole == "RUSER")
		{
			if(playerss[player].playerInfo.chips <= (table.potLimit * 4))
			{
				isupdate = true;
				await User.update({ _id: playerss[player].id }, { $inc: { chips: 100000 } });
				let usersdeee = await User.findOne({_id:  playerss[player].id},{chips : 1});
				playerss[player].playerInfo.chips = usersdeee.chips;
			}
		}
		
	}

	if(isupdate)
	{
		await Table.update({
			_id: table._id
		}, {
			$set: {
				players : playerss
			}
		});
	}
	


	table = await Table.findOne({
		_id: table._id
	});

	if (Object.keys(table.players).length >= constant.gameStartOnMinPlayer) {


		let cardInfo = await startGame(table, avialbleSlots);

		table = await Table.findOne({
			_id: table._id
		});

		deck.shuffle();
		let joker = deck.getCards();
		let jokers = cardInfo.jokers;
		delete cardInfo.jokers;

		cardInfo = await CardInfo.create({
			tableId: table._id,
			info: cardInfo,
			joker: joker[0],
			jokers
		});
		let game = await Game.create({
			tableId: table._id,
			cardInfoId: cardInfo._id,
			players: table.players
		});

		table.cardinfoId = cardInfo._id;
		table.lastGameId = game._id;
		table.turnplayerId = table.turnplayerId;

		table.playersleft = playersleft;

		await Table.update({
			_id: table._id
		}, {
			$set: table
		});
		let players = table.players;

		for (let player in players) {
			players[player].cardInfo = cardInfo._id;
		}

	
		let tablesss = JSON.parse(JSON.stringify(table));
		// for (let plll in tablesss.players) {
		// 	tablesss.players[plll].playerInfo.chips = 0;
		// 	tablesss.players[plll].playerInfo.userName = "***15";
		// }




		let sentObj = {
			//players,
			table: tablesss,
			joker: joker[0],
			jokers
		};



		let count = await Table.findOne({
			_id: table._id
		}, {
			playersLeft: 1
		});
		if (count.playersLeft > 1) {

			sio.to(table._id.toString()).emit("startNew", sentObj);
		} else {
			await Table.update({
				_id: table._id
			}, {
				$set: {
					gameStarted: false,
					slotUsed: 1,
					players: players,
					turnplayerId: "",
					amount: 0
				},
			});
		}

		SetTimer(table.turnplayerId, table._id, client, sio);

		table = await Table.findOne({
			_id: table._id
		});

		let playerssss = table.players;

		for (let player in playerssss) {

			var userId = playerssss[player].id;
			var user = await User.findOne({
				_id: userId
			});

			if (playerssss[player].disconnect || playerssss[player].forcedisconnect || user.forcedisconnect) {

				LeavePlayer(table._id, userId, client, sio, "after start game");

			}
		}

	} else if (Object.keys(table.players).length < constant.gameStartOnMinPlayer && !table.gameStarted) {
		sio.to(table._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

		await Table.update({
			_id: table._id
		}, {
			$set: {
				gameStarted: false,
				turnplayerId: "",
				amount: 0
			},
		});

	}


	//	logger.info("Leaving prepareStartGame");
}

async function startGame(table, avialbleSlots) {
	// logger.info("Inside startGame - avialbleSlots:" + avialbleSlots);
	cardsInfo = {};

	await resetTable(table);
	let players = await resetAllPlayers(table.players, table.boot);
	await Table.update({
		_id: table._id
	}, {
		$set: {
			players
		}
	});
	let tablee = await Table.findOne({
		_id: table._id
	});

	Table.gameStarted = true;

	avialbleSlots = {};
	tablee.slotUsedArray.forEach(function(d) {
		avialbleSlots["slot" + d] = "slot" + d;
	});

	players = decideDeal(players, avialbleSlots, tablee.maxPlayer);
	players = await decideTurn(players, avialbleSlots, tablee.maxPlayer, tablee.boot, tablee._id);

	tablee.gameStarted = true;
	tablee.isShowAvailable = Object.keys(players).length === 2;
	tablee.isSideShowAvailable = true;
	await Table.update({
		_id: tablee._id
	}, {
		players: players
	});

	players = await collectBootAmount(tablee, players);

	//  tablee = await Table.findOne({ _id: tablee._id });
	//  players = table.players;

	//	logger.info("Leaving startGame");



	return await distributeCards(players, tablee);
}

async function resetTable(myTable) {
	//logger.info("Inside resetTable");
	let iBoot = myTable.boot || 1000;
	await Table.update({
		_id: myTable._id
	}, {
		$set: {
			boot: iBoot,
			lastBet: iBoot,
			lastaction: "",
			showAmount: true,
			amount: 0,
			betRoundCompleted: 0
		},
	});
	//logger.info("Leaving resetTable");
};

async function resetAllPlayers(players, boot) {
	//	logger.info("Inside resetAllPlayers");
	var allPlayers = [];

	//	let iBoot = myTable.boot || 1000;

	for (var player in players) {
		allPlayers.push(player);
	}

	await User.update({
		_id: {
			$in: allPlayers
		}
	}, {
		$set: {
			turn: false,
			active: true,
			deal: false,
			packed: false,
			show: false,
			remove: false,
			nextAmount: boot,
			isSideShowAvailable: false,
			lastBet: 0,
			lastAction: '',
			cardSet: {
				closed: true,
			},
			noOfTurn: 0,
			cardSeen: false
		},
	}, );

	for (var player in players) {
		delete players[player].winner;
		players[player].turn = false;
		players[player].active = true;
		players[player].show = false;
		players[player].packed = false;
		players[player].idle = false;
		players[player].smallblind = false;
		players[player].bigblind = false;

		players[player].nextaction = false;
		players[player].bigblind = false;

		players[player].idle_amount = 0;
		players[player].isSideShowAvailable = false;
		players[player].contipack = 0;
		players[player].cardSet = {
			closed: true,
		};
		players[player].lastBet = 0;
		players[player].lastAction = '';
		players[player].noOfTurn = 0;
		players[player].cardSeen = false;
	}

	//	logger.info("Leaving resetAllPlayers");
	return players;
};

function decideDeal(players, avialbleSlots, maxPlayer) {
	//logger.info("Inside decideDeal - avialbleSlots:" + avialbleSlots + " maxPlayer:" + maxPlayer + " players:" + players);
	let firstPlayer = null,
		dealFound = false,
		isFirst = true,
		dealPlayer;
	for (let player in players) {
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
	if (!dealFound) {
		players[firstPlayer].deal = true;
	} else {
		let nextPlayer = getNextActivePlayer(dealPlayer.id, players, avialbleSlots, maxPlayer);
		players[nextPlayer.id].deal = true;
	}
	//logger.info("Leaving decideDeal - players:" + players);
	return players;
};

async function decideTurn(players, avialbleSlots, maxPlayer, boot, tableIddd) {
	//logger.info("Inside decideTurn - avialbleSlots:" + avialbleSlots + " maxPlayer:" + maxPlayer);
	let firstPlayer = null,
		dealFound = false,
		isFirst = true,
		dealPlayer;
	for (let player in players) {
		if (players[player].active) {
			if (isFirst) {
				firstPlayer = players[player];
				isFirst = false;
			}
			if (players[player].deal === true) {
				dealPlayer = players[player];
				dealFound = true;
			}
		}
	}

	for (let player in players) {
		if (players[player].active) {
			players[player].deal = false;
			players[player].smallblind = false;
			players[player].bigblind = false;
			players[player].turn = false;
		}
	}

	if (!dealFound) {
		players[firstPlayer.id].deal = true;
		let nextPlayer = getNextActivePlayer(firstPlayer.id, players, avialbleSlots, maxPlayer)
		players[nextPlayer.id].smallblind = true;
		players[nextPlayer.id].lastAction = "SB";
		let nextPlayer2 = getNextActivePlayer(nextPlayer.id, players, avialbleSlots, maxPlayer)
		players[nextPlayer2.id].bigblind = true;
		players[nextPlayer2.id].lastAction = "BB";
		let nextPlayer3 = getNextActivePlayer(nextPlayer2.id, players, avialbleSlots, maxPlayer)
		players[nextPlayer3.id].turn = true;




		await Table.update({
			_id: tableIddd
		}, {
			turnplayerId: nextPlayer3.id
		});


		//players[firstPlayer].turn = true;


		if (players[nextPlayer3.id].smallblind == true) {
			players[nextPlayer3.id].nextAction = "Call";
			players[nextPlayer3.id].nextAmount = boot;

		} else if (players[nextPlayer3.id].bigblind == true) {
			players[nextPlayer3.id].nextAction = "Call";
			players[nextPlayer3.id].nextAmount = boot * 2;

		} else {
			players[nextPlayer3.id].nextAction = "Call";
			players[nextPlayer3.id].nextAmount = boot * 2;
		}



	} else {
		let dealplayersss = getNextActivePlayer(dealPlayer.id, players, avialbleSlots, 5)
		players[dealplayersss.id].deal = true;
		let nextPlayer = getNextActivePlayer(dealplayersss.id, players, avialbleSlots, 5)
		players[nextPlayer.id].smallblind = true;
		players[nextPlayer.id].lastAction = "SB";


		let nextPlayer2 = getNextActivePlayer(nextPlayer.id, players, avialbleSlots, 5)
		players[nextPlayer2.id].bigblind = true;
		players[nextPlayer2.id].lastAction = "BB";


		let nextPlayer3 = getNextActivePlayer(nextPlayer2.id, players, avialbleSlots, 5)
		players[nextPlayer3.id].turn = true;




		await Table.update({
			_id: tableIddd
		}, {
			turnplayerId: nextPlayer3.id
		});



		if (players[nextPlayer3.id].smallblind == true) {
			players[nextPlayer3.id].nextAction = "Call";
			players[nextPlayer3.id].nextAmount = boot;

		} else if (players[nextPlayer3.id].bigblind == true) {
			players[nextPlayer3.id].nextAction = "Call";
			players[nextPlayer3.id].nextAmount = boot * 2;

		} else {
			players[nextPlayer3.id].nextAction = "Call";
			players[nextPlayer3.id].nextAmount = boot * 2;
		}




	}
	//logger.info("Leaving decideTurn");
	return players;
};

async function collectBootAmount(tableInfo, players) {
	//logger.info("Inside collectBootAmount");
	var bootAmount = 0;
	for (let player in players) {
		if (players[player].smallblind) {
			players[player].lastBet = tableInfo.boot;
			bootAmount = bootAmount + tableInfo.boot;
			const userInfo = await User.findOne({
				_id: players[player].id
			});
			players[player].playerInfo.chips = userInfo.chips;
			players[player].playerInfo.chips -= tableInfo.boot;

			await TransactionChalWin.create({
				userId: mongoose.Types.ObjectId(players[player].id),
				tableId: tableInfo._id,
				gameId: tableInfo.lastGameId,
				coins: bootAmount,
				transType: 'SB'
			});

			await gameAuditService.createAudit(tableInfo._id, tableInfo.cardinfoId, players[player].playerInfo._id, tableInfo.lastGameId, "SB", bootAmount, 0, players[player].playerInfo.chips, "new game", "game", tableInfo.amount, tableInfo.players, 0, '');



			// await User.update({
			// 	_id: players[player].id,
			// }, {
			// 	$set: {
			// 		chips: players[player].playerInfo.chips,
			// 	},
			// });

			await User.update({
				_id:  players[player].id
			}, 
			{
				$set: {	chips: players[player].playerInfo.chips	},
				$inc: { lostPoker: tableInfo.boot }
			}
			);



			

		}


		if (players[player].bigblind) {
			players[player].lastBet = tableInfo.boot * 2;
			bootAmount = bootAmount + (tableInfo.boot * 2);
			const userInfo = await User.findOne({
				_id: players[player].id
			});
			players[player].playerInfo.chips = userInfo.chips;
			players[player].playerInfo.chips -= tableInfo.boot * 2;
			/*    await Transactions.create({
                senderId: mongoose.Types.ObjectId(players[player].id),
                userId: mongoose.Types.ObjectId(players[player].id),
                coins: bootAmount,
                reason: 'Game',
                trans_type: 'bb'
            });
			*/
			await gameAuditService.createAudit(tableInfo._id, tableInfo.cardinfoId, players[player].playerInfo._id, tableInfo.lastGameId, "BB", bootAmount, 0, players[player].playerInfo.chips, "new game", "game", tableInfo.amount, tableInfo.players, 0, '');

			await TransactionChalWin.create({
				userId: mongoose.Types.ObjectId(players[player].id),
				tableId: tableInfo._id,
				gameId: tableInfo.lastGameId,
				coins: bootAmount,
				transType: 'BB'
			});
			await User.update({
				_id: players[player].id,
			}, {
				$set: {
					chips: players[player].playerInfo.chips,
				},
				$inc: {
					lostPoker: (tableInfo.boot * 2)
				}
			});
		}

		await User.update({
			_id:  players[player].id
		}, 
		{
			
			$inc: { gamePoker : 1 }
		}
		);




	}

	await Table.update({
		_id: tableInfo._id
	}, {
		$set: {

			players: players,
			gameStarted: true
		},
	});

	return players;
	//logger.info("Leaving collectBootAmount");
}

async function distributeCards(players, table) {
	//logger.info("Inside distributeCards");
	var cardsInfo = {};
	deck.shuffle();
	var deckCards = deck.getCards(),
		index = 0;
	for (var i = 0; i < 2; i++) {
		for (var player in players) {
			if (players[player].active) {
				if (!cardsInfo[players[player].id]) {
					cardsInfo[players[player].id] = {};
				}
				if (!cardsInfo[players[player].id].cards) {
					cardsInfo[players[player].id].cards = [];
					players[player].cardSet.cards = [];
				}
				cardsInfo[players[player].id].cards.push(deckCards[index]);
				players[player].cardSet.cards.push(deckCards[index]);
				index++;
			}
		}
	}

	await Table.update({
		_id: table._id
	}, {
		$set: {

			players: players,
			gameStarted: true
		},
	});

	deck.shuffle();
	deckCards = deck.getCards(),
		index = 0;
	for (var i = 0; i < 5; i++) {
		// Add three joker
		if (!cardsInfo.jokers) {
			cardsInfo.jokers = [];
		}
		cardsInfo.jokers.push(deckCards[index++]);
	}

	logger.info("Leaving distributeCards");
	return cardsInfo;
}


async function LeavePlayer(tableId, userId, client, sio, message) {


	var table = await Table.findOne({
		_id: tableId
	});
	var user = await User.findOne({
		_id: userId
	});
	console.warn("LeavePlayer : ",new Date(), " ui : ", userId, " gI : ", table.lastGameId, " ", message);

	await User.update({
		_id: userId
	}, {
		$set: {
			forcedisconnect: true,
			isplaying: "no"
		}
	});

	if (table.players != null && Object.keys(table.players).length > 0) {

		if (table.players[user._id]) {

			let playerturn = false;

			if (table.turnplayerId == userId)
				playerturn = true;
			let avialbleSlots = [];
			table.slotUsedArray.forEach(function(f) {
				avialbleSlots["slot" + f] = "slot" + f;
			});

			var players = table.players;

			console.log("player sizeeeeeeeeeeeeee : : : ", getActivePlayers(table.players));
			if (getActivePlayers(table.players) == 2 && isplyeractive(table.players,userId)) {


				let removedPlayer;

				let totalamounttt = 0;
				for (let position in players) {
					totalamounttt = totalamounttt + parseInt(players[position].lastBet);
				}


				removedPlayer = await playerService.removePlayer(userId, table.players, table);

				console.log("table id : ",tableId);
				table = await Table.findOne({
					_id: tableId
				});

				players = table.players;


				
				let tablesss33 = JSON.parse(JSON.stringify(table));
				// for (let plll in tablesss33.players) {
				// 	tablesss33.players[plll].playerInfo.chips = 0;
				// 	tablesss33.players[plll].playerInfo.userName = "***16";
				// }

				sio.to(table._id.toString()).emit("playerLeft", {
					bet: {
						lastAction: "Packed",
						lastBet: "",
					},
					removedPlayer: removedPlayer,
					placedBy: removedPlayer.id,
					players: tablesss33.players,
					table: tablesss33,
				});


				if (table.gameStarted) {


					if (getActivePlayerswithIdle(players) > 1) {
						console.log("cal winner .. 4");
						players = await winnerService.calculatewinningamout(players, table);

					} else {


						for (let position in players) {
							players[position].turn = false;
							if (players[position].active && !players[position].packed) {
								let totalwinningamout = table.amount + totalamounttt;
								let commission = (parseInt(totalwinningamout) * parseInt(table.commission)) / 100;
								totalwinningamout = totalwinningamout - commission;

								players[position].winner = true;
								players[position].turn = false;
								players[position].winningAmount = totalwinningamout;
								let user = await User.findOne({
									_id: players[position].id
								});

								let chipppp = user.chips + totalwinningamout;
								// await User.update({
								// 	_id: user._id
								// }, {
								// 	chips: chipppp
								// });

								
								await User.update({
										_id: user._id
									}, 
									{
										$set: {	chips: chipppp	},
										$inc: { winPoker: totalwinningamout }
									}
								);





								players[position].playerInfo.chips = chipppp;



								await TransactionChalWin.create({
									userId: mongoose.Types.ObjectId(players[position].id),
									tableId: table._id,
									gameId: table.lastGameId,
									coins: totalwinningamout,
									transType: 'WIN'
								});

								await Transactions.create({
									userName: players[position].playerInfo.userName,
									userId: mongoose.Types.ObjectId(players[position].id),
									receiverId: mongoose.Types.ObjectId(players[position].id),
									coins: totalwinningamout,
									reason: 'Game',
									transType: 'win'
								});

								await gameAuditService.createAudit(table._id, table.cardinfoId, players[position].id, table.lastGameId, "Winner", 0, 0, totalwinningamout, "Winner", "game", table.amount, table.players, 0, '');





							}
						}

					}

					table.plyers = players;
					table.gameStarted = false;
					table.turnplayerId = "";

				
					let tablesss1 = JSON.parse(JSON.stringify(table));
					// for (let plll in tablesss1.players) {
					// 	tablesss1.players[plll].playerInfo.chips = 0;
					// 	tablesss1.players[plll].playerInfo.userName = "***17";
					// }


					await gameAuditService.createAudit(table._id, table.cardinfoId, 0, table.lastGameId, "DISCONNECT", 0, 0, 0, "DISCONNECT", message, table.amount, table.players, 0, removedPlayer.id);


					sio.to(table._id.toString()).emit("LastShowwinner", {
						table: tablesss1,
						message: "leave player"
					});




				}
				await Table.update({
					_id: tableId
				}, {
					$set: {
						gameStarted: false,
						players: players,
						turnplayerId: "",
						amount: 0
					},
				});
				let avialbleSlots = {};
				table.slotUsedArray.forEach(function(f) {
					avialbleSlots["slot" + f] = "slot" + f;
				});

				startNewGameOnPlayerJoin(client, table._id, avialbleSlots, sio);
			} else {

				let removedPlayer;
				var nextPlayer = getNextActivePlayer(userId, players, avialbleSlots, table.maxPlayers);
				if (playerturn) {


				//	let nextPlayer = getNextActivePlayer(userId, players, avialbleSlots, table.maxPlayers);
					let lastplayer = getLastActivePlayer(userId, players, avialbleSlots, table.maxPlayers);
					let BetAmout = players[lastplayer.id].lastBet,
						action = players[lastplayer.id].lastAction;

						console.log("userid : ", userId);
						console.log("nextplayer : ", nextPlayer.id);
						console.log("lastplayer : ", lastplayer.id);

						console.log("lastbet : ",players[lastplayer.id].lastBet + "  nextplayer lastbet :  "+  players[nextPlayer.id].lastBet);
						console.log("last player : ",lastplayer.playerInfo.userName , "   next player : ", nextPlayer.playerInfo.userName );

					players[nextPlayer.id].turn = true;
					if (table.betRoundCompleted == 0 && players[nextPlayer.id].smallblind == true && BetAmout == table.boot * 2) {
						players[nextPlayer.id].nextAction = "Call"
						players[nextPlayer.id].nextAmount = BetAmout / 2;

						if (action == "Raise" || action == "Call") {
							players[nextPlayer.id].nextAmount = BetAmout - players[nextPlayer.id].lastBet;
						}
					} else if (action == "Call" || action == "Raise" || action == "AllIn") {
						players[nextPlayer.id].nextAction = "Call"
						players[nextPlayer.id].nextAmount = BetAmout - players[nextPlayer.id].lastBet;
					} else {
						players[nextPlayer.id].nextAction = "Check"
						players[nextPlayer.id].nextAmount = BetAmout;
					}


					if (players[nextPlayer.id].bigblind == true && players[userId].lastBet == (table.boot * 2) && table.betRoundCompleted == 0) {
						players[nextPlayer.id].nextAction = "Check"
						players[nextPlayer.id].nextAmount = BetAmout;
					}


					if (players[nextPlayer.id].smallblind == true && players[lastplayer.id].lastBet == 0) {
						players[nextPlayer.id].nextAction = "Check"
						players[nextPlayer.id].nextAmount = BetAmout;
					}


					await Table.update({
						_id: tableId
					}, {
						players: players,
						//	lastBet: amount,
						//	lastAction: action,
						turnplayerId: nextPlayer.id
					});
					table = await Table.findOne({
						_id: tableId
					});

					let nextPlayerForTurnChange = getNextActivePlayerForTurnChange(userId, players, avialbleSlots, table.maxPlayers);


					console.log("lastbet : ",players[lastplayer.id].lastBet , " action : ", action , "  players[nextPlayer.id].nextAmount :: " + players[nextPlayer.id].nextAmount , "   players[nextPlayer.id].lastBet : : ", players[nextPlayer.id].lastBet );

					await gameAuditService.createAudit(table._id, table.cardinfoId, userId, table.lastGameId, action, BetAmout, 0, players[userId].playerInfo.chips, action, "game", table.amount, table.players, 0, '');

					console.log("from : ", players[userId].bigblind == true && action == "Check" && table.betRoundCompleted == 0);
					console.log("1st : ",table.betRoundCompleted == 0 &&  players[nextPlayer.id].lastBet  >= players[userId].lastBet && players[userId].bigblind == true);
					console.log("2nd : ", (action == "Call" || action == "AllIn") && players[nextPlayer.id].nextAmount == 0 && players[nextPlayer.id].lastBet != 0);
					console.log("3nd : ", (action == "Call" || action == "AllIn") && table.betRoundCompleted != 0 && players[userId].nextAmount <= players[nextPlayer.id].lastBet && players[nextPlayer.id].lastBet != 0) ;
					console.log("4th : ", (action == "Check" && players[nextPlayer.id].smallblind == true));
					console.log("5th :", 	players[nextPlayer.id].lastAction == "AllIn");


					if ((players[userId].bigblind == true && action == "Check" && table.betRoundCompleted == 0) ||
					(table.betRoundCompleted == 0 &&  players[nextPlayer.id].lastBet  >= players[userId].lastBet && players[userId].bigblind == true)||
					((action == "Call" || action == "AllIn") && players[nextPlayer.id].nextAmount == 0 && players[nextPlayer.id].lastBet != 0 && table.betRoundCompleted != 0) ||
					((action == "Call" || action == "AllIn") && table.betRoundCompleted != 0 && players[userId].nextAmount <= players[nextPlayer.id].lastBet && players[nextPlayer.id].lastBet != 0) ||
					(action == "Check" && players[nextPlayer.id].smallblind == true) ||
					players[nextPlayer.id].lastAction == "AllIn") {


				

						table.betRoundCompleted = table.betRoundCompleted + 1;
						table.lastBet = table.boot;
						let totaltableamount = 0

						let IsAllIn = 0,
							AllIn_Amount = players[userId].lastBet;
						for (let position in players) {
							if (players[position].active) {
								if (players[position].lastAction == "AllIn" && !players[position].idle) {
									IsAllIn = 1;
									if (AllIn_Amount > players[position].lastBet) {
										AllIn_Amount = players[position].lastBet;
									}
								}
							}
						}

						if (IsAllIn == 1) {
							for (let position in players) {
								if (players[position].active) {
									if (AllIn_Amount < players[position].lastBet) {
										let user = await User.findOne({
											_id: players[position].id
										});

										let minusamount = players[position].lastBet - AllIn_Amount;
										let chipppp = user.chips - minusamount;

										// await User.update({
										// 	_id: players[position].id
										// }, {
										// 	chips: chipppp
										// });


									await User.update({
											_id: players[position].id
										}, 
										{
											$set: {	chips: chipppp	},
											$inc: { lostPoker: minusamount }
										}
									);


										players[position].lastBet = AllIn_Amount;
										players[position].playerInfo.chips = chipppp;



										await gameAuditService.createAudit(table._id, table.cardinfoId, userId, table.lastGameId, "Allin-minus", minusamount, 0, players[userId].playerInfo.chips, "Allin-minus", "game", table.amount, table.players, 0, '');

									}
								}

							}
						}


						for (let position in players) {
							if (players[position].active) {
								totaltableamount = totaltableamount + parseInt(players[position].lastBet);
								players[position].lastBet = 0;

								await TransactionChalWin.create({
									userId: mongoose.Types.ObjectId(players[position].id),
									tableId: table._id,
									gameId: table.lastGameId,
									coins: players[position].lastBet,
									transType: "callcheck"
								});

							}
						}

						let amountt = table.amount + totaltableamount;
						for (let position in players) {
							if (players[position].active) {
								if (players[position].lastAction == "AllIn" && !players[position].idle) {
									if (players[position].idle_amount == 0)
										players[position].idle_amount = amountt;
									players[position].idle = true;
								}
							}
						}

						await gameAuditService.createAudit(table._id, table.cardinfoId, 0, table.lastGameId, "ROUND_COMPLETE", 0, 0, AllIn_Amount, "ROUND_COMPLETE", "game", table.amount, table.players, 0, '');


						await Table.update({
							_id: tableId
						}, {
							$set: {
								amount: amountt,
								players: players,
								betRoundCompleted: table.betRoundCompleted

							},
						});

						table = await Table.findOne({
							_id: tableId
						});

						players[nextPlayer.id].turn = false;


						let NextPlayerTurn;
						let playerturnId;
						for (let position in players) {
							players[position].turn = false;
							if (players[position].active) {

								if (players[position].smallblind) {
									NextPlayerTurn = players[position];
									players[position].turn = true;
									playerturnId = NextPlayerTurn.id;
									players[position].nextAction = "Check";
									players[position].nextAmount = "0";

								}
							}
						}

						if (NextPlayerTurn.packed == true || NextPlayerTurn.idle == true) {
							players[nextPlayer.id].turn = false;
							NextPlayerTurn = getNextActivePlayer(NextPlayerTurn.id, players, avialbleSlots, table.maxPlayers);

							NextPlayerTurn.turn = true;
							playerturnId = NextPlayerTurn.id;
							NextPlayerTurn.nextAction = "Check";
							NextPlayerTurn.nextAmount = "0";

							for (let position in players) {
								players[position].turn = false;
							}
							players[NextPlayerTurn.id].turn = true;
							playerturnId = NextPlayerTurn.id;
							players[NextPlayerTurn.id].nextAction = "Check";
							players[NextPlayerTurn.id].nextAmount = "0";

						}

						await Table.update({
							_id: tableId
						}, {
							players: players,
							turnplayerId: playerturnId
						});


						if (table.betRoundCompleted == 4 || getActivePlayers(players) < 2) {

							console.log("cal winner .. 1");
							players = await winnerService.calculatewinningamout(players, table);

							await Table.update({
								_id: tableId
							}, {
								$set: {
									gameStarted: false,
									players: players,
									turnplayerId: "",
									amount: 0
								},
							});

							table = await Table.findOne({
								_id: tableId
							});

							
							let tablesss = JSON.parse(JSON.stringify(table));
							// for (let plll in tablesss.players) {
							// 	tablesss.players[plll].playerInfo.chips = 0;
							// 	tablesss.players[plll].playerInfo.userName = "***18";
							// }




							// client.emit("LastShowwinner", {
							// 	table: tablesss,
							// });
							sio.to(tablesss._id.toString()).emit("LastShowwinner", {
								table: tablesss,
								message: "leave player"
							});

							let avialbleSlots = {};
							table.slotUsedArray.forEach(function(d) {
								avialbleSlots["slot" + d] = "slot" + d;
							});

							startNewGameOnPlayerJoin(client, table._id, avialbleSlots, sio);


						} else {

							setTimeout(async function() {

								let table = await Table.findOne({
									_id: tableId
								});

							
								let tablesss = JSON.parse(JSON.stringify(table));
								// for (let plll in tablesss.players) {
								// 	tablesss.players[plll].playerInfo.chips = 0;
								// 	tablesss.players[plll].playerInfo.userName = "***19";
								// }

								let card = await CardInfo.findOne({
									_id: table.cardinfoId
								});

								let sentObj = {
									//players,
									table: tablesss,
									jokers: card.jokers,

								};



								//	client.emit("RoundCompleete",sentObj);
								sio.to(table._id.toString()).emit("RoundCompleete", sentObj);
								SetTimer(table.turnplayerId, table._id, client, sio);

								//	client.emit("TurnDone", { players: players, table: table, placeby : args });
								//	client.broadcast.to(table._id).emit("TurnDone", { players: players, table: table, placeby : args});

							}, 1000);

						}

					}





					removedPlayer = await playerService.removePlayer(user._id, table.players, table);

					table = await Table.findOne({
						_id: tableId
					});

					players = table.players;
					console.log("next player : ", nextPlayer.id);
					if (players[nextPlayer.id].bigblind == true && players[lastplayer.id].lastBet == (table.boot * 2) && table.betRoundCompleted == 0) {
						players[nextPlayer.id].nextAction = "Check"
						players[nextPlayer.id].nextAmount = BetAmout;
					}


					if (players[nextPlayer.id].smallblind == true && players[lastplayer.id].lastBet == 0) {
						players[nextPlayer.id].nextAction = "Check"
						players[nextPlayer.id].nextAmount = BetAmout;
					}

					await Table.update({
						_id: tableId
					}, {
						$set: {
							players: players
						}
					});


					
					let tablessssaaa = JSON.parse(JSON.stringify(table));
					// for (let plll in tablessssaaa.players) {
					// 	tablessssaaa.players[plll].playerInfo.chips = 0;
					// 	tablessssaaa.players[plll].playerInfo.userName = "***22";
					// }


					sio.to(table._id.toString()).emit("playerLeft", {
						bet: {
							lastAction: "Packed",
							lastBet: "",
						},
						removedPlayer: removedPlayer,
						placedBy: removedPlayer.id,
						players: tablessssaaa.players,
						table: tablessssaaa,
					});

					console.log("set timer ... 1");
					SetTimer(table.turnplayerId, table._id, client, sio);



				} else {


					removedPlayer = await playerService.removePlayer(userId, table.players, table);

					table = await Table.findOne({
						_id: table._id
					});

					await gameAuditService.createAudit(table._id, table.cardinfoId, 0, table.lastGameId, "DISCONNECT", 0, 0, 0, "DISCONNECT", "game", table.amount, table.players, 0, removedPlayer.id);

					// client.emit("playerLeft", {
					// 	bet: {
					// 		lastAction: "Packed",
					// 		lastBet: "",
					// 	},
					// 	removedPlayer: removedPlayer,
					// 	placedBy: removedPlayer.id,
					// 	players: players,
					// 	table: table,
					// });


				
					let tablessssaaasall = JSON.parse(JSON.stringify(table));
					// for (let plll in tablessssaaasall.players) {
					// 	tablessssaaasall.players[plll].playerInfo.chips = 0;
					// 	tablessssaaasall.players[plll].playerInfo.userName = "***23";
					// }


					sio.to(table._id.toString()).emit("playerLeft", {
						bet: {
							lastAction: "Packed",
							lastBet: "",
						},
						removedPlayer: removedPlayer,
						placedBy: removedPlayer.id,
						players: tablessssaaasall.players,
						table: tablessssaaasall,
					});
					
					
				//	SetTimer(table.turnplayerId, table._id, client, sio);
				let avialbleSlots = {};
				table.slotUsedArray.forEach(function(d) {
					avialbleSlots["slot" + d] = "slot" + d;
				});

				startNewGameOnPlayerJoin(client, table._id, avialbleSlots, sio);

				// let objectLength = Object.keys(table.players).length;
				// console.log("set timer ... 2 .. ",objectLength );
				// if(objectLength == 1)
				// {
				// 	sio.to(table._id.toString()).emit("notification", {
				// 		message: "Please wait for more players to join",
				// 		timeout: 4000,
				// 	});
				// }

				}


				
			}
		}
	}

}



async function SetTimer(userId, tableId, client, sio, timeouttime = 16000, issideshow = false, playerid = "") {

//timeouttime = 16000000;
console.log("table Id SetTimer: : : " + tableId);
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
		console.log("table Id : : : " + tableId);
		let timer = tablee.timer - 1;
		let objectLength = Object.keys(PlayerTimeOut).length

//console.log("timer : " ,timer);
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
			clearInterval(PlayerTimeOut[tableId]);

			ClearTimer(tableId);


			let user = await User.findOne({
				_id: userId
			});
			let tablee = await Table.findOne({
				_id: tableId
			});

			await Table.update({
				_id: tableId
			}, {
				timer: 16
			});

			clearInterval(PlayerTimeOut[tableId]);

			if (tablee.players && tablee.players[userId] && tablee.players[userId].disconnect) {
				let Endgameobj = {
					id: userId,
					userName: tablee.players[userId].playerInfo.userName,
					message: "Internet Disconnected"
				};
				client.emit("EndGame", Endgameobj);
				sio.to(tablee._id.toString()).emit("EndGame", Endgameobj);

				LeavePlayer(tablee._id, userId, client, sio, "disconnect before time over");

			} else if (tablee.players && tablee.players[userId]) {
				let avialbleSlots = {};
				tablee.slotUsedArray.forEach(function(d) {
					avialbleSlots["slot" + d] = "slot" + d;
				});

				let contipck = tablee.players[userId].contipack + 1;
				tablee.players[userId].contipack = contipck;

				await Table.update({
					_id: tableId
				}, {
					players: tablee.players
				});


				//tablee.players = await betService.packPlayer(userId, tablee.players, avialbleSlots, tablee.maxPlayers, tablee);



				// tablee = await Table.findOne({
				// 	_id: tablee._id
				// });




				if (tablee.players[userId].contipack >= 3) {

					let Endgameobj = {
						id: tablee.players[userId].id,
						userName: tablee.players[userId].playerInfo.userName,
						message: "You're idle in game"
					};

					//  client.emit("EndGame", Endgameobj); 
					sio.to(tablee._id.toString()).emit("EndGame", Endgameobj);



					setTimeout(async function() {

						LeavePlayer(tablee._id, userId, client, sio, "disconnect after 3 time idle");

					}, 2000);


				} else {

					PlacePack(tableId, userId, client, sio);

				}



			}






		}

	}, 1000);



}


function ClearTimer(tableId) {

	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);


}


async function PlacePack(tableId, userId, client, sio) {
	let tablee = await Table.findOne({
		_id: tableId
	});


	if (tablee.players != null && Object.keys(tablee.players).length > 0) {

		if (tablee.players[userId]) {


			let avialbleSlots = {};
			tablee.slotUsedArray.forEach(function(d) {
				avialbleSlots["slot" + d] = "slot" + d;
			});

			let maxPlayers = tablee.maxPlayers;



			tablee = await betService.packPlayer(userId, tablee.players, avialbleSlots, maxPlayers, tablee);

			let players = tablee.players;

			if (getActivePlayers(tablee.players) < 2 ) {


				await gameAuditService.createAudit(tablee._id, tablee.cardinfoId, 0, tablee.lastGameId, "packed", 0, 0, 0, "packed", "game", tablee.amount, tablee.players, 0, userId);


				// let tablesss22222 = tablee;

				// for(let plll in tablesss22222.players)
				// {
				// 	tablesss22222.players[plll].playerInfo.chips = 0;
				// 	tablesss22222.players[plll].playerInfo.userName = "***";
				// }


				// sio.to(tablee._id.toString()).emit("playerPacked", {

				// 	placedBy: userId,
				// 	table: tablesss22222,
				// });



				if (tablee.gameStarted) {



					if (getActivePlayerswithIdle(players) > 1) {
						console.log("cal winner .. 2");
						players = await winnerService.calculatewinningamout(players, tablee);

					} else {

						let totalamounttt = 0;
						for (let position in players) {
							totalamounttt = totalamounttt + parseInt(players[position].lastBet);
						}


						for (let position in players) {
							players[position].turn = false;
							if (players[position].active && !players[position].packed) {
								let totalwinningamout = tablee.amount + totalamounttt;
								let commission = (parseInt(totalwinningamout) * parseInt(tablee.commission)) / 100;

								totalwinningamout = totalwinningamout - commission;

								players[position].winner = true;
								players[position].turn = false;
								players[position].winningAmount = totalwinningamout;
								let user = await User.findOne({
									_id: players[position].id
								});

								let chipppp = user.chips + totalwinningamout;
							
								await User.update({
									_id: user._id
								}, 
								{
									$set: {	chips: chipppp	},
									$inc: { winPoker: totalwinningamout }
								}
								);



								players[position].playerInfo.chips = chipppp;



								await TransactionChalWin.create({
									userId: mongoose.Types.ObjectId(players[position].id),
									tableId: tablee._id,
									gameId: tablee.lastGameId,
									coins: totalwinningamout,
									transType: 'WIN'
								});

								await Transactions.create({
									userName: players[position].playerInfo.userName,
									userId: mongoose.Types.ObjectId(players[position].id),
									receiverId: mongoose.Types.ObjectId(players[position].id),
									coins: totalwinningamout,
									reason: 'Game',
									transType: 'win'
								});

								await gameAuditService.createAudit(tablee._id, tablee.cardinfoId, players[position].id, tablee.lastGameId, "Winner", 0, 0, totalwinningamout, "Winner", "game", tablee.amount, tablee.players, 0, '');





							}
						}

					}




					tablee.plyers = players;
					tablee.gameStarted = false;
					tablee.turnplayerId = "";

					let tablesss1 = JSON.parse(JSON.stringify(tablee));
 					

					// for (let plll in tablesss1.players) {
					// 	tablesss1.players[plll].playerInfo.chips = 0;
					// 	tablesss1.players[plll].playerInfo.userName = "***9";
					// }


					sio.to(tablee._id.toString()).emit("LastShowwinner", {
						table: tablesss1,
						message: "leave player"
					});


				}


				await Table.update({
					_id: tableId
				}, {
					$set: {
						gameStarted: false,
						players: players,
						turnplayerId: "",
						amount: 0
					},
				});


				let avialbleSlots = {};
				tablee.slotUsedArray.forEach(function(f) {
					avialbleSlots["slot" + f] = "slot" + f;
				});


				startNewGameOnPlayerJoin(client, tablee._id, avialbleSlots, sio);
			} else {


				let table = tablee;
				let nextPlayer = getNextActivePlayer(userId, players, avialbleSlots, tablee.maxPlayers);
				let lastplayer = getLastActivePlayer(userId, players, avialbleSlots, tablee.maxPlayers);
				let BetAmout = players[lastplayer.id].lastBet,
					action = players[lastplayer.id].lastAction;

				players[nextPlayer.id].turn = true;
				if (table.betRoundCompleted == 0 && players[nextPlayer.id].smallblind == true && BetAmout == table.boot * 2) {
					players[nextPlayer.id].nextAction = "Call"
					players[nextPlayer.id].nextAmount = BetAmout / 2;

					if (action == "Raise" || action == "Call") {
						players[nextPlayer.id].nextAmount = BetAmout - players[nextPlayer.id].lastBet;
					}
				} else if (action == "Call" || action == "Raise" || action == "AllIn") {
					players[nextPlayer.id].nextAction = "Call"
					players[nextPlayer.id].nextAmount = BetAmout - players[nextPlayer.id].lastBet;
				} else {
					players[nextPlayer.id].nextAction = "Check"
					players[nextPlayer.id].nextAmount = BetAmout;
				}


				if (players[nextPlayer.id].bigblind == true && players[userId].lastBet == (table.boot * 2) && table.betRoundCompleted == 0) {
					players[nextPlayer.id].nextAction = "Check"
					players[nextPlayer.id].nextAmount = BetAmout;
				}


				if (players[nextPlayer.id].smallblind == true && players[lastplayer.id].lastBet == 0) {
					players[nextPlayer.id].nextAction = "Check"
					players[nextPlayer.id].nextAmount = BetAmout;
				}


				await Table.update({
					_id: tableId
				}, {
					players: players,
					//	lastBet: amount,
					//	lastAction: action,
					turnplayerId: nextPlayer.id
				});
				table = await Table.findOne({
					_id: tableId
				});

				let nextPlayerForTurnChange = getNextActivePlayerForTurnChange(userId, players, avialbleSlots, table.maxPlayers);




				await gameAuditService.createAudit(table._id, table.cardinfoId, userId, table.lastGameId, action, BetAmout, 0, players[userId].playerInfo.chips, action, "game", table.amount, table.players, 0, '');



/*
				if ((players[userId].bigblind == true && action == "Check" && table.betRoundCompleted == 0) ||
					(table.betRoundCompleted == 0 && players[nextPlayer.id].lastBet >= players[userId].lastBet) ||
					((action == "Call" || action == "AllIn") && players[nextPlayer.id].nextAmount == 0 && players[nextPlayer.id].lastBet != 0 && table.betRoundCompleted != 0) ||
					((action == "Call" || action == "AllIn") && table.betRoundCompleted != 0 && players[userId].nextAmount <= players[nextPlayer.id].lastBet && players[nextPlayer.id].lastBet != 0) ||
					(action == "Check" && players[nextPlayer.id].smallblind == true) ||
					players[nextPlayer.id].lastAction == "AllIn") {




					//if((players[userId].bigblind == true &&  action == "Check" && table.betRoundCompleted ==0)  ||  ((action == "Call" || action == "AllIn")   && players[userId].nextAmount >= players[nextPlayer.id].lastBet && players[nextPlayer.id].lastBet !=0) ||  (action == "Check" && players[nextPlayer.id].smallblind == true))
					//	{

					table.betRoundCompleted = table.betRoundCompleted + 1;
					table.lastBet = table.boot;
					let totaltableamount = 0

					let IsAllIn = 0,
						AllIn_Amount = players[userId].lastBet;
					for (let position in players) {
						if (players[position].active) {
							if (players[position].lastAction == "AllIn" && !players[position].idle) {
								IsAllIn = 1;
								if (AllIn_Amount > players[position].lastBet) {
									AllIn_Amount = players[position].lastBet;
								}
							}
						}
					}

					if (IsAllIn == 1) {
						for (let position in players) {
							if (players[position].active) {
								if (AllIn_Amount < players[position].lastBet) {
									let user = await User.findOne({
										_id: players[position].id
									});

									let minusamount = players[position].lastBet - AllIn_Amount;
									let chipppp = user.chips - minusamount;
									await User.update({
										_id: players[position].id
									}, {
										chips: chipppp
									});
									players[position].lastBet = AllIn_Amount;
									players[position].playerInfo.chips = chipppp;



									await gameAuditService.createAudit(table._id, table.cardinfoId, userId, table.lastGameId, "Allin-minus", minusamount, 0, players[userId].playerInfo.chips, "Allin-minus", "game", table.amount, table.players, 0, '');

								}
							}

						}
					}


					for (let position in players) {
						if (players[position].active) {
							totaltableamount = totaltableamount + parseInt(players[position].lastBet);
							players[position].lastBet = 0;

							await TransactionChalWin.create({
								userId: mongoose.Types.ObjectId(players[position].id),
								tableId: table._id,
								gameId: table.lastGameId,
								coins: players[position].lastBet,
								transType: "callcheck"
							});

						}
					}

					let amountt = table.amount + totaltableamount;
					for (let position in players) {
						if (players[position].active) {
							if (players[position].lastAction == "AllIn" && !players[position].idle) {
								if (players[position].idle_amount == 0)
									players[position].idle_amount = amountt;
								players[position].idle = true;
							}
						}
					}

					await gameAuditService.createAudit(table._id, table.cardinfoId, 0, table.lastGameId, "ROUND_COMPLETE", 0, 0, AllIn_Amount, "ROUND_COMPLETE", "game", table.amount, table.players, 0, '');


					await Table.update({
						_id: tableId
					}, {
						$set: {
							amount: amountt,
							players: players,
							betRoundCompleted: table.betRoundCompleted

						},
					});

					table = await Table.findOne({
						_id: tableId
					});

					players[nextPlayer.id].turn = false;


					let NextPlayerTurn;
					let playerturnId;
					for (let position in players) {
						players[position].turn = false;
						if (players[position].active) {

							if (players[position].smallblind) {
								NextPlayerTurn = players[position];
								players[position].turn = true;
								playerturnId = NextPlayerTurn.id;
								players[position].nextAction = "Check";
								players[position].nextAmount = "0";

							}
						}
					}

					if (NextPlayerTurn.packed == true || NextPlayerTurn.idle == true) {
						players[nextPlayer.id].turn = false;
						NextPlayerTurn = getNextActivePlayer(NextPlayerTurn.id, players, avialbleSlots, table.maxPlayers);

						NextPlayerTurn.turn = true;
						playerturnId = NextPlayerTurn.id;
						NextPlayerTurn.nextAction = "Check";
						NextPlayerTurn.nextAmount = "0";

						for (let position in players) {
							players[position].turn = false;
						}
						players[NextPlayerTurn.id].turn = true;
						playerturnId = NextPlayerTurn.id;
						players[NextPlayerTurn.id].nextAction = "Check";
						players[NextPlayerTurn.id].nextAmount = "0";

					}

					await Table.update({
						_id: tableId
					}, {
						players: players,
						turnplayerId: playerturnId
					});


					if (table.betRoundCompleted == 4 || getActivePlayers(players) < 2) {

						players = await winnerService.calculatewinningamout(players, table);

						await Table.update({
							_id: tableId
						}, {
							$set: {
								gameStarted: false,
								players: players,
								turnplayerId: "",
								amount: 0
							},
						});

						table = await Table.findOne({
							_id: tableId
						});

						let tablesss = table;

						for (let plll in tablesss.players) {
							tablesss.players[plll].playerInfo.chips = 0;
							tablesss.players[plll].playerInfo.userName = "***";
						}




						client.emit("LastShowwinner", {
							table: tablesss,
							message: "leave player"
						});
						sio.to(tablesss._id.toString()).emit("LastShowwinner", {
							table: tablesss,
							message: "leave player"
						});

						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(d) {
							avialbleSlots["slot" + d] = "slot" + d;
						});

						newGameService.startNewGameOnPlayerJoin(client, table._id, avialbleSlots, sio);


					} else {

						setTimeout(async function() {

							let table = await Table.findOne({
								_id: tableId
							});

							let tablesss = table;

							for (let plll in tablesss.players) {
								tablesss.players[plll].playerInfo.chips = 0;
								tablesss.players[plll].playerInfo.userName = "***";
							}

							let card = await CardInfo.findOne({
								_id: table.cardinfoId
							});

							let sentObj = {
								//players,
								table: tablesss,
								jokers: card.jokers,

							};



							//client.emit("RoundCompleete",sentObj);
							sio.to(table._id.toString()).emit("RoundCompleete", sentObj);
							SetTimer(table.turnplayerId, table._id, client, sio);

							//	client.emit("TurnDone", { players: players, table: table, placeby : args });
							//	client.broadcast.to(table._id).emit("TurnDone", { players: players, table: table, placeby : args});

						}, 1000);

					}

				}
*/


				if ((players[userId].bigblind == true && action == "Check" && table.betRoundCompleted == 0) ||
				(table.betRoundCompleted == 0 &&  players[nextPlayer.id].lastBet  >= players[userId].lastBet && players[userId].bigblind == true)||
				((action == "Call" || action == "AllIn") && players[nextPlayer.id].nextAmount == 0 && players[nextPlayer.id].lastBet != 0 && table.betRoundCompleted != 0) ||
				((action == "Call" || action == "AllIn") && table.betRoundCompleted != 0 && players[userId].nextAmount <= players[nextPlayer.id].lastBet && players[nextPlayer.id].lastBet != 0) ||
				(action == "Check" && players[nextPlayer.id].smallblind == true) ||
				players[nextPlayer.id].lastAction == "AllIn") {


			

					table.betRoundCompleted = table.betRoundCompleted + 1;
					table.lastBet = table.boot;
					let totaltableamount = 0

					let IsAllIn = 0,
						AllIn_Amount = players[userId].lastBet;
					for (let position in players) {
						if (players[position].active) {
							if (players[position].lastAction == "AllIn" && !players[position].idle) {
								IsAllIn = 1;
								if (AllIn_Amount > players[position].lastBet) {
									AllIn_Amount = players[position].lastBet;
								}
							}
						}
					}

					if (IsAllIn == 1) {
						for (let position in players) {
							if (players[position].active) {
								if (AllIn_Amount < players[position].lastBet) {
									let user = await User.findOne({
										_id: players[position].id
									});

									let minusamount = players[position].lastBet - AllIn_Amount;
									let chipppp = user.chips - minusamount;
									

									await User.update({
										_id: players[position].id
									}, 
									{
										$set: {	chips: chipppp	},
										$inc: { lostPoker: minusamount }
									}
									);

									players[position].lastBet = AllIn_Amount;
									players[position].playerInfo.chips = chipppp;



									await gameAuditService.createAudit(table._id, table.cardinfoId, userId, table.lastGameId, "Allin-minus", minusamount, 0, players[userId].playerInfo.chips, "Allin-minus", "game", table.amount, table.players, 0, '');

								}
							}

						}
					}


					for (let position in players) {
						if (players[position].active) {
							totaltableamount = totaltableamount + parseInt(players[position].lastBet);
							players[position].lastBet = 0;

							await TransactionChalWin.create({
								userId: mongoose.Types.ObjectId(players[position].id),
								tableId: table._id,
								gameId: table.lastGameId,
								coins: players[position].lastBet,
								transType: "callcheck"
							});

						}
					}

					let amountt = table.amount + totaltableamount;
					for (let position in players) {
						if (players[position].active) {
							if (players[position].lastAction == "AllIn" && !players[position].idle) {
								if (players[position].idle_amount == 0)
									players[position].idle_amount = amountt;
								players[position].idle = true;
							}
						}
					}

					await gameAuditService.createAudit(table._id, table.cardinfoId, 0, table.lastGameId, "ROUND_COMPLETE", 0, 0, AllIn_Amount, "ROUND_COMPLETE", "game", table.amount, table.players, 0, '');


					await Table.update({
						_id: tableId
					}, {
						$set: {
							amount: amountt,
							players: players,
							betRoundCompleted: table.betRoundCompleted

						},
					});

					table = await Table.findOne({
						_id: tableId
					});

					players[nextPlayer.id].turn = false;


					let NextPlayerTurn;
					let playerturnId;
					for (let position in players) {
						players[position].turn = false;
						if (players[position].active) {

							if (players[position].smallblind) {
								NextPlayerTurn = players[position];
								players[position].turn = true;
								playerturnId = NextPlayerTurn.id;
								players[position].nextAction = "Check";
								players[position].nextAmount = "0";

							}
						}
					}

					if (NextPlayerTurn.packed == true || NextPlayerTurn.idle == true) {
						players[nextPlayer.id].turn = false;
						NextPlayerTurn = getNextActivePlayer(NextPlayerTurn.id, players, avialbleSlots, table.maxPlayers);

						NextPlayerTurn.turn = true;
						playerturnId = NextPlayerTurn.id;
						NextPlayerTurn.nextAction = "Check";
						NextPlayerTurn.nextAmount = "0";

						for (let position in players) {
							players[position].turn = false;
						}
						players[NextPlayerTurn.id].turn = true;
						playerturnId = NextPlayerTurn.id;
						players[NextPlayerTurn.id].nextAction = "Check";
						players[NextPlayerTurn.id].nextAmount = "0";

					}

					await Table.update({
						_id: tableId
					}, {
						players: players,
						turnplayerId: playerturnId
					});


					if (table.betRoundCompleted == 4 || getActivePlayers(players) < 2) {
						console.log("cal winner .. 3");
						players = await winnerService.calculatewinningamout(players, table);

						await Table.update({
							_id: tableId
						}, {
							$set: {
								gameStarted: false,
								players: players,
								turnplayerId: "",
								amount: 0
							},
						});

						table = await Table.findOne({
							_id: tableId
						});

					
						let tablesss = JSON.parse(JSON.stringify(table));


						// for (let plll in tablesss.players) {
						// 	tablesss.players[plll].playerInfo.chips = 0;
						// 	tablesss.players[plll].playerInfo.userName = "***11";
						// }




						// client.emit("LastShowwinner", {
						// 	table: tablesss,
						// });
						sio.to(tablesss._id.toString()).emit("LastShowwinner", {
							table: tablesss,
							message: "leave player"
						});

						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(d) {
							avialbleSlots["slot" + d] = "slot" + d;
						});

						startNewGameOnPlayerJoin(client, table._id, avialbleSlots, sio);


					} else {

						setTimeout(async function() {

							let table = await Table.findOne({
								_id: tableId
							});

							
							let tablesss = JSON.parse(JSON.stringify(table));

							// for (let plll in tablesss.players) {
							// 	tablesss.players[plll].playerInfo.chips = 0;
							// 	tablesss.players[plll].playerInfo.userName = "***12";
							// }

							let card = await CardInfo.findOne({
								_id: table.cardinfoId
							});

							let sentObj = {
								//players,
								table: tablesss,
								jokers: card.jokers,

							};



							//	client.emit("RoundCompleete",sentObj);
							sio.to(table._id.toString()).emit("RoundCompleete", sentObj);
							SetTimer(table.turnplayerId, table._id, client, sio);

							//	client.emit("TurnDone", { players: players, table: table, placeby : args });
							//	client.broadcast.to(table._id).emit("TurnDone", { players: players, table: table, placeby : args});

						}, 1000);

					}

				}


				table = await Table.findOne({
					_id: tableId
				});

				players = table.players;
				console.log("next player : ", nextPlayer.id);
				if (players[nextPlayer.id].bigblind == true && players[lastplayer.id].lastBet == (table.boot * 2) && table.betRoundCompleted == 0) {
					players[nextPlayer.id].nextAction = "Check"
					players[nextPlayer.id].nextAmount = BetAmout;
				}


				if (players[nextPlayer.id].smallblind == true && players[lastplayer.id].lastBet == 0) {
					players[nextPlayer.id].nextAction = "Check"
					players[nextPlayer.id].nextAmount = BetAmout;
				}

				await Table.update({
					_id: tableId
				}, {
					$set: {
						players: players
					}
				});



			}

			tablee = await Table.findOne({
				_id: tableId
			});

			await gameAuditService.createAudit(tablee._id, tablee.cardinfoId, 0, tablee.lastGameId, "packed", 0, 0, 0, "packed", "game", tablee.amount, tablee.players, 0, userId);

			
			let tablesssd = JSON.parse(JSON.stringify(tablee));

			// for (let plll in tablesssd.players) {
			// 	tablesssd.players[plll].playerInfo.chips = 0;
			// 	tablesssd.players[plll].playerInfo.userName = "***13";
			// }



			sio.to(tablee._id.toString()).emit("playerPacked", {

				placedBy: userId,
				players: tablesssd.players,
				table: tablesssd,
			});

			SetTimer(tablee.turnplayerId, tablee._id, client, sio);
		}
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

function isplyeractive(players, userId) {
	let count = 0;
	
	if (players[userId].active && !players[userId].packed && !players[userId].idle) {
		return true;
	}

	return false;
}


function getActivePlayerswithIdle(players) {
	let count = 0;
	for (let player in players) {
		if (players[player].active && !players[player].packed) {
			count++;
		}
	}
	return count;
}

module.exports = {
	startNewGameOnPlayerJoin,
	startNewGame,
	LeavePlayer,
	PlacePack,
	SetTimer
}