const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const rankings = require('../model/rankings');
const users = require('../model/user');

router.get("/fetchReq", function (req, res) {

    rankings.find({}).populate('userId', 'userName displayName profilePic')
    .exec(function (err, data) {
        if (err) {
            console.log(err);
            res.json({
                status: "error",
                data: err,
            })
        } else {
            res.json({
                status: "success",
                data: data,
            });
        }
    });    


});

router.post("/editReq", function (req, res) {
    var editID = req.body.editID;
    var obj = req.body.obj;

    rankings.update({ _id: editID }, obj, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: err });
        } else {
            res.json({ success: true, msg: "edited", data: "Successfully Saved" });
        }
    });
});

// router.post("/createReq", function (req, res) {

//     let data = req.body;
//     console.log(req.body);
//     data = {
//         ...data
//     }

//     rankings.create(data, function (err, table) {
//         if (err) {
//             res.json({ success: false, msg: "error", data: err });
//         } else {
//             res.json({ success: true, msg: "created", data: data });
//         }
//     });
// });



module.exports = router;