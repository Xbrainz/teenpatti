const express = require('express');

const router = express.Router();
const authorize = require('../config/authorize');
const Settings = require('../model/settings');
const UserRole = require("../constant/userRole");

router.get('/fetchReq', (req, res) => {
    Settings.find({}, (err, data) => {
		if (err) {
            res.json({
                status: 'error',
                data: 'can not get',
            });
        } else {
            res.json({
                status: 'success',
                data,
            });
        }
    });
});

router.post('/editReq', authorize([UserRole.ADMIN]), (req, res) => {

    var editID = req.body.editID;
    var obj = req.body.obj;
    Settings.update({ _id : editID }, obj, (err) => {
        if (err) {
			console.log(err);
            res.json({ success: false, msg: 'error', data: '' });
        } else {
            res.json({ success: true, msg: "edited", data: "Successfully Saved" });
        }
    });
});


module.exports = router;