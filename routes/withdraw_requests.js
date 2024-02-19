const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const withReq = require('../model/withdraw_requests');

router.get("/fetchReq",  function (req, res) {
    withReq.find({}, function (err, data) {
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

    withReq.create(data, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "created", data: data });
        }
    });
});

router.post("/editReq", function (req, res) {
    var tableId = req.body.tableId;
    var obj = req.body.obj;
    withReq.update({ _id: tableId }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "edited", data: "Successfully Edited" });
        }
    });
});


module.exports = router;