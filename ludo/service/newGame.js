let _ = require("underscore");
let mongoose = require("mongoose");

let Table = require("../model/table");

let Game = require("../model/game");
let User = require("../model/user");
let TransactionChalWin = require("./../model/transactionChalWin");
let Transactions = require("../model/transaction");

const thirdPartyAPICall = require('../service/thirdPartyAPICall/thirdPartyAPICall');
let gameAuditService = require("../service/gameAudit");
let {
	getNextActivePlayer,
	getNextSlotForTurn
} = require("./common");
const staticValue = require("../constant/staticValue");

let startNewGameTime = {};
let startNewGamePlyerJoinTime = {};
var PlayerTimer = {};
var PlayerTimeOut = {};

const Bot_Details = require('../../model/bot_amounts');

//let newGameService = require("./newGame");

let playerService = require('../service/player');

let Settings_Model = require("../../model/settings");

const socketClient = require('../service/socketClient');

async function startNewGame(client, tableId, sio) {

	
	
	let myTable1 = await Table.findOne({
		_id: tableId
	});
	

	let playersTTT = myTable1.players;


	for (let player in playersTTT) {

		var table = myTable1;

		var userId = playersTTT[player].id;
		let user = await User.findOne({
			_id: userId
		});

		if (playersTTT[player].disconnect ) {

			LeavePlayer(userId, table._id, client, sio, "Disconnect before start new")
		}

	}




	myTable1 = await Table.findOne({
		_id: tableId
	});



	let length = Object.keys(myTable1.players).length;

	if(length == 1 && !myTable1.gameStarted && myTable1.tableSubType != "private")
	{
		var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "ludo" });

		if(Bot_Detailssss!= null)
		{
			if(Bot_Detailssss.onoff == "on")
			{
				socketClient.joinTable(myTable1._id);
			}
		}

		
	}

	



	
	var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "ludo" });

	if(Bot_Detailssss!= null)
	{
		if(Bot_Detailssss.onoff == "off"|| myTable1.tableSubType == "private")
		{
			socketClient.disconnect(myTable1._id);
		}
	}
  


	if (length >= myTable1.maxPlayers && !myTable1.gameStarted) {

		ClearTimer(myTable1._id);
	clearInterval(startNewGameTime[myTable1._id.toString()]);
	
		// for (let player in myTable1.players) {

		// 	const ApiResponce = await thirdPartyAPICall.CheckUser(myTable1.players[player].playerInfo.userName);

		// 	if (!ApiResponce.data.isActive) {

		// 		let Endgameobj = {
		// 			id: myTable1.players[player].id,
		// 			userName: myTable1.players[player].playerInfo.userName,
		// 			message: "Not Active"
		// 		};
		// 		client.emit("EndGame", Endgameobj);
		// 		sio.to(myTable1._id.toString()).emit("EndGame", Endgameobj);


		// 	}

		// }

		// setTimeout(async function() {
		// 	myTable1 = await Table.findOne({
		// 		_id: myTable1._id
		// 	});

			
		// 	let length = Object.keys(myTable1.players).length;
		// 	if(length >= 3 )
		// 	{
		// 		socketClient.disconnect(myTable1._id);
		// 	}
		// }, 4000);

	
		client.emit("gameCountDown", {
			counter: 10
		});
		sio.to(myTable1._id.toString()).emit("gameCountDown", {
			counter: 10
		});
		startNewGameTime[tableId] = setTimeout(async function() {
			let myTable = await Table.findOne({
				_id: tableId
			});
			let activePlayer = Object.keys(myTable.players).length;


			if (activePlayer >= myTable.maxPlayers && !myTable.gameStarted) {

				let avialbleSlots = {};
				myTable.slotUsedArray.forEach(function(f) {
					avialbleSlots["slot" + f] = "slot" + f;
				});



				await prepareStartGame(client, myTable, avialbleSlots, length, sio);



			} else if (myTable.players.length == 1) {
				client.emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
				sio.to(myTable._id.toString()).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});

				let tablll = JSON.parse(JSON.stringify(myTable));
				let playersss = tablll.players;

				for (let plll in playersss) {
					playersss[plll].playerInfo.chips = 0;
					playersss[plll].playerInfo.userName = "***";
				}
				tablll.players = playersss;


				let sentObj = {
					players: tablll.players,
					table: tablll,
				};
				client.emit("resetTable", sentObj);
				sio.to(myTable._id.toString()).emit("resetTable", sentObj);
			}
		}, 10000);
	} else  {
		client.emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
		sio.to(myTable1._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

		// let tablll = JSON.parse(JSON.stringify(myTable1));
		// let playersss = tablll.players;

		// for (let plll in playersss) {
		// 	playersss[plll].playerInfo.chips = 0;
		// 	playersss[plll].playerInfo.userName = "***";
		// }
		// tablll.players = playersss;



		// let sentObj = {
		// 	players: tablll.players,
		// 	table: tablll,
		// };
		// client.emit("resetTable", sentObj);
		// sio.to(myTable1._id.toString()).emit("resetTable", sentObj);
	}
}

async function prepareStartGame(client, table, avialbleSlots, playersleft, sio) {
	let game = await Game.create({
		tableId: table._id
	});
	table = await Table.findOne({
		_id: table._id
	});
	
	await gameAuditService.createAudit(table._id, "", game._id, table.players, "New Round", table.gameType, table.boot);




	let playersTTT = table.players;


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
	
	



	if (table.GameStatus == 0) {

		for (let player in playersTTT) {
			let Endgameobj = {
				id: playersTTT[player].playerInfo._id,
				userName: playersTTT[player].playerInfo.userName,
				// tableId: args.tableId,
				//   playeractive: ApiResponce.data.isActive,
				message: "This table is not available, please change table"
			};



			client.emit("EndGame", Endgameobj);
			sio.to(table._id.toString()).emit("EndGame", Endgameobj);



		}
	} else {

		let sendplayers = [];

		for (let player in playersTTT) {

			let sendplayerrss = {
				playerId: playersTTT[player].playerInfo.userName,
				device: playersTTT[player].playerInfo.deviceType,
				clientIP: playersTTT[player].playerInfo.clientIp,
				playerStatus: 'BLIND'

			}
			sendplayers.push(sendplayerrss);
		}

		let param = {
			roundId: game._id,
			tableCode: table._id,
			gameCategory: table.gameCategory,
			gameCode: game._id,
			gameName: table.gameName,
			amount: table.boot,
			description: "Ludo Initial amount",
			requestId: game._id,
			players: sendplayers,
		};

		
		//const ApiResponce = await thirdPartyAPICall.GameInitiate(param);
	


	//	if (ApiResponce.data.isSuccess) {
			let totalamount = 0;
			// for (let position in ApiResponce.data.data.usersAccount) {

			
			// 	if (!ApiResponce.data.data.usersAccount[position].isSuccess) {

			// 		let Endgameobj = {
			// 			id: ApiResponce.data.data.usersAccount[position].username,
			// 			userName: ApiResponce.data.data.usersAccount[position].username,
			// 			// tableId: args.tableId,
			// 			//   playeractive: ApiResponce.data.isActive,
			// 			message: "You can't play in this table."
			// 		};
			// 		client.emit("EndGame", Endgameobj);
			// 		sio.to(table._id.toString()).emit("EndGame", Endgameobj);

			// 	} else {

					

			// 		for (let player in playersTTT) {

			// 			if (playersTTT[player].playerInfo.userName == ApiResponce.data.data.usersAccount[position].operatorId + ":" + ApiResponce.data.data.usersAccount[position].username) {
			// 				await User.update({
			// 					_id: playersTTT[player].playerInfo._id
			// 				}, {
			// 					$set: {
			// 						chips: ApiResponce.data.data.usersAccount[position].availableBalance
			// 					}
			// 				});
			// 				playersTTT[player].playerInfo.chips = ApiResponce.data.data.usersAccount[position].availableBalance;

			// 				playersTTT[player].active = true;

			// 				totalamount = table.boot + totalamount;
			// 			}


			// 		}

			// 	}
			// }

			await Table.update({
				_id: table._id
			}, {
				$set: {
					players: playersTTT,
					amount : totalamount
				},
			});
		

		

			let tablee = await Table.findOne({
				_id: table._id
			});
			let players = tablee.players;
			resetTable(tablee);
			players = await resetAllPlayers(players);
			players = await decideDeal(players, avialbleSlots, tablee.maxPlayers);

			players = await decideTurn(players, avialbleSlots, tablee.maxPlayers, tablee.players);

			await collectBootAmount(tablee, players, game);

		

			table = await Table.findOne({
				_id: table._id
			});

			//	game.cardInfoId = cardInfo._id;
			game.players = table.players
			await Game.update({
				_id: game._id
			}, {
				$set: game
			});

			// table.lastGameId = game._id;

			// console.log("table update .. 23");
			// await Table.update({
			// 	_id: table._id
			// }, {
			// 	$set: table
			// });
			players = table.players;


			let tablll = JSON.parse(JSON.stringify(table));
			let playersss = tablll.players;

			for (let plll in playersss) {
				playersss[plll].playerInfo.chips = 0;
				playersss[plll].playerInfo.userName = "***";
			}
			tablll.players = playersss;



		
			let sentObj = {
				table: tablll,
			};

			let count = await Table.findOne({
				_id: table._id
			});
			
			if (getActivePlayers(count.players) > 1) {
				

				ClearTimer(table._id);
				client.emit("startNew", sentObj);
				sio.to(table._id.toString()).emit("startNew", sentObj);



				let playersTTT = table.players;

				for (let player in playersTTT) {
					let userId = playersTTT[player].id;
					let user = await User.findOne({
						_id: userId
					});
					if (playersTTT[player].disconnect || playersTTT[player].forcedisconnect || user.forcedisconnect) {

						LeavePlayer(userId, table._id, client, sio, "Disconnect from timer disconnect")
					}

				}



				SetTimer(table.turnplayerId, table._id, client, sio);




			} else {
				await Table.update({
					_id: table._id
				}, {
					$set: {
						gameStarted: false,
						slotUsed: 1,
						players: players,
					},
				});
			}



		// } else {
		// 	client.emit("notification", {
		// 		message: ApiResponce.data.exception.message,
		// 		timeout: 4000,
		// 	});
		// 	sio.to(table._id.toString()).emit("notification", {
		// 		message: ApiResponce.data.exception.message,
		// 		timeout: 4000,
		// 	});
		// }



	}

}

// async function startGame(table, avialbleSlots, game) {

// 	let oldTablee = await Table.findOne({ _id: table._id });
//     await resetTable(table);

//     await Table.update({ _id: table._id }, { $set: { players } });
//     let tablee = await Table.findOne({ _id: table._id });

//     Table.gameStarted = true;
//     players = decideDeal(players, avialbleSlots, tablee.maxPlayers);
//     players = decideTurn(players, avialbleSlots, tablee.maxPlayers, oldTablee.players);

//     tablee.gameStarted = true;



//     await collectBootAmount(tablee, players, game);



// }

async function resetTable(myTable) {
	let iBoot = myTable.boot || 1000;
	let lastBet = iBoot;


	await Table.update({
		_id: myTable._id
	}, {
		$set: {
			boot: iBoot,
			lastBet: lastBet,
			lastBlind: true,
			showAmount: true,
			//amount: 0,
			lastwinnerno: 5,
			winners: [],


			betRoundCompleted: 0
		},
	});
};

async function resetAllPlayers(players) {
	let allPlayers = [];

	for (let player in players) {
		allPlayers.push(player);
	}



	for (let player in players) {
		delete players[player].winner;

		players[player].active = true;

		players[player].packed = false;

		players[player].winner = false;

		players[player].token_0 = -1;
		players[player].token_1 = -1;
		players[player].token_2 = -1;
		players[player].token_3 = -1;
		players[player].active_token = [];
		players[player].current_dise_number = 0;
		players[player].action = "Game";

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
		if (players[player].winner) {
			players[player].deal = true;

		} else {

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



	return players;
};

function decideTurn(players, avialbleSlots, maxPlayer, oldPlayers) {
	let firstPlayer = null,
		dealFound = false,
		isFirst = true,
		isWinner = false,
		winPlayer = null,
		dealPlayer;
	for (let player in oldPlayers) {
		if (oldPlayers[player].winner) {
			if (!isWinner) {
				winPlayer = players[player];
				isWinner = true;
			}
		}
	}
	if (!isWinner) {
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
			players[firstPlayer].turn = true;
		} else {
			let nextPlayer = getNextActivePlayer(dealPlayer.id, players, avialbleSlots, maxPlayer)
			players[nextPlayer.id].turn = true;
		}
	} else {
		let nextPlayer = [];
		nextPlayer = getNextActivePlayer(winPlayer.id, players, avialbleSlots, maxPlayer)
		players[nextPlayer.id].turn = true;
	}

	return players;
};

async function collectBootAmount(tableInfo, players, game) {
	let bootAmount = 0;
	let iBoot = tableInfo.boot;

	await gameAuditService.createAudit(tableInfo._id, "", game._id, tableInfo.players, "collectBootAmount", tableInfo.amount, "");



		for (let pll in players) {
				if (players[pll].turn == true)
				tableInfo.turnplayerId = pll;
			}

			
			tableInfo.gameStarted = true;

			
			



	for (let player in players) {
		if (players[player].active) {
			players[player].totalChalAmount = iBoot;
			players[player].lastBet = iBoot;
			players[player].idle = false;
			players[player].lastAction = '';
			bootAmount = bootAmount + iBoot;
			


			const doc = await User.findOneAndUpdate({ _id: players[player].id},   { $inc: { chips : -iBoot, lostLudo: iBoot, gameLudo : 1} } , {
				new: true
			  });
  			players[player].playerInfo.chips = doc.chips;

			await TransactionChalWin.create({
				userId: mongoose.Types.ObjectId(players[player].id),
				tableId: tableInfo._id,
				gameId: game._id,
				coins: iBoot,
				transType: "BOOT"
			});

			 
			

		



		}
	}



	await Table.update({
		_id: tableInfo._id
	}, {
		$set: {
			turnplayerId: tableInfo.turnplayerId,
			amount: bootAmount,
			players: players,
			gameStarted: true,
			lastGameId: game._id
		},
	});
}



async function SetTimer(userId, tableId, client, sio, timeouttime = 16000) {

	//console.log("table update .. timerrrr... " +userId );
	//timeouttime = 16000000;

	let tablee = await Table.findOne({
		_id: tableId
	},{turnTime : 1	});


	//tablee.turnTime = 100;
	await Table.update({
		_id: tableId
	}, {
		timer: tablee.turnTime 
	});

	


	ClearTimer(tableId.toString());
	ClearTimer(tableId);
	let tabletimer =   tablee.turnTime - 3;
	



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
		console.log("tableId:: ",tableId , " timer : " , timer);
		if(timer == tabletimer)
		{
			socketClient.iscomputerplayer(tablee);
		}

		if (timer <= 0) {
			clearInterval(PlayerTimeOut[tableId]);
			ClearTimer(tableId);

			console.log("tableId:: ",tableId , " timer : 000000000 " );

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

			if(tablee.players[userId] != undefined)
			{
				
				if (tablee.players[userId].disconnect || user.forcedisconnect ) {
	
					LeavePlayer(userId, tablee._id, client, sio, "Disconnect from timer disconnect 2")
	
				} else if (tablee.players && tablee.players[userId]) {
	
	
					tablee = await Table.findOne({
						_id: tablee._id
					});
	
	
					let table = await Table.findOne({
						_id: tableId
					});
	
					if (table.players[userId].current_dise_number == 0) {
	
	
						let randomnumber = GetRandomNumber();
	
	
	
	
						//randomnumber = args.random_no;
	
	
						table.players[userId].current_dise_number = randomnumber;
	
						table.players[userId].active_token = [];
	
						if (randomnumber == 6) {
							if (table.players[userId].token_0 != staticValue.MaxValue) {
								var num = table.players[userId].token_0 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("0");
							}
	
							if (table.players[userId].token_1 != staticValue.MaxValue) {
								var num = table.players[userId].token_1 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("1");
							}
	
							if (table.players[userId].token_2 != staticValue.MaxValue) {
								var num = table.players[userId].token_2 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("2");
							}
	
	
							if (table.players[userId].token_3 != staticValue.MaxValue) {
								var num = table.players[userId].token_3 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("3");
							}
	
						} else {
	
							if (table.players[userId].token_0 != -1 && table.players[userId].token_0 != staticValue.MaxValue) {
								var num = table.players[userId].token_0 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("0");
							}
	
	
							if (table.players[userId].token_1 != -1 && table.players[userId].token_1 != staticValue.MaxValue) {
								var num = table.players[userId].token_1 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("1");
							}
	
	
							if (table.players[userId].token_2 != -1 && table.players[userId].token_2 != staticValue.MaxValue) {
								var num = table.players[userId].token_2 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("2");
							}
	
	
							if (table.players[userId].token_3 != -1 && table.players[userId].token_3 != staticValue.MaxValue) {
								var num = table.players[userId].token_3 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[userId].active_token.push("3");
							}
						}
	
	
	
						ClearTimer(tableId);
	
						let contipck = table.players[userId].contipack + 1;
						table.players[userId].contipack = contipck;
	
						await Table.update({
							_id: tableId
						}, {
							$set: {
								players: table.players,
							},
						});
	
						let argsss = {
							random_no: randomnumber,
							tableId: table._id,
							userId: userId
						}
	
						let tablll = JSON.parse(JSON.stringify(table));
						let playersss = tablll.players;
	
						for (let plll in playersss) {
							playersss[plll].playerInfo.chips = 0;
							playersss[plll].playerInfo.userName = "***";
						}
						tablll.players = playersss;
	
	
						sio.to(tableId.toString()).emit("ClickOnDiseDone", {
							number: randomnumber,
							table: tablll,
							args: argsss,
							path0: staticValue.path0,
							path1: staticValue.path1,
							path2: staticValue.path2,
							path3: staticValue.path3,
						});
	
	
	
						await gameAuditService.createAudit(table._id, userId, table.lastGameId, table.players, "ClickOnDiseDone", randomnumber, table.players[userId].active_token.toString());
	
	
						if (table.players[userId].active_token.length == 0) {
	
	
	
	
							table.players = await getNextSlotForTurn(userId, table.players, tableId);
							table = await Table.findOne({
								_id: tableId
							});
	
	
							let tablll = JSON.parse(JSON.stringify(table));
							let playersss = tablll.players;
	
							for (let plll in playersss) {
								playersss[plll].playerInfo.chips = 0;
								playersss[plll].playerInfo.userName = "***";
							}
							tablll.players = playersss;
	
	
	
							sio.to(tableId.toString()).emit("ChangePlayerTurn", {
								table: tablll,
								args: ""
							});
	
	
	
							table = await Table.findOne({
								_id: tableId
							});
	
							SetTimer(table.turnplayerId, table._id, client, sio);
	
							table.players[userId].current_dise_number = 0;
							await Table.update({
								_id: tableId
							}, {
								$set: {
									players: table.players,
								},
							});
	
	
						}
	
	
	
	
					}
	
	
	
					setTimeout(async function() {
	
	
	
	
	
						table = await Table.findOne({
							_id: tableId
						});
	
						if (table.players[userId].current_dise_number != 0 && table.turnplayerId == userId) {
	
	
							if (table.players[userId].active_token.length != 0) {
	
	
								let argsss = {
									userId: userId,
									tableId: tableId,
									token_no: parseInt(table.players[userId].active_token[0])
								};
								performTokenDone(argsss, client, sio);
	
							}
						}
	
	
	
					}, 2000);
	
				}
	
			}
			

		

		}

	}, 1000);

}





function ClearTimer(tableId) {
	//	var timername = playertimer + tableId;
	clearTimeout(PlayerTimer[tableId]);
	clearInterval(PlayerTimeOut[tableId]);

	startNewGameTime[tableId] 

	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);

}



function getActivePlayers(players) {
	let count = 0;
	for (let player in players) {
		if (players[player].active && !players[player].packed && !players[player].winner) {
			count++;
		}
	}
	return count;
}


function isActivePlayer(id, players) {
	return players[id] && players[id].active;
}
function getActivePlayersOriginal(players) {
	var count = 0;
	for (var player in players) {
		
			count++;
		
	}
	return count;
}



async function LeavePlayer(userId, tableId, client, sio, remark) {



	let player = await User.findOne({
		_id: userId
	});
	//   let table = player.table;

	var table = await Table.findOne({
		_id: tableId
	});

	console.warn("LeavePlayer : ",new Date(), " ui : ", userId, " gI : ", table.lastGameId);

	// client.emit("notification", {
	// 	message: remark,
	// 	timeout: 4000,
	// });
	// sio.to(tableId.toString()).emit("notification", {
	// 	message: remark,
	// 	timeout: 4000,
	// });



	// let Endgameobj = {
	// 	id: player._id,
	// 	userName: player.userName,
	// 	message: "Not Active " + remark
	// };
	// client.emit("EndGame", Endgameobj);
	// sio.to(table._id.toString()).emit("EndGame", Endgameobj);






	if (table.players && table.players[player._id]) {
		await gameAuditService.createAudit(table._id, player._id, table.lastGameId, table.players, "LeavePlayer", "", remark);

		let avialbleSlots = {};
		table.slotUsedArray.forEach(function(f) {
			avialbleSlots["slot" + f] = "slot" + f;
		});

		if (table.gameStarted && isActivePlayer(userId, table.players)) {
			let maxPlayers = 5;
			let tablee = await Table.findOne({
				_id: tableId
			});

			let turnofplayer = false;

			if(tablee.turnplayerId == userId)
				turnofplayer = true;
	
			let removedPlayer = await playerService.removePlayer(userId, tablee.players, avialbleSlots, tablee.slotUsedArray, tablee);
			
		

			let tableInfo = await Table.findOne({
				_id: tableId
			});

			if(turnofplayer)
				SetTimer(tableInfo.turnplayerId, tableInfo._id, client, sio);

			let players = tableInfo.players;
			if (getActivePlayers(players) < 2) {
				_.map(players, function(player) {
					player.turn = false;
					return player;
				});
			}


			let tablll = JSON.parse(JSON.stringify(tableInfo));
			let playersss = tablll.players;

			for (let plll in playersss) {
				playersss[plll].playerInfo.chips = 0;
				playersss[plll].playerInfo.userName = "***";
			}
			tablll.players = playersss;


			sio.to(tableId.toString()).emit("playerLeft", {
				bet: {
					lastAction: "Packed",
					lastBet: "",
				},
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				players: playersss,
				table: tablll,
			});

			sio.to(tableId.toString()).emit("ChangePlayerTurn", {
				table: tablll,
				args: ""
			});

			tableInfo =  await Table.findOne({
				_id: tableId
			});
		

			let playerLength = getActivePlayers(tableInfo.players);

			let table = tableInfo;

			let winnerid = "";
			for (let key in table.players) {
				if (!table.players[key].packed && table.players[key].active)
					winnerid = key;
			}

		



			if (playerLength == 1 && table.gameStarted) {


				let winningno = 1;
				for (let ll in table.winners) {
					if (table.winners[ll].winningposition == winningno)
						winningno++;
				}


				
					var winneradd = {
					id: winnerid,
					name: table.players[winnerid].playerInfo.userName,
					status: "win",
					winningposition: winningno
					}
					table.winners.push(winneradd);

			
			
				
				table.turnplayerId = "";

			
				table = await CallShowwinnerApi(table);
			

				let tablll = JSON.parse(JSON.stringify(table));
				let playersss = tablll.players;

				for (let plll in playersss) {
					playersss[plll].playerInfo.chips = 0;
					playersss[plll].playerInfo.userName = "***";
				}
				tablll.players = playersss;



				sio.to(tableId.toString()).emit("ShowWinner", {
					table: tablll
				});
				await gameAuditService.createAudit(table._id, "", table.lastGameId, table.players, "ShowWinner", "", "", table.winners);



				ClearTimer(table._id);
				await Table.update({
					_id: table._id
				}, {
					$set: {
						winners: [],
						turnplayerId: "",
						gameStarted: false,
						amount: 0
					},
				});

			
				startNewGame(client, table._id, sio);




			} else if (playerLength == 1 && !table.gameStarted) {

				ClearTimer(table._id);
			
				startNewGame(client, table._id, sio);



			} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {

				await Table.update({
					_id: table._id
				}, {
					$set: {

						gameStarted: false,
						amount: 0
					},
				});


			}


		} else {

			let tableee = await Table.findOne({
				_id: tableId
			});
			let removedPlayer = await playerService.removePlayer(userId, tableee.players, avialbleSlots, tableee.slotUsedArray, tableee);


			let tableInfo = await Table.findOne({
				_id: tableId
			});
			let players = tableInfo.players;
			let slot = getActivePlayers(players);


			let tablll = JSON.parse(JSON.stringify(tableInfo));
			let playersss = tablll.players;

			for (let plll in playersss) {
				playersss[plll].playerInfo.chips = 0;
				playersss[plll].playerInfo.userName = "***";
			}
			tablll.players = playersss;


			sio.to(tableId.toString()).emit("playerLeft", {
				bet: {
					lastAction: "Packed",
					lastBet: "",
				},
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				players: players,
				table: tablll,
			});
			let playerLength = getActivePlayers(players);

			let table = tableInfo;
			if (playerLength == 1 && table.gameStarted) {

				let winnerid = "";
				for (let key in table.players) {
					if (!table.players[key].packed && table.players[key].active)
						winnerid = key;
				}



				let winningno = 4;
				if (table.maxPlayers == 4)
					winningno = 4;
				else
					winningno = 2;


				for (let ll in table.winners) {
					if (table.winners[ll].winningposition == winningno)
						winningno--;
				}

				table.lastwinnerno++;
				var winneradd = {
					id: winnerid,
					name: table.players[winnerid].playerInfo.userName,
					status: "win",
					winningposition: winningno
				}
				table.winners.push(winneradd);
				table.turnplayerId = "";
				//	table.winners[winnerid]  = winneradd;

				table = await CallShowwinnerApi(table);


				let tablll = JSON.parse(JSON.stringify(table));
				let playersss = tablll.players;

				for (let plll in playersss) {
					playersss[plll].playerInfo.chips = 0;
					playersss[plll].playerInfo.userName = "***";
				}
				tablll.players = playersss;




				sio.to(table._id.toString()).emit("ShowWinner", {
					table: tablll
				});
				await gameAuditService.createAudit(table._id, "", table.lastGameId, table.players, "ShowWinner", "", "", table.winners);



				ClearTimer(table._id);
				await Table.update({
					_id: table._id
				}, {
					$set: {
						winners: [],
						turnplayerId: "",
						gameStarted: false,
						amount: 0
					},
				});

			

				startNewGame(client, table._id, sio);

			} else if (playerLength == 1 && !table.gameStarted) {

				ClearTimer(table._id);
			
				startNewGame(client, table._id, sio);


			} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {

				console.log("table update .. 13");
				await Table.update({
					_id: table._id
				}, {
					$set: {

						gameStarted: false,
						amount: 0
					},
				});

			}


		}
	}


	// await User.update({
	// 	_id: userId
	// }, {
	// 	$set: {
	// 		lasttableId: table._id
	// 	}
	// });


}

function GetRandomNumber() {
	let Num = Math.floor((Math.random() * 6) + 1);
	return Num;
}



async function performTokenDone(args, client, sio, from = "not") {




	let table = await Table.findOne({
		_id: args.tableId
	});
	console.warn("performTokenDone : ",new Date(), " ui : ", args.userId, " gI : ", table.lastGameId);
	if(table.players[args.userId] != undefined)
	{



	var current_dice_number = table.players[args.userId].current_dise_number;

	
		if(table.players[args.userId].current_dise_number != 0 && table.turnplayerId == args.userId)
		{


			await Table.update(
				{ _id:args.tableId},
				{
				  $set: {
					turnplayerId: "",
					
				  },
				}
			  );

		let next_number = 0;
		table.players[args.userId].current_dise_number = 0;
		
		if (args.token_no == 0) {
			next_number = table.players[args.userId].token_0 + current_dice_number;
			if (table.players[args.userId].token_0 == -1)
				next_number = 0;
			table.players[args.userId].token_0 = next_number;
		} else if (args.token_no == 1) {
			next_number = table.players[args.userId].token_1 + current_dice_number;
			if (table.players[args.userId].token_1 == -1)
				next_number = 0;
			table.players[args.userId].token_1 = next_number;
		} else if (args.token_no == 2) {
			next_number = table.players[args.userId].token_2 + current_dice_number;
			if (table.players[args.userId].token_2 == -1)
				next_number = 0;
			table.players[args.userId].token_2 = next_number;
		} else {
			next_number = table.players[args.userId].token_3 + current_dice_number;
			if (table.players[args.userId].token_3 == -1)
				next_number = 0;
			table.players[args.userId].token_3 = next_number;
		}

		if(from  == "fromuser")
		{
			
			table.players[args.userId].contipack = 0;
			
		}

		
	
		await Table.update({
			_id: args.tableId
		}, {
			$set: {
				players: table.players,
			},
		});
		///// hit token
		let hitplayerId = [];
		let hitplayerkey = [];
		let hitcurrenttoken = [];
		let Number, CurrentNumber;


		for (let key in table.players) {

			if (args.userId != key) {

				let takepath = staticValue.path0;
				let CurrentPath = staticValue.path3;



				if (table.players[args.userId].slot == "slot0") {
					if (table.players[key].slot == "slot0")
						takepath = staticValue.path3;

					if (table.players[key].slot == "slot1")
						takepath = staticValue.path0;

					if (table.players[key].slot == "slot2")
						takepath = staticValue.path1;

					if (table.players[key].slot == "slot3")
						takepath = staticValue.path2;

				} else if (table.players[args.userId].slot == "slot1") {
					if (table.players[key].slot == "slot0")
						takepath = staticValue.path2;

					if (table.players[key].slot == "slot1")
						takepath = staticValue.path3;

					if (table.players[key].slot == "slot2")
						takepath = staticValue.path0;

					if (table.players[key].slot == "slot3")
						takepath = staticValue.path1;

				} else if (table.players[args.userId].slot == "slot2") {
					if (table.players[key].slot == "slot0")
						takepath = staticValue.path1;

					if (table.players[key].slot == "slot1")
						takepath = staticValue.path2;

					if (table.players[key].slot == "slot2")
						takepath = staticValue.path3;

					if (table.players[key].slot == "slot3")
						takepath = staticValue.path0;

				} else if (table.players[args.userId].slot == "slot3") {
					if (table.players[key].slot == "slot0")
						takepath = staticValue.path0;

					if (table.players[key].slot == "slot1")
						takepath = staticValue.path1;

					if (table.players[key].slot == "slot2")
						takepath = staticValue.path2;

					if (table.players[key].slot == "slot3")
						takepath = staticValue.path3;

				}





				Number = table.players[key].token_0 % 13;
				if (table.players[key].token_0 != 0 && table.players[key].token_0 != staticValue.MaxValue) {






					CurrentNumber = next_number % 13;
					if (CurrentNumber == Number && CurrentNumber != 0 && CurrentNumber != 8 && table.players[key].token_0 != next_number && CurrentPath[next_number] == takepath[table.players[key].token_0]) {


						//hit key

						hitplayerId.push(key);
						hitplayerkey.push("0");
						hitcurrenttoken.push(table.players[key].token_0);
						table.players[key].token_0 = -1;
					}
				}




				if (table.players[key].token_1 != 0 && table.players[key].token_1 != staticValue.MaxValue) {



					Number = table.players[key].token_1 % 13;
					CurrentNumber = next_number % 13;
					if (CurrentNumber == Number && CurrentNumber != 0 && CurrentNumber != 8 && table.players[key].token_1 != next_number && CurrentPath[next_number] == takepath[table.players[key].token_1]) {
						//hit key


						hitplayerId.push(key);
						hitplayerkey.push("1");
						hitcurrenttoken.push(table.players[key].token_1);
						table.players[key].token_1 = -1;

					}
				}





				if (table.players[key].token_2 != -1 && table.players[key].token_2 != staticValue.MaxValue) {




					Number = table.players[key].token_2 % 13;
					CurrentNumber = next_number % 13;
					if (CurrentNumber == Number && CurrentNumber != 0 && CurrentNumber != 8 && table.players[key].token_2 != next_number && CurrentPath[next_number] == takepath[table.players[key].token_2]) {
						//hit key

						hitplayerId.push(key);
						hitplayerkey.push("2");
						hitcurrenttoken.push(table.players[key].token_2);
						table.players[key].token_2 = -1;

					}
				}





				if (table.players[key].token_3 != -1 && table.players[key].token_3 != staticValue.MaxValue) {

					Number = table.players[key].token_3 % 13;
					CurrentNumber = next_number % 13;
					if (CurrentNumber == Number && CurrentNumber != 0 && CurrentNumber != 8 && table.players[key].token_3 != next_number && CurrentPath[next_number] == takepath[table.players[key].token_3]) {


						//hit key
						hitplayerId.push(key);
						hitplayerkey.push("3");
						hitcurrenttoken.push(table.players[key].token_3);
						table.players[key].token_3 = -1;

					}
				}



			}

		}

		///// hit token done

		//set winners

		let isconditiontrue = false;


		if (table.gameType == 12) {
			if (table.players[args.userId].token_0 == staticValue.MaxValue || table.players[args.userId].token_1 == staticValue.MaxValue || table.players[args.userId].token_2 == staticValue.MaxValue || table.players[args.userId].token_3 == staticValue.MaxValue) {
				isconditiontrue = true;
			}
		} else if (table.gameType == 13) {
			if (table.players[args.userId].token_0 == staticValue.MaxValue && table.players[args.userId].token_1 == staticValue.MaxValue && table.players[args.userId].token_2 == staticValue.MaxValue && table.players[args.userId].token_3 == staticValue.MaxValue) {
				isconditiontrue = true;
			}
		}

		let isgameover = false;

		if (isconditiontrue) {
			let winnerid = args.userId;

			table.players[args.userId].winner = true;

			table.lastwinnerno++;

			let winningno = 1;
			for (let ll in table.winners) {
				if (table.winners[ll].winningposition == winningno)
					winningno++;
			}



			var winneradd = {
				id: winnerid,
				name: table.players[winnerid].playerInfo.userName,
				status: "win",
				winningposition: winningno
			}

		
			table.winners.push(winneradd);
			table.players[winnerid].winner = true;


			
			//  table.winners[winnerid]  = winneradd;

			sio.to(args.tableId.toString()).emit("Winners", {
				winningposition: winningno,
				winnerid: winnerid

			});
			await gameAuditService.createAudit(table._id, "", table.lastGameId, table.players, "Winners", "", "", table.winners);
		
			await Table.update({
				_id: args.tableId
			}, {
				$set: {
					winners: table.winners,
					players: table.players
				},
			});



			if (table.gameType == 12) {
				if (table.players[args.userId].token_0 == staticValue.MaxValue || table.players[args.userId].token_1 == staticValue.MaxValue || table.players[args.userId].token_2 == staticValue.MaxValue || table.players[args.userId].token_3 == staticValue.MaxValue) {
					isgameover = true;

					let winnerid = args.userId;

					for (let player in table.players) {
						if (!table.players[player].winner && table.players[player].active) {

							winnerid = player
							let winningno = 4;

							if (table.maxPlayers == 4)
								winningno = 4;
							else
								winningno = 2;

							for (let ll in table.winners) {
								if (table.winners[ll].winningposition == winningno)
									winningno--;
							}

							var winneradd = {
								id: winnerid,
								name: table.players[winnerid].playerInfo.userName,
								status: "lost",
								winningposition: winningno
							}
							table.winners.push(winneradd);
						}
					}
				}
			} else {
				if (getActivePlayers(table.players) < 2) {

					let winnerid = args.userId;

					for (let player in table.players) {
						if (!table.players[player].winner && table.players[player].active)
							winnerid = player
					}
					let winningno = 4;

					if (table.maxPlayers == 4)
						winningno = 4;
					else
						winningno = 2;

					for (let ll in table.winners) {
						if (table.winners[ll].winningposition == winningno)
							winningno--;
					}

					var winneradd = {
						id: winnerid,
						name: table.players[winnerid].playerInfo.userName,
						status: "lost",
						winningposition: winningno
					}
					table.winners.push(winneradd);
					isgameover = true;

				}

			}


			if (isgameover) {

				table.turnplayerId = "";
				table = await CallShowwinnerApi(table);


			


				let tablll = JSON.parse(JSON.stringify(table));
				let playersss = tablll.players;

				for (let plll in playersss) {
					playersss[plll].playerInfo.chips = 0;
					playersss[plll].playerInfo.userName = "***";
				}
				tablll.players = playersss;



				sio.to(args.tableId.toString()).emit("ShowWinner", {
					table: tablll
				});
				await gameAuditService.createAudit(table._id, "", table.lastGameId, table.players, "ShowWinner", "", "", table.winners);

				ClearTimer(table._id);
				console.log("table update .. 16");
				await Table.update({
					_id: table._id
				}, {
					$set: {
						winners: [],
						turnplayerId: "",
						gameStarted: false,
						amount: 0
					},
				});

			
				startNewGame(client, table._id, sio);

			}

		}






		let tablll = JSON.parse(JSON.stringify(table));
		let playersss = tablll.players;

		for (let plll in playersss) {
			playersss[plll].playerInfo.chips = 0;
			playersss[plll].playerInfo.userName = "***";
		}
		tablll.players = playersss;



		sio.to(args.tableId.toString()).emit("performTokenDone", {
			table: tablll,
			args: args,
			num: current_dice_number,
			hitplayerId: hitplayerId,
			Curr_number: next_number,
			hitPlayertokenNo: hitcurrenttoken,
			hitplayerkey: hitplayerkey,
			path0: staticValue.path0,
			path1: staticValue.path1,
			path2: staticValue.path2,
			path3: staticValue.path3,
		});
		let jsondata = {
			args: args,
			num: current_dice_number,
			hitplayerId: hitplayerId,
			Curr_number: next_number,
			hitPlayertokenNo: hitcurrenttoken,
			hitplayerkey: hitplayerkey,
		}
		await gameAuditService.createAudit(table._id, args.userId, table.lastGameId, table.players, "performTokenDone", "HitPlayerId : " + hitplayerId, JSON.stringify(jsondata));
		console.log("table update .. 17");
		await Table.update({
			_id: args.tableId
		}, {
			$set: {
				players: table.players
			},
		});


		if (!isgameover) {

			if (getActivePlayers(table.players) >= 2) {

				let totalTokenDone = false;


				if (table.gameType == 12) {
					if (table.players[args.userId].token_0 == staticValue.MaxValue || table.players[args.userId].token_1 == staticValue.MaxValue || table.players[args.userId].token_2 == staticValue.MaxValue || table.players[args.userId].token_3 == staticValue.MaxValue) {
						totalTokenDone = true;
					}
				} else if (table.gameType == 13) {
					if (table.players[args.userId].token_0 == staticValue.MaxValue && table.players[args.userId].token_1 == staticValue.MaxValue && table.players[args.userId].token_2 == staticValue.MaxValue && table.players[args.userId].token_3 == staticValue.MaxValue) {
						totalTokenDone = true;
					}
				}




			

				if (totalTokenDone) {


					table.players = await getNextSlotForTurn(args.userId, table.players, args.tableId);
				
					table = await Table.findOne({
						_id: args.tableId
					});

					let tablll = JSON.parse(JSON.stringify(table));
					let playersss = tablll.players;

					for (let plll in playersss) {
						playersss[plll].playerInfo.chips = 0;
						playersss[plll].playerInfo.userName = "***";
					}
					tablll.players = playersss;



					sio.to(args.tableId.toString()).emit("ChangePlayerTurn", {
						table: tablll
					});


				
					SetTimer(table.turnplayerId, table._id, client, sio);


				} else if (current_dice_number != 6 && next_number != staticValue.MaxValue && hitplayerId == "") {
				
					table.players = await getNextSlotForTurn(args.userId, table.players, args.tableId);
					table = await Table.findOne({
						_id: args.tableId
					});


					let tablll = JSON.parse(JSON.stringify(table));
					let playersss = tablll.players;

					for (let plll in playersss) {
						playersss[plll].playerInfo.chips = 0;
						playersss[plll].playerInfo.userName = "***";
					}
					tablll.players = playersss;




					sio.to(args.tableId.toString()).emit("ChangePlayerTurn", {
						table: tablll
					});
					console.log("table update .. 18");
					await Table.update({
						_id: args.tableId
					}, {
						$set: {
							players: table.players,
						},
					});

					SetTimer(table.turnplayerId, table._id, client, sio);


				} else {

					await Table.update(
						{ _id:args.tableId},
						{
						  $set: {
							turnplayerId: args.userId,
							
						  },
						}
					  );

					table = await Table.findOne({
						_id: args.tableId
					});



					let tablll = JSON.parse(JSON.stringify(table));
					let playersss = tablll.players;

					for (let plll in playersss) {
						playersss[plll].playerInfo.chips = 0;
						playersss[plll].playerInfo.userName = "***";
					}
					tablll.players = playersss;


					sio.to(args.tableId.toString()).emit("ChangePlayerTurn", {
						table: tablll
					});
					SetTimer(table.turnplayerId, table._id, client, sio);
				}




			} else {

				ClearTimer(args.tableId);
				console.log("table update .. 19");
				await Table.update({
					_id: args.tableId
				}, {
					$set: {

						gameStarted: false,
						timer: 16
					},
				});

				
				startNewGame(client, args.tableId, sio);


			}



		}



	}
}
}


async function CallShowwinnerApi(table) {
	let players = table.players;
	let playerWinner = table.winners;

	console.warn("CallShowwinnerApi : ",new Date(),  " gI : ", table.lastGameId);
	let winningamount = table.amount;

	let commission  = Math.round( (winningamount * table.commission) / 100);

	let final_winning_amount = winningamount - commission;

	if(table.gameType == 13 && table.maxPlayers == 4)
	{
		let Settings = await Settings_Model.findOne({
			type: "ludo_winners"
		});
		let first =  Settings.values[0];
		let second =  Settings.values[1];
		let third =  Settings.values[2];
		let first_amount =  Math.round((final_winning_amount * first )/ 100 );
		let Second_amount = Math.round( (final_winning_amount * second )/ 100); 
		let Third_amount = Math.round( (final_winning_amount * third )/ 100) ;
	

		for (const position in playerWinner) {

			if (playerWinner[position].winningposition ==1) {
				
				let user = await User.findOne({
					_id: playerWinner[position].id
				});
		
				let uchips =Math.round( user.chips +first_amount);
	
				
				await User.update(
					{ _id: playerWinner[position].id },
					{ $set: { chips: uchips } ,
						$inc: {
						winLudo: first_amount
					  }
					}
				);
	
				if(players[playerWinner[position].id])
				players[playerWinner[position].id].playerInfo.chips= uchips;
			}


			
			if (playerWinner[position].winningposition ==2) {
				
				let user = await User.findOne({
					_id: playerWinner[position].id
				});
		
				let uchips = Math.round(user.chips +Second_amount);
	
				
				await User.update(
					{ _id: playerWinner[position].id },
					{ $set: { chips: uchips } ,
					$inc: {
					winLudo: Second_amount
				  }}
				);
	
				if(players[playerWinner[position].id])
				players[playerWinner[position].id].playerInfo.chips= uchips;
			}


			
			if (playerWinner[position].winningposition ==3) {
				
				let user = await User.findOne({
					_id: playerWinner[position].id
				});
		
				let uchips = Math.round(user.chips +Third_amount);
	
				
				await User.update(
					{ _id: playerWinner[position].id },
					{ $set: { chips: uchips }  ,
					$inc: {
					winLudo: Third_amount
				  }}
				);
	
				if(players[playerWinner[position].id])
				players[playerWinner[position].id].playerInfo.chips= uchips;
			}
		}

		
	}else{
		for (const position in playerWinner) {

			if (playerWinner[position].status == "win") {
				
				let user = await User.findOne({
					_id: playerWinner[position].id
				});
		
				let uchips = user.chips +final_winning_amount;
	
				
				await User.update(
					{ _id: playerWinner[position].id },
					{ $set: { chips: uchips } ,
					$inc: {
					winLudo: final_winning_amount
				  }}
				);
	
				players[playerWinner[position].id].playerInfo.chips= uchips;
			}
		}
	
	}



	


	// let Winnerss = [];

	// let tablePlayers = [];

	// let game = await Game.findOne({
	// 	_id: table.lastGameId
	// });
	// let gameplayers = game.players;

	// for (let gameplayerposition in gameplayers) {
	// 	let winnerstatus = "LOST";

	// 	let isplayerexist = false;
	// 	for (const position in playerWinner) {

	// 		if (gameplayers[gameplayerposition].id == playerWinner[position].id && gameplayers[gameplayerposition].active == true) {
	// 			isplayerexist = true;
				
	// 				if (playerWinner[position].status == "win") {
	// 					winnerstatus = "WON";
	// 					let sendplayerrss = {
	// 						playerId: gameplayers[gameplayerposition].playerInfo.userName,
	// 						playerResult: winnerstatus,
	// 						playerStatus: 'SEEN'
	// 					}
	// 					tablePlayers.push(sendplayerrss);

	// 					let winnerssss = {
	// 						playerId: gameplayers[gameplayerposition].playerInfo.userName,
	// 						rank: playerWinner[position].winningposition,
		
	// 					}
	// 					Winnerss.push(winnerssss);

	// 				} else {
	// 					let sendplayerrss = {
	// 						playerId: gameplayers[gameplayerposition].playerInfo.userName,
	// 						playerResult: winnerstatus,
	// 						playerStatus: 'SEEN'
	// 					}
	// 					tablePlayers.push(sendplayerrss);
	// 				}

				
	

	// 		}
	// 	}

	// 	if(isplayerexist == false)
	// 	{
	// 		let sendplayerrss = {
	// 			playerId: gameplayers[gameplayerposition].playerInfo.userName,
	// 			playerResult: winnerstatus,
	// 			playerStatus: 'SEEN'
	// 		}
	// 		tablePlayers.push(sendplayerrss);

	// 		// let winnerssss = {
	// 		// 	playerId: gameplayers[gameplayerposition].playerInfo.userName,
	// 		// 	rank: playerWinner[gameplayerposition].winningposition,
	// 		// }
	// 		// Winnerss.push(winnerssss);
	// 	}

	// }

/*

	let param = {
		roundId: game._id,
		tableCode: table._id,
		gameCategory: table.gameCategory,
		gameCode: game._id,
		gameName: table.gameName,
		totalAmount: table.amount,
		gameCommission: table.commission,
		providerCommission: table.provider_commission,
		description: "Ludo Initial amount",
		requestId: game._id,
		winners: Winnerss,
		tablePlayers: tablePlayers,
	};

	const ApiResponce = await thirdPartyAPICall.LudoWinner(param);


	let totalwinningamount = 0;
	for (let position in ApiResponce.data.data.usersAccount) {

		for (let player in players) {


			if (players[player].playerInfo.userName == ApiResponce.data.data.usersAccount[position].operatorId + ":" + ApiResponce.data.data.usersAccount[position].username) {

				let usersss = await User.findOne({
					userName: players[player].playerInfo.userName
				});
				let winningamount = ApiResponce.data.data.usersAccount[position].availableBalance - usersss.chips;

				totalwinningamount += winningamount;
				await User.update({
					_id: players[player].playerInfo._id
				}, {
					$set: {
						chips: ApiResponce.data.data.usersAccount[position].availableBalance
					}
				});
				players[player].playerInfo.chips = ApiResponce.data.data.usersAccount[position].availableBalance;
				
				


				Transactions.create({
					userName: usersss.userName,
					userId: mongoose.Types.ObjectId(usersss._id),
					receiverId: mongoose.Types.ObjectId(usersss._id),
					coins: winningamount,
					reason: 'Game',
					trans_type: 'win'
				});


				if (players[usersss._id].winner) {


					//  let winnerCardSet = players[usersss._id].cardSet.cards;
					// 		if(players[usersss._id].newSet) {
					// 			winnerCardSet = players[usersss._id].newSet;
					// 		}

					let amount = winningamount;

					// processTransaction(tableInfo, usersss._id, amount)




					await gameAuditService.createAudit(table._id, "", table.lastGameId, table.players, "Won", table.gameType, table.boot);


				}


			}

		}



	}

*/
table.winners = _.sortBy(table.winners, 'winningposition');
	table.players = players;
	await Table.update({
		_id: table._id
	}, {
		$set: {
		
			players: players,
			winners: table.winners,

			
		},
	});

	return table;


}




module.exports = {

	startNewGame,
	SetTimer,
	ClearTimer,

	LeavePlayer,
	performTokenDone
}