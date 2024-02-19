const ioClient = require('socket.io-client');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const secret = "developersecretcode";
const User = require('../model/user');
const Table = require('../model/table');
const computerClients = new Map();
const Bot_Details = require('../../model/bot_amounts');
let db_config = require("../../config/db_uri");


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


    var Bot_Detailssss =  await Bot_Details.findOne({ table_boot: "ludo" });

    if(Bot_Detailssss.onoff == "on")
    {

  
    var user =  await User.findOne({ userName: `computer_` + tableId });

    if(user == null || user == undefined)
    {
        let userData = {
            userName : "computer_"+tableId,
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

    }

   // console.log("user : ", user);
    jwtToken = generateJwtTokenByUser(user);
    connection_string = "http://localhost:"+db_config.PORT_LUDO+"?userId=" + user._id + "&token=" + jwtToken;


	const resultNamw = getRandomItem(array);


    user = await User.findOneAndUpdate(
        { _id: user.id },
        { $set: { clientIp: "1.1.1.1",Decrole :"Client", jwtToken :jwtToken,displayName : resultNamw } },
        { new: true },
    )





    if(connection_string != "")
    {
        let socketClient = ioClient.connect(connection_string);    
      
        socketClient
        .on('connect', async function() {
            await socketClient.emit('joinTable', { tableId: tableId, userId: user._id });
            computerClients.set(user._id, socketClient);
        }).on('error',async function()
        {

        });
    }
    
}
}

async function getComputerPlayerForTable(tableId) {
    return await User.findOne({ userName: `computer_` + tableId });
}

async function disconnect(tableId) {

    const user = await getComputerPlayerForTable(tableId);
 
    let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_LUDO+"?userId=" + user._id + "&token=" + user.jwtToken;
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
   if(table.turnplayerId != "" && table.players[table.turnplayerId])
   {

  
        let usernammmee = table.players[table.turnplayerId].playerInfo.userName;
        if(`computer_` + table._id == usernammmee)
        {
            turnPlayer(table._id)
        }

    }
	
}

async function isFinishgame(table)
{
    let usernammmee = table.players[table.turnplayerId].playerInfo.userName;
	// if(`computer_` + table._id == usernammmee)
	// {
		
        const user = await getComputerPlayerForTable(table._id);
	let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_LUDO+"?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);    
      
	socketClient
	.on('connect', async function() {

     

        

      

    }).on('error',async function()
	{
		console.log("on error");
	});



	//}
}


async function turnPlayer(tableId)
{
	const user = await getComputerPlayerForTable(tableId);
	let connection_string = "";
	connection_string = "http://localhost:"+db_config.PORT_LUDO+"?userId=" + user._id + "&token=" + user.jwtToken;
	let socketClient = ioClient.connect(connection_string);    
      
	socketClient
	.on('connect', async function() {

        await Table.update({_id: tableId}, {$inc: {botTurn: 1}});

        let table_bet = await Table.findOne({
            _id: tableId
        },{_id : 0 ,botTurn : 1 });


        await socketClient.emit('ClickOnDise', { tableId: tableId, userId: user._id  ,random_no : 0});
        let  table = await Table.findOne({
            _id: tableId
        },{players : 1});



        if (table.players[user._id].active_token.length > 0) {
            setTimeout(async function() {

                table = await Table.findOne({
                    _id: tableId
                });

                if (table.players[user._id].active_token.length > 0) {
                    let tokenno ;
                    if(table.players[user._id].active_token.length == 1)
                    {
                        tokenno = table.players[user._id].active_token[0];
                    }else{
                        let random = Math.floor(Math.random() * (table.players[user._id].active_token.length-1));
                    
                        tokenno = table.players[user._id].active_token[random];
                    }

                    await socketClient.emit('performToken', { tableId: tableId, userId: user._id , token_no : parseInt(tokenno) });
                }

            }, 2000);
        }

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
		connection_string = "http://localhost:" + db_config.PORT_LUDO + "?userId=" + user._id + "&token=" + user.jwtToken;

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
	iscomputerplayer,
    isFinishgame,disconnectRobo
}