const ioClient = require('socket.io-client');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const secret = "developersecretcode";
const User = require('../model/User');
const Table = require('../model/po_table');
const computerClients = new Map();
const Bot_Details = require('../../model/bot_amounts');
let db_config = require("../../config/db_uri");
let CardInfo = require("../model/cardInfo");
let playerService = require('../service/player');


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

    var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "poker" });
    console.log("robot add...");
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
    connection_string = "http://localhost:"+db_config.PORT_POKER+"?userId=" + user._id + "&token=" + jwtToken;

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
            await socketClient.emit('joinTable', { tableId: tableId, userId: user._id, sit : 1 });
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
	connection_string = "http://localhost:"+db_config.PORT_POKER+"?userId=" + user._id + "&token=" + user.jwtToken;
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
 
	let usernammmee = table.players[table.turnplayerId].playerInfo.userName;
    console.log("is computerrrrr playersss  : ", usernammmee);
	if(`computer_` + table._id == usernammmee)
	{
		console.log("yes computer player turn");
		turnPlayer(table._id,table.cardInfoId)
	}


	
}


async function turnPlayer(tableId,cardinfoid)
{
	const user = await getComputerPlayerForTable(tableId);
	let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_POKER+"?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);    
      
	socketClient
	.on('connect', async function() {

        await Table.update({_id: tableId}, {$inc: {botTurn: 1}});

        let table_bet = await Table.findOne({
            _id: tableId
        },{_id : 0 ,botTurn : 1 , maxbotTurn : 1});

        console.log("bot turnnn : ",table_bet  , " bot turn : ",table_bet.botTurn );



        

        setTimeout(async function(){
            let tableeee = await Table.findOne({
                _id: tableId
            });

            
            NextAmount = parseInt(tableeee.players[user._id].nextAmount);
            NextAction = tableeee.players[user._id].nextAction;


            if(NextAction=="Check")
                {
                    let isrand =  Math.floor(Math.random() * 3);
                    if(isrand == 2)
                    {
                        NextAmount  = NextAmount + 200;
                        NextAction = "Raise";
                    }
                   
                }
            let jsondiscard = {
                action: NextAction,
                userId: user._id ,
                tableId : tableId,
                amount : parseInt(NextAmount)
              
    
            }
            console.log("computer PlaceTurn : ", jsondiscard);
        await socketClient.emit('PlaceTurn', jsondiscard);

           

        }, 2000);

        // }else 
        // {
           


        
             
       
	}).on('error',async function()
	{
		console.log("on error");
	});
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
		connection_string = "http://localhost:" + db_config.PORT_POKER + "?userId=" + user._id + "&token=" + user.jwtToken;

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




module.exports = {
    joinTable,
    disconnect,
	turnPlayer,
	iscomputerplayer,disconnectRobo
}