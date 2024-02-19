const express = require("express");
const router = express.Router();
const Gametypemaster_Table = require("../model/gametype_master");
const Gamemaster_Table = require("../model/gamemaster");
const Jackpot_table = require("../model/jackpot");
const Table = require("../model/table");
const authorize = require("../config/authorize");

router.get("/fetchAllGamesTypes",  function (req, res) {
    let data = "" ; 
    try {
        Gametypemaster_Table.find({}, function (err, data) {
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
    }catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
    
});

router.post("/fetchGameByName", authorize(),  async function (req, res) {
    /* var tableId = req.body.tableId;
     let table = await Table.findOne({ _id: tableId });*/
         const { gameName } = req.body;
      


         Gamemaster_Table.find({ Sku: gameName},{GameName :true, GameRules : true,Sku : true}, function (err, data) {
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
        }).limit(1);;

    
    //  res.json({
    //      data: gamemaster,
    //      status: "success",
    //  });
 });


 router.post("/fetchGameByNameApp", authorize(), async function (req, res) {
    /* var tableId = req.body.tableId;
     let table = await Table.findOne({ _id: tableId });*/
         const { gameName } = req.body;
      

         Gamemaster_Table.find({ Sku: gameName}, {GameName :true, GameRules : true,Sku : true}, function (err, data) {
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
        }).limit(1);;

    
    //  res.json({
    //      data: gamemaster,
    //      status: "success",
    //  });
 });


router.post("/createGameType", function (req, res) {
    let data = req.body;
    data = {
        ...data
    }
    Gametypemaster_Table.create(data, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "created", data: "created" });
        }
    });
});

router.post("/editGameType",  function (req, res) {
    try {
        var tableId = req.body.tableId;
        var obj = req.body.obj;
        let data = " success" ; 
        Gametypemaster_Table.update({ _id: tableId }, obj, function (err, table) {
            if (err) {
                res.json({ success: false, msg: "error", data: "" });
            } else {
                res.json({ success: true, msg: "edited", data: "edited" });
            }
        });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/deleteGameType", function (req, res) {
    var tableId = req.body.tableId;
    Gametypemaster_Table.remove({ _id: tableId }, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "deleted", data: "deleted" });
        }
    });
});

//{GameName :true, GameRules : true,Sku : true}, 

router.get("/fetchAllGamesApp",  function (req, res) {
    let data = "" ; 
    try {
        Gamemaster_Table.find({GameStatus : 1}, {GameCommission:false, ProviderCommission:false},function (err, data) {
            if (err) {
                res.json({
                    status: "error",
                    data: "Error : "+err,
                });
            } else {
                res.json({
                    status: "success",
                    data: data,
                });
            }
        });
    }catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
    
});



router.get("/fetchAllGames",  function (req, res) {
    let data = "" ; 
    try {
        Gamemaster_Table.find({}, function (err, data) {
            if (err) {
                res.json({
                    status: "error",
                    data: "Error : "+err,
                });
            } else {
                res.json({
                    status: "success",
                    data: data,
                });
            }
        });
    }catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
    
});

router.post("/createGame", function (req, res) {
    let data = req.body;
    data = {
        ...data,
    }
    Gamemaster_Table.create(data, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error"+err, data: "" });
        } else {
            res.json({ success: true, msg: "created", data: "created" });
        }
    });
});

router.post("/editGame",  function (req, res) {
    try {
        var tableId = req.body.tableId;
        var obj = req.body.obj;
        let data = " success" ; 
        Gamemaster_Table.update({ _id: tableId }, obj, function (err, table) {
            if (err) {
                res.json({ success: false, msg: "error", data: "" });
            } else {
                res.json({ success: true, msg: "edited", data: "edited" });

                var GameCommission = req.body.obj.GameCommission;
                var ProviderCommission = req.body.obj.ProviderCommission;
                Table.find({
                    gameTypeId : tableId
                }).updateMany(
                    {},
                    {
                    $set: {
                        commission : GameCommission,
                        provider_commission : ProviderCommission
                    },
                    },
                    { multi: true },
                    function (err, data) {
                    //  data = err.message;
                        console.log(err);
                        // console.log(data);
                    }
                );
        
            }
        });



    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
});

router.post("/deleteGame",function (req, res) {
    var tableId = req.body.tableId;
    console.log(tableId);
    Gamemaster_Table.remove({ _id: tableId }, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "deleted", data: "deleted" });
        }
    });
});






module.exports = router;