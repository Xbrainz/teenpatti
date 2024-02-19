const mongoose = require('mongoose');
const _ = require('lodash')
const TransactionChalWin = require("../../poker/model/transactionChalWin")
const Transactionrecharge = require("./../../poker/model/transactionRecharge")
const TransactionGiftTip = require("./../../model/transactionGiftTip");
const TransactionType = require('../../constant/transactionType');
const UserRole = require('./../../constant/userRole');
const User = require('../../model/user');

const userwise = async (data, user) => {
    const { startDate, endDate, userId, skip, limit, transType } = data;
    let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        }
    }

    let subUserData;
    let transactionChalWinResult = [], transactionGiftTipResult = [], transactionRechargeResult = [];
    if (transType && transType.toLowerCase() === "all") {
        let conditionsTR1, conditionsTR2;
        let lookupTR1, lookupTR2;
        lookupTR1 = {
            "$lookup": {
                "from": "users",
                "localField": "receiverId",
                "foreignField": "_id",
                "as": "userData"
            }
        }
        lookupTR2 = {
            "$lookup": {
                "from": "users",
                "localField": "senderId",
                "foreignField": "_id",
                "as": "userData"
            }
        }
        if (userId && userId.length > 5) {
            console.log("TransType-All ==> Selected userId....")
            conditionsTR1 = {
                ...conditions,
                receiverId: mongoose.Types.ObjectId(userId)
            }
            conditionsTR2 = {
                ...conditions,
                senderId: mongoose.Types.ObjectId(userId)
            }
            conditions = {
                ...conditions,
                userId: mongoose.Types.ObjectId(userId)
            }
            
        } else {
            // if (user.role === UserRole.DISTRIBUTOR) {
            //     console.log("TransType-All ==> User-ALL ===> Role ==> Distributor")
            //     const agentIds = await User.find({ distributorId: user.id.toString() }, { _id: 1 })
            //     const agentsArr = agentIds.map(agent => agent._id);
            //     const userList = await User.find({ agentId: { $in: agentsArr } }, { _id: 1 });
            //     const userArr = userList.map(userl => userl._id);
            //     conditions = {
            //         ...conditions,
            //         userId: { $in: userArr }
            //     }

            //     const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] }, agentId: { $in: agentsArr } }, { _id: 1 })
            //     const userArrTR = userListTR.map(userl => userl._id);
            //     conditionsTR1 = {
            //         ...conditions,
            //         receiverId: { $in: userArrTR }
            //     }

            //     conditionsTR2 = {
            //         ...conditions,
            //         senderId: { $in: userArrTR }
            //     }

            //     subUserData = [
            //         {
            //             $project: {
            //                 "transType": 1,
            //                 "coins": 1,
            //                 "playerId": "$userData._id",
            //                 "userName": "$userData.userName",
            //                 "displayName": "$userData.displayName",
            //                 "remark": 1,
            //                 "createdAt": 1,
            //             }
            //         }
            //     ]

            // } else if (user.role === UserRole.AGENT) {
            //     console.log("TransType-All ==> User-ALL ===> Role ==> AGENT")
            //     const userList = await User.find({ agentId: user.id }, { _id: 1 })
            //     const userArr = userList.map(userl => userl._id);
            //     conditions = {
            //         ...conditions,
            //         userId: { $in: userArr }
            //     }

            //     // const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER], agentId: { $in: agentsArr } } }, { _id: 1 })
            //     // const userArrTR = userListTR.map(user => user._id);
            //     conditionsTR1 = {
            //         ...conditions,
            //         receiverId: { $in: userArr }
            //     }

            //     conditionsTR2 = {
            //         ...conditions,
            //         senderId: { $in: userArr }
            //     }
            // } else {
                console.log("TransType-All ==> User-ALL ===> Role . ==> Admin")
                const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } }, { _id: 1 })
                const userArrTR = userListTR.map(user => user._id);
                // console.log(userArrTR);
                conditionsTR1 = {
                    ...conditions,
                    receiverId: { $in: userArrTR }
                }

                conditionsTR2 = {
                    ...conditions,
                    senderId: { $in: userArrTR }
                }
          //  }


        }

        let pipelineTCW = [{
            "$match": conditions
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "userId",
                "foreignField": "_id",
                "as": "userData"
            }
        }, {
            "$unwind": "$userData"
        },
        {
            $project: {
                "transType": 1,
                "coins": 1,
                "playerId": "$userData._id",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "createdAt": 1
            }
        },
        { "$sort": { "createdAt": -1 } },
        ];

        transactionChalWinResult = await TransactionChalWin.aggregate(pipelineTCW)

        let pipelineGT = [{
            "$match": conditionsTR2
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "senderId",
                "foreignField": "_id",
                "as": "userData"
            }
        }, {
            "$unwind": "$userData"
        },
        {
            $project: {
                "transType": 1,
                "coins": 1,
                "playerId": "$userData._id",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "createdAt": 1
            }
        },
        { "$sort": { "createdAt": -1 } },
        ];

        transactionGiftTipResult = await TransactionGiftTip.aggregate(pipelineGT)

        let pipelineTR1 = [{
            "$match": conditionsTR1
        },
        {
            ...lookupTR1
        }, {
            "$unwind": "$userData"
        },
        {
            $project: {
                "transType": 1,
                "coins": 1,
                "playerId": "$userData._id",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "createdAt": 1
            }
        },
        { "$sort": { "createdAt": -1 } },
        ];

        transactionRechargeResult = await Transactionrecharge.aggregate(pipelineTR1)

        let pipelineTR2 = [{
            "$match": conditionsTR2
        },
        {
            ...lookupTR2
        }, {
            "$unwind": "$userData"
        },
        {
            $project: {
                "transType": 1,
                "coins": 1,
                "playerId": "$userData._id",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "createdAt": 1
            }
        },
        { "$sort": { "createdAt": -1 } },
        ];

        let transactionRechargeResultS = await Transactionrecharge.aggregate(pipelineTR2)

        transactionRechargeResult = [...transactionRechargeResult, ...transactionRechargeResultS]

    } else {


        if (["SB", "BB","WIN","callcheck"].includes(transType)) {

            if (userId && userId.length > 5) {
                console.log("TransType-[Boot,Chal,Win] ==> User-Selected")
                conditions = {
                    ...conditions,
                    transType: transType,
                    userId: mongoose.Types.ObjectId(userId)
                }
            } else {
               
                    console.log("TransType-[Boot,Chal,Win] ==> User-All ===> Role ==> Admin")
                    conditions = {
                        ...conditions,
                        transType: transType
                    }
              
            }

            let pipelineTCW = [{
                "$match": conditions
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userData"
                }
            }, {
                "$unwind": "$userData"
            },
            {
                $project: {
                    "transType": 1,
                    "coins": 1,
                    "playerId": "$userData._id",
                    "userName": "$userData.userName",
                    "displayName": "$userData.displayName",
                    "createdAt": 1
                }
            },
            { "$sort": { "createdAt": -1 } },
            ];

            transactionChalWinResult = await TransactionChalWin.aggregate(pipelineTCW)
        }

        if ([TransactionType.GIFT, TransactionType.TIP].includes(transType)) {
            if (userId && userId.length > 5) {
                console.log("TransType-[Gift, TIP] ==> User-Selectd")
                conditions = {
                    ...conditions,
                    transType: transType,
                    senderId: mongoose.Types.ObjectId(userId)
                }
            } else {
                if (user.role === UserRole.DISTRIBUTOR) {
                    console.log("TransType-[Gift, TIP] ==> User-All ===> Role ==> Admin")
                    const agentIds = await User.find({ distributorId: user.id.toString() }, { _id: 1 })
                    const agentsArr = agentIds.map(agent => agent._id);
                    const userList = await User.find({ agentId: { $in: agentsArr } }, { _id: 1 });
                    const userArr = userList.map(userl => userl._id);
                    conditions = {
                        ...conditions,
                        transType: transType,
                        senderId: { $in: userArr }
                    }


                } else if (user.role === UserRole.AGENT) {
                    console.log("TransType-[Gift, TIP] ==> User-All ===> Role ==> AGENT")
                    const userList = await User.find({ agentId: user.id }, { _id: 1 })
                    const userArr = userList.map(userl => userl._id);
                    conditions = {
                        ...conditions,
                        transType: transType,
                        senderId: { $in: userArr }
                    }

                } else {
                    console.log("TransType-[Gift, TIP] ==> User-All ===> Role ==> Admin")
                    conditions = {
                        ...conditions,
                        transType: transType
                    }
                }
            }

            let pipelineGT = [{
                "$match": conditions
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "senderId",
                    "foreignField": "_id",
                    "as": "userData"
                }
            }, {
                "$unwind": "$userData"
            },
            {
                $project: {
                    "transType": 1,
                    "coins": 1,
                    "playerId": "$userData._id",
                    "userName": "$userData.userName",
                    "displayName": "$userData.displayName",
                    "createdAt": 1
                }
            },
            { "$sort": { "createdAt": -1 } },
            ];

            transactionGiftTipResult = await TransactionGiftTip.aggregate(pipelineGT)
        }

        if ([TransactionType.RECHARGE, TransactionType.RECHARGE_REVERT, TransactionType.SETTLEMENT].includes(transType)) {

            conditionsTR = conditions;
            conditionsTR = {
                ...conditionsTR,
                transType: transType,
            }

            const userList = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } }, { _id: 1 })
            const userArr = userList.map(userl => userl._id);
            let lookup;
            if (TransactionType.RECHARGE === transType) {

                if (userId && userId.length > 5) {
                    console.log("TransType-[RECHARGE] ==> User-Selected")
                    conditionsTR = {
                        ...conditionsTR,
                        transType: transType,
                        receiverId: mongoose.Types.ObjectId(userId)
                    }
                } else {
                    if (user.role === UserRole.DISTRIBUTOR) {
                        console.log("TransType-[RECHARGE] ==> User-All ===> Role ==> Distributor")
                        const agentIds = await User.find({ distributorId: user.id.toString() }, { _id: 1 })
                        const agentsArr = agentIds.map(agent => agent._id);

                        const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] }, agentId: { $in: agentsArr } }, { _id: 1 })
                        const userArrTR = userListTR.map(userl => userl._id);
                        conditionsTR = {
                            ...conditionsTR,
                            receiverId: { $in: userArrTR }
                        }

                    } else if (user.role === UserRole.AGENT) {
                        console.log("TransType-[RECHARGE] ==> User-All ===> Role ==> Agent")
                        const userList = await User.find({ agentId: user.id }, { _id: 1 })
                        const userArr = userList.map(userl => userl._id);
                        // const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER], agentId: { $in: agentsArr } } }, { _id: 1 })
                        // const userArrTR = userListTR.map(user => user._id);
                        conditionsTR = {
                            ...conditionsTR,
                            receiverId: { $in: userArr }
                        }
                    } else {
                        console.log("TransType-[RECHARGE] ==> User-All ===> Role ==> Admin")
                        const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } }, { _id: 1 })
                        const userArr = userListTR.map(user => user._id);
                        conditionsTR = {
                            ...conditionsTR,
                            receiverId: { $in: userArr }
                        }
                    }
                }

                lookup = {
                    "$lookup": {
                        "from": "users",
                        "localField": "receiverId",
                        "foreignField": "_id",
                        "as": "userData"
                    }
                }
            } else if ([TransactionType.RECHARGE_REVERT, TransactionType.SETTLEMENT].includes(transType)) {

                if (userId && userId.length > 5) {
                    console.log("TransType-[RECHARGE_REVERT, SETTLEMENT] ==> User-Slected")
                    conditionsTR = {
                        ...conditionsTR,
                        transType: transType,
                        senderId: mongoose.Types.ObjectId(userId)
                    }
                } else {
                    if (user.role === UserRole.DISTRIBUTOR) {
                        console.log("TransType-[RECHARGE_REVERT, SETTLEMENT] ==> User-All ===> Role ==> Distributor")
                        const agentIds = await User.find({ distributorId: user.id.toString() }, { _id: 1 })
                        const agentsArr = agentIds.map(agent => agent._id);

                        const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] }, agentId: { $in: agentsArr } }, { _id: 1 })
                        const userArrTR = userListTR.map(userl => userl._id);
                        conditionsTR = {
                            ...conditionsTR,
                            senderId: { $in: userArrTR }
                        }

                    } else if (user.role === UserRole.AGENT) {
                        console.log("TransType-[RECHARGE_REVERT, SETTLEMENT] ==> User-All ===> Role ==> AGENT")
                        const userList = await User.find({ agentId: user.id }, { _id: 1 })
                        const userArr = userList.map(userl => userl._id);

                        conditionsTR = {
                            ...conditionsTR,
                            senderId: { $in: userArr }
                        }
                    } else {
                        console.log("TransType-[RECHARGE_REVERT, SETTLEMENT] ==> User-All ===> Role ==> Admin")
                        const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } }, { _id: 1 })
                        const userArrTR = userListTR.map(user => user._id);
                        conditionsTR = {
                            ...conditionsTR,
                            senderId: { $in: userArrTR }
                        }
                    }
                }
                lookup = {
                    "$lookup": {
                        "from": "users",
                        "localField": "senderId",
                        "foreignField": "_id",
                        "as": "userData"
                    }
                }
            }

            let pipelineTR = [{
                "$match": conditionsTR
            },
            {
                ...lookup
            }, {
                "$unwind": "$userData"
            },
            {
                $project: {
                    "transType": 1,
                    "coins": 1,
                    "playerId": "$userData._id",
                    "userName": "$userData.userName",
                    "displayName": "$userData.displayName",
                    "createdAt": 1
                }
            },
            { "$sort": { "createdAt": -1 } },
            ];

            transactionRechargeResult = await Transactionrecharge.aggregate(pipelineTR)
        }

    }

    let result = [...transactionChalWinResult, ...transactionGiftTipResult, ...transactionRechargeResult]
    let total = result.length;

    result = _.orderBy(result, ['createdAt'], ['desc'])
    result = result.slice(skip, skip + limit)

    return { result, total };
}

module.exports = {
    userwise,
}