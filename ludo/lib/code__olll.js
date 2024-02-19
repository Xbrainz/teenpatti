const connectedUserSocket = new Map();


const connectedUserDevice = new Map();
const logger = require("tracer").colorConsole();
let io = require("socket.io");
const https = require('https');
const express = require('express');
let _ = require("underscore");

var App_Web = "app";
let {
	SetTimer,
	ClearTimer
} = require("../service/newGame");


let mongoose = require("mongoose");
let Table = require("../model/table");
let CardInfo = require("../../model/cardInfo");
let User = require("../model/user");
let Game = require("../model/game");
let Transactions = require("../model/transaction");
let gameAuditService = require("../../service/gameAudit");

let newGameService = require("../service/newGame");
let winnerService = require('../../service/winner');
let playerService = require('../../service/player');

let betService = require('../service/bet');
let constant = require("../core/constant");

let {
	getNextActivePlayer,
	getLastActivePlayer,
	getNextActivePlayerForTurnChange
} = require("../service/common");
const {
	debug
} = require("console");





const islogon = true;


let startNewGameTime;
let startNewGamePlyerJoinTime;

let FocusTimerout = {};


function code() {
	return {
		init: function(server) {
			let options;

			if(App_Web == "app")
			{

				options = {
					cors: [
						"http://localhost:7070",
						"http://35.154.207.34/",
						
					],
					allowEIO3: true,
					pingInterval: 2000,
					pingTimeout: 5000,
					reconnectInterval: 5000,
	
				};

			}else{
				 options = {
					cors: [
						"http://localhost:3000",
						"https://cg-dev.deckheros.com",
						"https://cg.deckheros.com",
						"https://cg.deckheroz.io",
						"https://cgskt.radheexchange.com/",
						"https://cgskt.radheexch.com/",
						"https://cgskt.deckheros.com",
						"https://skt.deckheros.com",
						"https://gskt.deckheros.co",
					],
					pingInterval: 2000,
					pingTimeout: 5000,
					reconnectInterval: 5000,
	
				};
	
			}
			


			const sio = require("socket.io")(server, options);

			// sio.configure('development', function(){
			// 	sio.set('transports', ['xhr-polling']);
			//   });



			// client connection starts from here..
			sio.use(async function(socket, next) {



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
						next();
						// if (users.jwtToken != socket.handshake.query.token) {
						// 	next(new Error('user is login in another device'));
						// //next();
						// } else {

						// 	next();
						// }
					} catch (error) {

						next(new Error('user is login in another device'));
					}


				} else {


					next(new Error('Authentication error'));
				}

			}).on("connection", (client) => {


				var username = client.username;
				connectedUserSocket.set(username, client);



				client.on("watchTable", async function(args) {

					if(App_Web == "app")
						args = JSON.parse(args);


					
					let inId = args.tableId;
					let table = await Table.findOne({
						_id: args.tableId
					});
					client.join(inId, async function() {});

					

					client.emit("watchTable", {
					//	players: table.players,
						table
					});


				});

				client.on("joinOther", async function(args) {
					
					if(App_Web == "app")
						args = JSON.parse(args);

					let tableLength = await Table.findOne({
						_id: args.tableId
					} );
					if (tableLength.players == null) {
						playersLength = 0;
					} else {
						playersLength = Object.keys(tableLength.players).length;
					}


				if (playersLength == 5 && !tableLength.players[args.userId]) {

					let arrtable = await Table.aggregate([
						{	$project: {
								"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
								PlayerCount: {$size: {"$objectToArray": "$players"}},
						}},
						{	$match: {
								tableSubType: "public",
								boot: tableLength.boot,
								gameType: tableLength.gameType,
								_id: { $ne: new mongoose.Types.ObjectId( tableLength._id.toString())},
								GameStatus: 1,
								PlayerCount: { $in: [1, 2, 3, 4] }
						}},
						{	$sample: {size: 1} }
					]);
		
					if (arrtable.length == 0) {
						arrtable = await Table.aggregate([
							{	$project: {
									"_id": 1,"gameType": 1,"tableSubType": 1,"boot": 1,"GameStatus": 1,
									PlayerCount: {$size: {"$objectToArray": "$players"}},
							}},
							{	$match: {
								tableSubType: "public",
								boot: tableLength.boot,
								gameType: tableLength.gameType,
								
								GameStatus: 1,
								PlayerCount: { $in: [0,1, 2, 3, 4] },
								_id: { $ne: new mongoose.Types.ObjectId(tableLength._id.toString()) }
							}},
							{	$sample: {size: 1} }
						]);
		
					}

					await joinAgain(arrtable[0]._id, args.userId, client,sio,args,args.tableId);

				}else{
					
				}
					
				});

				

				client.on("OwnChips", async function(args) {

					if(App_Web == "app")
					args = JSON.parse(args);

					let chips = 0, chips_2 =0;
					// let table = await Table.findOne({
					// 	_id: args.tableId
					// });
					//  if(table.players[args.userId] != null)
					// {
				//		chips  = table.players[args.userId].playerInfo.chips;
					//}else{
						let user = await User.findOne({
							_id: args.userId
						});
						chips_2 = user.chips;
				//	}
					
				
					client.emit("OwnChipsSend", {
						chips:chips_2,
						userId : args.userId,
						potLimit : args.potLimit
						
					});
					
				});


				// client.on("joinTable", async function (args) {

				// //  args = JSON.parse(args);
				//    let inId = args.tableId;
				//    console.log("join table");
				//    let tableLength = await Table.findOne({ _id: args.tableId });
				//   let playersLength;
				//   if (tableLength.players == null) {
				// 	playersLength = 0;
				//   } else {
				// 	playersLength = Object.keys(tableLength.players).length;
				//   }

				//   if (playersLength <= 5) {
				// 	console.log("join table 1");
				// 	client.join(inId, async function () {
				// 		console.log("join table 1111");
				// 	  await User.update({ _id: args.userId }, { $set: { tableId: args.tableId, clientId: client.id } });
				// 	  let table = await Table.findOne({ _id: args.tableId });
				// 	  let myData = await User.findOne({ _id: args.userId });
				// 	  myData.userId = args.userId;
				// 	  myData.clientId = args.clientId;
				// 	 // delete myData.

				// 	 console.log("playerss.. ", table.players);
				// 	  if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {
				// 		let player = { 
				// 		  id: args.userId,
				// 		  cardSet: {
				// 			closed: true,
				// 		  },
				// 		  playerInfo: myData,
				// 		};
				// 		table.slotUsedArray.sort(function (a, b) {
				// 		  return a - b;
				// 		});
				// 		console.log("join table 11");
				// 		let response = await playerService.addPlayer(table, player, client,args.sit);
				// 		let addedPlayer = response.player;
				// 		console.log("join table 2");
				// 		let avialbleSlots = response.avialbleSlots;
				// 	 //   console.log(addedPlayer.slot);
				// 		let myTable = await Table.findOne({ _id: args.tableId });
				// 		if (addedPlayer !== null) {
				// 		  let newPlayer = {
				// 			id: args.userId,
				// 			tableId: args.tableId,
				// 			slot: addedPlayer.slot,
				// 			turn: false,
				// 			active: addedPlayer.active,
				// 			winner: null,
				// 			packed: addedPlayer.packed,
				// 			playerInfo: args,
				// 			lastAction: "",
				// 			lastBet: 0,
				// 			nextaction : "",
				// 			nextAmount : 0,
				// 			cardSet: addedPlayer.cardSet,
				// 			otherPlayers: myTable.players,
				// 		  };
				// 		  await Table.update({ _id: args.tableId }, { $inc: { playersLeft: 1 } });
				// 		  let cardInfo = await CardInfo.findOne({ _id: myTable.cardinfoId }, { info: 1 });
				// 		  if(cardInfo) {
				// 			cardInfo = Object.keys(cardInfo.info);
				// 		  } else {
				// 			cardInfo = [];
				// 		  }

				// 		  console.log("tablejoined.. 1");

				// 			await gameAuditService.createAudit(table._id, table.cardinfoId, newPlayer.playerInfo._id, table.lastGameId, "JOIN_TABLE", 0, 0, newPlayer.playerInfo.chips, "JOIN_TABLE", "JOIN_TABLE", table.amount, table.players, 0, '');


				// 		  client.emit("tableJoined", { newPlayer, myTable, cardInfo });
				// 		  client.broadcast.to(args.tableId).emit("newPlayerJoined", { newPlayer, myTable, cardInfo });
				// 		  newGameService.startNewGameOnPlayerJoin(client, myTable, avialbleSlots, args.tableId);
				// 		}
				// 	  }
				// 	});
				//   }
				// });



				client.on("joinTable", async function(args) {

					if(App_Web == "app")
						args = JSON.parse(args);


					const start = Date.now();


					let inId = args.tableId;
					let tableLength = await Table.findOne({
						_id: args.tableId
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
						setTimeout(async function() {


							let sit = 0;
						
							await User.update({
								_id: args.userId
							}, {
								$set: {
								
									tableId: args.tableId,
									clientId: client.id
								}
							});

							let table = await Table.findOne({
								_id: args.tableId
							});
							let myData = await User.findOne({
								_id: args.userId
							});
						
							sit = args.sit;
						






							if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {

								
								let daaataaa = {
									chips: myData.chips,
									userName: myData.userName,
									displayName: getDotDotName(myData.displayName),
									Decrole: myData.Decrole,
									deviceType: myData.deviceType,
									clientIp: myData.clientIp,
									_id: myData._id,
								}


								let player = {
									id: args.userId,
									cardSet: {
										closed: true,
									},
									playerInfo: daaataaa,
								};

								await playerService.addPlayer(table, player, client, sit, async function(addedPlayer, avialbleSlots, myTable) {
									if (addedPlayer == null) {



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

										if (addedPlayer !== null) {


											if (args.remark == undefined || args.remark == null)
												args.remark = "no remark";
											await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "JOIN_TABLE", 0, 0, addedPlayer.playerInfo.chips, '', args.remark.toString(), 0, table.players, 0, '');


											let playersss = JSON.parse(JSON.stringify(myTable.players));

											let chipsss = playersss[args.userId].playerInfo.chips;
											for (let plll in playersss) {
												playersss[plll].playerInfo.chips = 00;
												playersss[plll].playerInfo.userName = "***";
											}

											let tabllll = JSON.parse(JSON.stringify(myTable));

											tabllll.players = [];




											let newPlayer = {
												id: args.userId,
												tableId: args.tableId,
												slot: addedPlayer.slot,
												turn: false,
												active: addedPlayer.active,
												winner: null,
												packed: addedPlayer.packed,

												lastAction: "",
												lastBet: "",
												cardSet: addedPlayer.cardSet,
												otherPlayers: playersss,
												table: tabllll,

											};


											let newPlayer_own = {
												id: args.userId,
												tableId: args.tableId,
												slot: addedPlayer.slot,
												turn: false,
												active: addedPlayer.active,
												winner: null,
												packed: addedPlayer.packed,

												lastAction: "",
												lastBet: "",
												cardSet: addedPlayer.cardSet,
												otherPlayers: playersss,
												table: tabllll,
												chips: chipsss

											};



											client.emit("tableJoined", newPlayer_own);
											sio.to(args.tableId).emit("newPlayerJoined", newPlayer);
											//newGameService.SwitchTables(args.tableId, client, sio);
											let tableGG = await Table.findOne({
												_id: myTable._id
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

											newGameService.startNewGameOnPlayerJoin(client, myTable._id, avialbleSlots,  sio);

											const stop = Date.now();
											// let timess = stop - start;

											// if(timess > 0)
											// {
											// 	// exeTimes.create({	gameId: myTable.lastGameId,
											// 	// 	userId: myTable._id,
											// 	// 	remark : "Join Table" ,
											// 	// 	exetime : timess + ""
											// 	// });
											// }


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

						await joinAgain(arrtable[0]._id, args.userId, client, sio, args, args.tableId);


					}

				});



				client.on("reconnectt", async function(args) {

					if(App_Web == "app")
						args = JSON.parse(args);

					try {
						let roleofplayer = await User.findOne({
							_id: args.userId
						});
						const table_length = await Table.findOne({ _id:  args.tableId }).count();
					if(table_length <= 0){
						
						await User.update({	_id: args.userId	}, {$set: {	lasttableId: ""}});
						let Endgameobj = {
							id: args.userId,
							userName:roleofplayer.userName,
							message: "Table is not available",
						};
					//	client.emit("EndGame", Endgameobj);
						sio.to(args.tableId).emit("EndGame", Endgameobj);
						
					}else{
					
						var lasttableiddd = roleofplayer.lasttableId;
						//clearTimeout(SetTimeoutDisconnect);
						client.join(args.tableId, async function() {});
						client.join(args.tableId);
						await User.update({
							_id: args.userId
						}, {
							$set: {
								lasttableId: args.tableId,
								tableId: args.tableId,
								clientId: client.id,
								isplaying: "yes",
								forcedisconnect : false
							}
						});

						let table = await Table.findOne({
							_id: args.tableId
						});
						
						if (table.players != null) {
							if (table.players[args.userId]) {
								table.players[args.userId].disconnect = false;
								table.players[args.userId].forcedisconnect = false;
								
								
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
							
							}
						}

					
						let card = await CardInfo.findOne({
							_id: table.cardinfoId
						});
						let jokerscard = "";
						
						if(card != null)
							jokerscard = card.jokers;


						let tablesss = table;
					
						for(let plll in tablesss.players)
						{
							tablesss.players[plll].playerInfo.chips = 00;
							tablesss.players[plll].playerInfo.userName = "***";
						}

						client.on("connectttt", async function(args) {
							client.emit("connectionSuccess", {
								id: client.id,
							});
						});
		
						client.emit("reconnectttt", {
							table : tablesss,
							role: roleofplayer.Decrole,
							jokers : jokerscard
						});

					

						await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "Reconnect", 0, 0, roleofplayer.chips, '', "Reconnect", 0, table.players, 0, '');
					
						
						if(lasttableiddd != undefined)
						{
							if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0 ) {
				
								var lasttable = await Table.findOne({
									_id: lasttableiddd
								});
						
								if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {
								
									let table = lasttable;
									let player = roleofplayer;
									newGameService.LeavePlayer(table._id,player._id, client,sio,"From Reconnect");
	
								}
	
							}
	
						}
						

					}

					} catch (error) {
					
					
						console.log("error .. ",error );
					}
				});



				client.on("PlaceTurn", async function(args) {

					if(App_Web == "app")
						args = JSON.parse(args);

					//	args = JSON.parse(args);

					let tableId = args.tableId,
						userId = args.userId,
						action = args.action,
						amount = args.amount;

					let table = await Table.findOne({
						_id: tableId
					});
					let user = await User.findOne({
						_id: userId
					});
					let players = table.players;

					let avialbleSlots = {};
					table.slotUsedArray.forEach(function(d) {
						avialbleSlots["slot" + d] = "slot" + d;
					});
					players[userId].contipack = 0;
					let nextPlayer = getNextActivePlayer(userId, players, avialbleSlots, table.maxPlayers);
					let BetAmout = 0;
					if (action == "pack") {
						let lastplayer = getLastActivePlayer(userId, players, avialbleSlots, table.maxPlayers);
						action = lastplayer.lastAction;
						amount = lastplayer.lastBet;

					} else {

						for (let position in players) {
							if (players[position].active) {
								players[position].turn = false;
								if (players[position].id == userId) {

									if (action == "Call" || action == "Raise" || action == "AllIn") {
										let chipss = user.chips - amount;
										await User.update({
											_id: userId
										}, {
											chips: chipss
										});
										players[position].lastBet = players[position].lastBet + amount;
										players[position].lastAction = action;
										players[position].playerInfo.chips = chipss;
										if (action == "Call" || action == "Raise" )
											BetAmout = players[position].lastBet;
										else if(action == "AllIn")
										{
											if(players[position].nextAmount > amount)
											BetAmout = players[position].nextAmount;
											else
											BetAmout = amount;
										}
											
										else
											BetAmout = table.boot;
									} else {
										players[position].lastAction = action;
									}
								}
							}
						}
					}

					players[nextPlayer.id].turn = true;
					if (table.betRoundCompleted == 0 && players[nextPlayer.id].smallblind == true && BetAmout == table.boot * 2 )  {
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

					
					if(action == "AllIn" &&  players[userId].smallblind == true)
					{
						players[userId].smallblind == false;
						players[nextPlayer.id].smallblind = true;
					}



					await Table.update({
						_id: tableId
					}, {
						players: players,
						lastBet: amount,
						lastAction: action,
						turnplayerId : nextPlayer.id
					});
					table = await Table.findOne({
						_id: tableId
					});

					let nextPlayerForTurnChange = getNextActivePlayerForTurnChange(userId, players, avialbleSlots, table.maxPlayers);




					await gameAuditService.createAudit(table._id, table.cardinfoId, userId, table.lastGameId, action, amount, 0, players[userId].playerInfo.chips, action, "game", table.amount, table.players, 0, '');




				



					if ((players[userId].bigblind == true && action == "Check" && table.betRoundCompleted == 0) ||
						(table.betRoundCompleted == 0 &&  players[nextPlayer.id].lastBet  >= players[userId].lastBet && players[userId].bigblind == true)||
						((action == "Call" || action == "AllIn") && players[nextPlayer.id].nextAmount == 0 && players[nextPlayer.id].lastBet != 0) ||
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
							turnplayerId : playerturnId
						});


						if (table.betRoundCompleted == 4 || getActivePlayers(players) < 2) {

							players = await winnerService.calculatewinningamout(players, table);

							await Table.update({
								_id: tableId
							}, {
								$set: {
									gameStarted: false,
									players: players,
									turnplayerId : ""
								},
							});

							table = await Table.findOne({
								_id: tableId
							});

							let tablesss = table;
					
							for(let plll in tablesss.players)
							{
								tablesss.players[plll].playerInfo.chips = 00;
								tablesss.players[plll].playerInfo.userName = "***";
							}



	
							client.emit("LastShowwinner", {
								table: tablesss,
							});
							sio.to(args.tableId).emit("LastShowwinner", {
								table: tablesss,
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
					
								for(let plll in tablesss.players)
								{
									tablesss.players[plll].playerInfo.chips = 00;
									tablesss.players[plll].playerInfo.userName = "***";
								}
								
								let card = await CardInfo.findOne({ _id: table.cardinfoId });
								
								let sentObj = {
									//players,
									table : tablesss,
									jokers : card.jokers,
									
								};
							

								
								client.emit("RoundCompleete",sentObj);
								sio.to(table._id.toString()).emit("RoundCompleete", sentObj);
								SetTimer(table.turnplayerId, table._id, client, sio);
								//	client.emit("TurnDone", { players: players, table: table, placeby : args });
								//	client.broadcast.to(table._id).emit("TurnDone", { players: players, table: table, placeby : args});

							}, 1000);

						}

					} else {
						

						let tablesss = table;
					
						for(let plll in tablesss.players)
						{
							tablesss.players[plll].playerInfo.chips = 00;
							tablesss.players[plll].playerInfo.userName = "***";
						}

						

						client.emit("TurnDone", {
							//players: players,
							table: tablesss,
							placeby: args,
						});
						sio.to(table._id.toString()).emit("TurnDone", {
						//	players: players,
							table: tablesss,
							placeby: args,
						});

						SetTimer(table.turnplayerId, table._id, client, sio);

					}




				});

			

				client.on("placePack", async function(args) {
					//	args = JSON.parse(args);
					if(App_Web == "app")
					args = JSON.parse(args);



					let table = await Table.findOne({
						_id: args.tableId
					});
					

					table.players[args.userId].contipack = 0;

					await Table.update({
						_id: table._id
					}, {
						$set: {
							players: table.players,
						},
					});

					newGameService.PlacePack(args.tableId,args.userId,client,sio);
					
				});



				client.on("disconnect", function() {
					const delay = Number(Math.random(0, 1000));
					setTimeout(async function() {
						let query = [{
								$match: {
									clientId: client.id
								}
							},
							{
								$lookup: {
									from: "po_tables",
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
							var table = player.table;


							if (table.players != null && table.players[player._id]) {
								table.players[player._id].forcedisconnect = true;
								table.players[player._id].disconnect = true;
								await User.update({
									_id: player._id
								}, {
									$set: {
										forcedisconnect: true,
									}
								});
								await Table.update({
									_id: table._id
								}, {
									$set: {
										players: table.players,
									},
								});
		
							}



							setTimeout(async function(tableId) {
								var table = await Table.findOne({
									_id: tableId
								});

								var user = await User.findOne({
									_id: player._id
								});
							
								if(table.players != null && Object.keys(table.players).length >0 && !table.gameStarted)
								{
								
									if(user.forcedisconnect == true || table.players[player._id].disconnect == true || table.players[player._id].forcedisconnect == true )
									{
										newGameService.LeavePlayer(table._id,player._id, client,sio,"From Disconnect");
									}
									
								}

						}, 10000,table._id);

						}

					}, delay * 1000);




				});

				client.on("Forcedisconnect", async function(args) {

					if(App_Web == "app")
						args = JSON.parse(args);

					let player = await User.findOne({
						_id: args.userId
					});

					var table = await Table.findOne({
						_id: args.tableId
					});

					if (table.players != null && table.players[player._id]) {
						table.players[player._id].forcedisconnect = true;
						await User.update({
							_id: player._id
						}, {
							$set: {
								forcedisconnect: true,
							}
						});
						await Table.update({
							_id: args.tableId
						}, {
							$set: {
								players: table.players,
							},
						});

					}

					newGameService.LeavePlayer(table._id,player._id, client,sio, "From ForceDisconnect");

					

				});





				client.on("standUp", async function(args) {
					if(App_Web == "app")
						args = JSON.parse(args);

					//	args = JSON.parse(args);


					newGameService.LeavePlayer( args.tableId, args.userId,client,sio, " From Standup");


					let table = await Table.findOne({
						_id: args.tableId
					});


					let tablesss = table;
					
					for(let plll in tablesss.players)
					{
						tablesss.players[plll].playerInfo.chips = 00;
						tablesss.players[plll].playerInfo.userName = "***";
					}



					sio.to(table._id.toString()).emit("standUp", {
					//	players: table.players,
						//table :tablesss ,
						userId: args.userId
					});



					client.emit("standUp_Own", {
						players: table.players,
						table,
						userId: args.userId
					});



				});



				client.on("seeAllCards", async function(args) {
					if(App_Web == "app")
						args = JSON.parse(args);

					//args = JSON.parse(args);

					let tablez = await Table.findOne({
						_id: args.tableId
					});

					let cardInfos = await CardInfo.findOne({
						_id: tablez.cardinfoId
					});

					client.emit("allCards", {
						cardss: cardInfos.info
					});
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
	return "******";
	// return str;
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

function isallBlindPortLimit(tableInfo, players) {

	//return tableInfo.amount > tableInfo.boot * 8;


	if (tableInfo.amount) {
		let isallblind = false;
		for (let player in players) {
			if (!isallblind) isallblind = players[player].cardSeen;
		}
		if (!isallblind) {

			let playercount = getActivePlayers(players);


			if (tableInfo.gameType == StaticgameType.ThreeJoker) {

				if (playercount == 2) return tableInfo.amount > tableInfo.boot * 200;

				if (playercount == 3) return tableInfo.amount > tableInfo.boot * 150;

				if (playercount == 4) return tableInfo.amount > tableInfo.boot * 150;

				if (playercount == 5) return tableInfo.amount > tableInfo.boot * 100;

			} else {

				if (playercount == 2) return tableInfo.amount > tableInfo.boot * 100;

				if (playercount == 3) return tableInfo.amount > tableInfo.boot * 80;

				if (playercount == 4) return tableInfo.amount > tableInfo.boot * 80;

				if (playercount == 5) return tableInfo.amount > tableInfo.boot * 50;

			}






		} else return false;
	}
	return false;

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
		setTimeout(async function() {


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



						if(lasttableiddd != undefined)
						{
							if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0 ) {
				
								var lasttable = await Table.findOne({
									_id: lasttableiddd
								});
						
								if (lasttable.players != null && lasttable.players[userId] && lasttableiddd != args.tableId) {
								
									let table = lasttable;
								
									newGameService.LeavePlayer(table._id,userId, client,sio, "From Join again");
	
								}
	
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
					_id: myData._id
				}

				let player = {
					id: userId,
					cardSet: {
						closed: true,
					},
					playerInfo: daaataaa,
				};

				await playerService.addPlayer(table, player, client, sit, async function(addedPlayer, avialbleSlots, myTable) {

					if (addedPlayer == null) {


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
							await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.JOIN_TABLE, 0, 0, addedPlayer.playerInfo.chips, 'join again', args.remark.toString(), 0, table.players, 0, '');

							let playersss = JSON.parse(JSON.stringify(myTable.players));
							let chipsss = playersss[args.userId].playerInfo.chips;
							for (let plll in playersss) {
								playersss[plll].playerInfo.chips = 00;
								playersss[plll].playerInfo.userName = "***";
							}


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
								table: tablll5,
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
								table: tablll5,
								chips: chipsss
							};



							sio.to(oldtable.toString()).emit("ChangeTable", newPlayer);
							client.emit("tableJoined", newPlayer_own);
							sio.to(tableId.toString()).emit("newPlayerJoined", newPlayer);
							//newGameService.SwitchTables(args.tableId, client, sio);

							await User.update({
								_id: userId
							}, {
								$set: {
								//	lasttableId: tableId,
									tableId: tableId,
									clientId: client.id
								}
							});


							let tableGG = await Table.findOne({
								_id: myTable._id
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

							newGameService.startNewGameOnPlayerJoin(client, myTable._id, avialbleSlots,  sio);




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