const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
const Role = require('../config/role');
const authorize = require('../config/authorize');
const User = require('../model/user');
const Table = require('../model/table');
const Package = require('../model/package');
const ROLE = require("../constant/userRole");

router.post('/fetchPackages', (req, res) => {
    Package.find({}, (err, data) => {
        console.log("fetchPackages");
		if (err) {
            console.log("err",err);
            res.json({
                status: 'error',
                data: err,
            });
        } else {
            console.log("sccs");
            res.json({
                status: 'success',
                data,
            });
        }
    });
});




router.post('/createPackage', (req, res) => {
    
    const obj = {
        coin: req.body.coin,
        extra: req.body.extra,
        price: req.body.price,
        status: req.body.status,
    };

    Package.create(obj, async (err, table) => {
        if (err) {
			console.log(err);
            res.json({ success: false, msg: 'error', data: '' });
        } else {
			

            res.json({ success: true, msg: 'created', data: 'created' });
        }
    });
});

router.post('/editPackage', authorize(), (req, res) => {
    const { packId } = req.body;
    const { obj } = req.body;
    Package.update({ _id : packId }, obj, (err) => {
        if (err) {
			console.log(err);
            res.json({ success: false, msg: 'error', data: '' });
        } else {
            res.json({ success: true, msg: 'edited', data: 'edited' });
        }
    });
});

router.post('/deletePackage', authorize(Role.Admin), (req, res) => {
    const { packId } = req.body;
    Package.remove({ _id: packId }, (err) => {
        if (err) {
            res.json({ success: false, msg: 'error', data: '' });
        } else {
            res.json({ success: true, msg: 'deleted', data: 'deleted' });
        }
    });
});


module.exports = router;