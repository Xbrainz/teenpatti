const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
const Role = require('../config/role');
const authorize = require('../config/authorize');
const User = require('../model/user');
const Table = require('../model/table');
const Announcements = require('../model/announcements');
const ROLE = require("../constant/userRole");

router.post('/fetchReq', (req, res) => {
    Announcements.find({}, (err, data) => {
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




router.post('/createReq', (req, res) => {
    
    const obj = {
        title: req.body.title,
        descr: req.body.descr,
        image: req.body.image,
        status: req.body.status,
    };

    Announcements.create(obj, async (err, table) => {
        if (err) {
			console.log(err);
            res.json({ success: false, msg: 'error', data: '' });
        } else {
			

            res.json({ success: true, msg: 'created', data: 'created' });
        }
    });
});

router.post('/editReq', authorize(), (req, res) => {
    const { packId } = req.body;
    const { obj } = req.body;
    Announcements.update({ _id : packId }, obj, (err) => {
        if (err) {
			console.log(err);
            res.json({ success: false, msg: 'error', data: '' });
        } else {
            res.json({ success: true, msg: 'edited', data: 'edited' });
        }
    });
});

router.post('/deleteReq', authorize(Role.Admin), (req, res) => {
    const { packId } = req.body;
    Announcements.remove({ _id: packId }, (err) => {
        if (err) {
            res.json({ success: false, msg: 'error', data: '' });
        } else {
            res.json({ success: true, msg: 'deleted', data: 'deleted' });
        }
    });
});


module.exports = router;