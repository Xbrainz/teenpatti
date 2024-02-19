const express = require("express");
const router = express.Router();
const Role = require("../config/role");
const UserRole = require("./../constant/userRole");
const authorize = require("../config/authorize");
const Game = require("../model/dt_game");
const GamePlayer = require("../model/dt_game_player");
const Table = require("../model/table");





router.get("/getGames",  function (req, res) {
	
	const { startDate, endDate,  limit, skip } = req.body;
	
	
	   let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
	
	
    Game.find(
	{"createdAt": {
		"$gte": new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0), 
		"$lt": new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)}}
	
	, function (err, data) {
        if (err) {
            res.json({
                status: "error",
				datee : startDate,
                data: err,
            });
        } else {
            res.json({
                status: "success",
                data: data,
            });
        }
    }).sort({createdAt: -1}).limit(limit).skip(skip);
});


router.get("/getGamesIdsWisePlayers",  function (req, res) {
	
	const { startDate, endDate,  limit, skip,gameId } = req.body;
	
	console.log("startdate" + startDate);
	   let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
	
	
    GamePlayer.find(
	{"createdAt": {
		"$gte": new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0), 
		"$lt": new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)},
		"gameId" : gameId
		
    }
	
	, function (err, data) {
        if (err) {
            res.json({
                status: "error",
				datee : startDate,
                data: err,
            });
        } else {
            res.json({
                status: "success",
                data: data,
            });
        }
    }).sort({createdAt: -1}).limit(limit).skip(skip);
});



router.get("/getGamesIdsWise",  function (req, res) {
	
	const { startDate, endDate,  limit, skip,gameId } = req.body;
	
	console.log("startdate" + startDate);
	   let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
	
	
    Game.find(
	{"createdAt": {
		"$gte": new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0), 
		"$lt": new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)},
		"_id" : gameId
		
		}
	
	, function (err, data) {
        if (err) {
            res.json({
                status: "error",
				datee : startDate,
                data: err,
            });
        } else {
            res.json({
                status: "success",
                data: data,
            });
        }
    }).sort({createdAt: -1}).limit(limit).skip(skip);
});





router.post("/getgameplayers",  function (req, res) {
	
	const { startDate, endDate, tableId, limit, skip ,userId} = req.body;
	
	console.log("startdate" + startDate);
	   let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
	
    
	
    GamePlayer.find(
	{"createdAt": {
		"$gte": new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0), 
		"$lt": new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)}
	
		}
			
	, function (err, data) {
        if (err) {
            res.json({
                status: "error",
				datee : startDate,
                data: err,
            });
        } else {
            res.json({
                status: "success",
                data: data,
            });
        }
    }).sort({createdAt: -1}).limit(limit).skip(skip);
});



router.get("/fetchTables",  function (req, res) {
    Table.find({}, function (err, data) {
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

router.post("/totalplayer", authorize(), async function (req, res) {
   /* var tableId = req.body.tableId;
    let table = await Table.findOne({ _id: tableId });*/
        const { tableId } = req.body;
        const table = await Table.findOne({ _id: tableId }).lean().exec();
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

router.post("/createTable", authorize(), function (req, res) {
    var slotArray = [];
    for (var i = 1; i <= 9; i++) {
        slotArray.push(i);
    }

    let data = req.body;
    data = {
        ...data,
        slotUsedArray: slotArray
    }

    Table.create(data, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "created", data: "created" });
        }
    });
});

router.post("/editTable", authorize(), function (req, res) {
    var tableId = req.body.tableId;
    var obj = req.body.obj;
    Table.update({ _id: tableId }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "edited", data: "edited" });
        }
    });
});

router.get("/deleteTable", authorize(Role.Admin), function (req, res) {
    var tableId = req.query.tableId;
    Table.remove({ _id: tableId }, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "edited", data: "edited" });
        }
    });
});

router.post("/tablesByType", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), async function (req, res) {
    try {
        const { type } = req.body;
        const tables = await Table.find({ type: type })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, msg: "success", data: tables });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/checkTableByPlayerLeft", async function (req, res) {
    try {
        const { boot } = req.body;
        const tables = await Table.find({
            tableSubType: "public",
            boot: boot,
            playersLeft: { $lt: 5 },
            gameType : 0,
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

router.post("/checkTableBootAmounts", authorize(), async function (req, res) {
    try {
        const tables = await Table.find().lean().exec();
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
        const sortedBootAmount = uniqueBootAmount.sort(function (a, b) {
            return a - b;
        });
        res.json({ success: true, msg: "success", data: sortedBootAmount });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/getPrivateTables", authorize(), async function (req, res) {
    try {
        const tables = await Table.find({ tableSubType: "private" })
            .lean()
            .exec();
        res.json({ success: true, msg: "success", data: tables });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/getPrivateTablesByUserName", authorize(), async function (req, res) {
    try {
		
		 const { tableid, pass } = req.body;
      
        const tables = await Table.findOne({ tableidusername: tableid ,password : pass  })
            .lean()
            .exec();
        res.json({ success: true, msg: "success", data: tables });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/getvariation", authorize(), async function (req, res) {
    try {
        const { gametype } = req.body;
        const tables = await Table.find({ gameType: gametype }).lean().exec();
        res.json({ success: true, msg: "success", data: tables });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/getTableDetails", authorize(), async function (req, res) {
    try {
        const { tableId } = req.body;
        const tables = await Table.find({ _id: tableId }).lean().exec();
        res.json({ success: true, msg: "success", data: tables });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/checkTableBootAmountsNew", authorize(), async function (req, res) {
    try {
        const tables = await Table.find().lean().exec();
        let tableBootArray = [10,20,50,100,200,500,1000];
        let noOfTablesByBootValue = [];
        let activePlayersArray = [];
        let bootAmount = [];
        let allData = [];
        let minValueAsPerTable = [100,200,500,1000,2000,5000,10000];

        console.log("tables.length :: ", tables.length);
        

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
                tableBoot : tableBootArray[i],
                // totalTables : noOfTablesByBootValue[i],
                ActivePlayers : activePlayersArray[i],
                totalPlayers : noOfTablesByBootValue[i] * 9,
                minValueAsPerTable : minValueAsPerTable[i],
            }
            allData.push(obj);
        }

    
        
        const uniqueBootAmount = [...new Set(bootAmount)];
        const sortedBootAmount = uniqueBootAmount.sort(function (a, b) {
            return a - b;
        });
        res.json({ success: true, msg: "success", data: sortedBootAmount, allData : allData });
    } catch (err) {
        console.log("err :: ", err);
        res.json({ success: false, msg: err.message, data: "" });
    }
});




router.get("/count_tables",  function (req, res) {
    Table.find({}, function (err, data) {
        if (err) {
            res.json({ status: "error", data: "can not get", });
        } else {
            res.json({ status: "success", data: data});
        }
    }).count();
});




module.exports = router;