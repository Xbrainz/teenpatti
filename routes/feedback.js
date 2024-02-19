const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const FeedBack = require('../model/feedbacks');

router.get("/fetchfeedback",  function (req, res) {
    FeedBack.find({}, function (err, data) {
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


router.post("/createfeedback", function (req, res) {

    let data = req.body;
    data = {
        ...data
    }

    FeedBack.create(data, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "created", data: data });
        }
    });
});

router.post("/editfeedback", function (req, res) {
	
	console.log("editttttt");
    var tableId = req.body.tableId;
    var obj = req.body.obj;
    FeedBack.update({ _id: tableId }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "edited", data: "Successfully Edited" });
        }
    });
});


module.exports = router;