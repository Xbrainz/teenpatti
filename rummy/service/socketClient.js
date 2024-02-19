const ioClient = require('socket.io-client');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const secret = "developersecretcode";
const User = require('../model/user');
const Table = require('../model/table');
const computerClients = new Map();
const Bot_Details = require('../../model/bot_amounts');
let db_config = require("../../config/db_uri");
let CardInfo = require("../model/cardInfo");
let playerService = require('../service/player');

const {
    sortCards,
    groupPointCounter,
    addCardToHand
  } = require("../service/cardComparision");

  let url ;

// program to get a random item from an array
let staticCards = [
    {
        cards: [{
            "type": "spade",
            "rank": 5,
            "name": "5",
            "priority": 5,
            "id2" : "12345"
        },
        {
            "type": "spade",
            "rank": 6,
            "name": "6",
            "priority": 6,
            "id2" : "123453"
        },
        {
            "type": "spade",
            "rank": 7,
            "name": "7",
            "priority": 7,
            "id2" : "123454"
        },
        {
            "type": "spade",
            "rank": 8,
            "name": "8",
            "priority": 8,
            "id2" : "123455"
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
            "id2" : "123456"
        },
        {
            "type": "heart",
            "rank": 13,
            "name": "K",
            "priority": 13,
            "id2" : "123457"
        },
        {
            "type": "heart",
            "rank": 1,
            "name": "A",
            "priority": 14,
            "id2" : "123458"
        }],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "123459"
        },
        {
            "type": "spade",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "1234510"
        },
        {
            "type": "club",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "1234511"
        }],
        msg: "Proper Set."
    },
    {
        cards: [{
            "type": "heart",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "1234512"
        },
        {
            "type": "spade",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "1234513"
        },
        {
            "type": "club",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "1234514"
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


  let staticCards2 = [
    {
        cards: [{
            "type": "diamond",
            "rank": 2,
            "name": "2",
            "priority": 2,
            "id2" : "12345"
        },
        {
            "type": "diamond",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "123453"
        },
        {
            "type": "diamond",
            "rank": 4,
            "name": "4",
            "priority": 4,
            "id2" : "123454"
        }
        ],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 5,
            "name": "5",
            "priority": 5,
            "id2" : "123459"
        },
        {
            "type": "spade",
            "rank": 5,
            "name": "5",
            "priority": 5,
            "id2" : "1234510"
        },
        {
            "type": "club",
            "rank": 5,
            "name": "5",
            "priority": 5,
            "id2" : "1234511"
        }],
        msg: "Proper Set."
    }, {
        cards: [{
            "type": "heart",
            "rank": 6,
            "name": "6",
            "priority": 6,
            "id2" : "123456"
        },
        {
            "type": "heart",
            "rank": 7,
            "name": "7",
            "priority": 7,
            "id2" : "123457"
        },
        {
            "type": "heart",
            "rank": 8,
            "name": "8",
            "priority": 8,
            "id2" : "123458"
        }, {
            "type": "heart",
            "rank": 9,
            "name": "9",
            "priority": 9,
            "id2" : "123458"
        }
    
    ],
        msg: "Pure Sequence"
    }, {
        cards: [{
            "type": "heart",
            "rank" : 11,
            "name" : "J",
            "priority" : 11,
            "id2" : "1234512"
        },
        {
            "type": "spade",
            "rank" : 11,
            "name" : "J",
            "priority" : 11,
            "id2" : "1234513"
        },
        {
            "type": "club",
            "rank" : 11,
            "name" : "J",
            "priority" : 11,
            "id2" : "1234514"
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


  let staticCards3 = [
    {
        cards: [{
            "type": "heart",
            "rank": 5,
            "name": "5",
            "priority": 5,
            "id2" : "12345"
        },
        {
            "type": "heart",
            "rank": 6,
            "name": "6",
            "priority": 6,
            "id2" : "123453"
        },
        {
            "type": "heart",
            "rank": 7,
            "name": "7",
            "priority": 7,
            "id2" : "123454"
        },
        {
            "type": "heart",
            "rank": 8,
            "name": "8",
            "priority": 8,
            "id2" : "123455"
        },
        {
            "type": "heart",
            "rank": 9,
            "name": "9",
            "priority": 9,
            "id2" : "123455"
        },
        {
            "type": "heart",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "123455"
        }
        ],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 11,
            "name": "J",
            "priority": 11,
            "id2" : "123456"
        },
            {
            "type": "heart",
            "rank": 12,
            "name": "Q",
            "priority": 12,
            "id2" : "123456"
        },
        {
            "type": "heart",
            "rank": 13,
            "name": "K",
            "priority": 13,
            "id2" : "123457"
        },
        {
            "type": "heart",
            "rank": 1,
            "name": "A",
            "priority": 14,
            "id2" : "123458"
        }],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "123459"
        },
        {
            "type": "spade",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "1234510"
        },
        {
            "type": "club",
            "rank": 3,
            "name": "3",
            "priority": 3,
            "id2" : "1234511"
        }],
        msg: "Proper Set."
    },
    {
        cards: []
     
    },
    {
        cards: [],
    },
    {
        cards: [],
    }
  ];



  
let staticCards4 = [
    {
        cards: [{
            "type": "heart",
            "rank": 12,
            "name": "Q",
            "priority": 12,
            "id2" : "123456"
        },
        {
            "type": "heart",
            "rank": 13,
            "name": "K",
            "priority": 13,
            "id2" : "123457"
        },
        {
            "type": "heart",
            "rank": 1,
            "name": "A",
            "priority": 14,
            "id2" : "123458"
        }],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "spade",
            "rank": 5,
            "name": "5",
            "priority": 5,
            "id2" : "12345"
        },
        {
            "type": "spade",
            "rank": 6,
            "name": "6",
            "priority": 6,
            "id2" : "123453"
        },
        {
            "type": "spade",
            "rank": 7,
            "name": "7",
            "priority": 7,
            "id2" : "123454"
        },
        {
            "type": "spade",
            "rank": 8,
            "name": "8",
            "priority": 8,
            "id2" : "123455"
        }
        ],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "1234512"
        },
        {
            "type": "diamond",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "1234513"
        },
        {
            "type": "club",
            "rank": 10,
            "name": "10",
            "priority": 10,
            "id2" : "1234514"
        }],
        msg: "Proper Set."
    },

    {
        cards: [{
            "type": "heart",
            "rank" : 13,
            "name" : "K",
            "priority" : 13,
            "id2" : "123459"
        },
        {
            "type": "spade",
            "rank" : 13,
            "name" : "K",
            "priority" : 13,
            "id2" : "1234510"
        },
        {
            "type": "club",
            "rank" : 13,
            "name" : "K",
            "priority" : 13,
            "id2" : "1234511"
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

function getRandomItem(arr) {

    // get random index value
    const randomIndex = Math.floor(Math.random() * arr.length);

    // get random item
    const item = arr[randomIndex];

    return item;
}


async function joinTable(tableId) {
    
    let connection_string = "";

	const array = ['Aadeshwar','Carina','Aadhikesavan','Ira','Krisha','Nyra','Saloni', 'Zara', 'Charanpreet', 'shahid','Ishmeet','MR L','Shirina','Tavleen','Sukhleen'];

    var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "rummy" });

	console.log("logg", Bot_Detailssss);
    if(Bot_Detailssss.onoff == "on")
    {

  
    var user =  await User.findOne({ userName: `computer_` + tableId });

    if(user == null || user == undefined)
    {
        console.log("usersssssssssssssssssssssssssssss...");
        let userData = {
            userName : "computer_"+tableId,
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
         user =  await User.findOne({ userName: `computer_` + tableId });
		 console.log("usersssssssssssssssssssssssssssss..111.");

    }

   // console.log("user : ", user);
    jwtToken = generateJwtTokenByUser(user);
    connection_string = "http://localhost:"+db_config.PORT_RUMMY+"?userId=" + user._id + "&token=" + jwtToken;

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
            computerClients.set(user._id, socketClient);
        }).on('error',async function()
        {
            console.log("on error");
        });
        console.log("connection srtring :11 ");
    }
    
}
}

async function getComputerPlayerForTable(tableId) {
    return await User.findOne({ userName: `computer_` + tableId });
}

async function disconnect(tableId) {

    const user = await getComputerPlayerForTable(tableId);
 
    let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_RUMMY+"?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);    
      
	socketClient
	.on('connect', async function() {
		console.log("on connect");
		await socketClient.emit('Forcedisconnect', { tableId: tableId, userId: user._id  });
		socketClient.disconnect();
	}).on('error',async function()
	{
		console.log("on error");
	});


    
 
}

function generateJwtTokenByUser(user) {
   
	
	let key = jwt.sign({ sub: user.id, id: user.id }, secret, {
         expiresIn: Math.floor(Date.now() / 1000) + 60 * 60,
        
    });
    return key;
}

async function iscomputerplayer(table)
{
  console.log("is computerrrrr playersss");
	let usernammmee = table.players[table.turnplayerId].playerInfo.userName;
	if(`computer_` + table._id == usernammmee)
	{
		console.log("yes computer player turn");
		turnPlayer(table._id,table.cardInfoId)
	}


	
}

async function isFinishgame(table)
{
    console.log("finish gameeeee");
  //  let usernammmee = table.players[table.turnplayerId].playerInfo.userName;
	// if(`computer_` + table._id == usernammmee)
	// {
		
        const user = await getComputerPlayerForTable(table._id);
	let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_RUMMY+"?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);    
      
	socketClient
	.on('connect', async function() {

        console.log("finish gameeeee onnnnnnnnnnnnnn");
        let cardInfo = await CardInfo.findById({
            _id: table.cardInfoId
        });
        if(cardInfo.info.updatedPlayers[user._id])
        {
            if(cardInfo.info.updatedPlayers[user._id].playerDeclared == false && updatedPlayers[Object.keys(updatedPlayers)[i]].active && !updatedPlayers[Object.keys(updatedPlayers)[i]].packed)
            {
              
            
                let removecard = cardInfo.info.updatedPlayers[user._id].newopenclosecard;
                let jsondiscard = {
                    tableId: table._id,
                    userId: user._id ,
                    finishCard :  removecard
        
                }
        
                // if(cardInfo.info.updatedPlayers[user._id])
        
              //  await socketClient.emit('finishGame',jsondiscard);
        
             //   setTimeout(async function()  {
                    await socketClient.emit('decideWinner',jsondiscard);
              //  }, 1000);
            }
        }
       

    }).on('error',async function()
	{
		console.log("on error");
	});



	//}
}


async function turnPlayer(tableId,cardinfoid)
{
	const user = await getComputerPlayerForTable(tableId);
	let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_RUMMY+"?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);    
      
	socketClient
	.on('connect', async function() {

        await Table.update({_id: tableId}, {$inc: {botTurn: 1}});

        let table_bet = await Table.findOne({
            _id: tableId
        },{_id : 0 ,botTurn : 1 , maxbotTurn : 1});

     console.log("bot turnnn : ",table_bet  , " bot turn : ",table_bet.botTurn );


  //   table_bet.maxbotTurn
        if(table_bet.botTurn !=  table_bet.maxbotTurn)
        {

            if(table_bet.botTurn == 1)
            {

        
                let isrand =  Math.floor(Math.random() * 3);

                if(isrand == 2 )
                {

               

                let cardInfo = await CardInfo.findById({
                    _id: cardinfoid
                });
                let updatedPlayers = cardInfo.info.updatedPlayers;

                let rcscardd ; 
                let isrand =  Math.floor(Math.random() * 4);

                if(isrand == 0)
                rcscardd = staticCards;
                if(isrand == 1)
                rcscardd = staticCards2;
                if(isrand == 2)
                rcscardd = staticCards3;
                if(isrand == 3)
                rcscardd = staticCards4;



                updatedPlayers[user._id].cards = rcscardd;
                let playerPoints = groupPointCounter(updatedPlayers[user._id].cards, cardInfo.joker);
                if (playerPoints.totalPoints == null) {
                    playerPoints.totalPoints = 0;
                }
                updatedPlayers[user._id].totalPoints = playerPoints.totalPoints;

                if(updatedPlayers[user._id].totalPoints  > 80)
                updatedPlayers[user._id].totalPoints  = 80;
                updatedPlayers[user._id].cardsetPoints = playerPoints.cardsetPoints;


                let newInfo = {
                    updatedPlayers: updatedPlayers,
                    winner:  cardInfo.info.winner,
                    openedCard :  cardInfo.info.openedCard
                }
                await CardInfo.updateOne({
                    _id: cardinfoid
                }, {
                    $set: {
                    info: newInfo
                    }
                }, {
                    upsert: true
                });
                console.log("replace card dione");
                }

            }


              setTimeout(async function(){

            await socketClient.emit('closedDeckCard', { tableId: tableId, userId: user._id  });

            setTimeout(async function(){
                let cardInfo = await CardInfo.findById({
                    _id: cardinfoid
                });
            
                let removecard = cardInfo.info.updatedPlayers[user._id].newopenclosecard;
                let jsondiscard = {
                    tableId: tableId,
                    userId: user._id ,
                    discardedCard :  removecard
        
                }
        
                console.log("emit discardcard : : : " ,jsondiscard );
                await socketClient.emit('discardCard', jsondiscard);
                
            }, 2000);

        }, 2000);

        }else 
        {
           


           let isrand =  Math.floor(Math.random() * 3);

        //   isrand = 2;
           if(isrand == 2)
           {
            // console.log("playerDropped computer");
                await socketClient.emit('playerDropped', { tableId: tableId, userId: user._id  });
           }else{

           
            await socketClient.emit('closedDeckCard', { tableId: tableId, userId: user._id  });


      setTimeout(async function()  {
            let cardInfo = await CardInfo.findById({
                _id: cardinfoid
            });
        
            let removecard = cardInfo.info.updatedPlayers[user._id].newopenclosecard;
            let jsondiscard = {
                tableId: tableId,
                userId: user._id ,
                finishCard :  removecard
    
            }

            await socketClient.emit('finishGame',jsondiscard);

            setTimeout(async function()  {
                await socketClient.emit('decideWinner',jsondiscard);
            }, 1000);
        }, 1000);
           }
           

    
        }

        // setTimeout(async function()  {
        //     let cardInfo = await CardInfo.findById({
        //         _id: cardinfoid
        //     });
        //     let updatedPlayers = cardInfo.info.updatedPlayers;

        //     updatedPlayers[user._id].cards = staticCards;
        //     let playerPoints = groupPointCounter(updatedPlayers[user._id].cards, cardInfo.joker);
        //     if (playerPoints.totalPoints == null) {
        //         playerPoints.totalPoints = 0;
        //     }
        //     updatedPlayers[user._id].totalPoints = playerPoints.totalPoints;

        //     if(updatedPlayers[user._id].totalPoints  > 80)
        //     updatedPlayers[user._id].totalPoints  = 80;
        //     updatedPlayers[user._id].cardsetPoints = playerPoints.cardsetPoints;
  
            


        //   //  await socketClient.emit('replaceCards', { tableId: tableId, userId: user._id  });
        // }, 1000);
        
       
	}).on('error',async function()
	{
		console.log("on error");
	});
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
		connection_string = "http://localhost:" + db_config.PORT_RUMMY + "?userId=" + user._id + "&token=" + user.jwtToken;

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

module.exports = {
    joinTable,
    disconnect,
	turnPlayer,
	iscomputerplayer,
    isFinishgame,disconnectRobo
}