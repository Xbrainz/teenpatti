const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const MoneyReq = require('../model/money_requests');

router.get("/fetchReq",  function (req, res) {
    MoneyReq.find({}, function (err, data) {
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


router.post("/fetchReqOne",  function (req, res) {
    var tableId = req.body.id;
    MoneyReq.find({_id : tableId}, function (err, data) {
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


router.post("/createReq", function (req, res) {

    let data = req.body;
    console.log(req.body);
    data = {
        ...data
    }

    MoneyReq.create(data, function (err, dataadd) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "created", data: dataadd });
        }
    });
});

router.post("/editReq", function (req, res) {
    var tableId = req.body.customer_id;
    var obj = req.body.data;
    MoneyReq.update({ customer_id: tableId }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "edited", data: "Successfully Edited" });
        }
    });
});


module.exports = router;