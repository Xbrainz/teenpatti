const express = require("express");
const router = express.Router();
const Role = require("../config/role");
const UserRole = require("./../constant/userRole");
const authorize = require("../config/authorize");
const DailyBonus = require("../model/daily_bonus");

router.get("/get_bonus",  function (req, res) {
    DailyBonus.find({}, function (err, data) {
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


router.post("/edit_bonus", function (req, res) {
    var bonusId = req.body.bonusId;
    var obj = req.body.obj;
    DailyBonus.update({ _id: bonusId }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "edited", data: "edited" });
        }
    });
});




module.exports = router;