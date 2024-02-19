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
let CardInfo = require("../model/cardInfo");
let User = require("../model/user");
let TransactionGiftTip = require("../model/transactionGiftTip");
let transactionType = require("../constant/transactionType");
let newGameService = require("../service/newGame");
let winnerService = require("../service/winner");
let playerService = require("../service/player");
let sideShowService = require("../service/sideShow");
let GameAudit = require("../model/gameAudit");
let betService = require("../service/bet");
let exeTimes = require("../model/exeTimes");
let gameAuditService = require("../service/gameAudit");
let seeMyCardService = require("../service/seeMyCard");
let StaticgameType = require('./../constant/gametype');
let TransactionChalWin = require("../model/transactionChalWin");
let {
	getLastActivePlayer,
	getRandom,
	getNextSlotForTurn,
	getNextActivePlayer
} = require("../service/common");
let {
	SetTimer,
	ClearTimer
} = require("../service/newGame");

const thirdPartyAPICall = require("../service/thirdPartyAPICall/thirdPartyAPICall");
const staticValue = require("../constant/staticValue");
const auditType = require("../constant/audittype");
let JackPot = require("../model/jackpot");
let SetTimeoutDisconnect;
const port = 5050;
const islogon = true;

const socketClient = require('../service/socketClient');

let startNewGameTime;
let startNewGamePlyerJoinTime;

let FocusTimerout = {};

let Settings_Model = require("../model/settings");

function code() {
	return {
		init: function(server) {

		
			let options = {
				cors: [
					"http://localhost:5050",
					"http://3.110.35.77/",
					
				],
				allowEIO3: true,
				pingInterval: 2000,
				pingTimeout: 5000,
				reconnectInterval: 5000,

			};


			// let options = {
            //     cors: {
            //         origin: "http://localhost:5050",
            //         methods: ["GET", "POST"],
            //         transports: ['websocket', 'polling'],
            //         credentials: true
            //     },
            //     allowEIO3: true,
            
			// 	pingInterval: 2000,
			// 	pingTimeout: 5000,
			// 	reconnectInterval: 5000,

			// };



			const sio = require("socket.io")(server, options);

			// sio.configure('development', function(){
			// 	sio.set('transports', ['xhr-polling']);
			//   });



			// client connection starts from here..
			sio.use(async function(socket, next) {



				

				const obj = JSON.parse(JSON.stringify(socket.handshake));

				console.log("Connectttionnnnn ttt",obj);
			

				if (socket.handshake.query && socket.handshake.query.token) {

				
					console.log("tokennn ", socket.handshake.query.token);
				//	var device = socket.handshake.query.deviceid;
				
					var usernameFromDecodedToken = await gt_usr(socket.handshake.query.token);
				
				usernameFromDecodedToken = usernameFromDecodedToken.id;

				console.log("usernamedecode ",usernameFromDecodedToken );
				if(usernameFromDecodedToken == "")
					next(new Error('user is login in another device'));


					if (usernameFromDecodedToken == null)
						next(new Error('Invalid Token, Login Again'));
					
					
						try{
						
							let users = await User.findOne({
								_id: usernameFromDecodedToken
							});
							
							// if (users.jwtToken != socket.handshake.query.token) {
							// 	next(new Error('user is login in another device'));
							
							// } else {
							
								next();
							//}
						}catch(error)
						{
							
							next(new Error('user is login in another device'));
						}
					
					
				} else {
				
					console.log("Connectttionnnnn not successfully");
					next();
				}

			}).on("connection", (client) => {

    

			//	var device = client.device;
				var username = client.username;
				connectedUserSocket.set(username, client);
			//	connectedUserDevice.set(device, device);



			client.on("OwnChips", async function(args) {

				try{
					args = JSON.parse(args);
				}catch(error)
				{}
				let chips = 0;
				let table = await Table.findOne({
					_id: args.tableId
				});
				 if(table.players[args.userId] != null)
				{
					chips  = table.players[args.userId].playerInfo.chips;
				}else{
					let user = await User.findOne({
						_id: args.userId
					});
					chips = user.chips;
				}
				
			
				client.emit("OwnChipsSend", {
					chips:chips,
					userId : args.userId,
					potLimit : args.potLimit
					
				});
				
			});

			client.on("getUserInfo", async function (args) {

				//if (App_Web == "app")
				  args = JSON.parse(args);
			
	  
				let user = await User.findOne({
				  _id: args.userId
				},{ userName : 1 , profilePic : 1, displayName : 1,isComputer : 1,chips:1 ,gameTp : 1,lostTp :1,winTp :1,gamePoker:1,lostPoker:1,winPoker :1 , gameRummy:1 ,lostRummy:1,winRummy:1,gameLudo:1 , lostLudo:1 , winLudo:1});
				user.displayName = args.name;
				client.emit("userInfo", {
				  user: user
				 
				});
	  
			  });



			
			client.on("FocusUpdate", async function(args) {

				try{
					args = JSON.parse(args);
				}catch(error)
				{

				}
				
				try{

			
				await User.update({ _id:args.userId }, { $set: {userFocus : args.userFocus } });

			
			
				if(args.userFocus == "Out")
				{

					clearTimeout(FocusTimerout[args.userId]);
					FocusTimerout[args.userId] = setTimeout(async function() {
					

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
		
					


						let userId = user._id;
						let tableId = tablesss._id;
						let table = tablesss;

					
						await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 899', 'Disconnect 899', 0, table.players, 0, '');

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
							

								newGameService.startNewGame(client, table._id.toString(), avialbleSlots, sio);
							});
						
						} else if (playerLength == 1 && !tableInfo.gameStarted) {
						
							ClearTimer(tableInfo._id.toString());
							
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
							

								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);


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
							let avialbleSlots = {};
							tableInfo.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});
							newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

							
						}





							
						}
		

					}, 1000*60*6);
				}
				
			}catch(error)
			{
				console.log(error);
			}
				
			});




			client.on("watchTable", async function(args) {

				console.log("watchTable..66...33333");

				let roleofplayer = await User.findOne({
					_id: args.userId
				});
				let inId = args.tableId;
				let lasttableiddd = roleofplayer.lasttableId;
				
				const table_length = await Table.findOne({ _id:  args.tableId }).count();

				if(table_length <= 0){
					await User.update({	_id: args.userId	}, {$set: {	lasttableId: ""}});
					let Endgameobj = {
						id: args.userId,
						userName:lasttableiddd.userName,
						message: "Table is not available",
					};
				//	client.emit("EndGame", Endgameobj);
					sio.to(args.tableId).emit("EndGame", Endgameobj);

					for (var i = 0; i < table_length.watchCount.length; i++) {
						if (table_length.watchCount[i] === user.userName) {
							table_length.watchCount.splice(i, 1);
							i--;
						}
					}
					await Table.update({_id: table_length._id}, {$set: {watchCount:table_length.watchCount}});

					socketClient.addanddeleteRobot(table_length);


				}else{
				let table = await Table.findOne({
					_id: inId
				});
				 
			
				client.join(inId);

				client.join(args.tableId, async function() {});

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

				


				if (table.players == null) {
					table.players = {};
				}
				
				if(!table.watchCount.includes(roleofplayer.userName))
					table.watchCount.push(roleofplayer.userName);

					
		

				
				await Table.update({
					_id: args.tableId
				}, {
					$set: {
						watchCount:table.watchCount,
						roboPlayers : table.roboPlayers		
					}
				});
				let playersss =  JSON.parse(JSON.stringify(table.players));

				for(let plll in playersss)
				{
					playersss[plll].playerInfo.chips = 0;
					playersss[plll].playerInfo.userName = "***";
				}

				let tablll =  JSON.parse(JSON.stringify(table));
				tablll.players = [];

				socketClient.addanddeleteRobot(table);
				
				console.log("em,it watchatbel;");

				client.emit("watchTable", {
					players: playersss,
					table : tablll,
					role: roleofplayer.Decrole
				});


				await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "WatchTable", 0, 0, roleofplayer.chips, '', "WatchTable", 0, table.players, 0, '');

				}

				//   }
			});

				client.on("joinTable", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{
						
					}
	
					
					console.log("joinTable.22 " + args.tableId + " , userid " + args.userId);
					const start =  Date.now();

					let inId = args.tableId;
					let tableLength = await Table.findOne({
						_id: args.tableId
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
						setTimeout(async function() {


							let sit = 0;
							//  client.join(inId);
							// client.join(inId, async function () {
							await User.update({
								_id: args.userId
							}, {
								$set: {
									lasttableId: args.tableId,
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
							myData.userId = args.userId;
							myData.clientId = args.clientId;
							//for sit in given slot
							sit = args.sit;
							//let sit = getRandomInt(3,4);
						

							


							let lasttableiddd = myData.lasttableId;

							if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0 && lasttableiddd != args.tableId) {
				
								var lasttable = await Table.findOne({
									_id: lasttableiddd
								});
	
								if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {
	
								
									let table = lasttable;
									let player = myData;
									if (table.players != null && table.players[player._id] && table.players[player._id].disconnect) {
										let userId = player._id;
										let tableId = table._id
	
										let user = await User.findOne({
											_id: userId
										});
										await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 55', 'Disconnect 55', 0, table.players, 0, '');
	
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
												
	
												newGameService.startNewGame(client, table._id.toString(), avialbleSlots, sio);
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
											
	
												newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
	
	
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
											let avialbleSlots = {};
											tableInfo.slotUsedArray.forEach(function(d) {
													avialbleSlots["slot" + d] = "slot" + d;
												});
											newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
											
										}
	
									}
	
								}
	
							}



							if (table.players == null || table.players[args.userId] == null || table.players[args.userId] == undefined) {

								  
								let daaataaa = {
									chips : myData.chips,
									userName : myData.userName,
									displayName  : getDotDotName(myData.displayName),
									Decrole : myData.Decrole,
									deviceType : myData.deviceType,
									clientIp : myData.clientIp,
									profilePic : myData.profilePic,
									_id : myData._id,
									isComputer: myData.isComputer
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
				

										


									} else {

										if (addedPlayer !== null) {


											if (args.remark == undefined || args.remark == null)
												args.remark = "no remark";
											await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, auditType.JOIN_TABLE, 0, 0, addedPlayer.playerInfo.chips, '', args.remark.toString(), 0, table.players, 0, '');

											
											let playersss = JSON.parse(JSON.stringify( myTable.players));
										
											let chipsss = playersss[args.userId].playerInfo.chips;
											for(let plll in playersss)
											{
												playersss[plll].playerInfo.chips = 0;
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
												chips : chipsss
												
											};
											if (playersLength === 0) {
												socketClient.joinTable(args.tableId, myTable.boot);
											}


									
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
										
											newGameService.startNewGameOnPlayerJoin(client, myTable._id, avialbleSlots, args.tableId, sio);

											const stop = Date.now();
											let timess = stop - start;

											if(timess > 0)
											{
												exeTimes.create({	gameId: myTable.lastGameId,
													userId: myTable._id,
													remark : "Join Table" ,
													exetime : timess + ""
												});
											}
											
							
										}
									}
								});
							}
							// });
						}, delay * 1000);
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

						await joinAgain(arrtable[0]._id, args.userId, client,sio,args,args.tableId);




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

					
					//}
				});


				client.on("joinOther", async function(args) {
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



				client.on("connectttt", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					client.emit("connectionSuccess", {
						id: client.id,
					});
				});


				client.on("disconnectuser", async function(args) {
				
					try{
						args = JSON.parse(args);
					}catch(error)
					{}

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
						args = JSON.parse(args);
					}catch(error)
					{}
	
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
								isplaying: "yes"
							}
						});

						let table = await Table.findOne({
							_id: args.tableId
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
							_id: table.cardinfoId
						});
						let jokerscard = "";
						
						if(card != null)
							jokerscard = card.jokers;


						let tablesss = table;
					
						for(let plll in tablesss.players)
						{
							tablesss.players[plll].playerInfo.chips = 0;
							tablesss.players[plll].playerInfo.userName = "***";
						}

						
						let joker ;
						if(card != null)
						 joker = card.joker;


						
						client.emit("reconnectttt", {
							table : tablesss,
							role: roleofplayer.Decrole,
							jokers : jokerscard,
							joker
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

						


						await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "Reconnect", 0, 0, roleofplayer.chips, '', "Reconnect", 0, table.players, 0, '');


					
						
						if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0 ) {
				
							var lasttable = await Table.findOne({
								_id: lasttableiddd
							});
					
							if (lasttable.players != null && lasttable.players[args.userId] && lasttableiddd != args.tableId) {

							
								let table = lasttable;
								let player = roleofplayer;
								if (table.players != null && table.players[player._id]) {
									let userId = player._id;
									let tableId = table._id

									let user = await User.findOne({
										_id: userId
									});

									
									await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 33', 'Disconnect 33', 0, '', 0, '');

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
									
				
									let playersss02 = JSON.parse(JSON.stringify(players)); 

									for(let plll in playersss02)
									{
										playersss02[plll].playerInfo.chips = 0;
										playersss02[plll].playerInfo.userName = "***";
									}
				

										
									let tabllll02 =  JSON.parse(JSON.stringify(tableInfo)); 
									tabllll02.players = [];

								

									sio.to(table._id.toString()).emit("playerLeft", {
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										removedPlayer: removedPlayer,
										placedBy: removedPlayer.id,
										players: playersss02,
										table: tabllll02,
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

											let players002 = JSON.parse(JSON.stringify(players1)); 

											for(let plll in players002)
											{
												players002[plll].playerInfo.chips = 0;
												players002[plll].playerInfo.userName = "***";
											}
				
										
											let tabll002 = JSON.parse(JSON.stringify(tableInfo)); 
											tabll002.players = [];

											

											sio.to(tableInfo._id.toString()).emit("showWinner", {
												message,
												bet: {
													lastAction: "Packed",
													lastBet: "",
												},
												placedBy: removedPlayer.id,
												players: players002,
												table: tabll002,
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
										

											newGameService.startNewGame(client, table._id.toString(), avialbleSlots, sio);
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
										

										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);


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
										let avialbleSlots = {};
										tableInfo.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
										
									}

								}

							}

						}


					}

					} catch (error) {
					
					
						console.log("error .. ",error );
					}
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

				client.on("seeAllCards", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					//	  args = JSON.parse(args);

					let roleofplayer = await User.findOne({
						_id: args.userId
					});
					let table = await Table.findOne({
						_id: args.tableId
					});
					console.log("check ",roleofplayer.role );
					if (roleofplayer.Decrole == "SUSER") {
						let user = [];
						let playerss = Object.values(table.players);
						let cardInfos = await CardInfo.findOne({
							_id: table.cardinfoId
						});

						for (let i = 0; playerss.length > i; i++) {
							let players = playerss[i];
							let cards = Object.entries(cardInfos.info);
							cards.forEach(([key, value]) => {
								if (players.id === key) {
									user.push(new Array(players, value));
								}
							});
						}

						client.emit("allCards", user);
					}

				});

				client.on("ReplaceCard", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					//	args = JSON.parse(args);
					let replaceArray = [];

					let table = await Table.findOne({
						_id: args.tableId
					});

					const cardInfo = await CardInfo.findById(table.cardinfoId);
					let cards = Object.entries(cardInfo.info);

					cards.forEach(([key, value]) => {
						if (args.playerid === key) {
							cardInfo.info[args.playerid].cards.length = 0;
							cardInfo.info[args.playerid].cards.push.apply(cardInfo.info[args.playerid].cards, args.cards);
							replaceArray.push({
								player: args.playerid,
								value
							});
						}
					});

					replaceArray[0].value.cards.length = 0;
					replaceArray[0].value.cards.push.apply(replaceArray[0].value.cards, args.cards);

					const cardInfosss = await CardInfo.replaceOne({
						_id: table.cardinfoId, 
					}, {
						tableId: mongoose.Types.ObjectId(args.tableId),
						info: cardInfo.info,
						joker: cardInfo.joker,
						jokers: cardInfo.jokers,
						updatedAt: cardInfo.createdAt,
						createdAt: cardInfo.updatedAt,
					});
					client.emit("doneReplaceCards", replaceArray);


					let user = [];
						let playerss = Object.values(table.players);
						let cardInfos = await CardInfo.findOne({
							_id: table.cardinfoId
						});

						for (let i = 0; playerss.length > i; i++) {
							let players = playerss[i];
							let cards = Object.entries(cardInfos.info);
							cards.forEach(([key, value]) => {
								if (players.id === key) {
									user.push(new Array(players, value));
								}
							});
						}

						client.emit("allCards", user);


				});

				client.on("SendGift", async function(args) {
					args = JSON.parse(args);
					//		args = JSON.parse(args);
					const newUser = await User.update({
						_id: mongoose.Types.ObjectId(args.fromId)
					}, {
						$inc: {
							chips: -args.price
						}
					});
					const adminUser = await User.update({
						_id: mongoose.Types.ObjectId(staticValue.ADMIN_ID)
					}, {
						$inc: {
							chips: args.price
						}
					});

					const user = await User.findOne({
						_id: args.fromId
					});
					const transaction = await TransactionGiftTip.create({
						senderId: mongoose.Types.ObjectId(args.fromId),
						receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
						tableId: mongoose.Types.ObjectId(args.tableId),
						coins: args.price,
						transType: transactionType.GIFT,
					});

					let tableData = await Table.findOne({
						_id: args.tableId
					});
					let players = tableData.players;
					players[args.fromId].playerInfo.chips = user.chips;

					await Table.update({
						_id: args.tableId
					}, {
						$set: {
							players: players
						}
					});

					await gameAuditService.createAudit(tableData._id, tableData.cardinfoId, args.fromId, tableData.lastGameId, auditType.GIFT, 0, args.price, user.chips, "GIFT", "Gift", tableData.amount, tableData.players, 0, "");

					// client.emit("GiftSended", {
					// 	args,
					// 	user,
					// 	players,
					// });

					sio.to(args.tableId).emit("GiftSended", {
						args,
						user,
						players,
					});
				});

				client.on("TipToGirl", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					//	args = JSON.parse(args);


					let tableData = await Table.findOne({
						_id: args.tableId
					});
					
				
					const newUser = await User.update(
						{ _id: mongoose.Types.ObjectId(args.fromId) },
						{ $inc: { chips: -args.tip } }
					  );

					const adminUser = await User.update({
						_id: mongoose.Types.ObjectId(staticValue.ADMIN_ID)
					}, {
						$inc: {
							chips: args.tip
						}
					});

					const transaction = await TransactionGiftTip.create({
						senderId: mongoose.Types.ObjectId(args.fromId),
						receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
						tableId: mongoose.Types.ObjectId(args.tableId),
						coins: args.tip,
						transType: transactionType.TIP,
					});


					const user = await User.findOne({
						_id: args.fromId
					});

				

					tableData = await Table.findOne({
						_id: args.tableId
					});
					let players = tableData.players;
					players[args.fromId].playerInfo.chips =user.chips;

					await Table.update({
						_id: args.tableId
					}, {
						$set: {
							players: players
						}
					});

					await gameAuditService.createAudit(tableData._id, tableData.cardinfoId, args.fromId, tableData.lastGameId, auditType.TIP, 0, args.tip, user.chips, "TIP", "Tip", tableData.amount, tableData.players, 0, "");
					/*
					          client.emit("sendTips", {
					            message: `Sending Tip By ${user.displayName}`,
					            tip: args.tip,
					            player: args.fromId,
					            user,
					            players,
					          });


					          */

					sio.to(args.tableId).emit("sendTips", {
						message: `Sending Tip By ${user.displayName}`,
						tip: args.tip,
						player: args.fromId,
						user,
						players,
					});
				});


				
				client.on("ChangeDelar", async function(args) {


					try{
						args = JSON.parse(args);
					}catch(error)
					{}
				

					
					let tableData = await Table.findOne({
						_id: args.tableId
					});

					
					let Settings_amount = await Settings_Model.findOne({
						type: "dealer_amount"
					});

					const userbefore = await User.findOne({
						_id: args.fromId
					},{chips : 1});


					if(userbefore.chips <= Settings_amount.amount)
					{

						sio.to(args.tableId).emit("ChangeDelar", {
							message: "You don't have enough chips",
							success : false,
							tip: args.delear,
							player: args.fromId,
							dealer_no: args.dealer_no,
							user:userbefore,
						//	players : players,
						});



					}else{

					

					console.log("modelll : : ",Settings_amount);
			
					args.tip = Settings_amount.amount;
				
					const newUser = await User.update(
						{ _id: mongoose.Types.ObjectId(args.fromId) },
						{ $inc: { chips: -args.tip } }
					  );

					const adminUser = await User.update({
						_id: mongoose.Types.ObjectId(staticValue.ADMIN_ID)
					}, {
						$inc: {
							chips: args.tip
						}
					});

					const transaction = await TransactionGiftTip.create({
						senderId: mongoose.Types.ObjectId(args.fromId),
						receiverId: mongoose.Types.ObjectId(staticValue.ADMIN_ID),
						tableId: mongoose.Types.ObjectId(args.tableId),
						coins: args.tip,
						transType: "CHANGE_DEALER",
					});

					
					const user = await User.findOne({
						_id: args.fromId
					});

				

					tableData = await Table.findOne({
						_id: args.tableId
					});
					let players = tableData.players;
					if(players[args.fromId])
					{
						players[args.fromId].playerInfo.chips =user.chips;

						await Table.update({
							_id: args.tableId
						}, {
							$set: {
								players: players,
								dealer: args.dealer_no
							}
						});
	
					}else{
						await Table.update({
							_id: args.tableId
						}, {
							$set: {
								dealer: args.dealer_no
							}
						});
	
					}
					



					sio.to(args.tableId).emit("ChangeDelar", {
						message: `Sending Tip By ${user.displayName}`,
						tip: args.delear,
						success : true,
						player: args.fromId,
						dealer_no: args.dealer_no,
						user,
						players : players,
					});

				}
				});




				client.on("seeMyCards", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					//		args = JSON.parse(args);
					let table = await Table.findOne({
						_id: args.tableId
					});
				
					if (isActivePlayerforseemycard(args.current.id, table.players)) {

						

						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(d) {
							avialbleSlots["slot" + d] = "slot" + d;
						});

						let getCardInfo = await CardInfo.findOne({
							_id: args.table.cardinfoId
						});

						let cardsInfo = getCardInfo.info[args.current.id].cards;
						let players = await sideShowService.updateSideShow(args.current.id, table.players, avialbleSlots, table.maxPlayers);

						players[args.current.id].cardSeen = true;
						await Table.update({
							_id: args.tableId
						}, {
							$set: {
								players: players
							}
						});

						let cardsInfoNew = seeMyCardService.convertSetsForAK47AndJoker(table, args.current.id, getCardInfo);

						await gameAuditService.createAudit(args.tableId, getCardInfo._id, args.current.id, table.lastGameId, auditType.SEE_BTN_CLICK, 0, 0, players[args.current.id].playerInfo.chips, "SEE", "", table.amount, table.players, 0, "");


						let playersss = JSON.parse(JSON.stringify(players)); 

						for(let plll in playersss)
						{
							playersss[plll].playerInfo.chips = 0;
							playersss[plll].playerInfo.userName = "***";
						}
						
						let tabllll =  JSON.parse(JSON.stringify(table)); 
						tabllll.players = [];

					

						client.emit("cardsSeen", {
							cardsInfo,
							players : playersss,
							table : tabllll,
							cardsInfoNew,
							userId : args.current.id
						});
						sio.to(args.tableId).emit("playerCardSeen", {
							id: args.current.id,
							players : playersss,
							table : tabllll
						});
					} else {

					}

				});

				client.on("selectGame", async function(args) {
					args = JSON.parse(args);
					//	args = JSON.parse(args);
					await Table.update({
						_id: args.tableId
					}, {
						type: args.type,
						gameType: parseInt(args.gameType)
					});
					client.emit("selectGame", "game selected");
					client.broadcast.emit("selectGame", "game selected");
				});

				client.on("placePack", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					let tablee = await Table.findOne({
						_id: args.tableId
					});

					if (tablee.players && tablee.players[args.player.id]) {
						let avialbleSlots = {};
						tablee.slotUsedArray.forEach(function(d) {
							avialbleSlots["slot" + d] = "slot" + d;
						});

						tablee.players = await betService.packPlayer(args.player.id, tablee.players, avialbleSlots, tablee.maxPlayers, tablee);

						await gameAuditService.createAudit(tablee._id, tablee.cardinfoId, args.player.id, tablee.lastGameId, auditType.USER_TURN, 0, 0, tablee.players[args.player.id].playerInfo.chips, "Pack", "Packed", tablee.amount, tablee.players, 0, "");

					
						tablee = await Table.findOne({
							_id: args.tableId
						});
						if (getActivePlayers(tablee.players) < 2 && tablee.gameStarted) {
						
							winnerService.decideWinner(tablee, tablee.players, tablee.cardinfoId, false, "", async function(message, players3) {
								tablee.turnplayerId = "";


								let playersss09 = JSON.parse(JSON.stringify(players3)); 

								for(let plll in playersss09)
								{
									playersss09[plll].playerInfo.chips = 0;
									playersss09[plll].playerInfo.userName = "***";
								}
								
								let tabllll09 = JSON.parse(JSON.stringify(tablee)); 
								tabllll09.players = [];

							
								
								client.emit("playerPacked", {
									bet: args.bet,
									placedBy: args.player.id,
									players: playersss09,
									table: tabllll09,
								});

								sio.to(args.tableId).emit("playerPacked", {
									bet: args.bet,
									placedBy: args.player.id,
									players: playersss09,
									table: tabllll09,
								});

							


								sio.to(args.tableId).emit("showWinner", {
									message,
									bet: args.bet,
									placedBy: args.player.id,
								
									players: playersss09,
									table: tabllll09,

									packed: true,
									activePlayerCount: 1,
								});
					
							
								ClearTimer(tablee._id);
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

								
										

								
								newGameService.startNewGame(client, tablee._id, avialbleSlots, sio);
							});
						} else {
						

							let playersss99 = JSON.parse(JSON.stringify(tablee.players)); 

								for(let plll in playersss99)
								{
									playersss99[plll].playerInfo.chips = 0;
									playersss99[plll].playerInfo.userName = "***";
								}
								
								let tabllll99 = JSON.parse(JSON.stringify(tablee)); 
								tabllll99.players = [];

							
								
							

							client.emit("playerPacked", {
								bet: args.bet,
								placedBy: args.player.id,
								players:playersss99,
								table: tabllll99,
							});
							sio.to(args.tableId).emit("playerPacked", {
								bet: args.bet,
								placedBy: args.player.id,
								players:playersss99,
								table: tabllll99,
							});

							for (let posi in tablee.players) {
								if (tablee.players[posi].turn == true) {
									SetTimer(tablee.players[posi].id, tablee._id, client, sio);
								
								}
							}
						}
					}
				});

				client.on("placeBet", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					const start =  Date.now();
					var table = await Table.findOne({
						_id: args.tableId
					});
					let user = await User.findOne({
						_id: args.userId
					});
			

					if(table.gameStarted)
					{

			
					if(args.token== undefined || args.token == null || args.token == "null" || args.token == "")
					{
						args.token = user.jwtToken;
					}
					// if(args.token == user.jwtToken)
					// {

				
					let amount = args.amount;
					let lastamouunt = table.lastBet;
					if (table.lastBlind == true) {
						if (args.action == "Chaal") {
							lastamouunt = table.lastBet + table.lastBet;
						}
					} else {
						if (args.action == "Blind") {
							lastamouunt = table.lastBet / 2;
						}
					}
					let plusamount = lastamouunt + lastamouunt;
					let maxBlindChaalAmount = table.maxBet;
					if (args.action == "Blind")
						maxBlindChaalAmount = maxBlindChaalAmount / 2;
					
					if (amount < lastamouunt || amount < plusamount || amount > maxBlindChaalAmount) {
						args.amount = lastamouunt;
					}

					if(args.amount < table.boot)
					{
						args.amount = table.boot;
					}

				


					let playerssss = table.players;

					if (isActivePlayerforseemycard(args.userId, playerssss) && getActivePlayers(playerssss) > 1) {

						if (args.show)
						{
							await Table.update({
								_id: args.tableId
							}, {
								$set: {
									gameInit: false,
									gameStarted: false,
									turnplayerId : ""
								},
							});
						}

						let timer = table.timer;
						ClearTimer(args.tableId);
						let bet = args.amount;
						let requestid = getRandom();

						
							TransactionChalWin.create({
								userId: mongoose.Types.ObjectId(args.userId),
								tableId: args.tableId,
								gameId: table.lastGameId,
								coins: bet,
								transType: transactionType.CHAL,
								requestId: requestid,
							});
							let remark = "Chaal";
							if (args.show) remark = "Show";
							if (args.blind) remark = "Blind";
							if (table.lastBet < bet) remark = "Increased_Bet";

							let click = "Chaal";
							if (args.show) click = "Show";
							if (args.blind) click = "Blind";



							let idle = false;

							table = await Table.findOne({
								_id: args.tableId
							});
							table.amount += bet;
							playerssss = table.players;

							const userInfo = await User.findOne({ _id: args.userId });
							

							playerssss[user._id].playerInfo.chips = userInfo.chips;
							playerssss[user._id].blindcount = playerssss[user._id].blindcount + 1;
							playerssss[user._id].playerInfo.chips -= bet;
							await User.update({
								_id: user._id
							}, {
								$set: {
									chips: playerssss[user._id].playerInfo.chips
								},
								$inc: {
									lostTp: bet
								}
							});

							playerssss[user._id].totalChalAmount += bet;
						//	playerssss[user._id].noOfTurn = playerssss[user._id].noOfTurn + 1;
							playerssss[user._id].contipack = 0;
							playerssss[user._id].lastAction = args.action;




							// let betRoundCompleted = table.betRoundCompleted + 1;
							// _.forEach(playerssss, function (player) {
							//   if (player.noOfTurn !== table.betRoundCompleted + 1 && !player.packed && player.active && !player.idle) {
							//     betRoundCompleted = table.betRoundCompleted;
							//   }
							// });

							if (!idle) {
								table.lastBet = args.amount;
								table.lastBlind = args.blind;
								playerssss[user._id].lastBet = table.lastBet;
							} else {
								playerssss[user._id].lastBet = bet;
							}


							///////

							// playerssss[user._id].idle_amount = 0;
							// playerssss[user._id].idle = idle;
							// if (idle) {
							//   playerssss[user._id].idle_amount = table.amount;


							//	await Table.update(
							//		{ _id: tableInfo._id },
							//		{ $set: { amount: tableInfo.amount, lastBet: tableInfo.lastBet, players: players, betRoundCompleted, lastBlind: tableInfo.lastBlind } },
							//);

							let avialbleSlots = {};
							table.slotUsedArray.forEach(function(d) {
								avialbleSlots["slot" + d] = "slot" + d;
							});

							//////// placebetonly end

							if (!args.show)
							{
								playerssss = await getNextSlotForTurn(args.userId, playerssss, avialbleSlots, table.maxPlayers, args.tableId);
							}

							await gameAuditService.createAudit(args.tableId, table.cardinfoId, args.userId, table.lastGameId, auditType.USER_TURN, bet, 0, playerssss[args.userId].playerInfo.chips, click, remark + " timer : " + timer, table.amount, playerssss, 0, "");

							//// end placebet


							playerssss[args.userId].noOfTurn = playerssss[args.userId].noOfTurn + 1;
							let betRoundCompleted = table.betRoundCompleted + 1;
								
							_.forEach(playerssss, function(player) {
								if(player.noOfTurn !== betRoundCompleted && !player.packed && player.active && !player.idle) {
									betRoundCompleted = table.betRoundCompleted;
								}
							});

						
						


							table.players = playerssss;


							if (!args.show)
							{
							await Table.update({
								_id: args.tableId
							}, {
								$set: {
									players: playerssss,
									amount: table.amount,
									lastBet: table.lastBet,
									betRoundCompleted: betRoundCompleted,
									lastBlind: table.lastBlind
								}
							});
							}else{
								await Table.update({
									_id: args.tableId
								}, {
									$set: {
										players: playerssss,
										amount: table.amount,
										lastBet: table.lastBet,
										
										lastBlind: table.lastBlind
									}
								});
							}
							table = await Table.findOne({
								_id: args.tableId
							});
							if (args.show || isPotLimitExceeded(table)) {
								let showPlayerId = "";
								if (args.show) {
									showPlayerId = args.userId;
								}
								args.show = true;
								if(showPlayerId == "")
								{
									sio.to(table._id.toString()).emit("notification", {
										message: "Table Show",
										timeout: 4000,
									});
								}

								if(getActivePlayers(table.players) > 1)
								{

									
									winnerService.decideWinner(table, table.players, table.cardinfoId, args.show, showPlayerId, async function(winmsg, players3) {
										table.turnplayerId = "";
										let msg = winmsg;
										// sio.to(args.tableId).emit("betPlaced", {
										// 	bet: args,
										// 	placedBy: args.userId,
										// 	players: table.players,
										// 	table: table,
										// });
	
										// client.emit("showWinner", {
										// 	message: msg,
										// 	bet: args,
										// 	placedBy: args.userId,
										// 	players: players3,
										// 	table: table,
										// 	potLimitExceeded: isPotLimitExceeded(table),
										// });
	
										let playersss88 = JSON.parse(JSON.stringify(players3)); 

										for(let plll in playersss88)
										{
											playersss88[plll].playerInfo.chips = 0;
											playersss88[plll].playerInfo.userName = "***";
										}
										
										let tabllll88 = JSON.parse(JSON.stringify(table)); 
										tabllll88.players = [];

									


										sio.to(args.tableId).emit("showWinner", {
											message: msg,
											bet: args,
											placedBy: args.userId,
											players: playersss88,
											table: tabllll88,
											potLimitExceeded: isPotLimitExceeded(table),
										});
	
										// if (showPlayerId == "")
										// 	newGameService.SwitchTables(args.tableId, client, sio);
	
							
									
										ClearTimer(args.tableId);
										await Table.update({
											_id: args.tableId
										}, {
											$set: {
												gameInit: false,
												gameStarted: false,
												players: players3,
												amount: 0,
												turnplayerId: ""
											}
										});
	
										newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
									});
								}
								
							}
							//24-01-2021
							else if (getActivePlayers(table.players) < 2) {

								

								winnerService.decideWinner(table, table.players, table.cardinfoId, false, "", async function(message, players3) {
									table.turnplayerId = "";


									
									let playersss77 =   JSON.parse(JSON.stringify(players3)); 

									for(let plll in playersss77)
									{
										playersss77[plll].playerInfo.chips = 0;
										playersss77[plll].playerInfo.userName = "***";
									}
									
									let tabllll77 =  JSON.parse(JSON.stringify(table)); 
									tabllll77.players = [];

								


									client.emit("playerPacked", {
										bet: args,
										placedBy: args.userId,
										players: playersss77,
										table: tabllll77,
									});

									sio.to(args.tableId).emit("playerPacked", {
										bet: args.bet,
										placedBy: args.userId,
										players: playersss77,
										table: tabllll77,
									});

									// client.emit("showWinner", {
									// 	message,
									// 	bet: args.bet,
									// 	placedBy: args.userId,
									// 	players: players3,
									// 	table: table,
									// 	packed: true,
									// 	activePlayerCount: 1,
									// });

									sio.to(args.tableId).emit("showWinner", {
										message,
										bet: args.bet,
										placedBy: args.userId,
										players: playersss77,
										table: tabllll77,
										packed: true,
										activePlayerCount: 1,
									});
							
									await Table.update({
										_id: args.tableId
									}, {
										$set: {
											gameInit: false,
											gameStarted: false,
											players: players3,
											amount: 0,
											turnplayerId: ""
										}
									});


									ClearTimer(args.tableId);

									
									



									newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
								});
							} else {

								let card = await CardInfo.findOne({
									_id: table.cardinfoId
								});

								let jokerscard = "";
						
								if(card != null)
									jokerscard = card.jokers;
							
									let playersss66 =  JSON.parse(JSON.stringify(table.players)); 

									for(let plll in playersss66)
									{
										playersss66[plll].playerInfo.chips = 0;
										playersss66[plll].playerInfo.userName = "***";
									}
									
									let tabllll66 =JSON.parse(JSON.stringify( table)); 
									tabllll66.players = [];

								


								client.emit("betPlaced", {
									bet: args,
									placedBy: args.userId,
									players:playersss66,
									table: tabllll66,
									jokers : jokerscard,

									
									
								});

								sio.to(args.tableId).emit("betPlaced", {
									bet: args,
									players:playersss66,
									table: tabllll66,
									placedBy: args.userId,
									jokers : jokerscard
								});

								// client.broadcast.to(table._id).emit("betPlaced", {
								//   bet: args,
								//   placedBy: args.userId,
								//   players: table.players,
								//   table: table,
								// });
								// client.to(table._id).emit("betPlaced", {
								//   bet: args,
								//   placedBy: args.userId,
								//   players: table.players,
								//   table: table,
								// });

								// sio.sockets.in(table._id).emit("betPlaced", {
								//   bet: args,
								//   placedBy: args.userId,
								//   players: table.players,
								//   table: table,
								// });

								for (let posi in table.players) {
									if (table.players[posi].turn == true) {
										ClearTimer(table._id);
										SetTimer(table.players[posi].id, args.tableId, client, sio);
										
									}
								}
							}
						}

						const stop = Date.now();
						let timess = stop - start;

						if(timess > auditType.EXE_BETPLACED)
						{
							exeTimes.create({	gameId: table.lastGameId,
								userId: args.userId,
								remark : args.action,
								exetime : timess + ""
							});
						}

					} else {

				

					}

					// }else{
					// 	let Endgameobj = {
					// 		id: args.userId,
					// 		userName: user.userName,
					// 		message: "Not Active",
					// 	};

					// 	client.emit("OldUser", Endgameobj);

					// 	sio.to(table._id.toString()).emit("OldUser", Endgameobj);
					// }
				//	}
				});


				client.on("respondSideShow", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					//		args = JSON.parse(args);
					const exe_start = Date.now();

					let table = await Table.findOne({
						_id: args.tableId
					});

					if (args.player != null && table.players != null && table.players[args.player.id] && table.players[args.player.id].sideShowTurn) {

						

						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(d) {
							avialbleSlots["slot" + d] = "slot" + d;
						});
						let players1 = table.players,
							msg = "";
						let playerss = resetSideShowTurn(players1);

						if (players1[args.placedTo] == null || players1[args.placedTo].packed == true || players1[args.placedTo].active == false) {
							args.lastAction = "Denied";
							args.bet.lastAction = "Denied";
						}

						if (args.lastAction === "Denied") {
							let players3 = await playerService.setNextPlayerTurn(playerss, avialbleSlots, args.tableId);
							let players = sideShowDenied(args.player.id, players3);

							let remark = "with sideshow";
							await gameAuditService.createAudit(args.tableId, table.cardinfoId, args.player.id, table.lastGameId, auditType.USER_TURN, 0, 0, players[args.player.id].playerInfo.chips, "Denied", remark + " timer : " + table.timer, table.amount, players, 0, "");

							await Table.update({
								_id: args.tableId
							}, {
								$set: {
									players: players
								}
							});
							table = await Table.findOne({
								_id: args.tableId
							});
							msg = [args.player.playerInfo.displayName, " has denied side show"].join("");
							// client.emit("sideShowResponded", {
							// 	message: msg,
							// 	placedBy: args.player.id,
							// 	players: players,
							// 	placeTo: args.placedTo,
							// 	bet: args.bet,
							// 	table: table,
							// });

							let card = await CardInfo.findOne({
								_id: table.cardinfoId
							});

							let jokerscard = "";
						
							if(card != null)
								jokerscard = card.jokers;
						

								let playersss55 =  JSON.parse(JSON.stringify(players)); 

									for(let plll in playersss55)
									{
										playersss55[plll].playerInfo.chips = 0;
										playersss55[plll].playerInfo.userName = "***";
									}
									
									let tabllll55 = JSON.parse(JSON.stringify(table)); 
									tabllll55.players = [];




							sio.to(args.tableId).emit("sideShowResponded", {
								message: msg,
								bet: args.bet,
								placeTo: args.placedTo,
								placedBy: args.player.id,
								players: playersss55,
								table: tabllll55,
								jokers: jokerscard
							});

							for (let posi in players) {
								if (players[posi].turn == true) {
									SetTimer(players[posi].id, args.tableId, client, sio);
									
								}
							}
						} else if (args.lastAction === "Accepted") {

							let players3 = playerService.setNextPlayerTurn(playerss, avialbleSlots, args.tableId);
							sideShowService.sideShowAccepted(args.player.id, args.placedTo, playerss, table, avialbleSlots, async function(message, player, cardsToShow, players) {
								table = await Table.findOne({
									_id: table._id
								});
								// client.emit("sideShowResponded", {
								// 	message: message,
								// 	placedBy: args.player.id,
								// 	placeTo: args.placedTo,
								// 	player: player,
								// 	bet: args.bet,
								// 	players: players,
								// 	table: table,
								// 	cardsToShow: cardsToShow,
								// });


								let card = await CardInfo.findOne({
									_id: table.cardinfoId
								});
								let jokerscard = "";
						
								if(card != null)
									jokerscard = card.jokers;
							

									let playersss44 =  JSON.parse(JSON.stringify(players)); 

									for(let plll in playersss44)
									{
										playersss44[plll].playerInfo.chips = 0;
										playersss44[plll].playerInfo.userName = "***";
									}
									
									let tabllll44 = JSON.parse(JSON.stringify(table)); 
									tabllll44.players = [];

									



								sio.to(args.tableId).emit("sideShowResponded", {
									message: message,
									bet: args.bet,
									placeTo: args.placedTo,
									player: player,
									placedBy: args.player.id,
									players: playersss44,
									table: tabllll44,
									cardsToShow: cardsToShow,
									jokers: jokerscard
								});
								for (let posi in players) {
									if (players[posi].turn == true) {
										SetTimer(players[posi].id, args.tableId, client, sio);
										
									}
								}
								if (getActivePlayers(players) < 2) {
								
									winnerService.decideWinner(table, table.players, table.cardinfoId, args.bet.show, "", async function(winmsg, players, newCardSet) {
										msg = winmsg;
										table.turnplayerId = "";
										// client.emit("showWinner", {
										// 	message: msg,
										// 	players: players,
										// 	table: table,
										// 	potLimitExceeded: isPotLimitExceeded(table),
										// });

										let playersss22 =   JSON.parse(JSON.stringify(players)); 

										for(let plll in playersss22)
										{
											playersss22[plll].playerInfo.chips = 0;
											playersss22[plll].playerInfo.userName = "***";
										}
										
										let tabllll22 =   JSON.parse(JSON.stringify(table)); 
										tabllll22.players = [];

									



										sio.to(args.tableId).emit("showWinner", {
											message: msg,
											players: playersss22,
											table: tabllll22,
											potLimitExceeded: isPotLimitExceeded(table),
										});
								
										await Table.update({
											_id: args.tableId
										}, {
											$set: {
												gameInit: false,
												gameStarted: false,
												players: players,
												amount: 0,
												turnplayerId: ""
											}
										});
										
										ClearTimer(args.tableId);
										






										newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
									});
								}
							});
						}
					} else {
						
					}

					const exe_stop = Date.now();
						let timess = exe_stop - exe_start;

						if(timess > auditType.EXE_SIDESHOWRESPONDED)
						{
							exeTimes.create({	gameId: table.lastGameId,
								userId:  args.player.id,
								remark :"Sideshowrespond",
								exetime : timess + ""
							});
						}


				});

				client.on("placeSideShow", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					//	args = JSON.parse(args);
					const exe_start = Date.now();
					let table = await Table.findOne({
						_id: args.tableId
					});
					console.log("placeSideShow. gameid " + table.lastGameId + " , placedTo " + args.placedTo);
					let sideShowMessage = "";
					let timerr = table.timer;
					ClearTimer(args.tableId);
					let avialbleSlots = {};
					table.slotUsedArray.forEach(function(d) {
						avialbleSlots["slot" + d] = "slot" + d;
					});

					let playerssssss = getLastActivePlayer(args.player.id, table.players, avialbleSlots, 5);

					args.placedTo = playerssssss.id;

					let players1 = table.players;
				

					let requestid = getRandom();

					

						table.amount += args.bet.amount;
						const userInfo = await User.findOne({ _id: args.player.id });
						
						players1[args.player.id].playerInfo.chips = userInfo.chips;
						players1[args.player.id].playerInfo.chips -= args.bet.amount;
						console.warn("user chipsss: : : ",userInfo.chips , "amount : ",args.bet.amount," chips : ", players1[args.player.id].playerInfo.chips);
						await User.update({
							_id: args.player.id
						}, {
							$set: {
								chips: players1[args.player.id].playerInfo.chips
							},
							$inc: {
								lostTp: args.bet.amount
							}
						});

						players1[args.player.id].totalChalAmount += args.bet.amount;
					

						// players1[args.player.id].idle_amount = 0;
						// players1[args.player.id].idle = idle;
						// if (idle) {
						// 	players1[id].idle_amount = table.amount;
						// }

						//	Table.update(
						//		{ _id: tableInfo._id },
						//		{ $set: { amount: tableInfo.amount, lastBet: tableInfo.lastBet, players: players, betRoundCompleted, lastBlind: tableInfo.lastBlind } },
						//	);

						let newPlayer = getLastActivePlayer(args.player.id, players1, avialbleSlots, table.maxPlayers);
						players1[newPlayer.id].sideShowTurn = true;
						//return players;


						let tableAmount = table.amount;
						let remark = "with " + players1[newPlayer.id].playerInfo.userName;
						//  await Table.update({ _id: table._id }, { $set: { amount: tableAmount } });


						players1[args.player.id].noOfTurn = players1[args.player.id].noOfTurn + 1;
						let betRoundCompleted = table.betRoundCompleted + 1;
								
							_.forEach(players1, function(player) {
								if(player.noOfTurn !== betRoundCompleted && !player.packed && player.active && !player.idle) {
									betRoundCompleted = table.betRoundCompleted;
								}
							});

							

						await Table.update({
							_id: args.tableId
						}, {
							$set: {
								players: players1,
								amount: table.amount,
								lastBet: table.lastBet,
								betRoundCompleted,
								lastBlind: table.lastBlind
							}
						});
						await gameAuditService.createAudit(args.tableId, table.cardinfoId, args.player.id, table.lastGameId, auditType.USER_TURN, args.bet.amount, 0, players1[args.player.id].playerInfo.chips, "SideShowPlace", remark + " timer : " + timerr,  tableAmount, players1, 0, "");

						////////////// placeside show respond

						sideShowMessage = [getDotDotName(players1[args.player.id].playerInfo.displayName), " placed SideShow"].join("");

						if (isPotLimitExceeded(table) ) {





							args.bet.show = true;

							if(args.bet.show == true)
							{
								sio.to(table._id.toString()).emit("notification", {
									message: "Table Show",
									timeout: 4000,
								});
							}
							
							
							winnerService.decideWinner(table, players1, table.cardinfoId, args.bet.show, "", async function(msg, players1) {
								table.turnplayerId = "";
								// client.emit("showWinner", {
								// 	message: msg,
								// 	bet: args.bet,
								// 	placedBy: args.player.id,
								// 	placedTo: args.placedTo,
								// 	players: players1,
								// 	table: table,
								// 	potLimitExceeded: isPotLimitExceeded(table),
								// });

								let playersss21 = JSON.parse(JSON.stringify(players1));

								for(let plll in playersss21)
								{
									playersss21[plll].playerInfo.chips = 0;
									playersss21[plll].playerInfo.userName = "***";
								}
								
								let tabllll21 =  JSON.parse(JSON.stringify(table));
								tabllll21.players = [];

								


								sio.to(args.tableId.toString()).emit("showWinner", {
									message: msg,
									bet: args.bet,
									placedBy: args.player.id,
									placedTo: args.placedTo,
									players: playersss21,
									table: tabllll21,
									potLimitExceeded: isPotLimitExceeded(table),
								});
							
								await Table.update({
									_id: args.tableId
								}, {
									$set: {
										gameInit: false,
										gameStarted: false,
										amount: 0,
										turnplayerId: ""
									}
								});
							
								ClearTimer(args.tableId);
								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});
								

								//newGameService.SwitchTables(args.tableId, client, sio);
								newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
							});
						} else {
							// client.emit("sideShowPlaced", {
							// 	message: sideShowMessage,
							// 	bet: args.bet,
							// 	placedBy: args.player.id,
							// 	placedTo: args.placedTo,
							// 	players: players1,
							// 	table: table,
							// });


							let playersss23 =  JSON.parse(JSON.stringify(players1));

							for(let plll in playersss23)
							{
								playersss23[plll].playerInfo.chips = 0;
								playersss23[plll].playerInfo.userName = "***";
							}
							
							let tabllll23 = JSON.parse(JSON.stringify(table));
							tabllll23.players = [];

							


							sio.to(args.tableId.toString()).emit("sideShowPlaced", {
								message: sideShowMessage,
								bet: args.bet,
								placedBy: args.player.id,
								placedTo: args.placedTo,
								players: playersss23,
								table: tabllll23,
							});

						
							SetTimer(args.placedTo, args.tableId, client, sio, 16000, true, args.player.id);

							const exe_stop = Date.now();
							let timess = exe_stop - exe_start;
	
							if(timess > auditType.EXE_SIDESHOWPPLACED)
							{
								exeTimes.create({	gameId: table.lastGameId,
									userId: args.player.id,
									remark :"sideshow placed",
									exetime : timess + ""
								});
							}

						}
					//}
				});


				client.on("disconnect", async function() {
				

					console.log("disconnect");



					let query = [{
							$match: {
								clientId: client.id
							}
						},
						{
							$lookup: {
								from: "tables",
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
						await gameAuditService.createAudit(table._id, '', player._id, table.lastGameId, auditType.DISCONNECT, 0, 0, player.chips, 'Disconnect 00', 'Disconnect 00', 0, table.players, 0, '');



						await User.update({
							_id: player._id
						}, {
							$set: {
								isplaying: "no"
							}
						});
						let tableData = await Table.findOne({
							_id: table._id
						});

						console.log("disconnect +++++++++++++++++++++++++++++++ player " + player.userName);
						try{
						if (tableData.players == null || !tableData.players[player._id]) {
							
							await User.update({
								_id: player._id
							}, {
								$set: {
									clientId: "",
									forcedisconnect: true
								}
							});

							//   await User.update({ _id:player._id  }, { $set: {forcedisconnect :  true,  lasttableId: "" } });

							setTimeout(async function() {

								let playeraaa = await User.findOne({
									_id: player._id
								});

							

								if (playeraaa.clientId == "") {

									
									await User.update({
										_id: playeraaa._id
									}, {
										$set: {
											lasttableId: ""
										}
									});
								}

							}, 7000);

						}

						}catch(error)
						{

						}
					
						if (tableData.gameType != 1) {
							if (tableData.players != null && tableData.players[player._id]) {


								if (tableData.players != null && tableData.players[player._id]) {

								
									tableData.players[player._id].disconnect = true;

									await Table.update({
										_id: table._id
									}, {
										$set: {
											players: tableData.players,
										},
									});
								}


								table = await Table.findOne({
									_id: table._id
								});
								if (!table.gameStarted && table.players != null && table.players[player._id]) {

									setTimeout(async function() {
										table = await Table.findOne({
											_id: table._id
										});
										if (table.players != null && table.players[player._id] && table.players[player._id].disconnect) {
											let userId = player._id;
											let tableId = table._id

											let user = await User.findOne({
												_id: userId
											});
											//   await userTableInOutService.tableInOut(tableId, userId, 'Out');

											await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 2', 'Disconnect 2', 0, '', 0, '');

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

											let playersss445 =   JSON.parse(JSON.stringify(players));

											for(let plll in playersss445)
											{
												playersss445[plll].playerInfo.chips = 0;
												playersss445[plll].playerInfo.userName = "***";
											}
											
											let tabllll445 =  JSON.parse(JSON.stringify(tableInfo));
											tabllll445.players = [];


										

											sio.to(table._id.toString()).emit("playerLeft", {
												bet: {
													lastAction: "Packed",
													lastBet: "",
												},
												removedPlayer: removedPlayer,
												placedBy: removedPlayer.id,
												players: playersss445,
												table: tabllll445,
											});


											//args
											let playerLength = getActivePlayers(players);
											if (playerLength == 1 && tableInfo.gameStarted) {
												
												winnerService.decideWinner(tableInfo, tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
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

													let playersss776 =  JSON.parse(JSON.stringify(players1));

													for(let plll in playersss776)
													{
														playersss776[plll].playerInfo.chips = 0;
														playersss776[plll].playerInfo.userName = "***";
													}
													
													let tabllll776 = JSON.parse(JSON.stringify(tableInfo));
													tabllll776.players = [];

													


													sio.to(tableInfo._id.toString()).emit("showWinner", {
														message,
														bet: {
															lastAction: "Packed",
															lastBet: "",
														},
														placedBy: removedPlayer.id,
														players: playersss776,
														table: tabllll776,
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
													
													newGameService.startNewGame(client, table._id.toString(), avialbleSlots, sio);
												});
											} else if (playerLength == 1 && !tableInfo.gameStarted) {
												
												ClearTimer(tableInfo._id.toString());
												// client.emit("notification", {
												// 	message: "Please wait for more players to join",
												// 	timeout: 4000,
												// });
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
														turnplayerId: ""
													},
												});

												let avialbleSlots = {};
												tableInfo.slotUsedArray.forEach(function(d) {
														avialbleSlots["slot" + d] = "slot" + d;
													});
												newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

												
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

												let avialbleSlots = {};
												tableInfo.slotUsedArray.forEach(function(d) {
														avialbleSlots["slot" + d] = "slot" + d;
													});
												newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
											}




										}

									}, 10000);



								}

							}


						} else {


							if (tableData.players != null && tableData.players[player._id]) {

								tableData.players[player._id].disconnect = true;


								await Table.update({
									_id: table._id
								}, {
									$set: {
										players: tableData.players,
									},
								});
							}




							setTimeout(async function() {
								table = await Table.findOne({
									_id: table._id
								});

								var playersTTT = table.players;

								for (let position in playersTTT) {

									var userId = playersTTT[position].id;
								
									let user = await User.findOne({ _id: userId });
									let player = user;
									table = await Table.findOne({
										_id: table._id
									});
			
								
									if (table.players != null && table.players[player._id] && table.players[player._id].disconnect) {


										player = await User.findOne({
											_id: player._id
										});

										table = await Table.findOne({
											_id: table._id
										});

										if (table.players && table.players[player._id]) {

											let user = await User.findOne({
												_id: player._id
											});
											// await userTableInOutService.tableInOut(table._id, player._id, "Out");

											await gameAuditService.createAudit(table._id, "", player._id, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, "Disconnect 3", "Disconnect 3", 0, "", 0, "");

											let avialbleSlots = {};
											table.slotUsedArray.forEach(function(f) {
												avialbleSlots["slot" + f] = "slot" + f;
											});
											if (table.gameStarted && isActivePlayer(user.id, table.players)) {
												let maxPlayers = 5;
												let players1 = await betService.packPlayer(user.id, table.players, avialbleSlots, maxPlayers, table);
												let removedPlayer = await playerService.removePlayer(user.id, players1, avialbleSlots, table.slotUsedArray, table);

												await User.update({
													_id: user.id
												}, {
													$set: {
														isplaying: "no"
													}
												});
												//   args
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

												
												let playersss0101 =   JSON.parse(JSON.stringify(players));

												for(let plll in playersss0101)
												{
													playersss0101[plll].playerInfo.chips = 0;
													playersss0101[plll].playerInfo.userName = "***";
												}
												
												let tabllll0101 = JSON.parse(JSON.stringify(tableInfo));
												tabllll0101.players = [];

												


												sio.to(table._id.toString()).emit("playerLeft", {
													bet: {
														lastAction: "Packed",
														lastBet: "",
													},
													removedPlayer: removedPlayer,
													placedBy: removedPlayer.id,
													players: playersss0101,
													table: tabllll0101,
												});
												let playerLength = getActivePlayers(players);


												/* for (let posi in players) {
					if (players[posi].turn == true)
					SetTimer(players[posi].id, tableInfo._id,client, sio);
					}
	*/

												if (playerLength == 1 && tableInfo.gameStarted) {
													
													winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {

														tableInfo.turnplayerId = "";
														// client.emit("showWinner", {
														// 	message,
														// 	bet: {
														// 		lastAction: "Packed",
														// 		lastBet: "",
														// 	},
														// 	placedBy: removedPlayer.id,
														// 	players: players,
														// 	table: tableInfo,
														// 	packed: true,
														// 	activePlayerCount: 1,
														// });


														let playersssw =  JSON.parse(JSON.stringify(players));

														for(let plll in playersssw)
														{
															playersssw[plll].playerInfo.chips = 0;
															playersssw[plll].playerInfo.userName = "***";
														}
														
														let tabllllw = JSON.parse(JSON.stringify(tableInfo));
														tabllllw.players = [];

														tableInfo = await Table.findOne({
															_id: tableInfo._id
														});
														players = tableInfo.players;



														sio.to(table._id.toString()).emit("showWinner", {
															message,
															bet: {
																lastAction: "Packed",
																lastBet: "",
															},
															placedBy: removedPlayer.id,
															players: playersssw,
															table: tabllllw,
															packed: true,
															activePlayerCount: 1,
														});
												
														
														ClearTimer(table._id);
														await Table.update({
															_id: table._id
														}, {
															$set: {
																gameInit: false,
																gameStarted: false,
																slotUsed: 1,
																amount: 0,
																players: players,
																turnplayerId: ""
															},
														});
														let avialbleSlots = {};
														table.slotUsedArray.forEach(function(d) {
															avialbleSlots["slot" + d] = "slot" + d;
														});
														
														newGameService.startNewGame(client, table._id, avialbleSlots, sio);
													});
													// args
												} else if (playerLength && !tableInfo.gameStarted) {
													
													ClearTimer(table._id);
													// client.emit("notification", {
													// 	message: "Please wait for more players to join",
													// 	timeout: 4000,
													// });
													sio.to(table._id.toString()).emit("notification", {
														message: "Please wait for more players to join",
														timeout: 4000,
													});
													let sentObj = {
														players,
														table: tableInfo
													};
												//	client.emit("resetTable", sentObj);
													sio.to(table._id.toString()).emit("resetTable", sentObj);

													let avialbleSlots = {};
													tableInfo.slotUsedArray.forEach(function(d) {
															avialbleSlots["slot" + d] = "slot" + d;
														});
													newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);


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

													let avialbleSlots = {};
													tableInfo.slotUsedArray.forEach(function(d) {
															avialbleSlots["slot" + d] = "slot" + d;
														});
													newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
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

												let tableInfo = await Table.findOne({
													_id: table._id
												});
												let players = tableInfo.players;
												let slot = getActivePlayers(players);


												
												let playersssq =   JSON.parse(JSON.stringify(players));

												for(let plll in playersssq)
												{
													playersssq[plll].playerInfo.chips = 0;
													playersssq[plll].playerInfo.userName = "***";
												}
												
												let tabllllq =  JSON.parse(JSON.stringify(tableInfo));
												tabllllq.players = [];

												

												sio.to(table._id.toString()).emit("playerLeft", {
													bet: {
														lastAction: "Packed",
														lastBet: "",
													},
													removedPlayer: removedPlayer,
													placedBy: removedPlayer.id,
													players: playersssq,
													table: tabllllq,
												});

												/*    for (let posi in players) {
												args
													if (players[posi].turn == true)
													SetTimer(players[posi].id, tableInfo._id,client, sio);
													}
													*/
												let playerLength = getActivePlayers(players);
												if (playerLength == 1 && table.gameStarted) {
													
													winnerService.decideWinner(table, players, table.cardinfoId, false, "", async function(message, players1) {
														table.turnplayerId = "";

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

														let playersssa = JSON.parse(JSON.stringify(players1));

														for(let plll in playersssa)
														{
															playersssa[plll].playerInfo.chips = 0;
															playersssa[plll].playerInfo.userName = "***";
														}
														
														let tablllla =  JSON.parse(JSON.stringify(table));
														tablllla.players = [];

														

														sio.to(table._id.toString()).emit("showWinner", {
															message,
															bet: {
																lastAction: "Packed",
																lastBet: "",
															},
															placedBy: removedPlayer.id,
															players: playersssa,
															table: tablllla,
															packed: true,
															activePlayerCount: 1,
														});
													
														
														ClearTimer(table._id);
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
														
														newGameService.startNewGame(client, table._id, avialbleSlots, sio);
													});
												} else if (playerLength == 1 && !tableInfo.gameStarted) {


													let gameaudit = await GameAudit.findOne({
														gameId: tableInfo.lastGameId,
														auditType : "WINNER"
													});
					
													//console.warn("......................gameaudit ",gameaudit);
					
													if(gameaudit == null   && tableInfo.amount != 0 )
													{
														console.warn("......................gameaudit ");
														winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
															tableInfo.turnplayerId = "";
															let playersss56 =  JSON.parse(JSON.stringify(players));
															for(let plll in playersss56)
															{
																playersss56[plll].playerInfo.chips = 0;
																playersss56[plll].playerInfo.userName = "***";
															}
															
															let tabllll56 = JSON.parse(JSON.stringify(tableInfo));
															tabllll56.players = [];
															sio.to(args.tableId).emit("showWinner", {
																message,
																bet: {
																	lastAction: "Packed",
																	lastBet: "",
																},
																placedBy: removedPlayer.id,
																players: playersss56,
																table: tabllll56,
																packed: true,
																activePlayerCount: 1,
															});
														
															
															ClearTimer(args.tableId);
															await Table.update({
																_id: args.tableId
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
															
															newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
														});
													}
								
													
													
													
													ClearTimer(table._id);
													// client.emit("notification", {
													// 	message: "Please wait for more players to join",
													// 	timeout: 4000,
													// });
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
												} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {

													
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
											}
										}






									

									}

								}

							}, 10000);



						}

						socketClient.addanddeleteRobot(tableData);
					}

					

				});

				client.on("Forcedisconnect", async function(args) {

					try{
						args = JSON.parse(args);
					}catch(error)
					{

					}
					
					console.log("forcedisconnecttt: ", args);
					const table_length = await Table.findOne({ _id:  args.tableId }).count();
					if(table_length <= 0){
						
						
					}else{


					const exe_start = Date.now();
					let player = await User.findOne({
						_id: args.userId
					});

					var table = await Table.findOne({
						_id: args.tableId
					});

				

					// await User.update({
					// 	_id: player._id
					// }, {
					// 	$set: {
					// 		lasttableId: ""
					// 	}
					// });


					if (table.players != null && table.players[player._id]) {
						table.players[player._id].forcedisconnect = true;
						await User.update({
							_id: player._id
						}, {
							$set: {
								forcedisconnect: true,
						//		lasttableId: ""
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
					table = await Table.findOne({
						_id: args.tableId
					});
					if (table.players && table.players[player._id]) {

						let user = await User.findOne({
							_id: player._id
						});
						
						await gameAuditService.createAudit(args.tableId, "", player._id, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, "Disconnect 1", "Disconnect 1", 0, "", 0, "");

						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(f) {
							avialbleSlots["slot" + f] = "slot" + f;
						});

						if (table.gameStarted && isActivePlayer(user.id, table.players)) {
							let maxPlayers = 5;

							console.log("force disconnect remove player");
							let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);


							await User.update({
								_id: user.id
							}, {
								$set: {
									isplaying: "no"
								}
							});

							let tableInfo = await Table.findOne({
								_id: args.tableId
							});
							let players = tableInfo.players;

						

							if (getActivePlayers(players) < 2) {
								_.map(players, function(player) {
									player.turn = false;
									return player;
								});
							}
							

							let playersss45 = JSON.parse(JSON.stringify(players));

							for(let plll in playersss45)
							{
								playersss45[plll].playerInfo.chips = 0;
								playersss45[plll].playerInfo.userName = "***";
							}
							
							let tabllll45 = JSON.parse(JSON.stringify(tableInfo));
							tabllll45.players = [];

						

							sio.to(args.tableId).emit("playerLeft", {
								bet: {
									lastAction: "Packed",
									lastBet: "",
								},
								removedPlayer: removedPlayer,
								placedBy: removedPlayer.id,
								players: playersss45,
								table: tabllll45,
							});
							let playerLength = getActivePlayers(players);



							if (playerLength == 1 && tableInfo.gameStarted) {
								
								winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
									tableInfo.turnplayerId = "";
									


									let playersss56 =  JSON.parse(JSON.stringify(players));

									for(let plll in playersss56)
									{
										playersss56[plll].playerInfo.chips = 0;
										playersss56[plll].playerInfo.userName = "***";
									}
									
									let tabllll56 = JSON.parse(JSON.stringify(tableInfo));
									tabllll56.players = [];

								


									sio.to(args.tableId).emit("showWinner", {
										message,
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										placedBy: removedPlayer.id,
										players: playersss56,
										table: tabllll56,
										packed: true,
										activePlayerCount: 1,
									});
								
									
									ClearTimer(args.tableId);
									await Table.update({
										_id: args.tableId
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
									
									newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
								});
							} else if (playerLength && !tableInfo.gameStarted) {

								

								ClearTimer(args.tableId);
								// client.emit("notification", {
								// 	message: "Please wait for more players to join",
								// 	timeout: 4000,
								// });
								sio.to(args.tableId).emit("notification", {
									message: "Please wait for more players to join",
									timeout: 4000,
								});
								let sentObj = {
									players,
									table: tableInfo
								};
							//	client.emit("resetTable", sentObj);
								sio.to(args.tableId).emit("resetTable", sentObj);

								let avialbleSlots = {};
								tableInfo.slotUsedArray.forEach(function(d) {
										avialbleSlots["slot" + d] = "slot" + d;
									});
								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);


							} else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {

								console.warn("....................222.............................manually winnerssss...................................................................................................................................");

								ClearTimer(args.tableId);
								await Table.update({
									_id: args.tableId
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
								tableInfo.slotUsedArray.forEach(function(d) {
										avialbleSlots["slot" + d] = "slot" + d;
									});
								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

							}



						} else {
							console.log("force disconnect remove player 2");
							let removedPlayer = await playerService.removePlayer(user.id, table.players, avialbleSlots, table.slotUsedArray, table);

							await User.update({
								_id: user.id
							}, {
								$set: {
									isplaying: "no"
								}
							});

							let tableInfo = await Table.findOne({
								_id: args.tableId
							});
							let players = tableInfo.players;
							let slot = getActivePlayers(players);

							
							let playersss444 =  JSON.parse(JSON.stringify(players));

							for(let plll in playersss444)
							{
								playersss444[plll].playerInfo.chips = 0;
								playersss444[plll].playerInfo.userName = "***";
							}
							
							let tabllll4545 =  JSON.parse(JSON.stringify(tableInfo));
							tabllll4545.players = [];


						

							

							sio.to(args.tableId).emit("playerLeft", {
								bet: {
									lastAction: "Packed",
									lastBet: "",
								},
								removedPlayer: removedPlayer,
								placedBy: removedPlayer.id,
								players: playersss444,
								table: tabllll4545,
							});

							/*    for (let posi in players) {
							      if (players[posi].turn == true)
							       SetTimer(players[posi].id, tableInfo._id,client, sio);
							      }
							      */
							let playerLength = getActivePlayers(players);
							if (playerLength == 1 && table.gameStarted) {
								
								winnerService.decideWinner(table, players, table.cardinfoId, false, "", async function(message, players1) {
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

									let playersss43 =   JSON.parse(JSON.stringify(players1));

									for(let plll in playersss43)
									{
										playersss43[plll].playerInfo.chips = 0;
										playersss43[plll].playerInfo.userName = "***";
									}
									
									let tabllll43 = JSON.parse(JSON.stringify(tableInfo));
									tabllll43.players = [];

									
									


									sio.to(args.tableId).emit("showWinner", {
										message,
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										placedBy: removedPlayer.id,
										players: playersss43,
										table: tabllll43,
										packed: true,
										activePlayerCount: 1,
									});
								
									
									ClearTimer(args.tableId);
									await Table.update({
										_id: args.tableId
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
									
									newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
								});
							} else if (playerLength == 1 && !tableInfo.gameStarted) {

								let gameaudit = await GameAudit.findOne({
									gameId: tableInfo.lastGameId,
									auditType : "WINNER"
								});

								//console.warn("......................gameaudit ",gameaudit);

								if(gameaudit == null   && tableInfo.amount != 0 )
								{
									console.warn("......................gameaudit ");
									winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
										tableInfo.turnplayerId = "";
										let playersss56 =  JSON.parse(JSON.stringify(players));
										for(let plll in playersss56)
										{
											playersss56[plll].playerInfo.chips = 0;
											playersss56[plll].playerInfo.userName = "***";
										}
										
										let tabllll56 = JSON.parse(JSON.stringify(tableInfo));
										tabllll56.players = [];
										sio.to(args.tableId).emit("showWinner", {
											message,
											bet: {
												lastAction: "Packed",
												lastBet: "",
											},
											placedBy: removedPlayer.id,
											players: playersss56,
											table: tabllll56,
											packed: true,
											activePlayerCount: 1,
										});
									
										
										ClearTimer(args.tableId);
										await Table.update({
											_id: args.tableId
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
										
										newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
									});
								}
								
								
								ClearTimer(args.tableId);
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
										turnplayerId: "",
									},
								});
							} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
								
								ClearTimer(args.tableId);
								await Table.update({
									_id: args.tableId
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
								tableInfo.slotUsedArray.forEach(function(d) {
										avialbleSlots["slot" + d] = "slot" + d;
									});
								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

							
							
							}
						}
					}




					 table = await Table.findOne({
						_id: args.tableId
					});
					var playersTTT = table.players;

					

					for (let position in playersTTT) {

						var userId = playersTTT[position].id;
					
						let user = await User.findOne({ _id: userId });
						let player = user;
						table = await Table.findOne({
							_id: args.tableId
						});

						
						if(playersTTT[position].disconnect || playersTTT[position].forcedisconnect || user.forcedisconnect)
						{
							
							if (table.players && table.players[player._id]) {

								await gameAuditService.createAudit(args.tableId, table.cardinfoId, player._id, table.lastGameId, auditType.USER_TURN, 0, 0, table.players[player._id].playerInfo.chips, "standup", "standup 5", table.amount, table.players, 0, "");
								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(f) {
									avialbleSlots["slot" + f] = "slot" + f;
								});
		
								if (table.gameStarted && isActivePlayer(userId, table.players)) {
									let maxPlayers = 5;
								//	let players1 = await betService.packPlayer(args.userId, table.players, avialbleSlots, maxPlayers, table);
									let removedPlayer = await playerService.removePlayer(userId, table.players, avialbleSlots, table.slotUsedArray, table);
		
									let tableInfo = await Table.findOne({
										_id: args.tableId
									});
									let players = tableInfo.players;

									
									let playersss34 =  JSON.parse(JSON.stringify(players));

									for(let plll in playersss34)
									{
										playersss34[plll].playerInfo.chips = 0;
										playersss34[plll].playerInfo.userName = "***";
									}
									
									let tabllll34 = JSON.parse(JSON.stringify(tableInfo));
									tabllll34.players = [];

									

		
									sio.to(args.tableId).emit("playerLeft", {
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										removedPlayer: removedPlayer,
										placedBy: removedPlayer.id,
										players: playersss34,
										table: tabllll34,
									});
		
									let playerLength = getActivePlayers(players);
									if (playerLength == 1 && tableInfo.gameStarted) {
										
										winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
											tableInfo.turnplayerId = "";
											// client.emit("showWinner", {
											// 	message,
											// 	bet: {
											// 		lastAction: "Packed",
											// 		lastBet: "",
											// 	},
											// 	placedBy: removedPlayer.id,
											// 	players: players,
											// 	table: tableInfo,
											// 	packed: true,
											// 	activePlayerCount: 1,
											// });

											let playersss2 = JSON.parse(JSON.stringify(players));

											for(let plll in playersss2)
											{
												playersss2[plll].playerInfo.chips = 0;
												playersss2[plll].playerInfo.userName = "***";
											}
											
											let tabllll2 =  JSON.parse(JSON.stringify(tableInfo));
											tabllll2.players = [];

											
											
											
											sio.to(args.tableId).emit("showWinner", {
												message,
												bet: {
													lastAction: "Packed",
													lastBet: "",
												},
												placedBy: removedPlayer.id,
												players: playersss2,
												table: tabllll2,
												packed: true,
												activePlayerCount: 1,
											});
							
											
											ClearTimer(args.tableId);
											await Table.update({
												_id: args.tableId
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
											
											newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
										});
									} else if (playerLength && !tableInfo.gameStarted) {
		
										// client.emit("notification", {
										// 	message: "Please wait for more players to join",
										// 	timeout: 4000,
										// });
										sio.to(args.tableId).emit("notification", {
											message: "Please wait for more players to join",
											timeout: 4000,
										});
										let sentObj = {
											players,
											table: tableInfo
										};
		
										let avialbleSlots = {};
										table.slotUsedArray.forEach(function(d) {
											avialbleSlots["slot" + d] = "slot" + d;
										});
		
										newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
		
										//client.emit("resetTable", sentObj);
										sio.to(args.tableId).emit("resetTable", sentObj);
									} else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {
										await Table.update({
											_id: args.tableId
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
										tableInfo.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

										
									}
								} else {
									
									let removedPlayer = await playerService.removePlayer(userId, table.players, avialbleSlots, table.slotUsedArray, table);
		
		
									var tableInfo = await Table.findOne({
										_id: args.tableId
									});
									let players = tableInfo.players;
									let slot = getActivePlayers(players);


									let playersss1 =   JSON.parse(JSON.stringify(players));

									for(let plll in playersss1)
									{
										playersss1[plll].playerInfo.chips = 0;
										playersss1[plll].playerInfo.userName = "***";
									}
									
									let tabllll1 =  JSON.parse(JSON.stringify(tableInfo));
									tabllll1.players = [];

								
		
		
									sio.to(args.tableId).emit("playerLeft", {
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										removedPlayer: removedPlayer,
										placedBy: removedPlayer.id,
										players: playersss1,
										table: tabllll1,
									});
									let playerLength = getActivePlayers(players);
		
									if (playerLength == 1 && tableInfo.gameStarted) {
										
										winnerService.decideWinner(tableInfo, tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
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

											let playersss3 =  JSON.parse(JSON.stringify(players1));

											for(let plll in playersss3)
											{
												playersss3[plll].playerInfo.chips = 0;
												playersss3[plll].playerInfo.userName = "***";
											}
											
											let tabllll3 = JSON.parse(JSON.stringify(tableInfo));
											tabllll3.players = [];

											

											sio.to(args.tableId).emit("showWinner", {
												message,
												bet: {
													lastAction: "Packed",
													lastBet: "",
												},
												placedBy: removedPlayer.id,
												players: playersss3,
												table: tabllll3,
												packed: true,
												activePlayerCount: 1,
											});
								
											
											ClearTimer(args.tableId);
											await Table.update({
												_id: args.tableId
											}, {
												$set: {
													gameInit: false,
													gameStarted: false,
													amount: 0,
													slotUsed: 1,
													players: players1,
													turnplayerId: "",
												},
											});
											let avialbleSlots = {};
											table.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
											
											newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
										});
									} else if (getActivePlayers(table.players) == 1 && !tableInfo.gameStarted) {
		
										
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
												turnplayerId: "",
											},
										});

										let avialbleSlots = {};
										tableInfo.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

										
									} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
										await Table.update({
											_id: args.tableId
										}, {
											$set: {
												gameInit: false,
												gameStarted: false,
												slotUsed: 0,
												players: {},
												turnplayerId: "",
											},
										});
									}else  if(!table.gameStarted){

										await Table.update({
											_id: table._id
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
										table.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, table._id.toString(), avialbleSlots, sio);
										
									}
								}
							}
		
						}
				
					}


							const exe_stop = Date.now();
							let timess = exe_stop - exe_start;
	
							if(timess > auditType.EXE_FORCEDISCONNECT)
							{
								exeTimes.create({	gameId: table.lastGameId,
									userId: args.userId,
									remark : "Forece Disconnect",
									exetime : timess + ""
								});
							}
				socketClient.addanddeleteRobot(table);

					}



					

				});




				//standup from table and watch game only
				client.on("standUp", async function(args) {
					try{
						args = JSON.parse(args);
					}catch(error)
					{}
					const exe_start = Date.now();
					let player = await User.findOne({
						_id: args.userId
					});
					let table = await Table.findOne({
						_id: args.tableId
					});

					console.log("standup. gameid 22 " + table.lastGameId + " , userid " + args.userId);

					if (table.players && table.players[player._id]) {
						table.players[player._id].forcedisconnect = true;
				
						await User.update({
							_id: player._id
						}, {
							$set: {
								forcedisconnect: true
							}
						});


					}
					console.log("standup.  1 " );
					if (table.players && table.players[player._id]) {

						await gameAuditService.createAudit(args.tableId, table.cardinfoId, player._id, table.lastGameId, auditType.USER_TURN, 0, 0, table.players[player._id].playerInfo.chips, "standup 2", "standup 2", table.amount, table.players, 0, "");
						let avialbleSlots = {};
						table.slotUsedArray.forEach(function(f) {
							avialbleSlots["slot" + f] = "slot" + f;
						});

						console.warn("standup game start  ", table.gameStarted);
						console.log("standup. 2 0" );
						if (table.gameStarted && isActivePlayer(args.userId, table.players)) {
							let maxPlayers = 5;
							console.log("standup. 2 6" );
						//	let players1 = await betService.packPlayer(args.userId, table.players, avialbleSlots, maxPlayers, table);
							let removedPlayer = await playerService.removePlayer(args.userId, table.players, avialbleSlots, table.slotUsedArray, table);

							let tableInfo = await Table.findOne({
								_id: args.tableId
							});
							let players = tableInfo.players;


							let playersss3 =  JSON.parse(JSON.stringify(players));

							for(let plll in playersss3)
							{
								playersss3[plll].playerInfo.chips = 0;
								playersss3[plll].playerInfo.userName = "***";
							}
							
							let tabllll3 = JSON.parse(JSON.stringify(tableInfo));
							tabllll3.players = [];


						

							sio.to(args.tableId).emit("playerLeft", {
								bet: {
									lastAction: "Packed",
									lastBet: "",
								},
								removedPlayer: removedPlayer,
								placedBy: removedPlayer.id,
								players: playersss3,
								table: tabllll3,
							});

							let playerLength = getActivePlayers(players);
							if (playerLength == 1 && tableInfo.gameStarted) {
							
								winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
									tableInfo.turnplayerId = "";
									// client.emit("showWinner", {
									// 	message,
									// 	bet: {
									// 		lastAction: "Packed",
									// 		lastBet: "",
									// 	},
									// 	placedBy: removedPlayer.id,
									// 	players: players,
									// 	table: tableInfo,
									// 	packed: true,
									// 	activePlayerCount: 1,
									// });


									let playersss5 =  JSON.parse(JSON.stringify(players));

									for(let plll in playersss5)
									{
										playersss5[plll].playerInfo.chips = 0;
										playersss5[plll].playerInfo.userName = "***";
									}
									
									let tabllll5 =  JSON.parse(JSON.stringify(tableInfo));
									tabllll5.players = [];


									

									sio.to(args.tableId).emit("showWinner", {
										message,
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										placedBy: removedPlayer.id,
										players: playersss5,
										table: tabllll5,
										packed: true,
										activePlayerCount: 1,
									});
							
									
									ClearTimer(args.tableId);
									await Table.update({
										_id: args.tableId
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
									
									newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
								});
								console.log("standup.  080 ");
							} else if (playerLength && !tableInfo.gameStarted) {

								// client.emit("notification", {
								// 	message: "Please wait for more players to join",
								// 	timeout: 4000,
								// });
								sio.to(args.tableId).emit("notification", {
									message: "Please wait for more players to join",
									timeout: 4000,
								});
								let sentObj = {
									players,
									table: tableInfo
								};

								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(d) {
									avialbleSlots["slot" + d] = "slot" + d;
								});

								newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);

							//	client.emit("resetTable", sentObj);
								sio.to(args.tableId).emit("resetTable", sentObj);

								console.log("standup.  099 ");
							} else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {
								await Table.update({
									_id: args.tableId
								}, {
									$set: {
										gameInit: false,
										gameStarted: false,
										slotUsed: 0,
										players: {},
										turnplayerId: "",
									},
								});

								console.log("standup.  088 ");
							}
						} else {
							console.log("standup. 2 4" );
							let removedPlayer = await playerService.removePlayer(args.userId, table.players, avialbleSlots, table.slotUsedArray, table);


							var tableInfo = await Table.findOne({
								_id: args.tableId
							});
							let players = tableInfo.players;
							let slot = getActivePlayers(players);

							let playersss6 =   JSON.parse(JSON.stringify(players));

							for(let plll in playersss6)
							{
								playersss6[plll].playerInfo.chips = 0;
								playersss6[plll].playerInfo.userName = "***";
							}
							
							let tabllll6 =  JSON.parse(JSON.stringify(tableInfo));
							tabllll6.players = [];


						


							sio.to(args.tableId).emit("playerLeft", {
								bet: {
									lastAction: "Packed",
									lastBet: "",
								},
								removedPlayer: removedPlayer,
								placedBy: removedPlayer.id,
								players: playersss6,
								table: tabllll6,
							});
							let playerLength = getActivePlayers(players);

							if (playerLength == 1 && tableInfo.gameStarted) {
								
								console.log("standup. 2 00" );
								winnerService.decideWinner(tableInfo, tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
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

									let playersss7 =  JSON.parse(JSON.stringify(players1));

									for(let plll in playersss7)
									{
										playersss7[plll].playerInfo.chips = 0;
										playersss7[plll].playerInfo.userName = "***";
									}
									
									let tabllll7 = JSON.parse(JSON.stringify(tableInfo));
									tabllll7.players = [];

									


									sio.to(args.tableId).emit("showWinner", {
										message,
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										placedBy: removedPlayer.id,
										players: playersss7,
										table: tabllll7,
										packed: true,
										activePlayerCount: 1,
									});
							
									
									ClearTimer(args.tableId);
									await Table.update({
										_id: args.tableId
									}, {
										$set: {
											gameInit: false,
											gameStarted: false,
											amount: 0,
											slotUsed: 1,
											players: players1,
											turnplayerId: "",
										},
									});
									let avialbleSlots = {};
									table.slotUsedArray.forEach(function(d) {
										avialbleSlots["slot" + d] = "slot" + d;
									});
									
									newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
								});
								console.log("standup.  055 ");
							} else if (getActivePlayers(table.players) == 1 && !tableInfo.gameStarted) {


								console.log("standup. 2 02" );
								// client.emit("notification", {
								// 	message: "Please wait for more players to join",
								// 	timeout: 4000,
								// });
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
								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

								console.log("standup.  044 ");
							} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
								console.log("standup.  033 ");
								await Table.update({
									_id: args.tableId
								}, {
									$set: {
										gameInit: false,
										gameStarted: false,
										slotUsed: 0,
										players: {},
										turnplayerId: "",
									},
								});
								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
							}else  if(!tableInfo.gameStarted){

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
								newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
								
							}
						}
					}

					let playersss8 =   JSON.parse(JSON.stringify( table.players));
					console.log("standup.  3 ");
					for(let plll in playersss8)
					{
						playersss8[plll].playerInfo.chips = 0;
						playersss8[plll].playerInfo.userName = "***";
					}
					
					let tabllll8 = JSON.parse(JSON.stringify(table));
					tabllll8.players = [];

					


					sio.to(args.tableId).emit("standUp", {
						players: playersss8,
						table : tabllll8,
						userId: args.userId
					});

					client.emit("standUp_Own", {
						players: playersss8,
						table : tabllll8,
						userId: args.userId,
						role: player.Decrole
					});

					await User.update({
						_id: args.userId
					}, {
						$set: {
							lasttableId: table._id
						}
					});

					var tableInfo = await Table.findOne({
						_id: args.tableId
					});
					var playersTTT = tableInfo.players;

					

					for (let position in playersTTT) {

						var userId = playersTTT[position].id;
					
						let user = await User.findOne({ _id: userId });
						let player = user;
						table = await Table.findOne({
							_id: args.tableId
						});

					
						if(playersTTT[position].disconnect || playersTTT[position].forcedisconnect || user.forcedisconnect)
						{
							console.log("standup.  4 " );
							if (table.players && table.players[player._id]) {

								await gameAuditService.createAudit(args.tableId, table.cardinfoId, player._id, table.lastGameId, auditType.USER_TURN, 0, 0, table.players[player._id].playerInfo.chips, "standup 3", "standup 3", table.amount, table.players, 0, "");
								let avialbleSlots = {};
								table.slotUsedArray.forEach(function(f) {
									avialbleSlots["slot" + f] = "slot" + f;
								});
		
								if (table.gameStarted && isActivePlayer(userId, table.players)) {
									let maxPlayers = 5;
								//	let players1 = await betService.packPlayer(args.userId, table.players, avialbleSlots, maxPlayers, table);
									let removedPlayer = await playerService.removePlayer(userId, table.players, avialbleSlots, table.slotUsedArray, table);
		
									let tableInfo = await Table.findOne({
										_id: args.tableId
									});
									let players = tableInfo.players;


									let playersss9 = JSON.parse(JSON.stringify(players));


									for(let plll in playersss9)
									{
										playersss9[plll].playerInfo.chips = 0;
										playersss9[plll].playerInfo.userName = "***";
									}
									
									let tabllll9 = JSON.parse(JSON.stringify(tableInfo));
									tabllll9.players = [];

									

		
									sio.to(args.tableId).emit("playerLeft", {
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										removedPlayer: removedPlayer,
										placedBy: removedPlayer.id,
										players: playersss9,
										table: tabllll9,
									});
		
									let playerLength = getActivePlayers(players);
									if (playerLength == 1 && tableInfo.gameStarted) {
										console.log("standup.  034 " );
										winnerService.decideWinner(tableInfo, players, tableInfo.cardinfoId, false, "", async function(message, players) {
											tableInfo.turnplayerId = "";
											// client.emit("showWinner", {
											// 	message,
											// 	bet: {
											// 		lastAction: "Packed",
											// 		lastBet: "",
											// 	},
											// 	placedBy: removedPlayer.id,
											// 	players: players,
											// 	table: tableInfo,
											// 	packed: true,
											// 	activePlayerCount: 1,
											// });


											let playerss1 =  JSON.parse(JSON.stringify(players));

											for(let plll in playerss1)
											{
												playerss1[plll].playerInfo.chips = 0;
												playerss1[plll].playerInfo.userName = "***";
											}
											
											let tablll1 =  JSON.parse(JSON.stringify(tableInfo));
											tablll1.players = [];

											
											sio.to(args.tableId).emit("showWinner", {
												message,
												bet: {
													lastAction: "Packed",
													lastBet: "",
												},
												placedBy: removedPlayer.id,
												players: playerss1,
												table: tablll1,
												packed: true,
												activePlayerCount: 1,
											});
										
											
											ClearTimer(args.tableId);
											await Table.update({
												_id: args.tableId
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
											

											newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);

										});
									} else if (playerLength && !tableInfo.gameStarted) {
		
										// client.emit("notification", {
										// 	message: "Please wait for more players to join",
										// 	timeout: 4000,
										// });
										sio.to(args.tableId).emit("notification", {
											message: "Please wait for more players to join",
											timeout: 4000,
										});
										let sentObj = {
											players,
											table: tableInfo
										};
		
										let avialbleSlots = {};
										table.slotUsedArray.forEach(function(d) {
											avialbleSlots["slot" + d] = "slot" + d;
										});
		
										newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
		
										//client.emit("resetTable", sentObj);
										sio.to(args.tableId).emit("resetTable", sentObj);
									} else if (getActivePlayers(players) < 2 && tableInfo.gameStarted) {
										await Table.update({
											_id: args.tableId
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
										tableInfo.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

									}
								} else {
									console.log("standup.  02 " );
									let removedPlayer = await playerService.removePlayer(userId, table.players, avialbleSlots, table.slotUsedArray, table);
		
		
									var tableInfo = await Table.findOne({
										_id: args.tableId
									});
									let players = tableInfo.players;
									let slot = getActivePlayers(players);


									let playerss2 =  JSON.parse(JSON.stringify(players));

									for(let plll in playerss2)
									{
										playerss2[plll].playerInfo.chips = 0;
										playerss2[plll].playerInfo.userName = "***";
									}
									
									let tablll2 =  JSON.parse(JSON.stringify(tableInfo));
									tablll2.players = [];

									

		
		
									sio.to(args.tableId).emit("playerLeft", {
										bet: {
											lastAction: "Packed",
											lastBet: "",
										},
										removedPlayer: removedPlayer,
										placedBy: removedPlayer.id,
										players: playerss2,
										table: tablll2,
									});
									let playerLength = getActivePlayers(players);
		
									if (playerLength == 1 && tableInfo.gameStarted) {
										
										winnerService.decideWinner(tableInfo, tableInfo.players, tableInfo.cardinfoId, false, "", async function(message, players1) {
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

											
									let playerss3 = JSON.parse(JSON.stringify(players1));

									for(let plll in playerss3)
									{
										playerss3[plll].playerInfo.chips = 0;
										playerss3[plll].playerInfo.userName = "***";
									}
									
									let tablll3 =  JSON.parse(JSON.stringify(tableInfo));
									tablll3.players = [];

									


									console.log("standup.  052 " );
											sio.to(args.tableId).emit("showWinner", {
												message,
												bet: {
													lastAction: "Packed",
													lastBet: "",
												},
												placedBy: removedPlayer.id,
												players: playerss3,
												table: tablll3,
												packed: true,
												activePlayerCount: 1,
											});
									
											
											ClearTimer(args.tableId);
											await Table.update({
												_id: args.tableId
											}, {
												$set: {
													gameInit: false,
													gameStarted: false,
													amount: 0,
													slotUsed: 1,
													players: players1,
													turnplayerId: "",
												},
											});
											let avialbleSlots = {};
											table.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
											


											


											newGameService.startNewGame(client, args.tableId, avialbleSlots, sio);
										});
									} else if (getActivePlayers(table.players) == 1 && !tableInfo.gameStarted) {
		
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
												turnplayerId: "",
											},
										});

										let avialbleSlots = {};
										tableInfo.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);

										
									} else if (getActivePlayers(table.players) == 0 && table.gameStarted) {
										await Table.update({
											_id: args.tableId
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
										tableInfo.slotUsedArray.forEach(function(d) {
												avialbleSlots["slot" + d] = "slot" + d;
											});
										newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
											console.log("standup.  05 " );
									}
								}
							}

							table = await Table.findOne({
								_id: args.tableId
							});

							let playerss4 = JSON.parse(JSON.stringify(table.players));

							for(let plll in playerss4)
							{
								playerss4[plll].playerInfo.chips = 0;
								playerss4[plll].playerInfo.userName = "***";
							}
							
							let tablll4 = JSON.parse(JSON.stringify(table));
							tablll4.players = [];

						
							sio.to(args.tableId).emit("standUp", {
								players: playerss4,
								table:tablll4,
								userId: userId
							});
		
							client.emit("standUp_Own", {
								players: playerss4,
								table:tablll4,
								userId: userId,
								role: player.Decrole
							});
		
							await User.update({
								_id: userId
							}, {
								$set: {
									lasttableId: table._id
								}
							});

						}
				
					}

					console.log("standup.  5 " );
					const exe_stop = Date.now();
					let timess = exe_stop - exe_start;

					if(timess > auditType.EXE_STANDUP)
					{
						exeTimes.create({	gameId: tableInfo.lastGameId,
							userId: tableInfo._id,
							remark : "standup",
							exetime : timess + ""
						});
					}
					console.log("standup.  6 " );

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
	var strFirstThree = str.substring(0, 13);
	if(str.length > 13)
	 strFirstThree = strFirstThree +  "...";
//return "******";
	 return strFirstThree;
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

		try{

			let vvv = JSON.parse(Buffer.from(tn.split('.')[1], 'base64').toString());
			//console.log("tokkk ", vvv);
			// console.log("tokkk 0  ", JSON.parse(Buffer.from(tn.split('.')[0], 'base64').toString()));

			// console.log("tokkk 1   ", JSON.parse(Buffer.from(tn.split('.')[1], 'base64').toString()));

			// console.log("tokkk 2   ", JSON.parse(Buffer.from(tn.split('.')[2], 'base64').toString()));

			return vvv;
		}catch(error)
		{
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


			if(tableInfo.gameType ==  StaticgameType.ThreeJoker)
			{
			
				if (playercount == 2) return tableInfo.amount > tableInfo.boot * 200;
			
				if (playercount == 3) return tableInfo.amount > tableInfo.boot * 150;
			
				if (playercount == 4) return tableInfo.amount > tableInfo.boot * 150;
			
				if (playercount == 5) return tableInfo.amount > tableInfo.boot * 100;

			}else{
			
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


async function joinAgain(tableId, userId, client,sio,args,oldtable)
{
	console.log( " join again table id " , tableId);
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

					


							if (lasttableiddd.trim() != "" && lasttableiddd.trim() != null && lasttableiddd.length != 0   && lasttableiddd != tableId) {
				
								var lasttable = await Table.findOne({
									_id: lasttableiddd
								});
	
							
								if (lasttable.players != null && lasttable.players[args.userId] ) {
	
									
									let table = lasttable;
									let player = myData;
									if (table.players != null && table.players[player._id]) {

									
										let userId = player._id;
										let tableId = table._id
	
										let user = await User.findOne({
											_id: userId
										});
										await gameAuditService.createAudit(tableId, '', userId, table.lastGameId, auditType.DISCONNECT, 0, 0, user.chips, 'Disconnect 66', 'Disconnect 66', 0, table.players, 0, '');
	
										let avialbleSlots = {};
										table.slotUsedArray.forEach(function(f) {
											avialbleSlots["slot" + f] = "slot" + f;
										});
	
										let removedPlayer = await playerService.removePlayer(userId, table.players, avialbleSlots, table.slotUsedArray, table);
										await User.update({
											_id: userId
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
	

										let playerss5 = JSON.parse(JSON.stringify(players));

										for(let plll in playerss5)
										{
											playerss5[plll].playerInfo.chips = 0;
											playerss5[plll].playerInfo.userName = "***";
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
											players: playerss5,
											table: tablll5,
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

												let playerss6 =  JSON.parse(JSON.stringify(players1));

												for(let plll in playerss6)
												{
													playerss6[plll].playerInfo.chips = 0;
													playerss6[plll].playerInfo.userName = "***";
												}
												
												let tablll6 = JSON.parse(JSON.stringify(tableInfo));
												tablll6.players = [];

												


												sio.to(tableInfo._id.toString()).emit("showWinner", {
													message,
													bet: {
														lastAction: "Packed",
														lastBet: "",
													},
													placedBy: removedPlayer.id,
													players: playerss6,
													table: tablll6,
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
												
	
												newGameService.startNewGame(client, table._id.toString(), avialbleSlots, sio);
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
											
	
												newGameService.startNewGame(client, tableInfo._id.toString(), avialbleSlots, sio);
	
	
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
						



							if (table.players == null || table.players[userId] == null || table.players[userId] == undefined) {

								let daaataaa = {
									chips : myData.chips,
									userName : myData.userName,
									displayName  : getDotDotName(myData.displayName),
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

								await playerService.addPlayer(table, player, client, sit, async function(addedPlayer, avialbleSlots, myTable) {

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


											if (args.remark == undefined || args.remark == null)
												args.remark = "no remark";
											await gameAuditService.createAudit(table._id, '', userId, table.lastGameId, auditType.JOIN_TABLE , 0, 0, addedPlayer.playerInfo.chips, 'join again', args.remark.toString(), 0, table.players, 0, '');

											let playersss =  JSON.parse(JSON.stringify( myTable.players));
											let chipsss = playersss[args.userId].playerInfo.chips;
											for(let plll in playersss)
											{
												playersss[plll].playerInfo.chips = 0;
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
												chips : chipsss
											};

											console.log("robot..................................................1");
											if (playersLength === 0) {
												socketClient.joinTable(tableId, myTable.boot);
											}

											sio.to(oldtable.toString()).emit("ChangeTable", newPlayer);
											client.emit("tableJoined", newPlayer_own);
											sio.to(tableId.toString()).emit("newPlayerJoined", newPlayer);
											//newGameService.SwitchTables(args.tableId, client, sio);

											await User.update({
												_id: userId
											}, {
												$set: {
													lasttableId: tableId,
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
										
											newGameService.startNewGameOnPlayerJoin(client, myTable._id, avialbleSlots, args.tableId, sio);

										
											
							
										}
									}
								});
							}
							// });
						}, delay * 1000);
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