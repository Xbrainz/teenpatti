const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const Bot_Amounts = require("./../model/bot_amounts");
const Role = require("../config/role");



router.get("/getBots", async function (req, res) {
  try {
    const Bot_Details = await Bot_Amounts.find().sort({ createdAt: -1 });

    res.send(200, {
      success: true,
      Bot_Details,
      message: "Bot_Details Get Successfull",
    });
  } catch (err) {
    res.send({ success: false, message: err.name });
  }
});

router.post("/updateBots",  async function (req, res) {
  try {

    var tableId = req.body.table_boot;
    var obj = req.body.obj;
    let data = " success" ; 
    Bot_Amounts.updateOne({ table_boot: tableId }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "edited", data: table });
        }
    });


  
  } catch (err) {
    res.send({ success: false, message: err.message });
  }
});


module.exports = router;
