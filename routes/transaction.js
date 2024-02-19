const express = require("express");
const router = express.Router();
const Role = require("../config/role");
const authorize = require("../config/authorize");
const User = require("../model/user");
const Table = require("../model/table");
const Transaction = require("../model/transaction");
const TransactionRecharge = require("../model/transactionRecharge");
const TransactionGiftTip = require("../model/transactionGiftTip");
const TransactionCommission = require("../model/transactionCommission");
const transactionType = require("./../constant/transactionType");

router.get("/", function (req, res) {
    res.send("respond with a resource");
});

router.post("/getAdminTransaction", authorize(), async function (req, res) {
    try {
        const { userId } = req.body;
        const { skip } = req.body;
        const { limit } = req.body;
        if (userId) {
            const data = await Transaction.find({ receiverId: userId })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            res.send(200, {
                success: true,
                data,
            });
        } else {
            res.send({ success: false, message: "userId not found" });
        }
    } catch (err) {
        res.send(401, { success: false, message: err.name });
    }
});

router.post(
    "/getAdminRechargeTransaction",
    authorize(Role.Admin),
    async function (req, res) {
        try {
            const { userId } = req.body;
            const { skip } = req.body;
            const { limit } = req.body;
            if (userId) {
                const rechargeTransaction = await TransactionRecharge.find({
                    senderId: userId,
                    transType: transactionType.RECHARGE,
                })
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 });
                res.send(200, {
                    success: true,
                    rechargeTransaction,
                });
            } else {
                res.send({ success: false, message: "userId not found" });
            }
        } catch (err) {
            res.send(401, { success: false, message: err.name });
        }
    }
);

router.post(
    "/userTransactions",
    authorize(Role.Admin),
    async function (req, res) {
        try {
            const { userId } = req.body;
            const { skip } = req.body;
            const { limit } = req.body;
            if (userId) {
                const userTransactions = await Transaction.find({
                    userId: userId,
                })
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 });
                res.status(200).json({
                    success: true,
                    userTransactions,
                });
            } else {
                res.status(200).json({
                    success: false,
                    message: "userId not found",
                });
            }
        } catch (err) {
            res.status(401).json({ success: false, message: err });
        }
    }
);

router.get("/hitHighest", function (req, res) {
    var cardSet = [
        {
            set: [
                {
                    type: "heart",
                    rank: 6,
                    name: "6",
                    priority: 6,
                    id: 0.821374815702129,
                },
                {
                    type: "diamond",
                    rank: 5,
                    name: "5",
                    priority: 5,
                    id: 0.924271319640736,
                },
                {
                    type: "heart",
                    rank: 9,
                    name: "9",
                    priority: 9,
                    id: 0.709345920038595,
                },
            ],
        },
    ];
    Table.makeMeHighest(cardSet, 12, function (cards) {
        res.json({ newCard: cards });
    });
});

router.get("/dashboard", authorize(Role.Admin), function (req, res) {
    User.count({}, function (err, user) {
        Table.count({}, function (err, table) {
            User.find({}, function (err, allUser) {
                var obj = {
                    numberOfUser: user,
                    numberOfTable: table,
                    userDetails: allUser,
                };
                res.json({ success: true, data: obj });
            });
        });
    });
});

router.get("/getTransactions", function (req, res) {
    Transaction.find({ userId: req.query.userId }, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "success", data: table });
        }
    });
});

router.get("/allTotal", authorize(Role.Admin), async function (req, res) {
    try {
        let rechargeTotals;
        let tipTotals;
        let giftTotals;

        const rechargeTotal = await TransactionRecharge.aggregate([
            {
                $match: {
                    transType: transactionType.RECHARGE,
                },
            },
            {
                $group: {
                    _id: "",
                    Amount: {
                        $sum: "$coins",
                    },
                },
            },
            {
                $project: {
                    Total: "$Amount",
                },
            },
        ]);

        const rechargeRevertTotal = await TransactionRecharge.aggregate([
            {
                $match: {
                    transType: transactionType.RECHARGE_REVERT,
                },
            },
            {
                $group: {
                    _id: "",
                    Amount: {
                        $sum: "$coins",
                    },
                },
            },
            {
                $project: {
                    Total: "$Amount",
                },
            },
        ]);

        if (rechargeTotal.length > 0) {
            if (rechargeRevertTotal.length > 0) {
                rechargeTotals =
                    rechargeTotal[0].Total - rechargeRevertTotal[0].Total * -1;
            } else {
                rechargeTotals = rechargeTotal[0].Total;
            }
        } else {
            rechargeTotals = 0;
        }

        const tipTotal = await TransactionGiftTip.aggregate([
            {
                $match: {
                    transType: transactionType.TIP,
                },
            },
            {
                $group: {
                    _id: "",
                    Amount: {
                        $sum: "$coins",
                    },
                },
            },
            {
                $project: {
                    Total: "$Amount",
                },
            },
        ]);

        if (tipTotal.length > 0) {
            tipTotals = tipTotal[0].Total;
        } else {
            tipTotals = 0;
        }

        const giftTotal = await TransactionGiftTip.aggregate([
            {
                $match: {
                    transType: transactionType.GIFT,
                },
            },
            {
                $group: {
                    _id: "",
                    Amount: {
                        $sum: "$coins",
                    },
                },
            },
            {
                $project: {
                    Total: "$Amount",
                },
            },
        ]);

        if (giftTotal.length > 0) {
            giftTotals = giftTotal[0].Total;
        } else {
            giftTotals = 0;
        }

        const commissionAmount = await TransactionCommission.aggregate([
            {
                $match: {
                    transType: transactionType.COMMISSION,
                },
            },
            {
                $group: {
                    _id: "",
                    Amount: {
                        $sum: "$coins",
                    },
                },
            },
            {
                $project: {
                    Total: "$Amount",
                },
            },
        ]);

        let commissionTotals;
        if (commissionAmount.length > 0) {
            commissionTotals = commissionAmount[0].Total;
        } else {
            commissionTotals = 0;
        }

        res.send(200, {
            success: true,
            rechargeTotals,
            tipTotals,
            giftTotals,
            commissionTotals,
        });
    } catch (err) {
        res.send({
            success: false,
            message: err.name,
        });
    }
});

module.exports = router;
