const User = require("../model/user");
const Coins = require("./../model/coins");
const TransactionRecharge = require("./../model/transactionRecharge");



const transactionType = require("./../constant/transactionType");
const rechargeService = require("./../service/recharge");

const create = async (req, res) => {
    try {
        const { userId, coins } = req.body;

        const { bonus_number} = req.body;


        console.log("bonuss :  ",bonus_number);

        if(bonus_number != undefined)
        {
          //  User
            // const result = await User.retainCoin(userId, parseInt(coins), transactionType, remark);

            var datetime = new Date();
          

            var date = datetime.toISOString().slice(0,10);

            await User.update({
                _id: userId
            }, {
                $set: {
                    dailybonus_day: bonus_number,
                    dailybonus_date  :date
                },
            });

        }

        const result = await rechargeService.transferCoin(userId, parseInt(coins));
        res.status(200).send({
            success: true,
            result,
            message: "Coins transferred successfully",
        })
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

const remove = async (req, res) => {
    try {
        const { userId, coins, transactionType, remark } = req.body;

        const result = await rechargeService.retainCoin(userId, parseInt(coins), transactionType, remark);
        res.status(200).send({
            success: true,
            result,
            message: "Coins transferred successfully",
        })
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = {
    create,
    remove,
}