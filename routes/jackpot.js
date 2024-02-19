const express = require("express");
const router = express.Router();
const Role = require("../config/role");
const UserRole = require("./../constant/userRole");
const authorize = require("../config/authorize");
const Table = require("../model/table");
const Jackpot_table = require("../model/jackpot");


router.get("/fetchTables",  function (req, res) {
    Jackpot_table.find({}, function (err, data) {
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

router.post("/editTable",  function (req, res) {
    try {
        var tableId = req.body.tableId;
        var obj = req.body.obj;
        let data = " success" ; 
        Jackpot_table.update({ _id: tableId }, obj, function (err, table) {
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




module.exports = router;