const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../model/user");
const TransactionRecharge = require("./../model/transactionRecharge");
const StaticValue = require("../constant/staticValue");
const UserRole = require("./../constant/userRole");
const Status = require("./../constant/status");

const rechargeService = require("../service/recharge");

const create = async (req, res) => {
    try {
        const password = await bcrypt.hash(req.body.password, 10);
        let data = req.body;
        let chips = data.chips ? data.chips : 0

        data = {
            ...data,
            password: password,
            role: UserRole.DISTRIBUTOR,
            chips: 0
        }

        const user = await User.findOne({ userName: data.userName });
        if (user) {
            return res.status(401).json({
                success: false,
                message: "Distributor already exist",
            });
        }
        const newUser = new User(data);
        const addedUser = await newUser.save();

        const result = await rechargeService.transferCoin(addedUser._id, chips)

        res.status(200).send({
            success: true,
            result,
            message: "Distributor created successfully",
        })
    } catch (err) {
        res.status(401).send({
            success: false,
            message: err.message,
        })
    }
}

const list = (req, res) => {

    User.find({ role: UserRole.DISTRIBUTOR }, function (err, data) {
        if (err) {
            res.status(400).send({
                status: "error",
                data: "can not get",
            })
        } else {
            res.status(200).json({
                status: "success",
                data: data,
            });
        }
    });
}

const update = async (req, res) => {
    try {
        let data = req.body;

        const user = await User.findOne({ userName: data.userName });
        if (user) {
            return res.send(401, {
                success: false,
                message: "Distributor already exist",
            });
        }

        await User.findByIdAndUpdate({ _id: data.userId }, data, function (err) {
            if (err) {
                res.status(400).json({ success: false, msg: "error", data: "" });
            } else {
                res.status(200).json({ success: true, msg: "edited", data: "edited" });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(401).json({
            success: false,
            message: err.message,
        });
    }
}

const remove = (req, res) => {
    let { userId } = req.query;

    User.findByIdAndUpdate({ _id: userId }, { status: Status.DELETEED }, function (err) {
        if (err) {
            console.log(err);
            res.status(401).json({ success: false, msg: "error", data: "" });
        } else {
            res.status(200).json({ success: true, msg: "deleted", data: "deleted" });
        }
    });
}

module.exports = {
    create,
    list,
    update,
    remove
}