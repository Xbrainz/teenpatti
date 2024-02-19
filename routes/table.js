const express = require("express");
var _ = require("underscore");
const router = express.Router();
const Role = require("../config/role");
const UserRole = require("./../constant/userRole");
const authorize = require("../config/authorize");
const Table = require("../model/table");
const Old_Table = require("../model/old_table");
const gameAudit = require("../model/gameAudit");
const gamed = require("../model/game");
const cardInfo = require("../model/cardInfo");
const Po_Table = require("../poker/model/po_table");
const Rm_Table = require("../rummy/model/table");
const Lu_Table = require("../ludo/model/table");
const DT_Tablessss = require("../model/dt_table");
const User = require("../model/user");
const Teenpatti_Newgame = require("../service/newGame");
const ioClient = require('socket.io-client');
var ObjectID = require('mongodb').ObjectID;
let db_config = require("../config/db_uri");
//const Dt_Table = require("../ludo/model/dt_table");
const {
	constant
} = require("./../constant/constant");
const e = require("express");

router.get("/po_fetchTables", function(req, res) {
	Po_Table.find({}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data,
			});
		}
	});
});

router.get("/rm_fetchTables", function(req, res) {
	Rm_Table.find({}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data,
			});
		}
	});
});

router.post("/po_getTableDetails", authorize(), async function(req, res) {
	try {
		const {
			tableId
		} = req.body;
		const tables = await Po_Table.find({
			_id: tableId
		}).lean().exec();
		res.json({
			success: true,
			msg: "success",
			data: tables
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.get("/fetchgameId", function(req, res) {

	let finalStartDate = new Date("2022-08-21");
	let finalEndDate = new Date("2022-08-20");


	gamed.find({
		_id: ObjectId(/beb6/),
		// createdAt: {
		//     $gte: '2022-08-21 00:00:00',
		//     $lt:  '2022-08-18 00:00:00'
		// }

		// createdAt: {
		//     $gte: new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0),
		//     $lt: new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59),
		// },
	}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get " + err,
			});
		} else {
			res.json({
				status: "success",
				datas: data,
			});
		}
	});
});


router.post("/getCardInfo", function(req, res) {

	// var cardInfoId = req.data.cardInfoId;
	const {
		cardInfoId
	} = req.body;
	cardInfo.find({
		_id: cardInfoId
	}, {
		info: 1
	}, function(err, table) {
		if (err) {
			res.json({
				success: false,
				msg: "error",
				data: ""
			});
		} else {
			res.json({
				success: true,
				msg: "edited",
				data: table
			});
		}
	});
});



router.post("/GetScreenSortData", authorize(), async function(req, res) {
	/* var tableId = req.body.tableId;
	 let table = await Table.findOne({ _id: tableId });*/

	try {

		let {
			gameId
		} = req.body;


		let result = await gamed.aggregate([{
				$addFields: {
					tempId: {
						$toString: '$_id'
					},
				}
			},
			{
				$match: {
					tempId: {
						$regex: gameId
					},

				}
			}
		]);


		gameId = result[0]._id.toString();

		const table = await gameAudit.findOne({
			gameId: gameId,
			auditType: "WINNER"
		}).lean().exec();

		let tabledata = table.remark;
		let json = JSON.parse(tabledata);
		//    console.log("data .. " + tabledata);
		//  console.log("data .. " + json._id);
		let cardinfo = await cardInfo.findOne({
			_id: json.cardinfoId
		}).lean().exec();
		let game = await gamed.findOne({
			_id: json.lastGameId
		}).lean().exec();

		let data = {
			table: json,
			cardinfo: cardinfo,
			game: game,
		}

		res.json({
			data: data,

			status: "success",
			msg: "Screensort Data"
		});

	} catch (err) {
		console.log("errorrr", err.message);
		res.json({
			status: "falied",
			msg: err.message,
			data: ""
		});
	}

});


router.get("/fetchTables", function(req, res) {
	console.log("fetch all tbaless.....");
	const start = Date.now();
	Table.find({}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data,
			});
		}
		const stop = Date.now();

		console.log(`exe. time, fetchAllTables, primary = ${(stop - start)/1000} second`);
	});
});




router.post("/fetchTablesMin1",async function(req, res) {
	console.log("fetch all tbaless.....");

	try {
		const {
			gametype
		} = req.body;

	let data;

	if(gametype ==11)
	{
		data= await DT_Tablessss.find({}, {_id: 1,gameName: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1,tableCode: 1,gameType: 1,players: 1});
	}else if(gametype ==12 || gametype ==13)
	{
		data= await Lu_Table.find({}, {_id: 1,gameName: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1,tableCode: 1,gameType: 1,players: 1});
	}else if(gametype == 14){
		data= await Rm_Table.find({}, {_id: 1,gameName: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1,tableCode: 1,gameType: 1,players: 1});
	}else if(gametype == 15){
		data= await Po_Table.find({}, {_id: 1,gameName: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1,tableCode: 1,gameType: 1,players: 1});
	}else{
		data= await Table.find({}, {_id: 1,gameName: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1,tableCode: 1,gameType: 1,players: 1});

	}
	res.json({
		status: "success",
		data
		
	});

	}catch(error)
	{
		res.json({
			success: false,
			msg: error.message,
			data: ""
		});
	}
	
});




router.get("/fetchTablesMin2",async function(req, res) {
	

	try {
		const {
			gametype
		} = req.query;

	let data;
	console.log("fetch all tbaless.....",gametype);

	if(gametype ==11)
	{
		data= await DT_Tablessss.find({}, {_id: 1,gameName: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1});
	}else if(gametype ==12 || gametype ==13)
	{
		data= await Lu_Table.find({}, {_id: 1,gameType: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1});
	}else if(gametype == 14){
		data= await Rm_Table.find({}, {_id: 1,gameType: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1});
	}else if(gametype == 15){
		data= await Po_Table.find({}, {_id: 1,gameType: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1});
	}else{
		data= await Table.find({}, {_id: 1,gameType: 1,name: 1,boot: 1,tableSubType: 1,GameStatus: 1});

	}
	res.json({
		status: "success",
		data
		
	});

	}catch(error)
	{
		res.json({
			success: false,
			msg: error.message,
			data: ""
		});
	}





});





router.get("/fetchTables_Old", function(req, res) {
	console.log("fetch all tbaless.....");
	const start = Date.now();
	Old_Table.find({}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data,
			});
		}
		const stop = Date.now();

		console.log(`exe. time, fetchAllTables, primary = ${(stop - start)/1000} second`);
	});
});


router.post("/totalLivePlayers", function(req, res) {
	Table.find({}, {
		"playersLeft": 1,
		_id: 0
	}, function(err, data) {
		//  Table.find({}, function (err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data,
			});
		}
	});
});


router.post("/fetchPrivateTableDetail", async function(req, res) {



	try {
		const {
			gameName
		} = req.body;
		const tables = await Table.find({
			gameName: gameName
		}).lean().exec();

		let arrayoftablesdetail = [];
		for (let i = 0; i < tables.length; i++) {
			let tableBoot = tables[i].boot;
			if (tables[i].tableSubType !== "private" &&
				tables[i].GameStatus == "1"
			) {

				let TableBoot = false;
				for (let j = 0; j < arrayoftablesdetail.length; j++) {
					if (arrayoftablesdetail[j].bootAmount == tableBoot) {
						TableBoot = true;
					}

				}
				if (!TableBoot) {
					var data = {
						bootAmount: tableBoot,
						//    Commission : tables[i].commission,
						//    PotLimit : tables[i].potLimit,
						//    MaxBet : tables[i].maxBet,
						//    Name : tables[i].name, 
						//    Image : tables[i].image
					}

					arrayoftablesdetail.push(data);

				}
			}
		}

		arrayoftablesdetail = _.sortBy(arrayoftablesdetail, 'bootAmount');
		//    const uniqueBootAmount = [...new Set(bootAmount)];
		//    const sortedBootAmount = uniqueBootAmount.sort(function (a, b) {
		//        return a - b;
		//    });
		res.json({
			success: true,
			msg: "success",
			ddata: arrayoftablesdetail

		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}

});





router.post("/fetchPrivateTables", function(req, res) {

	let createdBy = req.body.createdBy;


	// Table.find({createdBy : createdBy , tableSubType : "private"}, {  maxPlayers: true, _id : true, name : true, playersLeft : true,provider_commission : true, commission : true, createdBy : true,jack_2to10 : true, jack_jqk : true, jack_aaa : true, maxBlindCount : true,boot : true, maxBet : true,potLimit : true, tableCode : true,
	//     gameCategory : true, gameName : true,maxBlindCount : true

	Table.find({
		createdBy: createdBy,
		tableSubType: "private"
	}, {
		maxPlayers: true,
		_id: true,
		name: true,
		createdBy: true,
		jack_2to10: true,
		jack_jqk: true,
		jack_aaa: true,
		maxBlindCount: true,
		boot: true,
		maxBet: true,
		potLimit: true,
		tableCode: true,
		gameCategory: true,
		gameName: true
	}, function(err, data) {
		if (err) {
			res.json({
				success: false,
				data: "can not get",
			});
		} else {
			res.json({
				success: true,
				data: data,
			});
		}
	});
});

router.post("/totalplayer", authorize(), async function(req, res) {
	/* var tableId = req.body.tableId;
	 let table = await Table.findOne({ _id: tableId });*/
	const {
		tableId
	} = req.body;
	const table = await Table.findOne({
		_id: tableId
	}).lean().exec();
	let playersLength;
	if (table.players == null) {
		playersLength = 0;
	} else {
		playersLength = Object.keys(table.players).length;
	}
	res.json({
		totalpayer: playersLength,
		status: "success",
	});
});







router.post("/createTable", async function(req, res) {
	var slotArray = [];
	let data = req.body;
	let maxPlayers = req.body.maxPlayers;
	if (maxPlayers == 5) {
		slotArray = [1, 2, 3, 4, 5];
	} else if (maxPlayers == 4) {
		slotArray = [1, 2, 3, 4];
	} else if (maxPlayers == 3) {
		slotArray = [1, 3, 5];
	} else if (maxPlayers == 2) {
		slotArray = [1, 3];
	}
	var gameType = data.gameType;
	console.log("gametyree" , req.body);

	// if (req.body.gameName == "TEENPATTI")
	// 	gameType = 0;
	// else if (req.body.gameName == "OPENTP")
	// 	gameType = 1;
	// else if (req.body.gameName == "MUFLIS")
	// 	gameType = 2;
	// else if (req.body.gameName == "AK47")
	// 	gameType = 3;
	// else if (req.body.gameName == "ZHANDU")
	// 	gameType = 4;
	// else if (req.body.gameName == "2X_BOOT")
	// 	gameType = 5;
	// else if (req.body.gameName == "4X_BOOT")
	// 	gameType = 6;
	// else if (req.body.gameName == "JOKER")
	// 	gameType = 7;
	// else if (req.body.gameName == "AFLATOON")
	// 	gameType = 8;
	// else if (req.body.gameName == "4_CARDS")
	// 	gameType = 9;
	// else if (req.body.gameName == "JACKPOT")
	// 	gameType = 10;
	// else if (req.body.gameName == "POINT_RUMMY")
	// 	gameType = 11;
	// else if (req.body.gameName == "LUDO_CLASSIC")
	// 	gameType = 12;
	// else if (req.body.gameName == "LUDO_PREMIUM")
	// 	gameType = 13;
	// else if (req.body.gameName == "RUMMY")
	// 	gameType = 14;


	if (gameType == 12 || gameType == 13) {
		if (maxPlayers == 2) {
			slotArray = [0, 2];
		} else {
			slotArray = [0, 1, 2, 3];
		}

	}


	data = {
		...data,
		gameInit: false,
		slotUsedArray: slotArray,
		gameType: gameType,
		players: {},
		lastGameId: null
	}
	console.log("create tablesss ", data.players);

	if(gameType == "14")
	{

		slotArray = [1,2,3,4,5,6];


		let point  = data.boot / 80;
		data = {
			...data,
			gameInit: false,
			pointValue : point,
			slotUsedArray: slotArray,
			gameType: gameType,
			players: {},
			lastGameId: null
		}
		
		Rm_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}else if(gameType =="15")
	{
		Po_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}else if(gameType == "12" || gameType == "13")
	{
		Lu_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}else{
		Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}


	
});


router.post("/rm_createTable", async function(req, res) {

	var slotArray = [];
	let data = req.body;
	let maxPlayers = req.body.maxPlayers;
	console.log("create table : ", data);
	if (maxPlayers == 5) {
		slotArray = [1, 2, 3, 4, 5];
	} else if (maxPlayers == 4) {
		slotArray = [1, 2, 3, 4];
	} else if (maxPlayers == 3) {
		slotArray = [1, 3, 5];
	} else if (maxPlayers == 2) {
		slotArray = [1, 3];
	}
	var gameType = data.gameType;
	console.log("gametyree" , req.body);

	// if (req.body.gameName == "TEENPATTI")
	// 	gameType = 0;
	// else if (req.body.gameName == "OPENTP")
	// 	gameType = 1;
	// else if (req.body.gameName == "MUFLIS")
	// 	gameType = 2;
	// else if (req.body.gameName == "AK47")
	// 	gameType = 3;
	// else if (req.body.gameName == "ZHANDU")
	// 	gameType = 4;
	// else if (req.body.gameName == "2X_BOOT")
	// 	gameType = 5;
	// else if (req.body.gameName == "4X_BOOT")
	// 	gameType = 6;
	// else if (req.body.gameName == "JOKER")
	// 	gameType = 7;
	// else if (req.body.gameName == "AFLATOON")
	// 	gameType = 8;
	// else if (req.body.gameName == "4_CARDS")
	// 	gameType = 9;
	// else if (req.body.gameName == "JACKPOT")
	// 	gameType = 10;
	// else if (req.body.gameName == "POINT_RUMMY")
	// 	gameType = 11;
	// else if (req.body.gameName == "LUDO_CLASSIC")
	// 	gameType = 12;
	// else if (req.body.gameName == "LUDO_PREMIUM")
	// 	gameType = 13;
	// else if (req.body.gameName == "RUMMY")
	// 	gameType = 14;


	if (gameType == 12 || gameType == 13) {
		if (maxPlayers == 2) {
			slotArray = [0, 2];
		} else {
			slotArray = [0, 1, 2, 3];
		}

	}


	data = {
		...data,
		gameInit: false,
		slotUsedArray: slotArray,
		gameType: gameType,
		players: {},
		lastGameId: null
	}
	console.log("create tablesss ", data.players);

	if(gameType == "14")
	{
		slotArray = [1,2,3,4,5,6];

		data = {
			...data,
			gameInit: false,
			slotUsedArray: slotArray,
			gameType: gameType,
			players: {},
			lastGameId: null
		}


		Rm_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}else if(gameType =="15")
	{
		Po_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}else if(gameType == "12" || gameType == "13")
	{
		Lu_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}else{
		Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "created"
				});
			}
		});
	}


	
});

function getRandom(digit) {
	var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var random_code = '';
	for (var i = 0; i < digit; i++) {
		random_code += letters[Math.floor(Math.random() * 16)];
	}
	return random_code;
}

router.post("/createPrivateTable", async function(req, res) {
	var slotArray = [];
	let data = req.body;
	let maxPlayers = req.body.maxPlayers;
	let createdBy = req.body.createdBy;

	if (maxPlayers == 6) {
		slotArray = [1, 2, 3, 4, 5, 6];
	}else if (maxPlayers == 5) {
		slotArray = [1, 2, 3, 4, 5];
	} else if (maxPlayers == 4) {
		slotArray = [1, 2, 3, 4];
	} else if (maxPlayers == 3) {
		slotArray = [1, 3, 5];
	} else if (maxPlayers == 2) {
		slotArray = [1, 3];
	}

	var gameType = data.gameType;
	console.log("privateCreate" , req.body);

	if (gameType == 12 || gameType == 13) {
		if (maxPlayers == 2) {
			slotArray = [0, 2];
		} else {
			slotArray = [0, 1, 2, 3];
		}
	}else if(gameType == 14)
	{
		slotArray = [1,2,3,4,5,6];
	}

	let tables = "" ;
	if(gameType == "14")
	{


		 tables = await Rm_Table.find({
			boot: req.body.boot,
			gameInit: false,
			gameType: req.body.gameType,
		}).limit(1);
	}else if(gameType =="15")
	{
		
		tables = await Po_Table.find({
			boot: req.body.boot,
			gameInit: false,
			gameType: req.body.gameType,
		}).limit(1);
	}else if(gameType == "12" || gameType == "13")
	{
		tables = await Lu_Table.find({
			boot: req.body.boot,
			gameInit: false,
			gameType: req.body.gameType,
		}).limit(1);
	}else{
		tables = await Table.find({
			boot: req.body.boot,
			gameInit: false,
			gameType: req.body.gameType,
		}).limit(1);
	}
	console.log("get tablesss ", tables);

	var tableCode = getRandom(6);
	data = {
		...data,
		slotUsedArray: slotArray,
		gameInit: false,
		tableCode: tableCode,
		commission: tables[0].commission,
		provider_commission: tables[0].provider_commission,
		maxBlindCount: tables[0].maxBlindCount,
		maxBet: tables[0].maxBet,
		potLimit: tables[0].potLimit,
		tableSubType: "private",
		gameType: tables[0].gameType,
		players: {},
		lastGameId: tables[0].lastGameId,
		slotUsed: 0,
		turnTime: 15,
		name: "Private Table",
		color_code: tables[0].color_code,
		type: "premium",
		password: "",
		minChip: 0,
		maxChip: 999999999,
		GameStatus: 1,
		jack_aaa: tables[0].jack_aaa,
		jack_jqk: tables[0].jack_jqk,
		jack_2to10: tables[0].jack_2to10,
		image: "",
		createdBy: createdBy

	}


	if(gameType == "14")
	{

		data = {
			...data,
			bonusTime: tables[0].bonusTime
		
		}
		Rm_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "success",
					TableCode: tableCode
				});
			}
		});
	}else if(gameType =="15")
	{
		Po_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "success",
					TableCode: tableCode
				});
			}
		});
	}else if(gameType == "12" || gameType == "13")
	{
		Lu_Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "success",
					TableCode: tableCode
				});
			}
		});
	}else{
		Table.create(data, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: err
				});
			} else {
	
				res.json({
					success: true,
					msg: "created",
					data: "success",
					TableCode: tableCode
				});
			}
		});

	}



});







router.post("/editTable",  function(req, res) {
	var tableId = req.body.tableId;
	var obj = req.body.obj;
	var gameType = req.body.obj.gameType;


	if(gameType == "14")
	{
		Rm_Table.update({
			_id: tableId
		}, obj, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: ""
				});
			} else {
				res.json({
					success: true,
					msg: "edited",
					data: "edited"
				});
			}
		});
	} else if(gameType =="15")
	{
		console.log("gam,etypaaa : 15");
		Po_Table.update({
			_id: tableId
		}, obj, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: ""
				});
			} else {
				res.json({
					success: true,
					msg: "edited",
					data: "edited"
				});
			}
		});
	}else if(gameType == "12" || gameType == "13")
	{
		Lu_Table.update({
			_id: tableId
		}, obj, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: ""
				});
			} else {
				res.json({
					success: true,
					msg: "edited",
					data: "edited"
				});
			}
		});
	}
	else{
		Table.update({
			_id: tableId
		}, obj, function(err, table) {
			if (err) {
				res.json({
					success: false,
					msg: "error",
					data: ""
				});
			} else {
				res.json({
					success: true,
					msg: "edited",
					data: "edited"
				});
			}
		});
	}

	
});

router.get("/deleteTable", authorize(Role.Admin), function(req, res) {
	var tableId = req.query.tableId;
	Table.remove({
		_id: tableId
	}, function(err, table) {
		if (err) {
			res.json({
				success: false,
				msg: "error",
				data: ""
			});
		} else {
			res.json({
				success: true,
				msg: "edited",
				data: "edited"
			});
		}
	});
});

router.get("/rm_deleteTable", authorize(Role.Admin), function(req, res) {
	var tableId = req.query.tableId;
	Rm_Table.remove({
		_id: tableId
	}, function(err, table) {
		if (err) {
			res.json({
				success: false,
				msg: "error",
				data: ""
			});
		} else {
			res.json({
				success: true,
				msg: "edited",
				data: "edited"
			});
		}
	});
});
router.post("/tablesByType", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), async function(req, res) {
	try {
		const {
			type
		} = req.body;
		const tables = await Table.find({
				type: type
			})
			.sort({
				createdAt: -1
			})
			.lean();
		res.json({
			success: true,
			msg: "success",
			data: tables
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

/*
router.post("/checkTableByPlayerLeft", async function (req, res) {
    try {
        console.log(req.body);
        const { boot } = req.body.boot;
        const { gameType } = req.body.gameType;
        console.log(boot);
        console.log(gameType);

        const tables = await Table.find({
            tableSubType: "public",
            boot: req.body.boot,
            playersLeft: { $lt: 5 },
            gameType : req.body.gameType,
        })
            .sort({ playersLeft: -1 })
            .limit(1)
            .lean()
            .exec();
        res.json({ success: true, msg: "success", data: tables });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});
*/

router.post("/checkTableByPlayerLeft", async function(req, res) {
	//try {
		const {
			boot,
			gameType,maxplayersss,userId
		} = req.body;


		const userdetail = await User.find({
			_id: userId
		});

		let tables;
		console.warn("get table : Boot : ", boot , " Gametype : ", gameType , " maxplayer : ",maxplayersss);

		if (gameType == "14") {

            if(maxplayersss == 2)
            {
                tables = await Rm_Table.aggregate([{
					$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,	"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1, "pointValue" : 1, "points" : 1,
						PlayerCount: {$size: {"$objectToArray": "$players"}},
					}
				},
				{
					$match: {
						tableSubType: "public",
						boot: parseInt(boot),
							gameType: parseInt(gameType),
						GameStatus: 1,
						PlayerCount: {
							$in: [1]
						},

					}
				},

				{
					$limit: 1
				}
			]);


			if (tables.length == 0) {
				console.log("message 88");
				tables = await Rm_Table.aggregate([{
						$project: {
							"_id": 1,"maxPlayers": 1,"bonusTime" :1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,"pointValue" : 1, "points" : 1, PlayerCount: {$size: {"$objectToArray": "$players"}},
						}
					},
					{
						$match: {
							tableSubType: "public",
							boot: parseInt(boot),
							gameType: parseInt(gameType),
							GameStatus: 1,
							PlayerCount: {
								$in: [0]
							}
						}
					},
					{
						$limit: 1
					}
				]);
			}
            }else{

                tables = await Rm_Table.aggregate([{
					$project: {"_id": 1,"maxPlayers": 1,"bonusTime" :1,"maxBlindCount": 1,	"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,"pointValue" : 1, "points" : 1,
						PlayerCount: {$size: {"$objectToArray": "$players"}},
					}
				},
				{
					$match: {
						tableSubType: "public",
						boot: parseInt(boot),
						gameType: parseInt(gameType),
						GameStatus: 1,
						PlayerCount: {
							$in: [1, 2, 3, 4,5]
						},

					}
				},

				{
					$limit: 1
				}
			]);


			if (tables.length == 0) {
				console.log("message 88");
				tables = await Rm_Table.aggregate([{
						$project: {
							"_id": 1,"maxPlayers": 1,"bonusTime" :1, "maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1, "pointValue" : 1, "points" : 1,PlayerCount: {$size: {"$objectToArray": "$players"}},
						}
					},
					{
						$match: {
							tableSubType: "public",
                            boot: parseInt(boot),
							gameType: parseInt(gameType),
							GameStatus: 1,
							PlayerCount: {
								$in: [0]
							}
						}
					},
					{
						$limit: 1
					}
				]);
			}

            }

			

		} else if (gameType == "15") {

            console.log("in 15....");
			tables = await Po_Table.aggregate([{
					$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,	"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,
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
						boot: parseInt(boot),
						gameType: parseInt(gameType),
						GameStatus: 1,
						PlayerCount: {
							$in: [1, 2, 3, 4]
						},

					}
				},

				{
					$limit: 1
				}
			]);


			if (tables.length == 0) {
				console.log("message 88");
				tables = await Po_Table.aggregate([{
						$project: {
							"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,PlayerCount: {$size: {"$objectToArray": "$players"}},
						}
					},
					{
						$match: {
							tableSubType: "public",
							boot: parseInt(boot),
							gameType: parseInt(gameType),
							GameStatus: 1,
							PlayerCount: {
								$in: [0]
							}
						}
					}
                    ,
					{
						$limit: 1
					}
				]);


                
		

			}

		} else if (gameType == "12" || gameType == "13")  {



			if(userdetail[0].lasttableId == undefined)
			userdetail[0].lasttableId = "";


			
			console.warn("tableee. ..000   :   ");
			const {
				maxplayersss
			} = req.body;



			if (maxplayersss == 2) {

				console.log("userdetails L: :  ",userdetail[0].lasttableId , "   ::: ",userdetail[0].game );
				if(userdetail[0].lasttableId != "" && (userdetail[0].game == 12 || userdetail[0].game == 13))
				{
	
					tables = await Lu_Table.aggregate([{
						$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,
						"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,PlayerCount: {$size: {"$objectToArray": "$players"}
							},
						}
					},
					{


						$match: {
							tableSubType: "public",
							boot: parseInt(boot),
							gameType: userdetail[0].game ,
							GameStatus: 1,
							maxPlayers : 2,
							_id : ObjectID(userdetail[0].lasttableId)
							
						}
					}
					]);

					console.warn("table idddd : founddddddd ddddddddddddddddddddddddd " ,tables.length);

				}



		if (tables == null || tables.length == 0  ) {

				tables = await Lu_Table.aggregate([{
						$project: {
							"_id": 1,
							"maxPlayers": 1,
							"maxBlindCount": 1,
							"turnTime": 1,
							"gameType": 1,
							"boot": 1,
							"maxBet": 1,
							"potLimit": 1,
							"commission": 1,
							"color_code": 1,
							"type": 1,
							"tableSubType": 1,
							"gameCategory": 1,
							"gameName": 1,
							"image": 1,
							"commission": 1,
							"provider_commission": 1,
							"GameStatus": 1,
							"gameTypeId": 1,
							"name": 1,
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
							boot: parseInt(boot),
							gameType: parseInt(gameType),
							GameStatus: 1,
							maxPlayers : 2,
							PlayerCount: {
								$in: [1]
							},

						}
					},

					{
						$sort: {
							PlayerCount: 1
						}
					},
					{
						$limit: 1
					}
				]);

			}
				console.warn("tableee. ..1   :   ", tables._id);

				if (tables.length == 0) {

					console.log("message 88");
					tables = await Lu_Table.aggregate([{
							$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,
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
								boot: parseInt(boot),
								gameType: parseInt(gameType),
								GameStatus: 1,
								maxPlayers : 2,
								PlayerCount: {
									$in: [0]
								}
							}
						},
						{
							$limit: 1
						}
					]);
	
					console.warn("tableee. ..33  :   ", tables._id);
				}

				
			} else {

				if(userdetail[0].lasttableId != "" && (userdetail[0].game == 12 || userdetail[0].game == 13))
				{
	
				


					tables = await Lu_Table.aggregate([{
						$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,
						"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,PlayerCount: {$size: {"$objectToArray": "$players"}
							},
						}
					},
					{


						$match: {
							tableSubType: "public",
							boot: parseInt(boot),
							gameType: userdetail[0].game ,
							GameStatus: 1,
							maxPlayers : 4,
							_id : ObjectID(userdetail[0].lasttableId)
							
						}
					}
					]);



				}

				if (tables == null || tables.length == 0 ) {
				tables = await Lu_Table.aggregate([{
						$project: {
							"_id": 1,
							"maxPlayers": 1,
							"maxBlindCount": 1,
							"turnTime": 1,
							"gameType": 1,
							"boot": 1,
							"maxBet": 1,
							"potLimit": 1,
							"commission": 1,
							"color_code": 1,
							"type": 1,
							"tableSubType": 1,
							"gameCategory": 1,
							"gameName": 1,
							"image": 1,
							"commission": 1,
							"provider_commission": 1,
							"GameStatus": 1,
							"gameTypeId": 1,
							"name": 1,
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
							boot: parseInt(boot),
							maxPlayers : 4,
							gameType: parseInt(gameType),
							GameStatus: 1,
							PlayerCount: {
								$in: [1, 2, 3]
							},

						}
					},

					{
						$sort: {
							PlayerCount: -1
						}
					},{
						$limit: 1
					}
				]);
			}


				console.warn("tableee. ..22333   :   ", tables);

				if (tables.length == 0) {

					console.log("message 88");
					tables = await Lu_Table.aggregate([{
							$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,
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
								boot: parseInt(boot),
								gameType: parseInt(gameType),
								GameStatus: 1,
								maxPlayers : 4,
								PlayerCount: {
									$in: [0]
								}
							}
						},
						{
							$limit: 1
						}
					]);
	
					console.warn("tableee. ..33  :   ", tables._id);
				}

				
			}



			

			console.warn("table getttttt : ", tables[0]._id);


		}else {

            console.log("in 15....");
			tables = await Table.aggregate([{
					$project: {"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,	"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,
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
						boot: parseInt(boot),
						gameType: parseInt(gameType),
						GameStatus: 1,
						PlayerCount: {
							$in: [1, 2, 3, 4]
						},

					}
				},

				{
					$limit: 1
				}
			]);


			if (tables.length == 0) {
				console.log("message 88");
				tables = await Table.aggregate([{
						$project: {
							"_id": 1,"maxPlayers": 1,"maxBlindCount": 1,"turnTime": 1,"gameType": 1,"boot": 1,"maxBet": 1,"potLimit": 1,"commission": 1,"color_code": 1,"type": 1,"tableSubType": 1,"gameCategory": 1,"gameName": 1,"image": 1,"commission": 1,"provider_commission": 1,"GameStatus": 1,"gameTypeId": 1,"name": 1,PlayerCount: {$size: {"$objectToArray": "$players"}},
						}
					},
					{
						$match: {
							tableSubType: "public",
							boot: parseInt(boot),
							gameType: parseInt(gameType),
							GameStatus: 1,
							PlayerCount: {
								$in: [0]
							}
						}
					}
                    ,
					{
						$limit: 1
					}
				]);


                
		

			}

		} 

		console.log("..................bbbbbbbbbbbbbbbbbbb.. : ", tables.length);

	//	console.log(tables);
		console.log("..................bbbbbbbbbbbbbbbbbbb..mmmmmmmmmmmmmmmmmmmmmmmmmm");
        let arrtables ;
        if(gameType=="14")
        {

     
		 arrtables = await Rm_Table.find({
			boot: boot,
			gameType: gameType,
			GameStatus: 1,
			tableSubType: "public",
		});
        }else if(gameType == "15")
        {
            console.log("in table 155555555555555");
            arrtables = await Po_Table.find({
                boot: boot,
                gameType: gameType,
                GameStatus: 1,
                tableSubType: "public",
            });
        }else  if(gameType == "12" || gameType == "13"){
            arrtables = await Lu_Table.find({
                boot: boot,
                gameType: gameType,
				maxPlayers : maxplayersss,
                GameStatus: 1,
                tableSubType: "public",
            });
        }else{
			console.log("in table 155555555555555");
            arrtables = await Table.find({
                boot: boot,
                gameType: gameType,
                GameStatus: 1,
                tableSubType: "public",
            });
		}

      //  console.log("Sizzeee ", arrtables.length);
    //    console.log("tables[0] ", tables[0]);
        if(arrtables.length > 0 )
        {
            let totalplayes = 0;
            let totalmaxplayers = 0;
    
            for (let table in arrtables) {
    
                totalmaxplayers += arrtables[table].maxPlayers;
                  console.warn("totalmaxplayers .. " + totalmaxplayers  );
                if (arrtables[table].players == null) {
                    totalplayes += 0;
                } else {
    
                    let playersLength = Object.keys(arrtables[table].players).length;
                    totalplayes += playersLength;
                }
    
            }
    
     //       console.warn("table create new   notttt  " + (totalmaxplayers - totalplayes) + " totalplayes    " + totalplayes + "  totalmaxplayers  " + totalmaxplayers);
    
            if ((totalmaxplayers - totalplayes) < 26) {
                //create table
    
                console.warn("table create new");
    
                var slotArray = [];
                for (var i = 1; i <= 5; i++) {
                    slotArray.push(i);
                }

				if(gameType == 14)
				{
					slotArray = [1,2,3,4,5,6];	
				}
    
                if (gameType == 12 || gameType == 13) {
                    if (tables[0].maxPlayers == 2) {
                        slotArray = [0, 2];
                    } else {
                        slotArray = [0, 1, 2, 3];
                    }
    
                }
    
             //   console.log("maxplayersss : : ", tables[0]);
    
              
    
    
                //  if(tables[0].gameType != 12 && tables[0].gameType != 13)
                if(gameType=="14")
                {

					let data = [{
						maxPlayers: tables[0].maxPlayers,
						maxBlindCount: tables[0].maxBlindCount,
						slotUsed: "0",
						turnTime: tables[0].turnTime,
						gameType: tables[0].gameType,
						boot: tables[0].boot,
						maxBet: tables[0].maxBet,
						potLimit: tables[0].potLimit,
						commission: tables[0].commission,
						color_code: tables[0].color_code,
						type: tables[0].type,
						tableSubType: tables[0].tableSubType,
						gameCategory: tables[0].gameCategory,
						gameName: tables[0].gameName,
						image: tables[0].image,
						commission: tables[0].commission,
						provider_commission: tables[0].provider_commission,
						GameStatus: tables[0].GameStatus,
						gameTypeId: tables[0].gameTypeId,
						gameInit: false,
						name: tables[0].name,
						password: "",
						slotUsedArray: slotArray,
						lastGameId: null,
						players: {},
						timer: tables[0].timer,
						lastBet: tables[0].lastBet,
						cardInfoId: tables[0].cardInfoId,
						cardIdDiscarded: tables[0].cardIdDiscarded,
						gameStarted: false,
						bonusTime: tables[0].bonusTime,
						points: tables[0].points,
						pointValue: tables[0].pointValue,
					
					}];

				//	console.warn("rm tablesss .... ", tables[0].pointValue);

                    Rm_Table.create(data, function(err, table) {
                        console.log(err, table);
                    });
                }else if(gameType == "15")
                {

					let data = [{
						maxPlayers: tables[0].maxPlayers,
						maxBlindCount: tables[0].maxBlindCount,
						slotUsed: "0",
						turnTime: tables[0].turnTime,
						gameType: tables[0].gameType,
						boot: tables[0].boot,
						maxBet: tables[0].maxBet,
						potLimit: tables[0].potLimit,
						commission: tables[0].commission,
						color_code: tables[0].color_code,
						type: tables[0].type,
						tableSubType: tables[0].tableSubType,
						gameCategory: tables[0].gameCategory,
						gameName: tables[0].gameName,
						image: tables[0].image,
						commission: tables[0].commission,
						provider_commission: tables[0].provider_commission,
						GameStatus: tables[0].GameStatus,
						gameTypeId: tables[0].gameTypeId,
						gameInit: false,
						name: tables[0].name,
						password: "",
						slotUsedArray: slotArray,
						lastGameId: null,
						players: {},
						timer: tables[0].timer,
						lastBet: tables[0].lastBet,
						gameStarted: false,
						cardInfoId: tables[0].cardInfoId,
						turnplayerId : "",
						dealer: tables[0].dealer,
					}];
					
                    Po_Table.create(data, function(err, table) {
                        console.log(err, table);
                    });
              //      console.log("new table : ", data);
                }else if(gameType == "12" || gameType == "13"){
					console.log("new table : createdddd");
					let data = [{
						maxPlayers: tables[0].maxPlayers,
						maxBlindCount: tables[0].maxBlindCount,
						slotUsed: "0",
						turnTime: tables[0].turnTime,
						gameType: tables[0].gameType,
						boot: tables[0].boot,
						maxBet: tables[0].maxBet,
						potLimit: tables[0].potLimit,
						commission: tables[0].commission,
						color_code: tables[0].color_code,
						type: tables[0].type,
						tableSubType: tables[0].tableSubType,
						gameCategory: tables[0].gameCategory,
						gameName: tables[0].gameName,
						image: tables[0].image,
						commission: tables[0].commission,
						provider_commission: tables[0].provider_commission,
						GameStatus: tables[0].GameStatus,
						gameTypeId: tables[0].gameTypeId,
						gameInit: false,
						name: tables[0].name,
						password: "",
						slotUsedArray: slotArray,
						lastGameId: null,
						players: {},
						timer: tables[0].timer,
						lastBet: tables[0].lastBet,
						gameStarted: false,
						cardInfoId: tables[0].cardInfoId,
					}];

                    Lu_Table.create(data, function(err, table) {
                        console.log(err, table);
                    });
                }else {

					let data = [{
						maxPlayers: tables[0].maxPlayers,
						maxBlindCount: tables[0].maxBlindCount,
						slotUsed: "0",
						turnTime: tables[0].turnTime,
						gameType: tables[0].gameType,
						boot: tables[0].boot,
						maxBet: tables[0].maxBet,
						potLimit: tables[0].potLimit,
						commission: tables[0].commission,
						color_code: tables[0].color_code,
						type: tables[0].type,
						tableSubType: tables[0].tableSubType,
						gameCategory: tables[0].gameCategory,
						gameName: tables[0].gameName,
						image: tables[0].image,
						commission: tables[0].commission,
						provider_commission: tables[0].provider_commission,
						GameStatus: tables[0].GameStatus,
						gameTypeId: tables[0].gameTypeId,
						gameInit: false,
						name: tables[0].name,
						password: "",
						slotUsedArray: slotArray,
						lastGameId: null,
						players: {},
						timer: tables[0].timer,
						lastBet: tables[0].lastBet,
						gameStarted: false,
						cardInfoId: tables[0].cardInfoId,
						dealer: tables[0].dealer,
					}];

					Table.create(data, function(err, table) {
                        console.log(err, table);
                    });
				}
    
    
    
    
            }
    
        }
		


		
		console.log("user detail : ",userdetail[0].lasttableId);
		if(userdetail[0].lasttableId == undefined)
		userdetail[0].lasttableId = "";
	//	console.log("table id : ",tables[0]._id  , " user id : : ",userdetail[0].lasttableId + "   " + userId);
	//console.log(userdetail[0].game + "  gamtype  " +gameType);




	
		if(gameType != userdetail[0].game)
		{
			if(userdetail[0].lasttableId.toString() != 0)
			{
				

					userdetail[0].isplaying = "no";
				
				if(userdetail[0].game == 14)
				{
				//	let connection_string = "http://localhost:6060?userId=" + userdetail[0]._id + "&token=" + userdetail[0].jwtToken;


					const lasttable = await Rm_Table.findOne({
						_id: userdetail[0].lasttableId
					},{players : 1}).lean().exec();


					if(lasttable!= null && lasttable.players[userdetail[0]._id])
					{


					let connection_string = "http://localhost:"+db_config.PORT_RUMMY+"?userId=" + userdetail[0]._id + "&token=" + userdetail[0].jwtToken;



					let socketClient = ioClient.connect(connection_string);   
					socketClient.on('connect', async function() {
						console.log("on connect of robootttttt");
						await socketClient.emit('Forcedisconnect',  { tableId: lasttable._id, userId: userdetail[0]._id });
						socketClient.disconnect();
										
					}).on('error',async function()
					{
						console.log("on error");
					});

					userdetail[0].lasttableId = "";

					}
				}else if(userdetail[0].game == 12 || userdetail[0].game == 13)
				{
					console.log("lasttableiddd: ", userdetail[0].lasttableId);
					const lasttable = await Lu_Table.findOne({
						_id: userdetail[0].lasttableId
					},{players : 1}).lean().exec();

					
					if(lasttable!= null && lasttable.players[userdetail[0]._id])
					{

					let connection_string = "http://localhost:"+db_config.PORT_LUDO+"?userId=" + userdetail[0]._id + "&token=" + userdetail[0].jwtToken;

					console.log("on connect of robootttttt :22 ", userdetail[0].lasttableId , "  userid : ", userdetail[0]._id );
					let socketClient = ioClient.connect(connection_string);   
					socketClient.on('connect', async function() {
						console.log("on connect of robootttttt : ", lasttable._id, "  userid : ", userdetail[0]._id );
						await socketClient.emit('Forcedisconnect', { tableId: lasttable._id, userId: userdetail[0]._id });
						socketClient.disconnect();
										
					}).on('error',async function()
					{
						console.log("on error");
					});

					userdetail[0].lasttableId = "";
					}
				}
				else if(userdetail[0].game == 15)
				{
					
					const lasttable = await Po_Table.findOne({
						_id: userdetail[0].lasttableId
					},{players : 1}).lean().exec();


					if(lasttable!= null && lasttable.players[userdetail[0]._id])
					{

					let connection_string = "http://localhost:"+db_config.PORT_POKER+"?userId=" + userdetail[0]._id + "&token=" + userdetail[0].jwtToken;



					let socketClient = ioClient.connect(connection_string);   
					socketClient.on('connect', async function() {
						console.log("on connect of robootttttt");
						await socketClient.emit('Forcedisconnect',  { tableId: lasttable._id, userId: userdetail[0]._id });
						socketClient.disconnect();
										
					}).on('error',async function()
					{
						console.log("on error");
					});

					userdetail[0].lasttableId = "";
				}
				}else 
				{
				
					const lasttable = await Table.findOne({
						_id: userdetail[0].lasttableId
					},{players : 1}).lean().exec();

					console.log("table : " + lasttable + "    " + userdetail[0].lasttableId);

					if(lasttable!= null && lasttable.players[userdetail[0]._id])
					{
					let connection_string = "http://localhost:"+db_config.PORT_TEENPATTI+"?userId=" + userdetail[0]._id + "&token=" + userdetail[0].jwtToken;


					let socketClient = ioClient.connect(connection_string);   
					socketClient.on('connect', async function() {
						console.log("on connect of robootttttt");
						await socketClient.emit('Forcedisconnect',  { tableId: lasttable._id, userId: userdetail[0]._id });
						socketClient.disconnect();
										
					}).on('error',async function()
					{
						console.log("on error");
					});

					userdetail[0].lasttableId = "";
				
					}
				}
			}
		}

		console.log("table id : eeeeeeeeeeeeee");

		if(userdetail[0].lasttableId.toString() == "")
		{
			userdetail[0].isplaying = "no";
		}

	
		if(tables[0]._id.toString() == userdetail[0].lasttableId.toString() )
		{
			res.json({
				success: true,
				msg: "success",
				gametype : userdetail[0].game,
				lasttable : userdetail[0].lasttableId.toString() ,
				isplay :userdetail[0].isplaying,
				data: tables,
				
			});

		}else{
			res.json({
				success: true,
				msg: "success",
				gametype : userdetail[0].game,
				lasttable : userdetail[0].lasttableId.toString() ,
				isplay : userdetail[0].isplaying,
				data: tables,
				
			});
		}



		
	// } catch (err) {

	// 	res.json({
	// 		success: false,
	// 		msg: err.message,
	// 		data: ""
	// 	});
	// }
});




router.post("/checkTableBootAmounts", authorize(), async function(req, res) {
	try {
		const {
			gametype
		} = req.body;
		// const tables = await Table.find().lean().exec();
		const tables = await Table.find({
			gameType: gametype,
		}).lean().exec();
		let bootAmount = [];
		for (let i = 0; i < tables.length; i++) {
			let tableBoot = tables[i].boot;
			if (
				tables[i].tableSubType !== "private" &&
				tables[i].type == "premium"
			) {
				bootAmount.push(tableBoot);
			}
		}
		const uniqueBootAmount = [...new Set(bootAmount)];
		const sortedBootAmount = uniqueBootAmount.sort(function(a, b) {
			return a - b;
		});
		res.json({
			success: true,
			msg: "success",
			data: sortedBootAmount
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
		x
	}
});

router.post("/checkTableBootAmountsFull", async function(req, res) {
	try {
		
		const {
			gametype , maxPlayers
		} = req.body;
		let tables;

		console.log("playercountt L:");
		if (gametype == "14") {
			console.log("in 14");
			tables = await Rm_Table.find().sort( { "boot": 1 } );
		} else if (gametype == "15") {
			tables = await Po_Table.find().sort( { "boot": 1 } );
		} else if (gametype == "12" || gametype == "13") {
			tables = await Lu_Table.find({
				gameType: gametype, maxPlayers : maxPlayers
			}).sort( { "boot": 1 } );
		} else {
			tables = await Table.find({
				gameType: gametype,
			}).sort( { "boot": 1 } );
		}

	
		let bootAmount = [];
		//let Commission = [];
		let PotLimit = [];
	//	let MaxBet = [];
		let MaxPlayers = [];
	//	let Name = [];
	//	let Image = [];
	let Timer =[];
	let PlyerCount =[];

	let countt = 0;
	let lastboot  = 0;
	let lastPort = 0, lastMAzplayer = 0,lastTimer = 0;
		if(tables.length >0)
		{
			lastboot = tables[0].boot;
			lastPort = tables[0].potLimit;
			lastMAzplayer = tables[0].maxPlayers;
			lastTimer = tables[0].turnTime;
				

		}
	 
		for (let i = 0; i < tables.length; i++) {

			let tableBoot = tables[i].boot;

			
			
			
			if (tables[i].tableSubType != "private" && tables[i].GameStatus == "1" ) {

				console.log("table : " , tables[i].boot, Object.keys(tables[i].players).length);


			
				// console.log("innnnnnnnnnnnnnnn");
				// let TableBoot = false;
				// for (let j = 0; j < bootAmount.length; j++) {
				// 	if (bootAmount[j] == tableBoot) {
				// 		TableBoot = true;
				// 	}

				// }
				// if (!TableBoot) {
					
				// }

				if(lastboot != tables[i].boot )
				{
					console.log("add boot value  " ,tables[i].boot , " lastPort : ", lastPort , " lastboot : ", lastboot , " tables[i].PotLimit : ", tables[i].potLimit + " countt : " + countt);

					bootAmount.push(lastboot);
				
					PotLimit.push(lastPort);
				
					MaxPlayers.push(lastMAzplayer);
				
					Timer.push(lastTimer);
					PlyerCount.push(countt);
					countt = 0;
					console.log("push table : " ,countt);

					
				}
				countt =  countt + Object.keys(tables[i].players).length;
				lastboot = tables[i].boot;
				lastPort = tables[i].potLimit;
				lastMAzplayer = tables[i].maxPlayers;
				lastTimer = tables[i].turnTime;


			
			}
		}
		console.log("lassttttt : : " , lastboot);
		if(lastboot != bootAmount[bootAmount.length-1])
		{
			
			
			console.log("lassttttt : : addd doneneee " , lastboot);

				bootAmount.push(lastboot);
			
				PotLimit.push(lastPort);
			
				MaxPlayers.push(lastMAzplayer);
			
				Timer.push(lastTimer);
				PlyerCount.push(countt);
				
				console.log("push table : " ,countt);
			

		}
		//    const uniqueBootAmount = [...new Set(bootAmount)];
		//    const sortedBootAmount = uniqueBootAmount.sort(function (a, b) {
		//        return a - b;
		//    });
		res.json({
			success: true,
			msg: "success",
			ddata: {
				data: bootAmount,
				dataPotLimit: PotLimit,
				dataMaxPlayers: MaxPlayers,
				dataTimer : Timer,
				PlyerCount : PlyerCount
			}

		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.post("/ActivePlayerByBoot", async function(req, res) {
	try {
		const {
			gametype
		} = req.body;
		const tables = await Table.find({
			gameType: gametype,
		}).lean().exec();
		let bootAmount = [];
		let Commission = [];
		let PotLimit = [];
		let MaxBet = [];
		let MaxPlayers = [];
		let Name = [];
		let Image = [];
		for (let i = 0; i < tables.length; i++) {
			let tableBoot = tables[i].boot;
			if (tables[i].tableSubType !== "private" &&
				tables[i].type == "premium" &&
				tables[i].GameStatus == "1"
			) {

				let TableBoot = false;
				for (let j = 0; j < bootAmount.length; j++) {
					if (bootAmount[j] == tableBoot) {
						TableBoot = true;
					}

				}
				if (!TableBoot) {
					bootAmount.push(tableBoot);
					Commission.push(tables[i].commission);
					PotLimit.push(tables[i].potLimit);
					MaxBet.push(tables[i].maxBet);
					MaxPlayers.push(tables[i].maxPlayers);
					Name.push(tables[i].name);
					Image.push(tables[i].image);
				}
			}
		}


		let activeplayersss = [];
		for (let ii = 0; ii < bootAmount.length; ii++) {
			let activePlayers = 0;
			const tables = await Table.find({
				gameType: gametype,
				boot: bootAmount[ii]
			}).lean().exec();


			for (let i = 0; i < tables.length; i++) {

				if (tables[i].players != null) {
					for (let j = 0; j < Object.keys(tables[i].players).length; j++) {
						// if (tables[i].players[Object.keys(tables[i].players)[j]].active == true) {
						activePlayers += 1;
						// }
					}
				}
			}

			activeplayersss.push(activePlayers);

		}


		res.json({
			success: true,
			msg: "success",
			ddata: {
				data: bootAmount,
				dataactiveplayer: activeplayersss,
				dataMaxPlayers: MaxPlayers,

			}

		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});









/*Tables BOOT Wise New APIs */

router.post("/checkTableBootAmountsbyadmin", async function(req, res) {
	try {
		const {
			gametype
		} = req.body;
		
		let tables ;

		if(gametype == "14")
		{
			tables = await Rm_Table.find({
				gameType: gametype,
			}).lean().exec();
		}else if(gametype =="15")
		{
			tables = await Po_Table.find({
				gameType: gametype,
			}).lean().exec();
		}else if(gametype == "12" || gametype == "13")
		{
			tables = await Lu_Table.find({
				gameType: gametype,
			}).lean().exec();
		}else{
			tables = await Table.find({
				gameType: gametype,
			}).lean().exec();
		}

		console.log("tablesss :: ",tables.length);
		let bootAmount = [];
		let Commission = [];
		let Provider_commission = [];
		let PotLimit = [];
		let MaxBet = [];
		let Name = [];
		let Image = [];
		let status = [];
		let jack_aaa = [];
		let jack_jqk = [];
		let jack_2to10 = [];
		let MaxPlayers = [];
		let maxBlindCount = [];

		for (let i = 0; i < tables.length; i++) {
			let tableBoot = tables[i].boot;
			if (tables[i].tableSubType !== "private" && tables[i].type == "premium") {
				let TableBoot = false;
				for (let j = 0; j < bootAmount.length; j++) {
					if (bootAmount[j] == tableBoot) {
						TableBoot = true;
					}
				}
				if (!TableBoot) {
					bootAmount.push(tableBoot);
					Commission.push(tables[i].commission);
					Provider_commission.push(tables[i].provider_commission);
					PotLimit.push(tables[i].potLimit);
					MaxBet.push(tables[i].maxBet);
					Name.push(tables[i].name);
					Image.push(tables[i].image);
					MaxPlayers.push(tables[i].maxPlayers);
					maxBlindCount.push(tables[i].maxBlindCount);
					status.push(tables[i].GameStatus);
					jack_aaa.push(tables[i].jack_aaa);
					jack_jqk.push(tables[i].jack_jqk);
					jack_2to10.push(tables[i].jack_2to10);
				}
			}
		}
		//   const uniqueBootAmount = [...new Set(bootAmount)];
		//   const sortedBootAmount = uniqueBootAmount.sort(function (a, b) {
		//        return a - b;
		//   });
		res.json({
			success: true,
			msg: "success",
			data: bootAmount,
			datacommission: Commission,
			dataPotLimit: PotLimit,
			dataMaxBet: MaxBet,
			dataName: Name,
			dataImage: Image,
			dataProCommission: Provider_commission,
			dataStatus: status,
			dataMaxPlayers: MaxPlayers,
			dataMaxBlindCount: maxBlindCount,
			datajack_aaa: jack_aaa,
			datajack_jqk: jack_jqk,
			datajack_2to10: jack_2to10
		});
		// res.json({ 
		//     success: true, 
		//     msg: "success", 
		//     ddata: {
		//         data: bootAmount,
		//         datacommission : Commission, 
		//         dataPotLimit : PotLimit, 
		//         dataMaxBet : MaxBet,
		//         dataName : Name ,
		//         dataImage : Image 
		//     }

		// });
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

/*
router.post("/updateManyTables",  async function (req, res) {
    try {
		 const { boot,  gameType , comm ,potLimit ,maxBet } = req.body;
		 
		 //console.log(gametype)
      
       let data = " success" ; 
				   
			Table.updateMany(
			  {
				    boot: boot,
			gameType: gameType
		
				 
			},
			  {
				$set: {
				  commission: comm,
				  potLimit : potLimit,
				  maxBet : maxBet
				  
				},
			  },
			  { multi: true },
			  function (err, data) {
				//  data = err.message;
				console.log(err)
				
			  }
			).then();

	   
        res.json({ success: true, msg: "success", data: data });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

*/




router.post("/updateManyTables", async function(req, res) {
	try {
		const {
			boot,
			gameType,
			comm,
			potLimit,
			maxBet,
			name,
			image,
			provider_commission,
			GameStatus,
			jack_2to10,
			jack_jqk,
			jack_aaa,
			maxPlayers,
			maxBlindCount
		} = req.body;
		let data = "success";


		if(gameType == "14")
		{
			Rm_Table.updateMany({
				boot: boot,
				gameType: gameType
			}, {
				$set: {
					commission: comm,
					potLimit: potLimit,
					maxBet: maxBet,
					name: name,
					image: image,
					provider_commission: provider_commission,
					GameStatus: GameStatus,
					maxPlayers: maxPlayers,
					maxBlindCount: maxBlindCount,
					jack_2to10: jack_2to10,
					jack_jqk: jack_jqk,
					jack_aaa: jack_aaa
				},
			}, {
				multi: true
			},
			function(err, data) {
				// data = err.message;

			}
		);
		}else if(gameType =="15")
		{
			Po_Table.updateMany({
				boot: boot,
				gameType: gameType
			}, {
				$set: {
					commission: comm,
					potLimit: potLimit,
					maxBet: maxBet,
					name: name,
					image: image,
					provider_commission: provider_commission,
					GameStatus: GameStatus,
					maxPlayers: maxPlayers,
					maxBlindCount: maxBlindCount,
					jack_2to10: jack_2to10,
					jack_jqk: jack_jqk,
					jack_aaa: jack_aaa
				},
			}, {
				multi: true
			},
			function(err, data) {
				// data = err.message;

			}
		);
		}else if(gameType == "12" || gameType == "13")
		{
			Lu_Table.updateMany({
				boot: boot,
				gameType: gameType
			}, {
				$set: {
					commission: comm,
					potLimit: potLimit,
					maxBet: maxBet,
					name: name,
					image: image,
					provider_commission: provider_commission,
					GameStatus: GameStatus,
					maxPlayers: maxPlayers,
					maxBlindCount: maxBlindCount,
					jack_2to10: jack_2to10,
					jack_jqk: jack_jqk,
					jack_aaa: jack_aaa
				},
			}, {
				multi: true
			},
			function(err, data) {
				// data = err.message;

			}
		);
		}else{
			Table.updateMany({
				boot: boot,
				gameType: gameType
			}, {
				$set: {
					commission: comm,
					potLimit: potLimit,
					maxBet: maxBet,
					name: name,
					image: image,
					provider_commission: provider_commission,
					GameStatus: GameStatus,
					maxPlayers: maxPlayers,
					maxBlindCount: maxBlindCount,
					jack_2to10: jack_2to10,
					jack_jqk: jack_jqk,
					jack_aaa: jack_aaa
				},
			}, {
				multi: true
			},
			function(err, data) {
				// data = err.message;

			}
		);
		}



		
		res.json({
			success: true,
			msg: "success",
			data: data
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.post("/deleteManyTables", async function(req, res) {
	try {
		const {
			boot,
			gametype
		} = req.body;
		let data = " success";


		if(gametype == "14")
		{
			Rm_Table.remove({
				boot: boot,
				gameType: gametype
			}, function(err, table) {
				if (err) {
	
				} else {
	
				}
			});
		}else if(gametype =="15")
		{
			Po_Table.remove({
				boot: boot,
				gameType: gametype
			}, function(err, table) {
				if (err) {
	
				} else {
	
				}
			});
		}else if(gametype == "12" || gametype == "13")
		{
			Lu_Table.remove({
				boot: boot,
				gameType: gametype
			}, function(err, table) {
				if (err) {
	
				} else {
	
				}
			});
		}else{
			Table.remove({
				boot: boot,
				gameType: gametype
			}, function(err, table) {
				if (err) {
	
				} else {
	
				}
			});
		}



		
		res.json({
			success: true,
			msg: "success",
			data: data
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

/*Tables BOOT Wise New APIs END */


router.post("/getPrivateTables", authorize(), async function(req, res) {
	try {
		const tables = await Table.find({
				tableSubType: "private"
			})
			.lean()
			.exec();
		res.json({
			success: true,
			msg: "success",
			data: tables
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.post("/getPrivateTablesByUserName", authorize(), async function(req, res) {
	try {

		tableCode= req.body.tableCode;

		let gametype = req.body.gametype;


		console.log(req.body);
		if(gametype == "14")
		{
			const tables = await Rm_Table.findOne({
				tableCode: tableCode
			})
			.lean()
			.exec();
			if(tables== null)
			{
				res.json({
					success: false,
					msg: "table not found",
					data: tables
				});
			}else{

				res.json({
					success: true,
					msg: "success",
					data: tables
				});
			}
		}else if(gametype == "15")
		{
			const tables = await Po_Table.findOne({
				tableCode: tableCode
			})
			.lean()
			.exec();
			if(tables== null)
			{
				res.json({
					success: false,
					msg: "table not found",
					data: tables
				});
			}else{

				res.json({
					success: true,
					msg: "success",
					data: tables
				});
			}
		}else if(gametype == "12" || gametype == "13")
		{
			const tables = await Lu_Table.findOne({
				tableCode: tableCode
			})
			.lean()
			.exec();
			if(tables== null)
			{
				res.json({
					success: false,
					msg: "table not found",
					data: tables
				});
			}else{
				res.json({
					success: true,
					msg: "success",
					data: tables
				});
			}
		}else{
			const tables = await Table.findOne({
				tableCode: tableCode
			})
			.lean()
			.exec();
			if(tables== null)
			{
				res.json({
					success: false,
					msg: "table not found",
					data: tables
				});
			}else{
				res.json({
					success: true,
					msg: "success",
					data: tables
				});
			}
			
		}

		
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.post("/getvariation", authorize(), async function(req, res) {
	try {
		const {
			gametype
		} = req.body;
		const tables = await Table.find({
			gameType: gametype
		}).lean().exec();
		res.json({
			success: true,
			msg: "success",
			data: tables
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.post("/getTableDetails", authorize(), async function(req, res) {
	try {
		const {
			tableId
		} = req.body;
		const tables = await Table.find({
			_id: tableId
		}).lean().exec();
		res.json({
			success: true,
			msg: "success",
			data: tables
		});
	} catch (err) {
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});

router.post("/checkTableBootAmountsNew", authorize(), async function(req, res) {
	try {
		const tables = await Table.find().sort(boot)
		let tableBootArray = [10, 20, 50, 100, 200, 500, 1000];
		let noOfTablesByBootValue = [];
		let activePlayersArray = [];
		let bootAmount = [];
		let allData = [];
		let minValueAsPerTable = [100, 200, 500, 1000, 2000, 5000, 10000];
		let PlyerCount =[];


		for (let k = 0; k < tableBootArray.length; k++) {
			let noOfTable = 0;
			let activePlayers = 0;

			for (let i = 0; i < tables.length; i++) {
				let tableBoot = tables[i].boot;
				if (
					tables[i].tableSubType !== "private" &&
					tables[i].type == "premium" &&
					tables[i].gameType == 0 &&
					tables[i].boot == tableBootArray[k]
				) {
					bootAmount.push(tableBoot);
					noOfTable += 1;

					if (tables[i].players !== null) {
						let players = tables[i].players;

						for (let j = 0; j < Object.keys(players).length; j++) {
							if (players[Object.keys(players)[j]].active == true) {
								activePlayers += 1;
							}
						}
					}

				}
			}

			noOfTablesByBootValue.push(noOfTable);
			activePlayersArray.push(activePlayers);

		}



		for (let i = 0; i < tableBootArray.length; i++) {
			let obj = {
				tableBoot: tableBootArray[i],
				// totalTables : noOfTablesByBootValue[i],
				ActivePlayers: activePlayersArray[i],
				totalPlayers: noOfTablesByBootValue[i] * 9,
				minValueAsPerTable: minValueAsPerTable[i],
			}
			allData.push(obj);
		}



		const uniqueBootAmount = [...new Set(bootAmount)];
		const sortedBootAmount = uniqueBootAmount.sort(function(a, b) {
			return a - b;
		});
		res.json({
			success: true,
			msg: "success",
			data: sortedBootAmount,
			allData: allData
		});
	} catch (err) {
		console.log("err :: ", err);
		res.json({
			success: false,
			msg: err.message,
			data: ""
		});
	}
});






router.get("/count_tables", function(req, res) {
	Table.find({}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data
			});
		}
	}).count();
});

router.get("/count_rm_tables", function(req, res) {
	Table.find({}, function(err, data) {
		if (err) {
			res.json({
				status: "error",
				data: "can not get",
			});
		} else {
			res.json({
				status: "success",
				data: data
			});
		}
	}).count();
});


module.exports = router;