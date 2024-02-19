const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const Kycs = require('../model/kycs');

router.get("/fetchKyc",  function (req, res) {
    Kycs.find({}, function (err, data) {
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

router.post("/fetchKycUser",  function (req, res) {
    var userId = req.body.userId;
    console.log("call apisssss");
    //    withReq.find({ userId: userId }).sort({createdAt: -1}).limit(1, function(err, data){
    //         if (err) {
    //             res.json({
    //                 status: "error",
    //                 data: "can not get",
    //             });
    //         } else {
    //             res.json({
    //                 status: "success",
    //                 data: data,
    //             });
    //         }
    //     });
  


    Kycs.find({ userId: userId }, function (err, data) {
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
    }).sort({createdAt: -1}).limit(1);

    
});


router.post("/createReq", function (req, res) {

    let data = req.body;
    data = {
        ...data
    }

    Kycs.create(data, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "created", data: table });
			console.log(table);
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