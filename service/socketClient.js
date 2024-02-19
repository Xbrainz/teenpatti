const ioClient = require('socket.io-client');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const secret = "developersecretcode";
const User = require('../model/user');
const Table = require('../model/table');
const Settings = require('../model/settings');
let CardInfo = require("../model/cardInfo");
const Bot_Details = require('../model/bot_amounts');
let db_config = require("../config/db_uri");
let commonService = require("./common");
const thirdPartyAPICall = require("../service/thirdPartyAPICall/thirdPartyAPICall");

let {
	getLastActivePlayer
} = require("../service/common");

function getRandomItem(arr) {

	// get random index value
	const randomIndex = Math.floor(Math.random() * arr.length);

	// get random item
	const item = arr[randomIndex];

	return item;
}

async function addanddeleteRobot(tablee) {
	tablee = await Table.findOne({
		_id: tablee._id
	});

	if (tablee.tableSubType != "private") {



		// if(tablee.roboPlayers.length>=3)
		// {


		var playerss = tablee.players;
		let RobotCount = 0,
			PlayerCount = 0;
		console.log("remove playersss : : add");


		for (let plll in playerss) {


			if (playerss[plll].playerInfo.Decrole == "RUSER")
				RobotCount++;
			else
				PlayerCount++;

		}

		console.warn("******** player count : : : ", PlayerCount, "    robot player : ", RobotCount, " watchCount : ", " ********");

		if (tablee.watchCount.length > 0 || PlayerCount > 0) {
			if (PlayerCount == 0) {
				if (RobotCount == 0) {
					joinTable(tablee._id.toString(), "1");

				} else if (RobotCount == 1) {
					joinTable(tablee._id.toString(), "2");

				} else if (RobotCount == 2) {
					joinTable(tablee._id.toString(), "3");
				} else if (RobotCount == 4) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 5) {
					disconnect(tablee._id.toString(), "3");
				}
			}

			if (PlayerCount == 1) {
				if (RobotCount == 0) {
					joinTable(tablee._id.toString(), "1");
				} else if (RobotCount == 1) {
					  joinTable(tablee._id.toString(),"2");
				} else if (RobotCount == 2) {
					joinTable(tablee._id.toString(), "3");
				} else if (RobotCount == 3) {
					//disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 4) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 5) {
					disconnect(tablee._id.toString(), "3");
				}
			} else if (PlayerCount == 2) {
				if (RobotCount == 0) {
					joinTable(tablee._id.toString(), "1");
				} else if (RobotCount == 1) {
					joinTable(tablee._id.toString(), "2");
				} else if (RobotCount == 2) {
				

				} else if (RobotCount == 3) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 4) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 5) {
					disconnect(tablee._id.toString(), "3");
				}

			} else if (PlayerCount == 3) {
				if (RobotCount == 0) {
					joinTable(tablee._id.toString(), "1");
				} else if (RobotCount == 1) {

				} else if (RobotCount == 2) {
					disconnect(tablee._id.toString(), "2");

				} else if (RobotCount == 3) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 4) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 5) {
					disconnect(tablee._id.toString(), "3");
				}


			} else if (PlayerCount == 4) {
				if (RobotCount == 1) {
					disconnect(tablee._id.toString(), "1");
				} else if (RobotCount == 2) {
					disconnect(tablee._id.toString(), "2");

				} else if (RobotCount == 3) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 4) {
					disconnect(tablee._id.toString(), "3");
				} else if (RobotCount == 5) {
					disconnect(tablee._id.toString(), "3");
				}

			}

		} else {
			disconnectAll(tablee, "1");

		}


		// }else{
		//     console.warn("errorrr : : robot not found in table");
		// }
	}
	return "";
}

async function joinTable(tableId,name) {
    
    let connection_string = "";

	const array = ['Aadeshwar','Carina','Aadhikesavan','Ira','Krisha','Nyra','Saloni', 'Zara', 'Charanpreet', 'shahid','Ishmeet','MR L','Shirina','Tavleen','Sukhleen'];

    var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "teenpatti" });

	console.log("logg", Bot_Detailssss);

    let TableDetail = await Table.findOne({
        _id: tableId
    },{tableSubType : 1});


    if(Bot_Detailssss.onoff == "on" && TableDetail.tableSubType != "private")
    {
		let usernameee = "";

		if(name == "1")
		{
			usernameee =  `computer_1` + tableId ;
		}else if(name == "2")
		{
			usernameee =  `computer_2` + tableId ;
		}else if(name == "3")
		{
			usernameee =  `computer_3` + tableId ;
		}else if(name == "4")
		{
			usernameee =  `computer_4` + tableId ;
		}else if(name == "5")
		{
			usernameee =  `computer_5` + tableId ;
		}
  
    var user =  await User.findOne({ userName:usernameee});

    if(user == null || user == undefined)
    {
        console.log("usersssssssssssssssssssssssssssss...");
        let userData = {
            userName : usernameee,
         //   password: encryptedPassword,
            chips:1000000,
            Decrole : "RUSER",
            clientIp : "",
            type: 'premium',
            role: 'bot',
            isadmin : false,
            deviceType : "",
            profilePic : '',
            agentId : '61125ba635c7c31f998a18e0',
            password : '123456',
            isComputer : 'yes',
            displayName : 'computer',
            forcedisconnect : false
           
        };

     

        const newUser = new User(userData);
        await newUser.save();
         user =  await User.findOne({ userName:usernameee });
		 console.log("usersssssssssssssssssssssssssssss..111.");

    }

   // console.log("user : ", user);
    jwtToken = generateJwtTokenByUser(user);
    connection_string = "http://localhost:"+db_config.PORT_TEENPATTI+"?userId=" + user._id + "&token=" + jwtToken;

    console.log("connection srtring : " , connection_string);

	const resultNamw = getRandomItem(array);


    user = await User.findOneAndUpdate(
        { _id: user.id },
        { $set: { clientIp: "1.1.1.1",Decrole :"RUSER", jwtToken :jwtToken,displayName : resultNamw } },
        { new: true },
    )



    console.log("connection srtring new : " , connection_string);

    console.log("table id : ", tableId);

    console.log("user id : ", user.userName);
    if(connection_string != "")
    {
        let socketClient = ioClient.connect(connection_string);    
      
        socketClient
        .on('connect', async function() {
            console.log("on connect");
            await socketClient.emit('joinTable', { tableId: tableId, userId: user._id });
          // computerClients .set(user._id, socketClient);
        }).on('error',async function()
        {
            console.log("on error");
        });
        console.log("connection srtring :11 ");
    }
    
}
}


async function disconnect(tableId, whichrobo) {


	let tablee = await Table.findOne({
		_id: tableId._id
	}, {
		players: 1
	});


	var playerss = tablee.players;
	let robotid = ""
	console.log("remove playersss : disconnect: ", whichrobo);


	for (let plll in playerss) {


		if (playerss[plll].playerInfo.Decrole == "RUSER") {
			robotid = playerss[plll].id;
			break;
		}



	}

	if (robotid != "")

	{

		console.log("robot id : ", robotid);
		var user;
		user = await User.findOne({
			_id: robotid
		});








		let connection_string = "";
		connection_string = "http://localhost:" + db_config.PORT_TEENPATTI + "?userId=" + user._id + "&token=" + user.jwtToken;

		if (connection_string != "") {
			let socketClient = ioClient.connect(connection_string);

			socketClient
				.on('connect', async function() {
					console.log("on Forcedisconnect");

					await User.update({
						_id: user._id
					}, {
						$set: {
							lasttableId: ""
						}
					});

					await socketClient.emit('Forcedisconnect', {
						tableId: tableId._id,
						userId: user._id
					});
					await User.update({
						_id: user._id
					}, {
						$set: {
							lasttableId: ""
						}
					});
				}).on('error', async function() {
					//    console.log("on error");
				});

		}

	}


}


async function disconnectAll(tableId, whichrobo) {


	let tablee = await Table.findOne({
		_id: tableId._id
	}, {
		players: 1
	});


	var playerss = tablee.players;
	let robotid = ""
	console.log("remove playersss : all : ", whichrobo);


	for (let plll in playerss) {


		if (playerss[plll].playerInfo.Decrole == "RUSER") {
			robotid = playerss[plll].id;

			var user;
			user = await User.findOne({
				_id: robotid
			});


			let connection_string = "";
			connection_string = "http://localhost:" + db_config.PORT_TEENPATTI + "?userId=" + user._id + "&token=" + user.jwtToken;

			if (connection_string != "") {
				let socketClient = ioClient.connect(connection_string);

				socketClient
					.on('connect', async function() {
						console.log("on Forcedisconnect");
						await socketClient.emit('Forcedisconnect', {
							tableId: tableId._id,
							userId: user._id
						});
					}).on('error', async function() {
						//    console.log("on error");
					});

			}



		}



	}




}



function generateJwtTokenByUser(user) {



	let key = jwt.sign({
		sub: user.id,
		id: user.id
	}, secret, {
		expiresIn: Math.floor(Date.now() / 1000) + 60 * 60,

	});
	return key;
}

async function iscomputerplayer(table, issideshow = false) {


	console.log("side show turnnn 1");

	if (issideshow) {

		if(table.players[table.turnplayerId])
		{


		let avialbleSlots = {};
		table.slotUsedArray.forEach(function(f) {
			avialbleSlots["slot" + f] = "slot" + f;
		});

		let newPlayer = getLastActivePlayer(table.players[table.turnplayerId].id, table.players, avialbleSlots, table.maxPlayers);
		console.log("side show turnnn 3");
		if (table.players[newPlayer.id].playerInfo.Decrole.toUpperCase() == "RUSER") {
			console.log("side show turnnn 5");
			turnSideshow(table._id, table.cardInfoId, newPlayer.id)


		}
	}


	} else {
		if(table.players[table.turnplayerId])
		{

		
		let userDeckrole = table.players[table.turnplayerId].playerInfo.Decrole;

		// console.log("users : ",table.players[table.turnplayerId].playerInfo);

		console.warn("is sideshowwww : ", issideshow);
		if (userDeckrole.toUpperCase() == "RUSER") {
			turnPlayer(table._id, table.cardInfoId, table.players[table.turnplayerId].id)
		}
		}

	}



}


async function turnSideshow(tableId, cardinfo, userId) {
	console.warn("side show accept..............................................................................................................................................................................................................................................................................................................................");
	let table_bet = await Table.findOne({
		_id: tableId
	});


	var user = await User.findOne({
		_id: userId
	});
	let connection_string = "";
	connection_string = "http://localhost:" + db_config.PORT_TEENPATTI + "?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);

	socketClient
		.on('connect', async function() {


			let senddatasss = {
				lastAction: "Accepted"

			}


			let senddata = {
				player: table_bet.players[user._id],
				table: table_bet,
				token: user.jwtToken,
				tableId: table_bet._id,
				placedTo: table_bet.turnplayerId,
				lastAction: "Accepted",
				bet: senddatasss

			}
			await socketClient.emit('respondSideShow', senddata);
			// console.log("emit respondSideShow : ", senddata);

		}).on('error', async function() {
			console.log("on error");
		});


}

async function turnPlayer(tableId, cardinfo, userId) {
	let tableIDd = await Table.findOne({
		_id: tableId
	}, {
		_id: 0,
		players: 0
	});

	var user = await User.findOne({
		_id: userId
	});

	if (user._id == tableIDd.turnplayerId) {

		console.log("user chipsss : ", user.chips , "   lastbettt : ", (tableIDd.lastBet*2) , " if condi " , (user.chips <= (tableIDd.lastBet*2)) );
		if(user.chips > (tableIDd.lastBet*2))
		{



		let connection_string = "";
		connection_string = "http://localhost:" + db_config.PORT_TEENPATTI + "?userId=" + user._id + "&token=" + user.jwtToken;
		let socketClient = ioClient.connect(connection_string);

		socketClient
			.on('connect', async function() {

				//   setTimeout(async function() {
				await Table.update({
					_id: tableId
				}, {
					$inc: {
						botTurn: 1
					}
				});

				let table_bet = await Table.findOne({
					_id: tableId
				});


				let CurrentAction = "Blind";
				let isblind = false;
				if (table_bet.players[user._id].cardSeen == true) {
					CurrentAction = "Chaal";
					isblind = false;
				} else {
					CurrentAction = "Blind";
					isblind = true;
				}

				let LastBet = table_bet.lastBet;

				if (table_bet.lastBlind == true) {
					if (CurrentAction == "Chaal") {
						LastBet = LastBet + LastBet;
					}
				} else {
					if (CurrentAction == "Blind") {
						var minus = LastBet / 2;
						LastBet = LastBet - minus;
					}
				}

                let isturnapply = false;

                let AllRobo = false; 
				let robocount = 0;
                for (let p1 in table_bet.players) {
					console.log("all players : " , table_bet.players[p1].active , " : " ,!table_bet.players[p1].packed, " : " , !table_bet.players[p1].idle , " : " , table_bet.players[p1].playerInfo.Decrole );
                    if (table_bet.players[p1].active && !table_bet.players[p1].packed && !table_bet.players[p1].idle && table_bet.players[p1].playerInfo.Decrole != "RUSER") {
                        AllRobo = true;
                        break;
                    }

                }

                console.log("checkl usersss :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: AllRobo : ", AllRobo , "  :blindcount : " , table_bet.players[user._id].blindcount , "   maxbotTurn : " , table_bet.players[user._id].maxbotTurn  ," MAXROUND :" ,table_bet.maxRound);
                if (table_bet.players[user._id].maxbotTurn == table_bet.players[user._id].blindcount ) {

					let robocount = 0;
					for (let p1 in table_bet.players) {
						if (table_bet.players[p1].active && !table_bet.players[p1].packed && !table_bet.players[p1].idle && table_bet.players[p1].playerInfo.Decrole == "RUSER") {
							robocount = robocount + 1;
							
						}

					}



                    let isrobowin = await CheckWinner(table_bet);
                  //  isrobowin = false;

				  console.warn("checkl usersss :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: isrobowin : " , isrobowin  ," robocount :" ,robocount , "  isrobowin.winnerid : ",isrobowin.winnerid , "  user._id : ", user._id);


                    if (!isrobowin.isrobowin) {

                        isturnapply = true;

                        let iffffff = Math.floor(Math.random() * 3) ;

                        //iffffff = 0;
                        if(iffffff == 2)
                        {
                            let senddata = {
                            userId: user._id,
                            tableId: table_bet._id,
                            player:  table_bet.players[user._id],
                            token: user.jwtToken,
                          
                            }
                            await socketClient.emit('placePack', senddata);

                        }else{

                            if (getActivePlayers(table_bet.players) > 2) {


								let avialbleSlots = {};
								table_bet.slotUsedArray.forEach(function(f) {
									avialbleSlots["slot" + f] = "slot" + f;
								});

								
							let lastplayewr = getLastActivePlayer(user._id, table_bet.players, avialbleSlots, 5);

							if(table_bet.players[lastplayewr.id].cardSeen == true)
							{


								if (table_bet.players[user._id].cardSeen == false) {
									let sendtodata = {
										userId: user._id,
										table: table_bet,
										tableId: table_bet._id,
										current: table_bet.players[user._id]
			
									}
									await socketClient.emit('seeMyCards', sendtodata);
									//   console.log("emit : seemycard : ",sendtodata);

								}



                                let senddatasss = {
                                    amount: LastBet
                               }

                               let senddata = {
                                    player: table_bet.players[user._id],
                                    table: table_bet,
                                    token: user.jwtToken,
                                    tableId: table_bet._id,
                                    bet: senddatasss
                                }
                                await socketClient.emit('placeSideShow', senddata);

                                let isrand = Math.floor(Math.random() * 3) + 1;
                                table_bet.players[user._id].maxbotTurn = table_bet.maxbotTurn + isrand;
                                await Table.update({
                                    _id: table_bet._id
                                }, {
                                    $set: {
                                        players: table_bet.players
                                    }
                                });

							}else{

								let senddata = {
									userId: user._id,
									tableId: table_bet._id,
									player:  table_bet.players[user._id],
									token: user.jwtToken,
								  
									}
									await socketClient.emit('placePack', senddata);


							}

                            } else {
                                console.warn("robot : show");
                                let senddata = {
                                    userId: user._id,
                                    tableId: table_bet._id,
                                    action: "show",
                                    token: user.jwtToken,
                                    amount: LastBet,
                                    blind: isblind,
                                    show: true
                                }
                                await socketClient.emit('placeBet', senddata);
                            }

                        }

                    }else{

						if(robocount > 1 && isrobowin.winnerid != user._id)
						{
							isturnapply = true;
							let senddata = {
								userId: user._id,
								tableId: table_bet._id,
								player:  table_bet.players[user._id],
								token: user.jwtToken,
							  
								}
							await socketClient.emit('placePack', senddata);

							console.warn(":::::::::::::::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%%%%%%%%%%%%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
							console.log("placepack : ",senddata);
							console.warn(":::::::::::::::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%%%%%%%%%%%%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
							console.warn(":::::::::::::::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%%%%%%%%%%%%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
						}
					}

                }

                if (table_bet.players[user._id].blindcount == table_bet.maxRound) {
                    if (AllRobo) {
                        let isrand = Math.floor(Math.random() * 3) + 1;
                        table_bet.maxRound = table_bet.maxRound + isrand;
                        await Table.update({
                            _id: table_bet._id
                        }, {
                            $set: {
                                maxRound: table_bet.maxRound
                            }
                        });
                    }
                }




                if(!isturnapply)
                {
                    
                    if (table_bet.players[user._id].maxbotSeen == table_bet.players[user._id].blindcount) {


                        let sendtodata = {
                            userId: user._id,
                            table: table_bet,
                            tableId: table_bet._id,
                            current: table_bet.players[user._id]

                        }
                        await socketClient.emit('seeMyCards', sendtodata);
                        //   console.log("emit : seemycard : ",sendtodata);

                        LastBet = LastBet + LastBet;
                        CurrentAction = "Chaal";
                        isblind = false;

                        setTimeout(async function() {
                            let senddata = {
                                userId: user._id,
                                tableId: table_bet._id,
                                action: CurrentAction,
                                token: user.jwtToken,
                                amount: LastBet,
                                blind: isblind
                            }
                            await socketClient.emit('placeBet', senddata);

                        }, 1000);


                    } else {

                    

                    
                            if (table_bet.players[user._id].blindcount == table_bet.maxRound && !AllRobo) {

                                if (getActivePlayers(table_bet.players) > 2) {

									let avialbleSlots = {};
									table_bet.slotUsedArray.forEach(function(f) {
										avialbleSlots["slot" + f] = "slot" + f;
									});


									let lastplayewr = getLastActivePlayer(user._id, table_bet.players, avialbleSlots, 5);
									if(table_bet.players[lastplayewr.id].cardSeen == true)
									{
									


                                    let senddatasss = {
                                        amount: LastBet
                                   }

                                   let senddata = {
                                        player: table_bet.players[user._id],
                                        table: table_bet,
                                        token: user.jwtToken,
                                        tableId: table_bet._id,
                                        bet: senddatasss
                                    }
                                    await socketClient.emit('placeSideShow', senddata);

								}else
								{
									let senddata = {
										userId: user._id,
										tableId: table_bet._id,
										action: CurrentAction,
										token: user.jwtToken,
										amount: LastBet,
										blind: isblind
									}
									await socketClient.emit('placeBet', senddata);
		
								}

                                    let isrand = Math.floor(Math.random() * 3) + 1;
                                    table_bet.maxRound = table_bet.maxRound + 2;
                                    await Table.update({
                                        _id: table_bet._id
                                    }, {
                                        $set: {
                                            maxRound: table_bet.maxRound
                                        }
                                    });

                                } else {
                                    console.warn("robot : show");
                                    let senddata = {
                                        userId: user._id,
                                        tableId: table_bet._id,
                                        action: "show",
                                        token: user.jwtToken,
                                        amount: LastBet,
                                        blind: isblind,
                                        show: true
                                    }
                                    await socketClient.emit('placeBet', senddata);
                                }


                            } else {
                                let senddata = {
                                    userId: user._id,
                                    tableId: table_bet._id,
                                    action: CurrentAction,
                                    token: user.jwtToken,
                                    amount: LastBet,
                                    blind: isblind
                                }
                                await socketClient.emit('placeBet', senddata);
                                //    console.log("emit send: placeBet :  ",senddata);
                            }
                        
                    

                    }
                }



			}).on('error', async function() {
				console.log("on error");
			});



		}else{
		    disconnectRobo(tableId,user._id);
		}



	}
}


async function disconnectRobo(tableId, userId) {


	let tablee = await Table.findOne({
		_id: tableId
	}, {
		players: 1
	});

	//console.log("tablee : : ", tablee);

	var playerss = tablee.players;
	let robotid = userId;
	console.warn("remove playersss : disconnect: " ,robotid);




	if (robotid != "")

	{

		console.log("robot id : ", robotid);
		var user;
		user = await User.findOne({
			_id: robotid
		});



		if(user.Decrole == "RUSER")
		{

		




		let connection_string = "";
		connection_string = "http://localhost:" + db_config.PORT_TEENPATTI + "?userId=" + user._id + "&token=" + user.jwtToken;

		if (connection_string != "") {
			let socketClient = ioClient.connect(connection_string);

			socketClient
				.on('connect', async function() {
					console.log("on Forcedisconnect");

					await User.update({
						_id: user._id
					}, {
						$set: {
							lasttableId: ""
						}
					});

					await socketClient.emit('Forcedisconnect', {
						tableId: tableId,
						userId: user._id
					});
					await User.update({
						_id: user._id
					}, {
						$set: {
							lasttableId: ""
						}
					});
				}).on('error', async function() {
					//    console.log("on error");
				});

		}
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



async function GetNewRoboUser() {
	var SettingsValue = await Settings.findOne({
		key: "robocount"
	});

	let user;
	var Robonumber = SettingsValue.keyvalue.substring(10);

	if (Robonumber != "") {
		Robonumber = parseInt(Robonumber);

		let nextuser = Robonumber + 1;

		let newUserName = "RDE:roboot" + nextuser;
		console.log("Robot >>>>>>>>>>>>>> nextuser:", newUserName);

		user = await User.findOne({
			userName: newUserName
		});
		if (!user) {


			let userData = {
				userName: newUserName,
				//   password: encryptedPassword,
				chips: 0,
				deviceType: "DESKTOP",
				Decrole: "RUSER",
				type: 'premium',
				role: 'adminuser',
				isadmin: false,
				profilePic: 'https://cgimages.deckheros.com/upload/user/dummy.png',
				agentId: '623189e6bb5aceb9dd676549',
				password: '12345',
				forcedisconnect: true

			};

			const newUser = new User(userData);
			await newUser.save();

		}

		const ApiResponce = await thirdPartyAPICall.CheckUser(newUserName);
		//	console.log("api ApiResponce ", "userrrr" , " ", ApiResponce);
		const ApiResponce_Balance = await thirdPartyAPICall.GetBalance(newUserName);

		//	console.log("api responce ",  " ", ApiResponce_Balance);
		let operatorId = ApiResponce_Balance.data.operatorId;
		if (operatorId == "" || operatorId == null) {
			operatorId = "clubgames";
		}

		let ddata = {
			chips: ApiResponce_Balance.data.availableBalance,

			operatorId: operatorId,
			displayName: ApiResponce_Balance.data.name,
			Decrole: ApiResponce.data.role.toUpperCase(),
			userName: ApiResponce.data.userId,
			deviceId: "1111",
			deck_betLock: ApiResponce.data.betLock,
			deviceType: "DESKTOP",
			deck_isActive: ApiResponce.data.isActive,

		};

		await User.update({
			userName: newUserName
		}, {
			$set: ddata
		});

		user = await User.findOne({
			userName: newUserName
		});

		console.log("return userrssss");



		await Settings.update({
			key: "robocount"
		}, {
			$set: {
				keyvalue: newUserName
			}
		});




		return user;

	}



}

async function checkBalance(table)
{
	let players = table.players;

	for (let plll in players) {


		if (players[plll].playerInfo.Decrole == "RUSER")
		{

			let userss = await User.findOne({
				_id: players[plll].id
			},{chips:1});

			console.log("user chips : ",userss , "id :",players[plll].id);
			if(userss.chips < (table.lastBet*2))
			{
				console.log("kick user");
				disconnectRobo(table._id,userss._id);
			
			}

		}

	}



}

async function CheckWinner(table) {

	let cardsInfo = await CardInfo.findOne({
		_id: table.cardinfoId
	});
	let cardSets = [],
		winnerCard;
	let combinedCardSets = [];
	let players = table.players;
	let players_cards = cardsInfo.info;
	for (let player in players) {
		if (players[player].active && !players[player].packed && !players[player].idle) {
			cardSets.push({
				id: players[player].id,
				set: cardsInfo.info[players[player].id].cards,
			});
		}

	}

	let winners = [];
	let cardSetsWithWinners = commonService.variationWinner(
		table,
		cardSets,
		cardsInfo.jokers
	);


	for (let i = 0; i < cardSetsWithWinners.length; i++) {
		if (cardSetsWithWinners[i].set.newSet) {

			players[cardSetsWithWinners[i].set.id].newSet = [];
			players[cardSetsWithWinners[i].set.id].newSet = cardSetsWithWinners[i].set.newSet;
			if (cardSetsWithWinners[i].winner === true) {
				winnerCard = cardSetsWithWinners[i].set;
				winners.push(players[cardSetsWithWinners[i].set.id]);
				combinedCardSets.push({
					id: cardSetsWithWinners[i].set.id,
					set: players[cardSetsWithWinners[i].set.id].newSet,
				});
			}
		} else {

			players[cardSetsWithWinners[i].set.id].newSet = [];
			players[cardSetsWithWinners[i].set.id].newSet = cardSetsWithWinners[i].set.set;
			if (cardSetsWithWinners[i].winner === true) {
				winnerCard = cardSetsWithWinners[i].set;
				winners.push(players[cardSetsWithWinners[i].set.id]);
				combinedCardSets.push({
					id: cardSetsWithWinners[i].set.id,
					set: players[cardSetsWithWinners[i].set.id].newSet,
				});
			}
		}

	}


	console.log("winner idfdd : ", winnerCard.id);
	let isrobowin = false;
	for (let p1 in table.players) {
		if (table.players[p1].id == winnerCard.id && table.players[p1].playerInfo.Decrole == "RUSER") {
			isrobowin = true;
			break;
		}

	}


	let roborreturn = {
		isrobowin : isrobowin,
		winnerid : winnerCard.id
	}

	return roborreturn;


}


module.exports = {
	joinTable,
	disconnect,
	turnPlayer,
	iscomputerplayer,
	addanddeleteRobot,
	disconnectAll,checkBalance,disconnectRobo

}