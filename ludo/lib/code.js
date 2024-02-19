

const connectedUserDevice = new Map();
const logger = require("tracer").colorConsole();
let io = require("socket.io");
const https = require('https');

let _ = require("underscore");

var App_Web = "html";
let {
	SetTimer,
	ClearTimer
} = require("../service/newGame");


let mongoose = require("mongoose");

const socketClient = require('../service/socketClient');


const islogon = true;


let startNewGameTime;
let startNewGamePlyerJoinTime;

let FocusTimerout = {};


let Table = require("../model/table");

let User = require("../model/user");
let TransactionGiftTip = require("../model/transactionGiftTip");
let newGameService = require("../service/newGame");

let playerService = require("../service/player");


let gameAuditService = require("../service/gameAudit");



const thirdPartyAPICall = require("../service/thirdPartyAPICall/thirdPartyAPICall");
const staticValue = require("../constant/staticValue");
let turnautomatic;
let {
	getLastActivePlayer,
	getRandom,
	getNextSlotForTurn,
	getNextActivePlayer
} = require("../service/common");
const { warn } = require("console");


function GetRandomNumber() {
	let Num = Math.floor((Math.random() * 6) + 1);
	return Num;
}



function code() {
	return {
		init: function(server) {
			let options;

			if (App_Web == "app") {

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

			} else {
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
			//	connectedUserSocket.set(username, client);



			client.on("WildCard_EndGame", async function(args) {
				try{
					if (App_Web == "app")
					args = JSON.parse(args);
				}catch(error)
				{

				}
	  
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




				client.on("test", async function(args) {


					// client.join(args.tableId, async function() {});
					// client.join(args.tableId);

					// client.emit("test_back", { });
					// sio.to(args.tableId).emit("test_back_to", {   });

					let pokerrr = {
						id: 123446577,


					};

					client.emit("test_back", pokerrr);
					sio.to(args.tableId).emit("test_back_to", pokerrr);


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









				client.on("watchTable", async function(args) {
					// let inId = args.tableId;
					// console.log("watch tableee  " + args.tableId);
					// let table = await Table.findOne({ _id: inId });

					// client.join(inId);
					// client.join(args.tableId, async function () {
					// });
					// await User.update({ _id: args.userId }, { $set: {lasttableId : args.tableId, tableId: args.tableId,clientId: client.id , isplaying : "yes"} });



					// let tablll =  JSON.parse(JSON.stringify(table));
					// let playersss =  tablll.players;

					// for(let plll in playersss)
					// {
					//   playersss[plll].playerInfo.chips = 0;
					//   playersss[plll].playerInfo.userName = "***";
					// }
					// tablll.players = playersss;

					//   client.emit("watchTable", { tablll });




				});

				client.on("joinTable", async function(args) {



					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
					
					console.warn("join : ",new Date(), " ui : ", args.userId);

					let delay = Number(Math.random(0, 1000));
					setTimeout(async function() {

						let table = await Table.findOne({
							_id: args.tableId
						});
						let playersLength;

						if (table.players == null) {
							playersLength = 0;
						} else {
							playersLength = Object.keys(table.players).length;
						}
						if (playersLength <= 4) {


							let sit = 0;

							let roleofplayer = await User.findOne({
								_id: args.userId
							});

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
								displayName: myData.displayName,
								profilePic : myData.profilePic
							}

							


							sit = args.sit;
							if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {
								let player = {
									id: args.userId,
									playerInfo: daaataaa,
								};
								table.slotUsedArray.sort(function(a, b) {
									return a - b;
								});

								var lasttableiddd = roleofplayer.lasttableId;
								if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0) {

									var lasttable = await Table.findOne({
										_id: lasttableiddd
									});

									if (lasttable != undefined) {


										if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {

											let table = lasttable;
											let player = roleofplayer;
											if(table != null)
											{
												if (table.players != null && table.players[args.userId]) {

													newGameService.LeavePlayer(player._id, table._id, client, sio, "from jointable");
	
												}
											}
											

										}
									}
								}


								await playerService.addPlayer(table, player, client, sit, async function(addedPlayer, avialbleSlots) {
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

										await gameAuditService.createAudit(table._id, args.userId, table.lastGameId, table.players, "JOIN_TABLE", "", "");

										let myTable = await Table.findOne({
											_id: args.tableId
										});


										let tablll = JSON.parse(JSON.stringify(myTable));
										let playersss = tablll.players;

										for (let plll in playersss) {
											playersss[plll].playerInfo.chips = 0;
											playersss[plll].playerInfo.userName = "***";
										}
										tablll.players = playersss;
									

										client.join(args.tableId, async function() {});
										client.join(args.tableId);
			
										client.emit("tableJoined", {
											table: tablll,
											slot: addedPlayer.slot,
											userId: addedPlayer.id
										});
										sio.to(args.tableId.toString()).emit("newPlayerJoined", {
											table: tablll,
											userId: addedPlayer.id
										});

										await User.update({
											_id: args.userId
										}, {
											$set: {
												lasttableId: args.tableId,
												tableId: args.tableId,
												clientId: client.id,
												isplaying: "yes",
												forcedisconnect: false,
												disconnect: false,

											}
										});
										newGameService.startNewGame(client, myTable._id, sio);
									}
								});
							}else{
								
							}

						} else {
						
							let Endgameobj = {
								id: args.userId,
								userName: player.playerInfo.userName,
								message: "Sorry ! Table Full",
							};
							client.emit("EndGame", Endgameobj);
							sio.to(args.tableId.toString()).emit("EndGame", Endgameobj);
						}
					}, delay * 1000);


					//}
				});

				client.on("connectttt", async function(args) {
					
						if (App_Web == "app")
						args = JSON.parse(args);
				
					
					client.emit("connectionSuccess", {
						id: client.id,
					});
				});


				client.on("disconnectuser", async function(args) {
					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{
					}

					await User.update({
						_id: args.userId
					}, {
						$set: {
							isplaying: "no"
						}
					});

				});



				client.on("reconnectt", async function(args) {
					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{
					}

					try {
						let roleofplayer = await User.findOne({
							_id: args.userId
						});

					
						const table_length = await Table.findOne({
							_id: args.tableId
						}).count();
						if (table_length <= 0) {

							//	await User.update({	_id: args.userId	}, {$set: {	lasttableId: ""}});
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
							client.join(args.tableId, async function() {});
							client.join(args.tableId);
							

							let table = await Table.findOne({
								_id: args.tableId
							});
							console.warn("reconnectt : ",new Date(), " ui : ", args.userId, " gI : ", table.lastGameId);			
							
							if (table.players != null) {


								if (table.players[args.userId]) {

									await User.update({
										_id: args.userId
									}, {
										$set: {
											lasttableId: args.tableId,
											tableId: args.tableId,
											clientId: client.id,
											isplaying: "yes",
											forcedisconnect: false
										}
									});
									
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




							let tablesss = table;

							for (let plll in tablesss.players) {
								tablesss.players[plll].playerInfo.chips = 0;
								tablesss.players[plll].playerInfo.userName = "***";
							}

							client.emit("reconnectttt", {
								table: tablesss,
								path0: staticValue.path0,
								path1: staticValue.path1,
								path2: staticValue.path2,
								path3: staticValue.path3,
							});



							sio.to(args.tableId.toString()).emit("ChangePlayerTurn", {
								table: tablesss,
								args: "from Reconnecttt"
							});







							if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0) {



								var lasttable = await Table.findOne({
									_id: lasttableiddd
								});

								if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {

									let table = lasttable;
									let player = roleofplayer;
									if (table.players != null && table.players[player._id]) {

										await newGameService.LeavePlayer(player._id, table._id, client, sio, "from reconnectt");

									}

								}

							}

							await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "Reconnect", 0, 0, roleofplayer.chips, '', "Reconnect", 0, table.players, 0, '');

							await User.update({
								_id: args.userId
							}, {
								$set: {
									lasttableId: args.tableId,
									tableId: args.tableId,
									clientId: client.id,
									isplaying: "yes"
								}
							});





						}
					} catch (error) {}
				});


				client.on("WildCard_EndGame", async function(args) {
					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
					let Endgameobj = {
						id: args.userId,
						userName: args.userName,
						message: "You've been Kicked out by Administrator",
					};
					client.emit("EndGame", Endgameobj);
					sio.to(args.tableId.toString()).emit("EndGame", Endgameobj);
				});





				client.on("TipToGirl", async function(args) {
					//	args = JSON.parse(args);
					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
					let tableData = await Table.findOne({
						_id: args.tableId
					});
					const user = await User.findOne({
						_id: args.fromId
					});

					let param = {
						operatorPlayerId: user.userName,
						roundId: tableData.lastGameId,
						tableCode: args.tableId,
						gameCategory: "TEENPATTI",
						gameCode: tableData.gameType + "",
						gameName: "Normal Game",
						type: "TIP",
						amount: args.tip,
						description: "Tips Send",
					};

					const ApiResponce = await thirdPartyAPICall.SendTip(param);

					const newUser = await User.update({
						_id: mongoose.Types.ObjectId(args.fromId)
					}, {
						$inc: {
							chips: ApiResponce.data.availableBalance
						}
					});
					const adminUser = await User.update({
						_id: mongoose.Types.ObjectId(staticValue.ADMIN_ID)
					}, {
						$inc: {
							chips: args.tip,
							lostLudo: args.tip
						}
					});

					const transaction = await TransactionGiftTip.create({
						senderId: mongoose.Types.ObjectId(args.fromId),
						receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
						tableId: mongoose.Types.ObjectId(args.tableId),
						coins: args.tip,
						transType: "TIP",
					});

					let players = tableData.players;
					players[args.fromId].playerInfo.chips = ApiResponce.data.availableBalance;

					await Table.update({
						_id: args.tableId
					}, {
						$set: {
							players: players
						}
					});


					client.emit("sendTips", {
						message: `Sending Tip By ${user.displayName}`,
						tip: args.tip,
						player: args.fromId,
						user,
						players,
					});

					sio.to(args.tableId.toString()).emit("sendTips", {
						message: `Sending Tip By ${user.displayName}`,
						tip: args.tip,
						player: args.fromId,
						user,
						players,
					});
				});

				client.on("ChangeDelar", async function(args) {
					//	args = JSON.parse(args);
					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
					let tableData = await Table.findOne({
						_id: args.tableId
					});
					const user = await User.findOne({
						_id: args.fromId
					});

					let param = {
						operatorPlayerId: user.userName,
						roundId: tableData.lastGameId,
						tableCode: args.tableId,
						gameCategory: "TEENPATTI",
						gameCode: tableData.gameType + "",
						gameName: "Normal Game",
						type: "CHANGE_DEALER",
						amount: args.delear,
						description: "Change Dealer",
					};

					const ApiResponce = await thirdPartyAPICall.SendTip(param);

					const newUser = await User.update({
						_id: mongoose.Types.ObjectId(args.fromId)
					}, {
						$inc: {
							chips: ApiResponce.data.availableBalance
						}
					});
					const adminUser = await User.update({
						_id: mongoose.Types.ObjectId(staticValue.ADMIN_ID)
					}, {
						$inc: {
							chips: args.delear
						}
					});

					const transaction = await TransactionGiftTip.create({
						senderId: mongoose.Types.ObjectId(args.fromId),
						receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
						tableId: mongoose.Types.ObjectId(args.tableId),
						coins: args.delear,
						transType: "CHANGE_DEALER",
					});

					let players = tableData.players;
					players[args.fromId].playerInfo.chips = ApiResponce.data.availableBalance;

					await Table.update({
						_id: args.tableId
					}, {
						$set: {
							players: players
						}
					});



					await gameAuditService.createAudit(tableData._id, args.userId, tableData.lastGameId, tableData.players, "CHANGE_DEALER", "", "");



					client.emit("ChangeDelar", {
						message: `Sending Tip By ${user.displayName}`,
						tip: args.delear,
						player: args.fromId,
						user,
						players,
					});

					sio.to(args.tableId.toString()).emit("ChangeDelar", {
						message: `Sending Tip By ${user.displayName}`,
						tip: args.tip,
						player: args.fromId,
						user,
						players,
					});
				});




				client.on("disconnect", async function() {


					console.log("disconnectrtt");
					let query = [{
							$match: {
								clientId: client.id
							}
						},
						{
							$lookup: {
								from: "lu_tables",
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


						setTimeout(async function() {

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


						}, 1000);










					}

				});

				client.on("Forcedisconnect", async function(args) {




							
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
							forcedisconnect: true,
							
						}
					});


					console.log("forcedisconnect......................................................................................................");
					newGameService.LeavePlayer(args.userId, args.tableId, client, sio, "ForceDisconnect");



				});









				client.on("ClickOnDise", async function(args) {
					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
				
					let table = await Table.findOne({
						_id: args.tableId
					});

					console.warn("ClickOnDise : ",new Date(), " ui : ", args.userId, " gI : ", table.lastGameId);	
					console.warn("clickondise : ",args);

					let randomnumber = GetRandomNumber();

					// if(args.random_no != 0)
					// 	randomnumber = args.random_no;

					if (table.players[args.userId].current_dise_number == 0 && table.turnplayerId == args.userId) {



						table.players[args.userId].current_dise_number = randomnumber;

						table.players[args.userId].active_token = [];
						table.players[args.userId].contipack = 0;

						if (randomnumber == 6) {
							if (table.players[args.userId].token_0 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_0 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("0");

							}


							if (table.players[args.userId].token_1 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_1 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("1");
							}



							if (table.players[args.userId].token_2 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_2 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("2");
							}


							if (table.players[args.userId].token_3 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_3 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("3");
							}

						} else {

							if (table.players[args.userId].token_0 != -1 && table.players[args.userId].token_0 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_0 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("0");
							}


							if (table.players[args.userId].token_1 != -1 && table.players[args.userId].token_1 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_1 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("1");
							}


							if (table.players[args.userId].token_2 != -1 && table.players[args.userId].token_2 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_2 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("2");
							}


							if (table.players[args.userId].token_3 != -1 && table.players[args.userId].token_3 != staticValue.MaxValue) {
								var num = table.players[args.userId].token_3 + randomnumber;
								if (num <= staticValue.MaxValue)
									table.players[args.userId].active_token.push("3");
							}
						}



						ClearTimer(args.tableId);

						console.log("table update .. 8");
						await Table.update({
							_id: args.tableId
						}, {
							$set: {
								players: table.players,
							},
						});

						let tablll = JSON.parse(JSON.stringify(table));
						let playersss = tablll.players;

						for (let plll in playersss) {
							playersss[plll].playerInfo.chips = 0;
							playersss[plll].playerInfo.userName = "***";
						}
						tablll.players = playersss;


						console.log("clickondicedoneeeeeeeeeeee ");
						sio.to(args.tableId.toString()).emit("ClickOnDiseDone", {
							number: randomnumber,
							table: tablll,
							args: args,
							path0: staticValue.path0,
							path1: staticValue.path1,
							path2: staticValue.path2,
							path3: staticValue.path3,
						});
						await gameAuditService.createAudit(table._id, args.userId, table.lastGameId, table.players, "ClickOnDiseDone", randomnumber, "ActiveToken : " + table.players[args.userId].active_token.toString());



						setTimeout(async function() {
							table = await Table.findOne({
								_id: args.tableId
							});
							if(table.turnplayerId == args.userId)
							{

							
							newGameService.SetTimer(table.turnplayerId, table._id, client, sio);
							if (table.players[args.userId].active_token.length == 0) {
								console.log("Dise rotate .. 1");
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
									table: tablll,
									args: args
								});



								ClearTimer(args.tableId);
								newGameService.SetTimer(table.turnplayerId, table._id, client, sio);
								table.players[args.userId].current_dise_number = 0;
								console.log("current_dise_number : : 00 :: ",args );
								console.log("table update .. 9");
								await Table.update({
									_id: args.tableId
								}, {
									$set: {
										players: table.players,
									},
								});


							} else if (table.players[args.userId].active_token.length == 1) {
								console.log("Dise rotate .. 3");

								let argsss = {
									userId: args.userId,
									tableId: args.tableId,
									token_no: parseInt(table.players[args.userId].active_token[0])
								};

								newGameService.performTokenDone(argsss, client, sio);
							}
							}
						}, 2000);

					} else {
						console.warn("clickondise : in errrow......................................................................................................................................................................................................................................................................................",table.players[args.userId].current_dise_number , "  userId: "  , table.turnplayerId );
					}

				});


				client.on("SetWinners", async function(args) {

					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}

					let table = await Table.findOne({
						_id: args.tableId
					});

					console.warn("SetWinners : ",new Date(), " ui : ", args.userId, " gI : ", table.lastGameId);

				//	let usersss = await User.findOne({ userName: `computer_` + args.tableId });

					
				// for(let plll in table.players)
				// 	{
				// 		table.players[plll].token_0 = 51;
				// 		table.players[plll].token_1 = 52;
				// 		table.players[plll].token_2 = 53;
				// 		table.players[plll].token_3 = 54;
	
				// 	}

					
					table.players[args.userId].token_0 = 50;
					table.players[args.userId].token_1 = 52;
					table.players[args.userId].token_2 = 45;
					table.players[args.userId].token_3 = 48;


					console.log("table update .. 1");

					await Table.update({
						_id: args.tableId
					}, {
						$set: {
							players: table.players,
						},
					});


					let tablll = JSON.parse(JSON.stringify(table));
					let playersss = tablll.players;

					for (let plll in playersss) {
						playersss[plll].playerInfo.chips = 0;
						playersss[plll].playerInfo.userName = "***";
					}
					tablll.players = playersss;



					sio.to(args.tableId.toString()).emit("SetWinnersDone", {
						table: tablll,
						args: args,
						path0: staticValue.path0,
						path1: staticValue.path1,
						path2: staticValue.path2,
						path3: staticValue.path3,
					});


				});


				client.on("performToken", async function(args) {

					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
				

					//clearTimeout(turnautomatic);


					console.log("perform : ", args);

					newGameService.performTokenDone(args, client, sio, "fromuser");


				});


				client.on("OwnChips", async function(args) {

					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
					let chips = 0;
					let table = await Table.findOne({
						_id: args.tableId
					});
					if (table.players[args.userId] != null) {
						chips = table.players[args.userId].playerInfo.chips;


					} else {
						let user = await User.findOne({
							_id: args.userId
						});
						chips = user.chips;

					}



					client.emit("OwnChipsSend", {
						chips: chips,
						userId: args.userId,
						potLimit : args.potLimit


					});

				});


				client.on("getUserInfo", async function (args) {

					try{
						if (App_Web == "app")
						args = JSON.parse(args);
					}catch(error)
					{

					}
				
		  
					let user = await User.findOne({
					  _id: args.userId
					},{ userName : 1 , profilePic : 1, displayName : 1,isComputer : 1,chips:1 ,gameTp : 1,lostTp :1,winTp :1,gamePoker:1,lostPoker:1,winPoker :1 , gameRummy:1 ,lostRummy:1,winRummy:1,gameLudo:1 , lostLudo:1 , winLudo:1});
					user.displayName = args.name;
					client.emit("userInfo", {
					  user: user
					 
					});
		  
				  });









			});
		},
	};

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

async function joinAgain(tableId, userId, client,sio,args,oldtable)
{
	
	


	let tableLength = await Table.findOne({
		_id: tableId
	} );
					let playersLength;
					if (tableLength.players == null) {
						playersLength = 0;
					} else {
						playersLength = Object.keys(tableLength.players).length;
					}

					if (playersLength < 5) {
						let delay = Number(Math.random(0, 1000));
						//   delay =0;
						// setTimeout(async function() {


							let sit = 0;
							

							let table = await Table.findOne({
								_id: tableId
							});
							let myData = await User.findOne({
								_id: userId
							});
							myData.userId = userId;
							myData.clientId = client.id;


							let lasttableiddd = myData.lasttableId;



							
						


							if (table.players == null || table.players[userId] == null || table.players[userId] == undefined) {
								let daaataaa = {
									chips : myData.chips,
									userName : myData.userName,
									displayName  : myData.displayName,
									Decrole : myData.Decrole,
									deviceType : myData.deviceType,
									clientIp : myData.clientIp,
									profilePic : myData.profilePic,
									_id : myData._id,
									isComputer: myData.isComputer
								  }
						
								let player = {
									id: userId,
									cardSet: {
										closed: true,
									},
									playerInfo: daaataaa,
								};
								await playerService.addPlayer(table, player, client, sit, async function(addedPlayer, avialbleSlots) {

									if (addedPlayer == null) {

									// 	let Endgameobj = {
									// 		id: args.userId,
									// 		userName: player.playerInfo.userName,
									// 		message: "Sorry ! Table Full 1",
									// 	};
									// //	client.emit("EndGame", Endgameobj);
									// 	sio.to(args.tableId).emit("EndGame", Endgameobj);



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
				
										await joinAgain(arrtable[0]._id, userId, client,sio,args,oldtable);
				

										




									} else {

										if (addedPlayer !== null) {

											let myTable = await Table.findOne({
												_id: tableId
											});


											// if (args.remark == undefined || args.remark == null)
											// 	args.remark = "no remark";
										

											await gameAuditService.createAudit(table._id, userId, table.lastGameId, table.players, "JOIN_TABLE", "", "");


										

										
											
											let tablll = JSON.parse(JSON.stringify(myTable));
											let playersss = tablll.players;
	
											for (let plll in playersss) {
												playersss[plll].playerInfo.chips = 0;
												playersss[plll].playerInfo.userName = "***";
											}
											tablll.players = playersss;
											
										
											// sio.to(oldtable.toString()).emit("ChangeTable", newPlayer);
											// client.emit("tableJoined", newPlayer_own);
											// sio.to(tableId.toString()).emit("newPlayerJoined", newPlayer);
											// //newGameService.SwitchTables(args.tableId, client, sio);

											// await User.update({
											// 	_id: userId
											// }, {
											// 	$set: {
											// 		lasttableId: tableId,
											// 		tableId: tableId,
											// 		clientId: client.id
											// 	}
											// });


										client.join(tableId.toString(), async function() {});
										client.join(tableId.toString());


										client.emit("tableJoined", {
											table: tablll,
											slot: addedPlayer.slot,
											userId: addedPlayer.id
										});
										sio.to(tableId.toString()).emit("newPlayerJoined", {
											table: tablll,
											userId: addedPlayer.id
										});

										await User.update({
											_id: args.userId
										}, {
											$set: {
												lasttableId: tableId.toString(),
												tableId:tableId.toString(),
												clientId: client.id,
												isplaying: "yes",
												forcedisconnect: false,
												disconnect: false,
											}
										});
										newGameService.startNewGame(client, myTable._id, sio);


											
							
										}
									}
								});
							}else{
								console.log("join table : 111333 :43 : :: ",table.players[userId]);
							}
							// });
						// }, delay * 1000);
					} else {
					


					


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

						await joinAgain(arrtable[0]._id, userId, client,sio,args,oldtable);





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