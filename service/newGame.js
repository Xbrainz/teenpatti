let _ = require("underscore");
let mongoose = require("mongoose");

let Table = require("../model/table");
let CardInfo = require("../model/cardInfo");
let Game = require("../model/game");
let User = require("../model/user");
let TransactionChalWin = require("../model/transactionChalWin");
const thirdPartyAPICall = require('../service/thirdPartyAPICall/thirdPartyAPICall');
let gameAuditService = require("../service/gameAudit");
let winnerService = require('../service/winner');
const socketClient = require('../service/socketClient');
let deck = require("./deck");
let {
	getNextActivePlayer
} = require("./common");
let gameType = require('../constant/gametype');
let transactionType = require('../constant/transactionType');
let auditType = require("../constant/audittype");
const audittype = require("../constant/audittype");
//let code = require("../lib/code");
//let userTableInOutService = require("../service/userTableInOut");
let startNewGameTime = {};
let startNewGamePlyerJoinTime = {};
//var PlayerTimer = {};
var PlayerTimeOut = {};

let Bot_Details = require('../model/bot_amounts');
let newGameService = require("../service/newGame");
//let newGameService = require("./newGame");

let playerService = require('../service/player');
let sideShowService = require('../service/sideShow');
let betService = require('../service/bet');



async function startNewGameOnPlayerJoin(client, tableId, avialbleSlots, args, sio) {


	let myTable1 = await Table.findOne({
		_id: tableId
	});
	let length = Object.keys(myTable1.players).length;



	console.log("starttt.. ");





	// if(length == 1 && !myTable1.gameInit && myTable1.tableSubType != "private" )
	// {
		
		socketClient.addanddeleteRobot(myTable1);
	

	//}

	

	
    // var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "teenpatti" });

	// console.log("logg", Bot_Detailssss);
    // if(Bot_Detailssss.onoff == "off" || myTable1.tableSubType == "private")
    // {
	// 	socketClient.addanddeleteRobot(myTable1);
	// }


	
	if (length >= 2 && !myTable1.gameInit) {
	
		await Table.update({
			_id: myTable1._id
		}, {
			$set: {
				gameInit: true
			}
		});


		
		var iscomputer = false;
		let playersssss = myTable1.players;
		for(let poss in playersssss)
		{
			if(playersssss[poss].playerInfo.isComputer == "yes")
			{
				iscomputer = true;
				break
			}
			
		}



		//	client.emit("gameCountDown", { counter: 10 });
		sio.to(tableId.toString()).emit("gameCountDown", {
			counter: 7
		});

		setTimeout(async function() {
			myTable1 = await Table.findOne({
				_id: myTable1._id
			});

			socketClient.addanddeleteRobot(myTable1);


		}, 5000);

		

		setTimeout(async function() {
			myTable1 = await Table.findOne({
				_id: myTable1._id
			});
			
			socketClient.addanddeleteRobot(myTable1);


		}, 8000);

		setTimeout(async function() {
			myTable1 = await Table.findOne({
				_id: myTable1._id
			});

			socketClient.addanddeleteRobot(myTable1);


		}, 10000);

		

	
	
		


		clearTimeout(startNewGameTime[tableId]);
		clearTimeout(startNewGamePlyerJoinTime[tableId]);
		startNewGamePlyerJoinTime[tableId] = setTimeout(async function() {
			let myTable = await Table.findOne({
				_id: tableId
			});
			let activePlayer = Object.keys(myTable.players).length;


			if (activePlayer >= 2 && !myTable.gameStarted) {
				await prepareStartGame(client, myTable, avialbleSlots, length, sio);
			} else if (myTable.players.length == 1 && !myTable.gameStarted) {


				client.emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
				sio.to(myTable._id.toString()).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
			}
		}, 7000);
	} else if (length == 1 && !myTable1.gameStarted) {
		client.emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
		sio.to(myTable1._id).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});


	}
}

async function startNewGame(client, tableId, avialbleSlots, sio) {

	await Table.update({
		_id: tableId
	}, {
		$set: {
			turnplayerId: ""
		}
	});






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

	
	


		if (playersTTT[player].disconnect || playersTTT[player].forcedisconnect || user.forcedisconnect) {

			//	await userTableInOutService.tableInOut(tableId, userId, 'Out');

			await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 7', 'Disconnect 7', 0, '', 0, '');

			let avialbleSlots = {};
			table.slotUsedArray.forEach(function(f) {
				avialbleSlots["slot" + f] = "slot" + f;
			});

			let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
			let tableInfo = await Table.findOne({
				_id: table._id
			});
			let players = tableInfo.players;

			let playersss03 =  JSON.parse(JSON.stringify(players));

			for(let plll in playersss03)
			{
				playersss03[plll].playerInfo.chips = 0;
				playersss03[plll].playerInfo.userName = "***";
			}

			let tablll03 =   JSON.parse(JSON.stringify(tableInfo));
			tablll03.players = [];

		

			sio.to(table._id.toString()).emit("playerLeft", {
				bet: {
					lastAction: "Packed",
					lastBet: "",
				},
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				players: playersss03,
				table: tablll03,
			});
			//  await User.update({ _id:removedPlayer.id }, { $set: {lasttableId : "" } });
		}



	}










	myTable1 = await Table.findOne({
		_id: tableId
	});











	
	ClearTimer(myTable1._id);

	let length = Object.keys(myTable1.players).length;
	
	// if(length == 1 && !myTable1.gameInit)
	// {
	// 	socketClient.joinTable(myTable1._id);
	// }

	// if(!myTable1.gameInit)
	// {
		socketClient.addanddeleteRobot(myTable1);
	//  }

	
    // var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "teenpatti" });

	// console.log("logg", Bot_Detailssss);
    // if(Bot_Detailssss.onoff == "off")
    // {
	// 	socketClient.disconnect(myTable1._id);
	// }

	if(length == 1 && !myTable1.gameInit && myTable1.tableSubType != "private")
	{
	

		socketClient.addanddeleteRobot(myTable1);

	}

	







	if (length >= 2 && !myTable1.gameInit) {

		await Table.update({
			_id: myTable1._id
		}, {
			$set: {
				gameInit: true
			}
		});

		



		sio.to(myTable1._id.toString()).emit("gameCountDown", {
			counter: 7
		});

		setTimeout(async function() {
			myTable1 = await Table.findOne({
				_id: myTable1._id
			});

			socketClient.addanddeleteRobot(myTable1);


		}, 5000);

		

		setTimeout(async function() {
			myTable1 = await Table.findOne({
				_id: myTable1._id
			});
			
			socketClient.addanddeleteRobot(myTable1);


		}, 8000);

	
		

		startNewGameTime[tableId] = setTimeout(async function() {
			let myTable = await Table.findOne({
				_id: tableId
			});
			let activePlayer = Object.keys(myTable.players).length;



			if (activePlayer >= 2 && !myTable.gameStarted) {
				socketClient.addanddeleteRobot(myTable);
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
				let sentObj = {
					players: myTable.players,
					table: myTable,
				};
				client.emit("resetTable", sentObj);
				sio.to(myTable._id.toString()).emit("resetTable", sentObj);
			}
		}, 7000);
	} else if (length == 1) {



		await Table.update({
			_id: myTable1._id
		}, {
			$set: {
				turnplayerId: ""
			}
		});
		client.emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});
		sio.to(myTable1._id.toString()).emit("notification", {
			message: "Please wait for more players to join",
			timeout: 4000,
		});

		let sentObj = {
			players: myTable1.players,
			table: myTable1,
		};
		client.emit("resetTable", sentObj);
		sio.to(myTable1._id.toString()).emit("resetTable", sentObj);
	}
}

async function prepareStartGame(client, table, avialbleSlots, playersleft, sio) {




	let playersTTT = table.players;
	

	for (let player in playersTTT) {

		var userId = playersTTT[player].id;
		var user = await User.findOne({
			_id: userId
		});

	
		if (playersTTT[player].disconnect || playersTTT[player].forcedisconnect || user.forcedisconnect) {

			//	await userTableInOutService.tableInOut(tableId, userId, 'Out');

			await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 77', 'Disconnect 77', 0, '', 0, '');

			let avialbleSlots = {};
			table.slotUsedArray.forEach(function(f) {
				avialbleSlots["slot" + f] = "slot" + f;
			});
			let lasttableiddd = user.lasttableId;
			let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
			let tableInfo = await Table.findOne({
				_id: table._id
			});
			let players = tableInfo.players;

			let playersss333 = JSON.parse(JSON.stringify(players));
 
			for(let plll in playersss333)
			{
				playersss333[plll].playerInfo.chips = 0;
				playersss333[plll].playerInfo.userName = "***";
			}

			let tablll333 = JSON.parse(JSON.stringify(tableInfo));
			tablll333.players = [];

		

			sio.to(table._id.toString()).emit("playerLeft", {
				bet: {
					lastAction: "Packed",
					lastBet: "",
				},
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				players: playersss333,
				table: tablll333,
			});


			

			if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0 && lasttableiddd != table._id) {

				var lasttable = await Table.findOne({
					_id: lasttableiddd
				});

				if (lasttable.players != null && lasttable.players[user._id] && lasttableiddd != table._id) {

				
					let table = lasttable;
					let player = user;
					if (table.players != null && table.players[player._id] && table.players[player._id].disconnect) {
						let userId = player._id;
						let tableId = table._id

						let user = await User.findOne({
							_id: userId
						});
						await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 777', 'Disconnect 777', 0, '', 0, '');

						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(f) {
							avialbleSlots["slot" + f] = "slot" + f;
						});

						let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
						await User.update({
							_id: user.id
						}, {
							$set: {
								isplaying: "no"
							}
						});
						tableInfo = await Table.findOne({
							_id: table._id
						});
						let players = tableInfo.players;
						let slot = getActivePlayers(players);

						let playersss444 =JSON.parse(JSON.stringify(players));

						for(let plll in playersss444)
						{
							playersss444[plll].playerInfo.chips = 0;
							playersss444[plll].playerInfo.userName = "***";
						}

						let tablll444 = JSON.parse(JSON.stringify(tableInfo));
						tablll444.players = [];


					
						sio.to(table._id.toString()).emit("playerLeft", {
							bet: {
								lastAction: "Packed",
								lastBet: "",
							},
							removedPlayer: removedPlayer,
							placedBy: removedPlayer.id,
							players: playersss444,
							table: tablll444,
						});


						//args
						let playerLength = getActivePlayers(players);
						if (playerLength == 1 && tableInfo.gameStarted) {
				
							

							
							winnerService.decideWinner(tableInfo,tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
								tableInfo.turnplayerId = "";

								// client.emit("showWinner", {
								// 	message,
								// 	bet: {
								// 		lastAction: "Packed",
								// 		lastBet: "",
								// 	},
								// 	placedBy: removedPlayer.id,
								// 	players: players1,
								// 	table: tableInfo,
								// 	packed: true,
								// 	activePlayerCount: 1,
								// });

								let playersss01 =  JSON.parse(JSON.stringify(players1));

								for(let plll in playersss01)
								{
									playersss01[plll].playerInfo.chips = 0;
									playersss01[plll].playerInfo.userName = "***";
								}

								let tablll01 =  JSON.parse(JSON.stringify(tableInfo));
								tablll01.players = [];

								


								sio.to(tableInfo._id.toString()).emit("showWinner", {
									message,
									bet: {
										lastAction: "Packed",
										lastBet: "",
									},
									placedBy: removedPlayer.id,
									players: playersss01,
									table: tablll01,
									packed: true,
									activePlayerCount: 1,
								});
								//args

							
							
								ClearTimer(tableInfo._id.toString());
								await Table.update({
									_id: tableInfo._id.toString()
								}, {
									$set: {
										gameInit: false,
										gameStarted: false,
										slotUsed: 1,
										amount: 0,
										players: players1,
										turnplayerId: ""
									},
								});
								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});
							

								startNewGame(client, table._id.toString(), avialbleSlots, sio);
							});
						
						} else if (playerLength == 1 && !tableInfo.gameStarted) {
						
							ClearTimer(tableInfo._id.toString());
							// client.emit("notification", {
							// 	message: "Please wait for more players to join",
							// 	timeout: 4000,
							// });
							sio.to(tableInfo._id).emit("notification", {
								message: "Please wait for more players to join",
								timeout: 4000,
							});
							let sentObj = {
								players,
								table: tableInfo
							};
							await Table.update({
								_id: tableInfo._id
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									slotUsed: 1,
									players: players,
									turnplayerId: ""
								},
							});

							let avialbleSlots = {};
							tableInfo.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});
							

								startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);


						} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
					
							ClearTimer(tableInfo._id.toString());
							await Table.update({
								_id: tableInfo._id.toString()
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									slotUsed: 0,
									players: {},
									turnplayerId: ""
								},
							});

							
						}

					}

				}

			}




			//  await User.update({ _id:removedPlayer.id }, { $set: {lasttableId : "" } });
		}



	}


	table = await Table.findOne({
		_id: table._id
	});
	playersTTT = table.players;

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


console.log("new round start 1");

		let length = Object.keys(playersTTT).length;

	
			// console.warn("disconnecttttt that robot 1 ... ", length);
			// if(length >= 3 )
			// {
			// 	console.warn("that robot");
			// 	socketClient.disconnect(myTable1._id);
			// }

		if (length >= 2) {
			console.log("new round start 3");
			let game = await Game.create({
				tableId: table._id
			});
			await gameAuditService.createAudit(table._id, '', '', game._id, auditType.NEW_ROUND, 0, 0, 0, '', 'New Round start', table.amount, playersTTT, 0, '');




					let cardInfo = await startGame(table, avialbleSlots, game);
					table = await Table.findOne({
						_id: table._id
					});


					let cardssss = [{
						"type": "club",
						"rank": 9,
						"name": "9",
						"priority": 9,
						"id2" : "2345",
						"id": 0.288935780696173
					},
					{
						"type": "diamond",
						"rank": 11,
						"name": "J",
						"priority": 11,
						"id2" : "23451",
						"id": 0.134925588193503
					},
					{
						"type": "diamond",
						"rank": 5,
						"name": "5",
						"priority": 5,
						"id2" : "23452",
						"id": 0.506731457736256
					}
				];

				
					
	// if (players["650b06e54c13f3898c6d9cda"] != undefined) {
	// 	players["650b06e54c13f3898c6d9cda"].cards = cardssss;
	// 	cardsInfo["650b06e54c13f3898c6d9cda"].cards = cardssss;
	// }


	// if (players["650b06d64c13f3898c6d9cc3"] != undefined) {
	// 	players["650b06d64c13f3898c6d9cc3"].cards = cardssss;
	// 	cardsInfo["650b06d64c13f3898c6d9cc3"].cards = cardssss;
	// }

	let players = table.players;

	// for (let player in players) {
	// 	if (players[player].active) {
			
	// 		cardInfo[players[player].id].cards = cardssss;
	// 	}
	// }




					let joker = cardInfo.joker;
					let jokers = cardInfo.jokers;
					delete cardInfo.jokers;
					delete cardInfo.joker;
					cardInfo = await CardInfo.create({
						tableId: table._id,
						info: cardInfo,
						joker,
						jokers
					});

					game.cardInfoId = cardInfo._id;
					game.players = table.players
					await Game.update({
						_id: game._id
					}, {
						$set: game
					});

					table.cardinfoId = cardInfo._id;
					table.lastGameId = game._id;
					table.playersleft = playersleft;


					
					let isanyturn = false;
					let firstplayerid = "";
				
			


					for (let player in players) {
						if (isActivePlayerforseemycard(player, players))
							firstplayerid = player;
						players[player].cardInfo = cardInfo._id;
						
						// await gameAuditService.createAudit(table._id, cardInfo._id, players[player].id, game._id, auditType.CARDS, 0, 0, players[player].playerInfo.chips, '', '', table.amount, table.players, 0, '');

						await gameAuditService.createAudit(table._id, cardInfo._id, players[player].id, game._id, auditType.CARDS, 0, 0, players[player].playerInfo.chips, 'Client_IP:' +players[player].playerInfo.clientIp , '' , table.amount, table.players, 0, '');

						if (players[player].turn)
							table.turnplayerId = player

							let randomm = parseInt( Math.random() * (4 - 1) + 1);
							table.players[player].maxbotSeen = randomm;

							let mxxx = parseInt( Math.random() * (17 - 5) + 5);
							table.players[player].maxRound = mxxx;
							
							table.players[player].blindcount = 0;

					}

					if (table.turnplayerId == "") {
					
						players[firstplayerid].turn = true;
						table.turnplayerId = firstplayerid;
						
					}


					console.log("new round start 89  ");



					let slorrrr = [1, 2, 3, 4, 5];
					for (var playeraaa in players) {
						let slotttofplayer = players[playeraaa].slot;
						var slotuu = slotttofplayer.slice(-1);;
						for (var i = 0; i < slorrrr.length; i++) {
							if (slorrrr[i] == slotuu) {
								slorrrr.splice(i, 1);
							}
						}
					}
					//	await Table.update({ _id: myTable._id }, { $set: {slotUsedArray: slorrrr  } });

					table.slotUsedArray = slorrrr;
					let isrand = parseInt( Math.random() * (5 - 2) + 2);
					table.maxRound = isrand
					await Table.update({
						_id: table._id
					}, {
						$set: table
					});

					let tablleee = await Table.findOne({
						_id: table._id
					});


				
				
					var playersss02 = JSON.parse(JSON.stringify(tablleee.players)); 
				
				
					for(let plll in playersss02)
					{
						playersss02[plll].playerInfo.chips = 0;
						playersss02[plll].playerInfo.userName = "***";
					}
					
					
					var tablll02 = JSON.parse(JSON.stringify(tablleee)); 

					 tablll02.players = [];
					
					let sentObj = {
						players: playersss02,
						table: tablll02,
						joker,
						jokers
					};

					if (getActivePlayers(tablleee.players) > 1) {

						console.log("new round start 8  ");
						ClearTimer(table._id);
					
						sio.to(table._id.toString()).emit("startNew", sentObj);


						let playersTTT = tablleee.players;

						for (let player in playersTTT) {

							userId = playersTTT[player].id;
							let user = await User.findOne({
								_id: userId
							});
							if (playersTTT[player].disconnect || playersTTT[player].forcedisconnect || user.forcedisconnect) {




								//	await userTableInOutService.tableInOut(tableId, userId, 'Out');

								await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 9', 'Disconnect 9', 0, '', 0, '');

								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(f) {
									avialbleSlots["slot" + f] = "slot" + f;
								});

								let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
								let tableInfo = await Table.findOne({
									_id: table._id
								});
								let players = tableInfo.players;

								let playersss03 =  JSON.parse(JSON.stringify(players)); 

								for(let plll in playersss03)
								{
									playersss03[plll].playerInfo.chips = 0;
									playersss03[plll].playerInfo.userName = "***";
								}
			
								let tablll03 =  JSON.parse(JSON.stringify(tableInfo)); 
								tablll03.players = [];

								

								sio.to(table._id.toString()).emit("playerLeft", {
									bet: {
										lastAction: "Packed",
										lastBet: "",
									},
									removedPlayer: removedPlayer,
									placedBy: removedPlayer.id,
									players: playersss03,
									table: tablll03,
								});



								let playerLength = getActivePlayers(players);



								if (playerLength == 1 && tableInfo.gameStarted) {
							
									winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
										tableInfo.turnplayerId = "";
										// client.emit("showWinner", {
										//   message,
										//   bet: {
										// 	lastAction: "Packed",
										// 	lastBet: "",
										//   },
										//   placedBy: removedPlayer.id,
										//   players: players,
										//   table: tableInfo,
										//   packed: true,
										//   activePlayerCount: 1,
										// });


										let playersss04 = JSON.parse(JSON.stringify(players)); 

										for(let plll in playersss04)
										{
											playersss04[plll].playerInfo.chips = 0;
											playersss04[plll].playerInfo.userName = "***";
										}
					
										let tablll04 =  JSON.parse(JSON.stringify(tableInfo)); 
										tablll04.players = [];

										


										sio.to(tableInfo._id.toString()).emit("showWinner", {
											message,
											bet: {
												lastAction: "Packed",
												lastBet: "",
											},
											placedBy: removedPlayer.id,
											players: playersss04,
											table: tablll04,
											packed: true,
											activePlayerCount: 1,
										});

									
										ClearTimer(tableInfo._id);
										await Table.update({
											_id: tableInfo._id
										}, {
											$set: {
												gameInit: false,
												gameStarted: false,
												slotUsed: 1,
												amount: 0,
												players: players,
												turnplayerId: "",
											},
										});
										let avialbleSlots = {};
										table.slotUsedArray.forEach(function(d) {
											avialbleSlots["slot" + d] = "slot" + d;
										});
									
										startNewGame(client, tableInfo._id, avialbleSlots, sio);
									});
								} else if (playerLength && !tableInfo.gameStarted) {
								
									ClearTimer(tableInfo._id);
									await Table.update({
										_id: tableInfo._id
									}, {
										$set: {
											turnplayerId: ""
										}
									});
									client.emit("notification", {
										message: "Please wait for more players to join",
										timeout: 4000,
									});
									sio.to(tableInfo._id.toString()).emit("notification", {
										message: "Please wait for more players to join",
										timeout: 4000,
									});
									let sentObj = {
										players,
										table: tableInfo
									};
									client.emit("resetTable", sentObj);
									sio.to(tableInfo._id.toString()).emit("resetTable", sentObj);
								} else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {
								
									ClearTimer(tableInfo._id);
									await Table.update({
										_id: tableInfo._id
									}, {
										$set: {
											gameStarted: false,
											slotUsed: 0,
											players: {},
											turnplayerId: "",
										},
									});
								}

							}

						}






						//	client.in(table._id).emit("startNew", sentObj);
						//	io.sockets.in
						//	client.in(table._id).emit("startNew", sentObj);
						if (table.gameType != 1) {
							SetTimer(table.turnplayerId, table._id, client, sio, 18000,false,"","fromstart");
						}

						


						if (table.gameType == 1) {

							setTimeout(async function() {
							
								let showPlayerId = "";

								let show = true;
								table = await Table.findOne({
									_id: table._id
								});



								if (table.gameStarted) {


									winnerService.decideWinner(table, table.players, table.cardinfoId, show, showPlayerId, async function(winmsg, players3) {
										let msg = winmsg;

										table.turnplayerId = "";
										// client.emit("showWinner", {
										// 	message: msg,
										// 	bet: show,
										// 	placedBy: showPlayerId,
										// 	players: players3,
										// 	table: table,

										// });

										let playersss05 = JSON.parse(JSON.stringify(players3)); 

										for(let plll in playersss05)
										{
											playersss05[plll].playerInfo.chips = 0;
											playersss05[plll].playerInfo.userName = "***";
										}
					
										let tablll05 = JSON.parse(JSON.stringify(table)); 

										tablll05.players = [];


										sio.to(table._id.toString()).emit("showWinner", {
											message: msg,
											bet: show,
											placedBy: showPlayerId,
											players: playersss05,
											table: tablll05,

										});

										await Table.update({
											_id: table._id
										}, {
											$set: {
												amount: 0,
												gameInit: false,
												gameStarted: false,
												players: players3,
												turnplayerId: ""
											}
										});

										let avialbleSlots = {};
										table.slotUsedArray.forEach(function(d) {
											avialbleSlots["slot" + d] = "slot" + d;
										});
									
										ClearTimer(table._id);
									
										startNewGame(client, table._id, avialbleSlots, sio);

									});
								}

							}, 10000);


							
						}
					} else {
						await Table.update({
							_id: table._id
						}, {
							$set: {
								gameStarted: false,
								slotUsed: 1,
								players: players,
								turnplayerId: "",
							},
						});
					}



		} else {
			await Table.update({
				_id: table._id
			}, {
				$set: {
					gameInit: false,
					gameStarted: false,

					turnplayerId: "",
				},
			});
		}

	}

}

async function startGame(table, avialbleSlots, game) {
	cardsInfo = {};
	let oldTablee = await Table.findOne({
		_id: table._id
	});
	await resetTable(table);
	let players = await resetAllPlayers(table.players);
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
	players = decideDeal(players, avialbleSlots, tablee.maxPlayers);
	players = await decideTurn(players, avialbleSlots, tablee.maxPlayers, oldTablee.players, tablee._id);

	tablee.gameStarted = true;
	tablee.isShowAvailable = Object.keys(players).length === 2;
	tablee.isSideShowAvailable = true;




	await collectBootAmount(tablee, players, game);
	tablee = await Table.findOne({
		_id: tablee._id
	});
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
	await Table.update({
		_id: myTable._id
	}, {
		$set: {
			boot: iBoot,
			lastBet: lastBet,
			lastBlind: true,
			showAmount: true,
			amount: 0,
			turnplayerId: "",
			betRoundCompleted: 0
		},
	});
};

async function resetAllPlayers(players) {
	let allPlayers = [];

	for (let player in players) {
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
			jackpot_avail: false,
			isSideShowAvailable: false,
			lastBet: '',
			lastAction: '',
			change_dealer: false,
			cardSet: {
				closed: true,
			},
			noOfTurn: 0,
			totalChalAmount: 0,
			cardSeen: false
		},
	}, );

	for (let player in players) {
		delete players[player].winner;
		players[player].turn = false;
		players[player].active = true;
		players[player].show = false;
		players[player].packed = false;
		players[player].idle = false;
		players[player].jackpot_avail = false;
		players[player].idle_amount = 0;

		players[player].isSideShowAvailable = false;
		players[player].cardSet = {
			closed: true,
		};
		players[player].lastBet = '';
		players[player].lastAction = 'Boot';
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

async function decideTurn(players, avialbleSlots, maxPlayer, oldPlayers, tableId) {
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
			await Table.update({
				_id: tableId
			}, {
				$set: {
					turnplayerId: firstPlayer
				},
			});
		} else {
			let nextPlayer = getNextActivePlayer(dealPlayer.id, players, avialbleSlots, maxPlayer)
			players[nextPlayer.id].turn = true;
			await Table.update({
				_id: nextPlayer.id
			}, {
				$set: {
					turnplayerId: firstPlayer
				},
			});
		}
	} else {
		let nextPlayer = [];
		nextPlayer = getNextActivePlayer(winPlayer.id, players, avialbleSlots, maxPlayer)
		players[nextPlayer.id].turn = true;
		await Table.update({
			_id: nextPlayer.id
		}, {
			$set: {
				turnplayerId: firstPlayer
			},
		});
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
			players[player].lastAction = 'Boot';
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
					$inc: {
							lostTp: iBoot,
							gameTp : 1
					}
                }
            );
			

			let tableData = await Table.findOne({
				_id: tableInfo._id
			});
			await gameAuditService.createAudit(tableInfo._id, '', players[player].id, game._id, audittype.ANTE, 0, 0, players[player].playerInfo.chips, '', '', tableData.amount, tableData.players, 0, '');
		}
	}

	await Table.update({
		_id: tableInfo._id
	}, {
		$set: {
			amount: bootAmount,
			players: players,
			gameStarted: true
		},
	});
}

function distributeCards(players, table) {
	let cardsInfo = {};
	deck.shuffle();
	deck.shuffle();
	deck.shuffle();
	let deckCards = deck.getCards(),
		index = 0;
	let noOfCards = 3;
	if (table.gameType == gameType.FourCard) {
		noOfCards = 4;
	}
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
		index++;
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



async function SetTimer(userId, tableId, client, sio, timeouttime = 16000, issideshow = false, playerid = "",from = "fff") {
	//timeouttime = 16000000;
	let tablee = await Table.findOne({
		_id: tableId
	},{turnTime : 1	});

	console.warn("timer : : : " + tablee.turnTime);
	await Table.update({
		_id: tableId
	}, {
		timer: tablee.turnTime 
	});



	ClearTimer(tableId.toString());
	ClearTimer(tableId);
	let tabletimer ;

	if(from == "fromstart")
	{
		tabletimer =  tablee.turnTime  - 5;
	}else{
		tabletimer =  tablee.turnTime  - 3;
	}


	
	PlayerTimeOut[tableId] = setInterval(async function() {

		let tablee = await Table.findOne({
			_id: tableId
		});
		console.log("table Id : : : " + tableId);
		let timer = tablee.timer - 1;
		let objectLength = Object.keys(PlayerTimeOut).length

		console.log("timer .. ",timer );
	
		await Table.update({
			_id: tableId
		}, {
			timer: timer
		});


		if(timer == tabletimer)
		{
			console.log("is computer player ? ");
			socketClient.iscomputerplayer(tablee,issideshow);
		}



		if (timer <= 0) {
			console.log("is computer player nottttt time outtt");
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


			if (issideshow) {

				let table = tablee;

				let playerss = resetSideShowTurn(table.players);
				await Table.update({
					_id: tableId
				}, {
					$set: {
						players: playerss
					}
				});


				if (playerss[userId] != null) {
					let avialbleSlots = {};
					table.slotUsedArray.forEach(function(d) {
						avialbleSlots["slot" + d] = "slot" + d;
					});
					let players1 = table.players,
						msg = "";
					let playerss = resetSideShowTurn(players1);


					let players3 = await playerService.setNextPlayerTurn(playerss, avialbleSlots, table._id);

				

					let players = sideShowDenied(playerid, players3);


					let remark = "with " + players[userId].playerInfo.userName
				await	gameAuditService.createAudit(table._id, table.cardinfoId, playerid, table.lastGameId, auditType.USER_TURN, 0, 0, players[playerid].playerInfo.chips, 'Denied', remark, table.amount, players, 0, '');

					await Table.update({
						_id: tableId
					}, {
						$set: {
							players: players
						}
					});
					table = await Table.findOne({
						_id: table._id
					});
					let bet = {

					}
					msg = [
						"denied side show",
					].join("");


					let playersss06 = JSON.parse(JSON.stringify(players)); 

					for(let plll in playersss06)
					{
						playersss06[plll].playerInfo.chips = 0;
						playersss06[plll].playerInfo.userName = "***";
					}

					let tablll06 =  JSON.parse(JSON.stringify(table)); 
					tablll06.players = [];

					table = await Table.findOne({
						_id: table._id
					});
					players = table.players;




					client.emit("sideShowResponded", {
						message: msg,
						placedBy: playerid,
						players: playersss06,
						placeTo: userId,
						bet: bet,
						table: tablll06,
					});
					sio.to(table._id.toString()).emit("sideShowResponded", {
						message: msg,
						bet: bet,
						placeTo: userId,
						placedBy: playerid,
						players: playersss06,
						table: tablll06,
					});

					for (let posi in players) {
						if (players[posi].turn == true) {
							SetTimer(players[posi].id, tableId, client, sio);
						
						}

					}

				}


			} else {

			//	console.warn("::::::::::::::::::::::::::conti packkk :11 : ", players[id].contipack);
				if (tablee.players && tablee.players[userId] && tablee.players[userId].disconnect) {
				//	console.warn("::::::::::::::::::::::::::conti packkk :66 : ", players[id].contipack);
				
					let Endgameobj = {
						id: userId,
						userName: tablee.players[userId].playerInfo.userName,
						message: "Internet Disconnected"
					};
					client.emit("EndGame", Endgameobj);
					sio.to(tablee._id.toString()).emit("EndGame", Endgameobj);

					let table = tablee;


					let user = await User.findOne({
						_id: userId
					});
					//   await userTableInOutService.tableInOut(tableId, userId, 'Out');

					await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 10', 'Disconnect 10', 0, '', 0, '');

					let avialbleSlots = {};
					table.slotUsedArray.forEach(function(f) {
						avialbleSlots["slot" + f] = "slot" + f;
					});

					if (table.gameStarted && isActivePlayer(user.id, table.players)) {
						let maxPlayers = 5;
						let players1 = await betService.packPlayer(user.id, table.players, avialbleSlots, maxPlayers, table);
						table = await Table.findOne({
							_id: table._id
						});
						let removedPlayer = await playerService.removePlayer(user.id, players1, avialbleSlots, table.slotUsedArray, table);
						await User.update({
							_id: user.id
						}, {
							$set: {
								isplaying: "no"
							}
						});

						//  await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });
						let tableInfo = await Table.findOne({
							_id: table._id
						});
						let players = tableInfo.players;
						if (getActivePlayers(players) < 2) {
							_.map(players, function(player) {
								player.turn = false;
								return player;
							});
						}

						
						let playersss07 =  JSON.parse(JSON.stringify(players)); 

						for(let plll in playersss07)
						{
							playersss07[plll].playerInfo.chips = 0;
							playersss07[plll].playerInfo.userName = "***";
						}

						let tablll07 =  JSON.parse(JSON.stringify(tableInfo)); 
						tablll07.players = [];

					


						client.emit("playerLeft", {
							bet: {
								lastAction: "Packed",
								lastBet: "",
							},
							removedPlayer: removedPlayer,
							placedBy: removedPlayer.id,
							players: playersss07,
							table: tablll07,
						});

						sio.to(table._id.toString()).emit("playerLeft", {
							bet: {
								lastAction: "Packed",
								lastBet: "",
							},
							removedPlayer: removedPlayer,
							placedBy: removedPlayer.id,
							players: playersss07,
							table: tablll07,
						});

						for (let posi in players) {
							if (players[posi].turn == true) {
							
								SetTimer(players[posi].id, tableInfo._id, client, sio);
							}
						}



						let playerLength = getActivePlayers(players);



						if (playerLength == 1 && tableInfo.gameStarted) {
						
							winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
								tableInfo.turnplayerId = "";
								//  client.emit("showWinner", {
								//    message,
								//    bet: {
								// 	 lastAction: "Packed",
								// 	 lastBet: "",
								//    },
								//    placedBy: removedPlayer.id,
								//    players: players,
								//    table: tableInfo,
								//    packed: true,
								//    activePlayerCount : 1,
								//  });

								let playersss08 = JSON.parse(JSON.stringify(players)); 

									for(let plll in playersss08)
									{
										playersss08[plll].playerInfo.chips = 0;
										playersss08[plll].playerInfo.userName = "***";
									}

									let tablll08 = JSON.parse(JSON.stringify(tableInfo)); 
									tablll08.players = [];


									


								sio.to(table._id.toString()).emit("showWinner", {
									message,
									bet: {
										lastAction: "Packed",
										lastBet: "",
									},
									placedBy: removedPlayer.id,
									players: playersss08,
									table: tablll08,
									packed: true,
									activePlayerCount: 1,
								});


								await Table.update({
									_id: tableInfo._id
								}, {
									$set: {
										gameInit: false,
										gameStarted: false,
										slotUsed: 1,
										amount: 0,
										players: players,
										turnplayerId: "",
									},
								});
								let avialbleSlots = {};
								tableInfo.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});
							
								ClearTimer(tableInfo._id);
							
								startNewGame(client, tableInfo._id, avialbleSlots, sio);



								let useriddd;
								for (let poooo in players)
									useriddd = players[poooo].id;


								table = await Table.findOne({
									_id: tableInfo._id
								});

								if (table.players != null && table.players[useriddd].disconnect) {

									let userId = useriddd;
									let tableId = table._id


									let user = await User.findOne({
										_id: userId
									});
									//  await userTableInOutService.tableInOut(tableId, userId, 'Out');

									await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 11', 'Disconnect 11', 0, '', 0, '');

									let avialbleSlots = {};
									table.slotUsedArray.forEach(function(f) {
										avialbleSlots["slot" + f] = "slot" + f;
									});

									let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
									await User.update({
										_id: user.id
									}, {
										$set: {
											isplaying: "no"
										}
									});

									let tableInfo = await Table.findOne({
										_id: table._id
									});
									let players = JSON.parse(JSON.stringify(tableInfo.players));
									let slot = getActivePlayers(players);
									//	  await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });


									let playersss09 = JSON.parse(JSON.stringify(players));

									for(let plll in playersss09)
									{
										playersss09[plll].playerInfo.chips = 0;
										playersss09[plll].playerInfo.userName = "***";
									}

									let tablll09 = JSON.parse(JSON.stringify(tableInfo));
									tablll09.players = [];

								


									sio.to(table._id.toString()).emit("playerLeft", {
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										removedPlayer: removedPlayer,
										placedBy: removedPlayer.id,
										players: playersss09,
										table: tablll09,
									});



								}


							});













						} else if (playerLength == 1 && !tableInfo.gameStarted) {

						
							ClearTimer(tableInfo._id);
							await Table.update({
								_id: tableInfo._id
							}, {
								$set: {
									turnplayerId: ""
								}
							});
							//    client.emit("notification", {
							// 	 message:
							// 	   "Please wait for more players to join",
							// 	 timeout: 4000,
							//    });
							sio.to(table._id.toString()).emit("notification", {
								message: "Please wait for more players to join",
								timeout: 4000,
							});
							let sentObj = {
								players,
								table: tableInfo
							};
							client.emit("resetTable", sentObj);
							sio.to(table._id.toString()).emit("resetTable", sentObj);
						} else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {

						
							ClearTimer(table._id);
							await Table.update({
								_id: table._id
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									slotUsed: 0,
									players: {},
									turnplayerId: "",
								},
							});
						}
					} else {
						let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
						await User.update({
							_id: user.id
						}, {
							$set: {
								isplaying: "no"
							}
						});
						var tableInfo = await Table.findOne({
							_id: table._id
						});
						let players = tableInfo.players;
						let slot = getActivePlayers(players);
						//     await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });

						let playersss1 = JSON.parse(JSON.stringify(players));

						for(let plll in playersss1)
						{
							playersss1[plll].playerInfo.chips = 0;
							playersss1[plll].playerInfo.userName = "***";
						}

						let tablll1 = JSON.parse(JSON.stringify(tableInfo));
						tablll1.players = [];

					


						sio.to(table._id.toString()).emit("playerLeft", {
							bet: {
								lastAction: "Packed",
								lastBet: "",
							},
							removedPlayer: removedPlayer,
							placedBy: removedPlayer.id,
							players: playersss1,
							table: tablll1,
						});
						let playerLength = getActivePlayers(players);
						if (playerLength == 1 && tableInfo.gameStarted) {
						
							winnerService.decideWinner(tableInfo, tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
								tableInfo.turnplayerId = "";
								//  client.emit("showWinner", {
								//    message,
								//    bet: {
								// 	 lastAction: "Packed",
								// 	 lastBet: "",
								//    },
								//    placedBy: removedPlayer.id,
								//    players: players1,
								//    table: tableInfo,
								//    packed: true,
								//    activePlayerCount : 1,
								//  });


								
								let playersss2 = JSON.parse(JSON.stringify(players1));

								for(let plll in playersss2)
								{
									playersss2[plll].playerInfo.chips = 0;
									playersss2[plll].playerInfo.userName = "***";
								}

								let tablll2 =  JSON.parse(JSON.stringify(tableInfo));
								tablll2.players = [];

							



								sio.to(table._id.toString()).emit("showWinner", {
									message,
									bet: {
										lastAction: "Packed",
										lastBet: "",
									},
									placedBy: removedPlayer.id,
									players: playersss2,
									table: tablll2,
									packed: true,
									activePlayerCount: 1,
								});

							
								ClearTimer(tableInfo._id);
								await Table.update({
									_id: table._id
								}, {
									$set: {
										gameInit: false,
										gameStarted: false,
										slotUsed: 1,
										amount: 0,
										players: players1,
										turnplayerId: "",
									},
								});
								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});
							
								startNewGame(client, table._id, avialbleSlots, sio);
							});
						} else if (playerLength == 1 && !tableInfo.gameStarted) {
							//    client.emit("notification", {
							// 	 message:
							// 	   "Please wait for more players to join",
							// 	 timeout: 4000,
							//    });
							sio.to(tableInfo._id.toString()).emit("notification", {
								message: "Please wait for more players to join",
								timeout: 4000,
							});
							let sentObj = {
								players,
								table: tableInfo
							};
							await Table.update({
								_id: tableInfo._id
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									slotUsed: 1,
									players: players,
									turnplayerId: "",
								},
							});
							let avialbleSlots = {};
							tableInfo.slotUsedArray.forEach(function(d) {
								avialbleSlots["slot" + d] = "slot" + d;
							});
							startNewGame(client, tableInfo._id, avialbleSlots, sio);
						} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
							await Table.update({
								_id: table._id
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									slotUsed: 0,
									players: {},
									turnplayerId: "",
								},
							});

							let avialbleSlots = {};
							table.slotUsedArray.forEach(function(d) {
								avialbleSlots["slot" + d] = "slot" + d;
							});
							startNewGame(client, table._id, avialbleSlots, sio);
						}
					}
				} else if (tablee.players && tablee.players[userId]) {
					let avialbleSlots = {};
					tablee.slotUsedArray.forEach(function(d) {
						avialbleSlots["slot" + d] = "slot" + d;
					});

					let contipck = tablee.players[userId].contipack + 1;
					tablee.players[userId].contipack = contipck;
				//	console.warn("::::::::::::::::::::::::::conti packkk :22 : ", players[id].contipack);
					tablee.players = await betService.packPlayer(userId, tablee.players, avialbleSlots, tablee.maxPlayers, tablee);


					tablee = await Table.findOne({
						_id: tablee._id
					});




					if (tablee.players[userId].contipack >= 3) {

						let Endgameobj = {
							id: tablee.players[userId].id,
							userName: tablee.players[userId].playerInfo.userName,
							message: "You're idle in game"
						};

						//  client.emit("EndGame", Endgameobj); 
						sio.to(tablee._id.toString()).emit("EndGame", Endgameobj);



						setTimeout(async function() {

							var table = await Table.findOne({
								_id: tablee._id
							});

							if (table.players[userId]) {


								//	let userId = table.players[userId].id;
								let tableId = table._id


								let user = await User.findOne({
									_id: userId
								});
								//await userTableInOutService.tableInOut(tableId, userId, 'Out');

								await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 5', 'Disconnect 5', 0, '', 0, '');

								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(f) {
									avialbleSlots["slot" + f] = "slot" + f;
								});

								let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
								let tableInfo = await Table.findOne({
									_id: table._id
								});
								let players = tableInfo.players;
								let slot = getActivePlayers(players);

								let playersss5 = JSON.parse(JSON.stringify(players));

								for(let plll in playersss5)
								{
									playersss5[plll].playerInfo.chips = 0;
									playersss5[plll].playerInfo.userName = "***";
								}

								let tablll5 = JSON.parse(JSON.stringify(tableInfo));
								tablll5.players = [];

								

								sio.to(table._id.toString()).emit("playerLeft", {
									bet: {
										lastAction: "Packed",
										lastBet: "",
									},
									removedPlayer: removedPlayer,
									placedBy: removedPlayer.id,
									players: playersss5,
									table: tablll5,
								});
							}
						}, 2000);


					}



					await gameAuditService.createAudit(tablee._id, tablee.cardinfoId, userId, tablee.lastGameId, auditType.USER_TURN, 0, 0, tablee.players[userId].playerInfo.chips, 'Pack', 'Packed 4', tablee.amount, tablee.players, 0, '');


					let bet = {
						action: "Packed",
						amount: 0,
						show: false,
						tableId: tableId,
						blind: false
					}


					if (getActivePlayers(tablee.players) < 2 && tablee.gameStarted) {

						winnerService.decideWinner(tablee, tablee.players, tablee.cardinfoId, false, "", async function(message, players3) {

							tablee.turnplayerId = "";

							let playersss6 = JSON.parse(JSON.stringify(players3));

							for(let plll in playersss6)
							{
								playersss6[plll].playerInfo.chips = 0;
								playersss6[plll].playerInfo.userName = "***";
							}

							let tablll6 = JSON.parse(JSON.stringify(tablee));
							tablll6.players = [];

						


							client.emit("playerPacked", {
								bet: bet,
								placedBy: userId,
								players: playersss6,
								table: tablll6,
							});

							sio.to(tablee._id.toString()).emit("playerPacked", {
								bet: bet,
								placedBy: userId,
								players: playersss6,
								table: tablll6,
							});

							//    client.emit("showWinner", {
							// 	 message,
							// 	 bet: bet,
							// 	 placedBy: userId,
							// 	 players: players3,
							// 	 table: tablee,
							// 	 packed: true,
							// 	 activePlayerCount : 1,
							//    });

							sio.to(tablee._id.toString()).emit("showWinner", {
								message,
								bet: bet,
								placedBy: userId,
								players: playersss6,
								table: tablll6,
								packed: true,
								activePlayerCount: 1,
							});

							await Table.update({
								_id: tablee._id
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									players: players3,
									amount: 0,
									turnplayerId: ""
								}
							});
						
							ClearTimer(tablee._id);
						
							let avialbleSlots = {};
							tablee.slotUsedArray.forEach(function(d) {
								avialbleSlots["slot" + d] = "slot" + d;
							});
							startNewGame(client, tablee._id, avialbleSlots, sio);
						});
					} else {

						let playersss7 =  JSON.parse(JSON.stringify(tablee.players));

						for(let plll in playersss7)
						{
							playersss7[plll].playerInfo.chips = 0;
							playersss7[plll].playerInfo.userName = "***";
						}

						let tablll7 =  JSON.parse(JSON.stringify(tablee));
						tablll7.players = [];

					
					


						client.emit("playerPacked", {
							bet: bet,
							placedBy: userId,
							players: playersss7,
							table: tablll7,
						});
						sio.to(tablee._id.toString()).emit("playerPacked", {
							bet: bet,
							placedBy: userId,
							players: playersss7,
							table: tablll7,
						});

						for (let posi in tablee.players) {
							if (tablee.players[posi].turn == true) {
								ClearTimer(tablee._id);
								SetTimer(tablee.players[posi].id, tablee._id, client, sio);
							
							}
						}
					}
				}



			}



		}

	}, 1000);

	/*

		var PlayerTim = setTimeout(async function() {
			
			 console.log("Settimer......endddddd " + userId);
			 let user = await User.findOne({ _id: userId });
			 let tablee = await Table.findOne({ _id: tableId });
			 
			 await Table.update(
				{ _id: tableId },
				{ timer: 16  }
			  );
			  
			 clearInterval( PlayerTimeOut[tableId]);
		
			 
			 if(issideshow)
			 {
				
				let table = tablee;
				
				 let playerss = resetSideShowTurn(table.players);
				  await Table.update(
	              { _id: tableId },
	              { $set: { players: playerss } }
	            );
				
				
				if(playerss[userId] != null)
				{
	          let avialbleSlots = {};
	          table.slotUsedArray.forEach(function (d) {
	            avialbleSlots["slot" + d] = "slot" + d;
	          });
	          let players1 = table.players, msg = "";
	          let playerss = resetSideShowTurn(players1);
			  
			  
				let players3 = await playerService.setNextPlayerTurn(playerss, avialbleSlots, table._id);
				console.log("end side showwwww");
			//	console.log(players3);
			//	console.log(players3[playerid]);

				let players = sideShowDenied(playerid, players3);
			
				
	            let remark = "with "+ players[userId].playerInfo.userName
	             gameAuditService.createAudit(table._id, table.cardinfoId, playerid, table.lastGameId, auditType.USER_TURN, 0, 0, players[playerid].playerInfo.chips, 'Denied', remark, table.amount, players, 0, '');
	            
	            await Table.update(
	              { _id: tableId },
	              { $set: { players: players } }
	            );
				table = await Table.findOne({ _id: table._id });
				let bet = {
					
				}
	            msg = [
	              
	              "denied side show",
	            ].join("");
	            client.emit("sideShowResponded", {
	              message: msg,
	              placedBy: playerid,
	              players: players,
	              placeTo: userId,
	              bet: bet,
	              table: table,
	            });
	            sio.to(table._id.toString()).emit("sideShowResponded", {
	              message: msg,
	              bet: bet,
	              placeTo: userId,
	              placedBy: playerid,
	              players: players,
	              table: table,
	            });
				
				 for(let posi in players)
				 {
					 if(players[posi].turn == true)
					 {
						SetTimer(players[posi].id,tableId,client,sio);
						console.log("settimer ... 7");
					 }
						
				 }
				
				}

				
			 }else
			 {
			 
			 
			  if(tablee.players && tablee.players[userId] && tablee.players[userId].disconnect )
	              {
					  let Endgameobj = {
									id: userId,
									userName : tablee.players[userId].playerInfo.userName,
									message: "Internet Disconnected"
								  };
								client.emit("EndGame", Endgameobj);
								sio.to(tablee._id.toString()).emit("EndGame", Endgameobj);
								
					  	let table = tablee;
					  console.log("nowwwww  disconnect perform");
	            
					 let user = await User.findOne({ _id: userId });
	             //   await userTableInOutService.tableInOut(tableId, userId, 'Out');

	                await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 10', 'Disconnect 10', 0, '', 0, '');

	                let avialbleSlots = {};
	                table.slotUsedArray.forEach(function (f) {
	                  avialbleSlots["slot" + f] = "slot" + f;
	                });
	                
	                if (table.gameStarted && isActivePlayer(user.id, table.players)) {
	                  let maxPlayers = 5;
	                  let players1 = await betService.packPlayer(user.id, table.players, avialbleSlots, maxPlayers, table);
					  table = await Table.findOne({ _id: table._id });
	                  let removedPlayer = await playerService.removePlayer(user.id, players1, avialbleSlots, table.slotUsedArray, table);
					  await User.update({ _id:user.id }, { $set: { isplaying: "no"} });

	                //  await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });
	                  let tableInfo = await Table.findOne({ _id: table._id });
	                  let players = tableInfo.players;
	                  if (getActivePlayers(players) < 2) {
	                    _.map(players, function (player) {
	                      player.turn = false;
	                      return player;
	                    });
	                  }
					  client.emit("playerLeft", {
	                    bet: {
	                      lastAction: "Packed",
	                      lastBet: "",
	                    },
	                    removedPlayer: removedPlayer,
	                    placedBy: removedPlayer.id,
	                    players: players,
	                    table: tableInfo,
	                  });
					  
	                  sio.to(table._id.toString()).emit("playerLeft", {
	                    bet: {
	                      lastAction: "Packed",
	                      lastBet: "",
	                    },
	                    removedPlayer: removedPlayer,
	                    placedBy: removedPlayer.id,
	                    players: players,
	                    table: tableInfo,
	                  });

					  for (let posi in players) {
						if (players[posi].turn == true)
						{
							console.log("settimer ...8");
						 SetTimer(players[posi].id, tableInfo._id,client, sio);
					  }
					  }


				
	                  let playerLength = getActivePlayers(players);
	                  
	                  console.log("playerLength============================================",playerLength);

	                  if (playerLength == 1 && tableInfo.gameStarted) {
						  	  console.log("decide winner1111111111111111......2" );
	                    winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function (message, players) {
							tableInfo.turnplayerId  = "";
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
	                      sio.to(table._id.toString()).emit("showWinner", {
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
						  
						  
	                      await Table.update({ _id: tableInfo._id }, {
	                        $set: {
	                          gameStarted: false,
	                          slotUsed: 1,
							    amount : 0,
	                          players: players,turnplayerId  : "",
	                        },
	                      });
	                      let avialbleSlots = {};
	                      tableInfo.slotUsedArray.forEach(function (d) {
	                        avialbleSlots["slot" + d] = "slot" + d;
	                      });
						  console.log("ClearTimer  13 : " + tableInfo.id +  " " + tableInfo.lastGameId); 
						   ClearTimer(tableInfo._id);
						   console.log("?????????????????????????new game????????????????????????  1");
	                      startNewGame(client, tableInfo._id, avialbleSlots,sio);
	                  



						  console.log("last player outttttt....");

						let useriddd ;
						for(let poooo in players)
							useriddd = players[poooo].id;

						
						table = await Table.findOne({ _id: tableInfo._id });

						if (table.players != null && table.players[useriddd].disconnect)
						{
							
						  let userId = useriddd;
						  let tableId = table._id
						
						
						  let user = await User.findOne({ _id: userId });
						//  await userTableInOutService.tableInOut(tableId, userId, 'Out');
						  
						  await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 11', 'Disconnect 11', 0, '', 0, '');
						  
						  let avialbleSlots = {};
						  table.slotUsedArray.forEach(function (f) {
						  avialbleSlots["slot" + f] = "slot" + f;
						  });
						  
						  let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
	    await User.update({ _id:user.id }, { $set: { isplaying: "no"} });

						  let tableInfo = await Table.findOne({ _id: table._id });
						  let players = tableInfo.players;
						  let slot = getActivePlayers(players);
					//	  await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });
						  sio.to(table._id.toString()).emit("playerLeft", {
							bet: {
							  lastAction: "Packed",
							  lastBet: "",
							},
							removedPlayer: removedPlayer,
							placedBy: removedPlayer.id,
							players: players,
							table: tableInfo,
							});
					   


						}


					});













	                  } else if (playerLength == 1 && !tableInfo.gameStarted) {

						console.log("ClearTimer  14 : " + tableInfo.id +  " " + tableInfo.lastGameId); 
						ClearTimer(tableInfo._id);
						await Table.update({ _id: tableInfo._id }, { $set: { turnplayerId  : ""} });
	                    client.emit("notification", {
	                      message:
	                        "Please wait for more players to join",
	                      timeout: 4000,
	                    });
	                    sio.to(table._id.toString()).emit("notification", {
	                      message:
	                        "Please wait for more players to join",
	                      timeout: 4000,
	                    });
	                    let sentObj = { players, table: tableInfo };
	                    client.emit("resetTable", sentObj);
	                    sio.to(table._id.toString()).emit("resetTable", sentObj);
	                  } else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {

						console.log("ClearTimer  15 : " + table.id +  " " + table.lastGameId); 
						ClearTimer(table._id);
	                    await Table.update({ _id: table._id }, {
	                      $set: {
	                        gameStarted: false,
	                        slotUsed: 0,
	                        players: {},turnplayerId  : "",
	                      },
	                    });
	                  } 
	                } else {
	                  let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
					  await User.update({ _id:user.id }, { $set: { isplaying: "no"} });
	                  let tableInfo = await Table.findOne({ _id: table._id });
	                  let players = tableInfo.players;
	                  let slot = getActivePlayers(players);
	             //     await Table.update({ _id: table._id }, { $inc: { playersLeft: -1 } });
	                  
	                  sio.to(table._id.toString()).emit("playerLeft", {
	                    bet: {
	                      lastAction: "Packed",
	                      lastBet: "",
	                    },
	                    removedPlayer: removedPlayer,
	                    placedBy: removedPlayer.id,
	                    players: players,
	                    table: tableInfo,
	                  });
	                  let playerLength = getActivePlayers(players);
	                  if (playerLength == 1 && table.gameStarted) {
						  console.log("decide winner1111111111111111......1 " );
	                    winnerService.decideWinner(table, players, table.cardinfoId, false, "", async function (message, players1) {
							tableInfo.turnplayerId  = "";
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
	                      sio.to(table._id.toString()).emit("showWinner", {
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
						  console.log("ClearTimer  16 : " + tableInfo.id +  " " + tableInfo.lastGameId); 
					ClearTimer(tableInfo._id);
	                      await Table.update({ _id: table._id }, {
	                        $set: {
	                          gameStarted: false,
	                          slotUsed: 1,
							    amount : 0,
	                          players: players1,turnplayerId  : "",
	                        },
	                      });
	                      let avialbleSlots = {};
	                      table.slotUsedArray.forEach(function (d) {
	                        avialbleSlots["slot" + d] = "slot" + d;
	                      });
						  console.log("?????????????????????????new game????????????????????????  2");
	                      startNewGame(client, table._id, avialbleSlots,sio);
	                    });
	                  } else if (playerLength == 1 && !tableInfo.gameStarted) {
	                    client.emit("notification", {
	                      message:
	                        "Please wait for more players to join",
	                      timeout: 4000,
	                    });
	                    sio.to(tableInfo._id.toString()).emit("notification", {
	                      message:
	                        "Please wait for more players to join",
	                      timeout: 4000,
	                    });
	                    let sentObj = { players, table: tableInfo };
	                    await Table.update({ _id: tableInfo._id }, {
	                      $set: {
	                        gameStarted: false,
	                        slotUsed: 1,
	                        players: players,turnplayerId  : "",
	                      },  
	                    });
	                  } else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
	                    await Table.update({ _id: table._id }, {
	                      $set: {
	                        gameStarted: false,
	                        slotUsed: 0,
	                        players: {},turnplayerId  : "",
	                      },
	                    });
	                  }    
	                }
	              }
	           
			   
	      
	         else if(tablee.players && tablee.players[userId])
	          {
	            let avialbleSlots = {};
	            tablee.slotUsedArray.forEach(function (d) {
	              avialbleSlots["slot" + d] = "slot" + d;
	            });
	            
				tablee.players = await betService.packPlayer(userId, tablee.players, avialbleSlots, tablee.maxPlayers, tablee);

				tablee = await Table.findOne({ _id: tablee._id });
				
			//	tablee.players[userId].contipack = 3;

		//	console.log(tablee.players[userId].contipack + "   continussss packkkkkkkk");
				if(tablee.players[userId].contipack >=3)
				{
			
				//	console.log("Player removed from game 3 packed");
					let Endgameobj = {
					id: tablee.players[userId].id,
						userName :tablee.players[userId].playerInfo.userName,
					message: "You're idle in game"
					};

					client.emit("EndGame", Endgameobj); 
					sio.to(tablee._id.toString()).emit("EndGame", Endgameobj);



					setTimeout(async function() {
						
						 table = await Table.findOne({ _id: tablee._id });

						if(table.players[userId])
						{


					//	let userId = table.players[userId].id;
						let tableId = table._id
					  
						
						let user = await User.findOne({ _id: userId });
						//await userTableInOutService.tableInOut(tableId, userId, 'Out');
						
						await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 5', 'Disconnect 5', 0, '', 0, '');
						
						let avialbleSlots = {};
						table.slotUsedArray.forEach(function (f) {
						avialbleSlots["slot" + f] = "slot" + f;
						});
						
						let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
						let tableInfo = await Table.findOne({ _id: table._id });
						let players = tableInfo.players;
						let slot = getActivePlayers(players);
					   
						sio.to(table._id.toString()).emit("playerLeft", {
						  bet: {
							lastAction: "Packed",
							lastBet: "",
						  },
						  removedPlayer: removedPlayer,
						  placedBy: removedPlayer.id,
						  players: players,
						  table: tableInfo,
						  });
						}
					}, 2000);


				}
				
	            gameAuditService.createAudit(tablee._id, tablee.cardinfoId, userId, tablee.lastGameId, auditType.USER_TURN, 0, 0, tablee.players[userId].playerInfo.chips, 'Pack', 'Packed', tablee.amount, tablee.players, 0, '');
	            
				//	  console.log("decide winner1111111111111111......8000 "  + tablee.gameStarted );		
					  
					  let bet = {
						  action : "Packed",
						  amount : 0,
						  show : false,
						  tableId : tableId,
						  blind : false
					  }
					  
					  
	            if (getActivePlayers(tablee.players) < 2 && tablee.gameStarted) {
	          //      console.log('inside if '+ getActivePlayers(players));   
	              winnerService.decideWinner(tablee, tablee.players, tablee.cardinfoId, false, "", async function (message, players3) {
					
					tablee.turnplayerId  = "";
	                client.emit("playerPacked", {
	                  bet:bet,
	                  placedBy: userId,
	                  players: players3,
	                  table: tablee,
	                });

	                sio.to(tablee._id.toString()).emit("playerPacked", {
	                  bet: bet,
	                  placedBy:userId,
	                  players:players3,
	                  table: tablee,
	                });

	                client.emit("showWinner", {
	                  message,
	                  bet: bet,
	                  placedBy: userId,
	                  players: players3,
	                  table: tablee,
	                  packed: true,
	                  activePlayerCount : 1,
	                });

	                sio.to(tablee._id.toString()).emit("showWinner", {
	                  message,
	                  bet: bet,
	                  placedBy: userId,
	                  players: players3,
	                  table: tablee,
	                  packed: true,
	                  activePlayerCount : 1,
	                });

	                await Table.update({ _id: tablee._id }, { $set: { gameStarted: false, players: players3,amount : 0 ,turnplayerId  : ""} });
					console.log("ClearTimer  1  : " + tablee.id +  " " + tablee.lastGameId);     
					ClearTimer(tablee._id);
					console.log("?????????????????????????new game????????????????????????  3");      
	                startNewGame(client, tablee._id, avialbleSlots,sio);
	              });
	            } else {
			//		console.log('inside else '+ getActivePlayers(players));
			
	              client.emit("playerPacked", {
	                bet: bet,
	                placedBy:userId,
	                players: tablee.players,
	                table: tablee,
	              });
	              sio.to(tablee._id.toString()).emit("playerPacked", {
	                bet: bet,
	                placedBy: userId,
	                players: tablee.players,
	                table: tablee,
	              });
				  
				  for(let posi in  tablee.players)
						 {
							 if( tablee.players[posi].turn == true)
							 {
								 SetTimer( tablee.players[posi].id ,tablee._id,client,sio );
								 console.log("settimer ... 9");
								}
						 }
	            }
	          }
			  
			  
			  
			 }
			  
			
			
			
		}, timeouttime);
		PlayerTimer[tableId] = PlayerTim;
	*/









}




function ClearTimer(tableId) {
	//	var timername = playertimer + tableId;
	//clearTimeout(PlayerTimer[tableId]);
	//	clearTimeout(PlayerTimer[tableId]);
	//	clearTimeout(PlayerTimer[tableId]);
	//	clearTimeout(PlayerTimer[tableId]);

	clearInterval(PlayerTimeOut[tableId]);

	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);
	clearInterval(PlayerTimeOut[tableId]);


}

function resetSideShowTurn(players) {
	for (let player in players) {
		players[player].sideShowTurn = false;
	}
	return players;
}


function getActivePlayersWithoutRobo(players) {
	let count = 0;
	for (let player in players) {
		if (players[player].active && !players[player].packed && !players[player].idle) {
			count++;
		}
	}
	return count;
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

function sideShowDenied(id, players) {
	players[id].lastAction = "Denied";
	return players;
}

function isActivePlayer(id, players) {
	return players[id] && players[id].active;
}

function isActivePlayerforseemycard(player, players) {
	return players[player] && players[player].active && !players[player].packed && !players[player].idle;
}

async function SwitchTables(tableId, client, sio) {

	setTimeout(async function() {

		var table = await Table.findOne({
			_id: tableId
		});

		if (table.tableSubType != "private" && (table.gameType == 0 || table.gameType == 10 || table.gameType == 4 || table.gameType == 2 || table.gameType == 5 || table.gameType == 6 )) {

			var playersTTT = table.players;
			for (let player in playersTTT) {

				var userId = playersTTT[player].id;
				let user = await User.findOne({
					_id: userId
				});

			
				if (playersTTT[player].disconnect || playersTTT[player].forcedisconnect || user.forcedisconnect) {

					await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 24', 'Disconnect 24', 0, '', 0, '');

					let avialbleSlots = {};
					table.slotUsedArray.forEach(function(f) {
						avialbleSlots["slot" + f] = "slot" + f;
					});

					let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
					let tableInfo = await Table.findOne({
						_id: table._id
					});
					let players = tableInfo.players;

					let playersss8 =JSON.parse(JSON.stringify(players));

					for(let plll in playersss8)
					{
						playersss8[plll].playerInfo.chips = 0;
						playersss8[plll].playerInfo.userName = "***";
					}

					let tablll8 =   JSON.parse(JSON.stringify(tableInfo));
					tablll8.players = [];

				
					sio.to(table._id.toString()).emit("playerLeft", {
						bet: {
							lastAction: "Packed",
							lastBet: "",
						},
						removedPlayer: removedPlayer,
						placedBy: removedPlayer.id,
						players: playersss8,
						table: tablll8,
					});

				}

			}


			table = await Table.findOne({
				_id: tableId
			});
		

			let arrtable = await Table.aggregate([
				{	$project: {
					"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
					PlayerCount: {$size: {"$objectToArray": "$players"}},
				}},
				{	$match: {
						tableSubType: "public",
						boot: table.boot,
						gameType: table.gameType,
						GameStatus: 1,
						PlayerCount: { $in: [1, 2, 3, 4] },
						_id: { $ne: new mongoose.Types.ObjectId(tableId) }
				}},
				
				{	$sample: {size: 3} }
			]);




		


			if (arrtable.length == 0) {
				arrtable = await Table.aggregate([
					{	$project: {
							"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
							PlayerCount: {$size: {"$objectToArray": "$players"}},
					}},
					{	$match: {
							tableSubType: "public",
							boot: table.boot,
							gameType: table.gameType,
							_id: { $ne: new mongoose.Types.ObjectId(tableId)},
							GameStatus: 1,
							PlayerCount: { $in: [0,1, 2, 3, 4] }
					}},
					{	$sample: {size: 1} }
				]);

			}

		

			let playerlength = getoriginalActivePlayers(table.players);




			if (playerlength == 5) {
				var user1 = Object.keys(table.players)[0],
					user2 = Object.keys(table.players)[2],
					user3 = Object.keys(table.players)[3];
				if (arrtable.length >= 3) {
					let ttttt = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});

					if (ttttt.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user1, table, client, sio);


					let ttttt1 = await Table.findOne({
						_id: arrtable[1]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt1.playersLeft < 5)
						await ChangePlayerTable(arrtable[1], user2, table, client, sio);
					else
						await ChangePlayerTable(arrtable[2], user2, table, client, sio);



					let ttttt2 = await Table.findOne({
						_id: arrtable[2]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt2.playersLeft < 5)
						await ChangePlayerTable(arrtable[2], user3, table, client, sio);
					else
						await ChangePlayerTable(arrtable[0], user3, table, client, sio);




				} else if (arrtable.length == 2) {


					let ttttt1 = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt1.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user1, table, client, sio);



					let ttttt2 = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt2.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user2, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user2, table, client, sio);



					await ChangePlayerTable(arrtable[1], user3, table, client, sio);




				} else if (arrtable.length == 1) {
					await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					await ChangePlayerTable(arrtable[0], user2, table, client, sio);
					await ChangePlayerTable(arrtable[0], user3, table, client, sio);
				}
			} else if (playerlength == 4) {
				var user1 = Object.keys(table.players)[0],
					user2 = Object.keys(table.players)[2],
					user3 = Object.keys(table.players)[3];
				if (arrtable.length >= 3) {

					let ttttt1 = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt1.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user1, table, client, sio);


					let ttttt2 = await Table.findOne({
						_id: arrtable[1]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt2.playersLeft < 5)
						await ChangePlayerTable(arrtable[1], user2, table, client, sio);
					else
						await ChangePlayerTable(arrtable[2], user2, table, client, sio);






				} else if (arrtable.length == 2) {
					let ttttt1 = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt1.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user1, table, client, sio);



					let ttttt2 = await Table.findOne({
						_id: arrtable[1]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt2.playersLeft < 5)
						await ChangePlayerTable(arrtable[1], user2, table, client, sio);
					else
						await ChangePlayerTable(arrtable[0], user2, table, client, sio);




				} else if (arrtable.length == 1) {
					await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					await ChangePlayerTable(arrtable[0], user2, table, client, sio);

				}
			} else if (playerlength == 3) {
				var user1 = Object.keys(table.players)[0],
					user2 = Object.keys(table.players)[2];
				if (arrtable.length >= 3) {

					let ttttt2 = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt2.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user1, table, client, sio);




				} else if (arrtable.length == 2) {
					let ttttt2 = await Table.findOne({
						_id: arrtable[0]._id
					}, {
						"playersLeft": 1,
						_id: 0
					});
					if (ttttt2.playersLeft < 5)
						await ChangePlayerTable(arrtable[0], user1, table, client, sio);
					else
						await ChangePlayerTable(arrtable[1], user1, table, client, sio);



				} else if (arrtable.length == 1) {

					await ChangePlayerTable(arrtable[0], user1, table, client, sio);

				}
			} else if (playerlength == 2) {

			}



		}

	}, 4000);


}

async function ChangePlayerTable(tableLe, userId, table, client, sio) {

	//console.warn("change table : : ", tableLe);
	//4x table
//	tableLe = "6364cdc43ee315891d4d25e5";

	//tenpatti table
//	tableLe = "627f312e4e9490eb556a4e5b";
 //   console.warn("tableLe",tableLe);
	
	table = await Table.findOne({
		_id: table._id
	});
	var tableLength = await Table.findOne({
		_id: tableLe._id
	});

//	console.log("ChangePlayerTable  ", tableLe, "user Id : ", userId);
	let playersLength;
	if (tableLength.players == null) {
		playersLength = 0;
	} else {
		playersLength = Object.keys(tableLength.players).length;
	}
	var user ;
	if (playersLength < 5) {

		if (table.players[userId]) {
			
			 user = await User.findOne({
				_id: userId
			});

		

			await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 22', 'Disconnect 22', 0, '', 0, '');

			let avialbleSlots = {};
			table.slotUsedArray.forEach(function(f) {
				avialbleSlots["slot" + f] = "slot" + f;
			});

			let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
			let tableInfo = await Table.findOne({
				_id: table._id
			});
			let players = tableInfo.players;

			let playersss9 =  JSON.parse(JSON.stringify(players));

			for(let plll in playersss9)
			{
				playersss9[plll].playerInfo.chips = 0;
				playersss9[plll].playerInfo.userName = "***";
			}

			let tablll9 =  JSON.parse(JSON.stringify(tableInfo));
			tablll9.players = [];

			


			sio.to(table._id.toString()).emit("playerLeft", {
				bet: {
					lastAction: "Packed",
					lastBet: "",
				},
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				players: playersss9,
				table: tablll9,
			});


		}



		let sit = 0;

		await User.update({
			_id: userId
		}, {
			$set: {
				lasttableId: tableLength._id,
				tableId: tableLength._id,
				clientId: client.id
			}
		});

		tableLength = await Table.findOne({
			_id: tableLength._id
		});
		user = await User.findOne({
			_id: userId
		});
		user.userId = user._id;
		user.clientId = client.id;
		//for sit in given slot
		sit = 5;
		

	

		if (tableLength.players == null || tableLength.players[user._id] == null || tableLength.players[user._id] == undefined) {

			let daaataaa = {
				chips : user.chips,
				userName : user.userName,
				displayName  : getDotDotName(user.displayName),
				Decrole : user.Decrole,
				deviceType : user.deviceType,
				clientIp : user.clientIp,
				profilePic : user.profilePic,
				_id : user._id,
				isComputer: user.isComputer
			  }

			let player = {
				id: user._id.toString(),
				cardSet: {
					closed: true,
				},
				playerInfo: daaataaa,
			};
			
			await playerService.addPlayer(tableLength, player, client, sit, async function(addedPlayer, avialbleSlots, myTable) {

				
				if (addedPlayer == null) {



					let tablesss = await Table.aggregate([
										{	$project: {
												"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
												PlayerCount: {$size: {"$objectToArray": "$players"}},
										}},
										{	$match: {
												tableSubType: "public",
												boot: table.boot,
												gameType: table.gameType,
												
												_id: { $ne: new mongoose.Types.ObjectId( table._id.toString())},
												GameStatus: 1,
												PlayerCount: { $in: [1, 2, 3, 4] }
										}},
										{	$sample: {size: 1} }
									]);


					if (tablesss.length == 0) {
						tablesss = await Table.aggregate([
							{	$project: {
									"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
									PlayerCount: {$size: {"$objectToArray": "$players"}},
							}},
							{	$match: {
									tableSubType: "public",
									boot: table.boot,
									gameType: table.gameType,
									_id: { $ne: new mongoose.Types.ObjectId( table._id.toString())},
									GameStatus: 1,
									PlayerCount: { $in: [0,1, 2, 3, 4] }
							}},
							{	$sample: {size: 1} }
						]);

					}
					if (tablesss.length > 0)
						await ChangePlayerTable(tablesss[0], userId, table, client, sio);



				



				} else {


					if (addedPlayer != null) {


						tableLength = myTable;

						await gameAuditService.createAudit(tableLength._id, '', user._id, tableLength.lastGameId, auditType.JOIN_TABLE, 0, 0, addedPlayer.playerInfo.chips, '', " switch table", 0, tableLength.players, 0, '');


						let playersss10 =JSON.parse(JSON.stringify(myTable.players));

						for(let plll in playersss10)
						{
							playersss10[plll].playerInfo.chips = 0;
							playersss10[plll].playerInfo.userName = "***";
						}

						let tablll10 =  JSON.parse(JSON.stringify(myTable));
						tablll10.players = [];

					

						
						let newPlayer = {

							id: user._id,
							tableId: myTable._id,
							slot: addedPlayer.slot,
							turn: false,
							active: addedPlayer.active,
							winner: null,
							packed: addedPlayer.packed,

							//    playerInfo: args,
							lastAction: "",
							lastBet: "",
							cardSet: addedPlayer.cardSet,
							otherPlayers: playersss10,
							table: tablll10,
						};



						console.log("robot. new.................................................1 .. " + playersLength);
						if (playersLength === 1) {
							socketClient.joinTable(myTable._id,myTable.boot);
						} 

						sio.to(table._id.toString()).emit("ChangeTable", newPlayer);
						sio.to(myTable._id.toString()).emit("tableJoined", newPlayer);
						sio.to(myTable._id.toString()).emit("newPlayerJoined", newPlayer);

						let tableGG = await Table.findOne({
							_id: myTable._id
						});
						try{
							tableGG.players[userId].disconnect = true;
						}catch(error)
						{

						}
					
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
								slotUsedArray: slorrrr,
								players:tableGG.player
							}
						});

					

					//	console.warn("changhe table doneeee...................");

						startNewGameOnPlayerJoin(client, myTable._id, avialbleSlots, tableLength._id, sio);



					}

				}
			});
		}

	} else {




		




		let tablesss = await Table.aggregate([
			{	$project: {
					"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
					PlayerCount: {$size: {"$objectToArray": "$players"}},
			}},
			{	$match: {
					tableSubType: "public",
					boot: table.boot,
					gameType: table.gameType,
					_id: { $ne: new mongoose.Types.ObjectId( table._id.toString())},
					GameStatus: 1,
					PlayerCount: { $in: [1, 2, 3, 4] }
			}},
			{	$sample: {size: 1} }
		]);


		if (tablesss.length == 0) {
			tablesss = await Table.aggregate([
				{	$project: {
						"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
						PlayerCount: {$size: {"$objectToArray": "$players"}},
				}},
				{	$match: {
						tableSubType: "public",
						boot: table.boot,
						gameType: table.gameType,
						_id: { $ne: new mongoose.Types.ObjectId( table._id.toString())},
						GameStatus: 1,
						PlayerCount: { $in: [0,1, 2, 3, 4] }
				}},
				{	$sample: {size: 1} }
			]);


		}

		if (tablesss.length > 0)
			await ChangePlayerTable(tablesss[0], userId, table, client, sio);





	}
}


async function LeavePlayerFromLobby(userId,tableId)
{

	var lasttable = await Table.findOne({
		_id: tableId
	});

	if (lasttable.players != null && lasttable.players[userId] ) {

	
		let table = lasttable;
		///let player = userId;
		if (table.players != null && table.players[userId] && table.players[userId].disconnect) {
			//let userId = player._id;
			let tableId = table._id

			let user = await User.findOne({
				_id: userId
			});
			await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 323', 'Disconnect 323', 0, table.players, 0, '');

			let avialbleSlots = {};
			table.slotUsedArray.forEach(function(f) {
				avialbleSlots["slot" + f] = "slot" + f;
			});

			let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);
			await User.update({
				_id: user.id
			}, {
				$set: {
					isplaying: "no"
				}
			});
			var tableInfo = await Table.findOne({
				_id: table._id
			});
			let players = tableInfo.players;
			let slot = getActivePlayers(players);

			let playersss00 =  JSON.parse(JSON.stringify(players));

			for(let plll in playersss00)
			{
				playersss00[plll].playerInfo.chips = 0;
				playersss00[plll].playerInfo.userName = "***";
			}
			let tablll00 =  JSON.parse(JSON.stringify(tableInfo));
			tablll00.players = [];
			
			sio.to(table._id.toString()).emit("playerLeft", {
				bet: {
					lastAction: "Packed",
					lastBet: "",
				},
				removedPlayer: removedPlayer,
				placedBy: removedPlayer.id,
				players: playersss00,
				table: tablll00,
			});


			//args
			let playerLength = getActivePlayers(players);
			if (playerLength == 1 && tableInfo.gameStarted) {
				
				

				
				winnerService.decideWinner(tableInfo,tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
					tableInfo.turnplayerId = "";

					// client.emit("showWinner", {
					// 	message,
					// 	bet: {
					// 		lastAction: "Packed",
					// 		lastBet: "",
					// 	},
					// 	placedBy: removedPlayer.id,
					// 	players: players1,
					// 	table: tableInfo,
					// 	packed: true,
					// 	activePlayerCount: 1,
					// });

					let playersss01 = JSON.parse(JSON.stringify(players1));

					for(let plll in playersss01)
					{
						playersss01[plll].playerInfo.chips = 0;
						playersss01[plll].playerInfo.userName = "***";
					}
					let tablll01 =  JSON.parse(JSON.stringify(tableInfo));
					tablll01.players = [];


					
					sio.to(tableInfo._id.toString()).emit("showWinner", {
						message,
						bet: {
							lastAction: "Packed",
							lastBet: "",
						},
						placedBy: removedPlayer.id,
						players: playersss01,
						table: tablll01,
						packed: true,
						activePlayerCount: 1,
					});
					//args

				
					
					ClearTimer(tableInfo._id.toString());
					await Table.update({
						_id: tableInfo._id.toString()
					}, {
						$set: {
							gameInit: false,
							gameStarted: false,
							slotUsed: 1,
							amount: 0,
							players: players1,
							turnplayerId: ""
						},
					});
					let avialbleSlots = {};
					table.slotUsedArray.forEach(function(d) {
						avialbleSlots["slot" + d] = "slot" + d;
					});
					

					startNewGame(client, table._id.toString(), avialbleSlots, sio);
				});
			
			} else if (playerLength == 1 && !tableInfo.gameStarted) {
			
				ClearTimer(tableInfo._id.toString());
				// client.emit("notification", {
				// 	message: "Please wait for more players to join",
				// 	timeout: 4000,
				// });
				sio.to(tableInfo._id).emit("notification", {
					message: "Please wait for more players to join",
					timeout: 4000,
				});
				let sentObj = {
					players,
					table: tableInfo
				};
				await Table.update({
					_id: tableInfo._id
				}, {
					$set: {
						gameInit: false,
						gameStarted: false,
						slotUsed: 1,
						players: players,
						turnplayerId: ""
					},
				});

				let avialbleSlots = {};
				tableInfo.slotUsedArray.forEach(function(d) {
						avialbleSlots["slot" + d] = "slot" + d;
					});
				

					startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);


			} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
				
				ClearTimer(tableInfo._id.toString());
				await Table.update({
					_id: tableInfo._id.toString()
				}, {
					$set: {
						gameInit: false,
						gameStarted: false,
						slotUsed: 0,
						players: {},
						turnplayerId: ""
					},
				});

				
			}

		}

	}




}





function getoriginalActivePlayers(players) {
	let count = 0;
	for (let player in players) {
		if (players[player].lastAction != "new")
			count++;
	}
	return count;
}


function gettotalplayers(players) {
	let playersLength;
	if (players == null) {
		playersLength = 0;
	} else {
		playersLength = Object.keys(players).length;
	}

	return playersLength;
}

function getDotDotName(str) {
	var strFirstThree = str.substring(0, 13);
	if(str.length > 13)
	 strFirstThree = strFirstThree +  "...";
//return "******";
	 return strFirstThree;
}

module.exports = {
	startNewGameOnPlayerJoin,
	startNewGame,
	SetTimer,
	ClearTimer,
	SwitchTables,
	LeavePlayerFromLobby
}