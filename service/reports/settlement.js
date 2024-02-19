const mongoose = require('mongoose');

const User = require("./../../model/user");
const Transactionrecharge = require("./../../model/transactionRecharge")

const UserRole = require("./../../constant/userRole");
const TransactionType = require("./../../constant/transactionType");
const ReportType = require("./../../constant/reportType");

const settlement = async (data, user) => {
    const { startDate, endDate, userId, skip, limit, transType, reportType } = data;
    let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);

    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        },

    }

    if (transType === TransactionType.SETTLEMENT) {
        conditions = {
            ...conditions,
            transType: TransactionType.SETTLEMENT
        }
    } else if (transType === TransactionType.RECHARGE_REVERT) {
        conditions = {
            ...conditions,
            transType: TransactionType.RECHARGE_REVERT
        }
    } else if (transType === TransactionType.RECHARGE) {
        conditions = {
            ...conditions,
            transType: TransactionType.RECHARGE
        }
    } else {
        throw new Error("Report type wasn't exist");
    }

    let subUserData;
    if (userId && userId.length > 5) {
        if ([TransactionType.SETTLEMENT, TransactionType.RECHARGE_REVERT].includes(transType)) {
            conditions = {
                ...conditions,
                senderId: mongoose.Types.ObjectId(userId)
            }
        } else if (transType === TransactionType.RECHARGE) {
            conditions = {
                ...conditions,
                receiverId: mongoose.Types.ObjectId(userId)
            }
        } else {
            throw new Error("Report type wasn't exist");
        }
        subUserData = [
            {
                $project: {
                    "transType": 1,
                    "coins": 1,
                    "playerId": "$userData._id",
                    "userName": "$userData.userName",
                    "displayName": "$userData.displayName",
                    "remark": 1,
                    "createdAt": 1,
                }
            }
        ]
        
    } else {

        if ([TransactionType.SETTLEMENT, TransactionType.RECHARGE_REVERT].includes(transType)) { //For Transaction Type Recharge Revert and Settlement
            // if (user.role === UserRole.DISTRIBUTOR) {
            //     if (reportType === ReportType.AGENT) {
            //         console.log("TransType-Settlement,RechargeRevert ==>  Role-Distributor ==> reportType-Agent....")
            //         const agentIds = await User.find({ role: UserRole.AGENT, distributorId: user.id }, { _id: 1 })
            //         const agentsArr = agentIds.map(agent => agent._id);
            //         conditions = {
            //             ...conditions,
            //             senderId: { $in: agentsArr }
            //         }
            //         subUserData = [
            //             {
            //                 "$lookup": {
            //                     "from": "users",
            //                     "localField": "userData.distributorId",
            //                     "foreignField": "_id",
            //                     "as": "subUserData"
            //                 }
            //             }, {
            //                 "$unwind": "$subUserData"
            //             },
            //             {
            //                 $project: {
            //                     "transType": 1,
            //                     "coins": 1,
            //                     "playerId": "$userData._id",
            //                     "userName": "$userData.userName",
            //                     "displayName": "$userData.displayName",
            //                     "distributorId": "$subUserData._id",
            //                     "distributorName": "$subUserData.userName",
            //                     "distributorDisplayName": "$subUserData.displayName",
            //                     "remark": 1,
            //                     "createdAt": 1,
            //                 }
            //             }
            //         ]
            //     } else if (reportType === ReportType.USER) {
            //         console.log("TransType-Settlement,RechargeRevert ==>  Role-Distributor ==> reportType-User....")
            //         const agentIds = await User.find({ role: UserRole.AGENT, distributorId: user.id }, { _id: 1 })
            //         const agentsArr = agentIds.map(agent => agent._id);
            //         console.log(agentsArr);
            //         const userIds = await User.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] }, agentId: { $in: agentsArr } }, { _id: 1 })
            //         const usersArr = userIds.map(userl => userl._id);
            //         conditions = {
            //             ...conditions,
            //             senderId: { $in: usersArr }
            //         }
            //         console.log(conditions)
            //         subUserData = [
            //             {
            //                 "$lookup": {
            //                     "from": "users",
            //                     "localField": "userData.agentId",
            //                     "foreignField": "_id",
            //                     "as": "subUserData"
            //                 }
            //             }, {
            //                 "$unwind": "$subUserData"
            //             },
            //             {
            //                 $project: {
            //                     "transType": 1,
            //                     "coins": 1,
            //                     "playerId": "$userData._id",
            //                     "userName": "$userData.userName",
            //                     "displayName": "$userData.displayName",
            //                     "agentId": "$subUserData._id",
            //                     "agentName": "$subUserData.userName",
            //                     "agentDisplayName": "$subUserData.displayName",
            //                     "remark": 1,
            //                     "createdAt": 1,
            //                 }
            //             }
            //         ]
            //     } else {
            //         throw new Error("Report type wasn't exist");
            //     }

            // } else if (user.role === UserRole.AGENT) {
            //     if (reportType === ReportType.USER) {
            //         console.log("TransType-Settlement,RechargeRevert ==>  Role-Agent ==> reportType-User....")
            //         const userIds = await User.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] }, agentId: user._id }, { _id: 1 })
            //         const usersArr = userIds.map(userl => userl._id);
            //         conditions = {
            //             ...conditions,
            //             senderId: { $in: usersArr }
            //         }
            //         subUserData = [
            //             {
            //                 "$lookup": {
            //                     "from": "users",
            //                     "localField": "userData.agentId",
            //                     "foreignField": "_id",
            //                     "as": "subUserData"
            //                 }
            //             }, {
            //                 "$unwind": "$subUserData"
            //             },
            //             {
            //                 $project: {
            //                     "transType": 1,
            //                     "coins": 1,
            //                     "playerId": "$userData._id",
            //                     "userName": "$userData.userName",
            //                     "displayName": "$userData.displayName",
            //                     "agentId": "$subUserData._id",
            //                     "agentName": "$subUserData.userName",
            //                     "agentDisplayName": "$subUserData.displayName",
            //                     "remark": 1,
            //                     "createdAt": 1,
            //                 }
            //             }
            //         ]
            //     } else {
            //         throw new Error("Report type dosen't exist");
            //     }
            // } else {
                if (reportType === ReportType.DISTRIBUTOR) {
                    console.log("TransType-Settlement,RechargeRevert ==>  Role-Admin ==> reportType-Distributor....")
                    const distributorIds = await User.find({ role: UserRole.DISTRIBUTOR }, { _id: 1 })
                    const distributorsArr = distributorIds.map(distributor => distributor._id);
                    // console.log(distributorsArr.length);
                    conditions = {
                        ...conditions,
                        senderId: { $in: distributorsArr }
                    }
                    subUserData = [
                        {
                            $project: {
                                "transType": 1,
                                "coins": 1,
                                "playerId": "$userData._id",
                                "userName": "$userData.userName",
                                "displayName": "$userData.displayName",
                                "remark": 1,
                                "createdAt": 1,
                            }
                        }
                    ]
                } else if (reportType === ReportType.AGENT) {
                    console.log("TransType-Settlement,RechargeRevert ==>  Role-Admin ==> reportType-Agent....")
                    const agentIds = await User.find({ role: UserRole.AGENT }, { _id: 1 })
                    const agentsArr = agentIds.map(agent => agent._id);
                    conditions = {
                        ...conditions,
                        senderId: { $in: agentsArr }
                    }
                    subUserData = [
                        {
                            "$lookup": {
                                "from": "users",
                                "localField": "userData.distributorId",
                                "foreignField": "_id",
                                "as": "subUserData"
                            }
                        }, {
                            "$unwind": "$subUserData"
                        },
                        {
                            $project: {
                                "transType": 1,
                                "coins": 1,
                                "playerId": "$userData._id",
                                "userName": "$userData.userName",
                                "displayName": "$userData.displayName",
                                "distributorId": "$subUserData._id",
                                "distributorName": "$subUserData.userName",
                                "distributorDisplayName": "$subUserData.displayName",
                                "remark": 1,
                                "createdAt": 1,
                            }
                        }
                    ]
                } else if (reportType === ReportType.USER) {
                    console.log("TransType-Settlement,RechargeRevert ==>  Role-Admin ==> reportType-User....")
                    const userIds = await User.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] } }, { _id: 1 })
                    const usersArr = userIds.map(userl => userl._id);
                    conditions = {
                        ...conditions,
                        senderId: { $in: usersArr }
                    }
                    subUserData = [
                        {
                            "$lookup": {
                                "from": "users",
                                "localField": "userData.agentId",
                                "foreignField": "_id",
                                "as": "subUserData"
                            }
                        }, {
                            "$unwind": "$subUserData"
                        },
                        {
                            $project: {
                                "transType": 1,
                                "coins": 1,
                                "playerId": "$userData._id",
                                "userName": "$userData.userName",
                                "displayName": "$userData.displayName",
                                "agentId": "$subUserData._id",
                                "agentName": "$subUserData.userName",
                                "agentDisplayName": "$subUserData.displayName",
                                "remark": 1,
                                "createdAt": 1,
                            }
                        }
                    ]
                } else {
                    throw new Error("Report type dosen't exist");
                }
         //   }
        } else if (transType === TransactionType.RECHARGE) { //For Transaction Type Recharge
            // if (user.role === UserRole.DISTRIBUTOR) {
            //     if (reportType === ReportType.AGENT) {
            //         console.log("TransType-Recharge ==>  Role-Distributor ==> reportType-Agent....")
            //         const agentIds = await User.find({ role: UserRole.AGENT, distributorId: user.id }, { _id: 1 })
            //         const agentsArr = agentIds.map(agent => agent._id);
            //         conditions = {
            //             ...conditions,
            //             receiverId: { $in: agentsArr }
            //         }
            //         subUserData = [
            //             {
            //                 "$lookup": {
            //                     "from": "users",
            //                     "localField": "userData.distributorId",
            //                     "foreignField": "_id",
            //                     "as": "subUserData"
            //                 }
            //             }, {
            //                 "$unwind": "$subUserData"
            //             },
            //             {
            //                 $project: {
            //                     "transType": 1,
            //                     "coins": 1,
            //                     "playerId": "$userData._id",
            //                     "userName": "$userData.userName",
            //                     "displayName": "$userData.displayName",
            //                     "distributorId": "$subUserData._id",
            //                     "distributorName": "$subUserData.userName",
            //                     "distributorDisplayName": "$subUserData.displayName",
            //                     "remark": 1,
            //                     "createdAt": 1,
            //                 }
            //             }
            //         ]
            //     } else if (reportType === ReportType.USER) {
            //         console.log("TransType-Recharge ==> Role-Distributor ==> reportType-User....")
            //         const agentIds = await User.find({ role: UserRole.AGENT, distributorId: user.id }, { _id: 1 })
            //         const agentsArr = agentIds.map(agent => agent._id);
            //         console.log(agentsArr);
            //         const userIds = await User.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] }, agentId: { $in: agentsArr } }, { _id: 1 })
            //         const usersArr = userIds.map(userl => userl._id);
            //         conditions = {
            //             ...conditions,
            //             receiverId: { $in: usersArr }
            //         }
            //         console.log(conditions)
            //         subUserData = [
            //             {
            //                 "$lookup": {
            //                     "from": "users",
            //                     "localField": "userData.agentId",
            //                     "foreignField": "_id",
            //                     "as": "subUserData"
            //                 }
            //             }, {
            //                 "$unwind": "$subUserData"
            //             },
            //             {
            //                 $project: {
            //                     "transType": 1,
            //                     "coins": 1,
            //                     "playerId": "$userData._id",
            //                     "userName": "$userData.userName",
            //                     "displayName": "$userData.displayName",
            //                     "agentId": "$subUserData._id",
            //                     "agentName": "$subUserData.userName",
            //                     "agentDisplayName": "$subUserData.displayName",
            //                     "remark": 1,
            //                     "createdAt": 1,
            //                 }
            //             }
            //         ]
            //     } else {
            //         throw new Error("Report type dosen't exist");
            //     }

            // } else if (user.role === UserRole.AGENT) {
            //     if (reportType === ReportType.USER) {
                   
            //         const userIds = await User.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] }, agentId: user.id }, { _id: 1 })
            //         const usersArr = userIds.map(userl => userl._id);
					
				
					
            //         conditions = {
            //             ...conditions,
            //             receiverId: { $in: usersArr }
            //         }
            //         subUserData = [
            //             {
            //                 "$lookup": {
            //                     "from": "users",
            //                     "localField": "userData.agentId",
            //                     "foreignField": "_id",
            //                     "as": "subUserData"
            //                 }
            //             }, {
            //                 "$unwind": "$subUserData"
            //             },
            //             {
            //                 $project: {
            //                     "transType": 1,
            //                     "coins": 1,
            //                     "playerId": "$userData._id",
            //                     "userName": "$userData.userName",
            //                     "displayName": "$userData.displayName",
            //                     "agentId": "$subUserData._id",
            //                     "agentName": "$subUserData.userName",
            //                     "agentDisplayName": "$subUserData.displayName",
            //                     "remark": 1,
            //                     "createdAt": 1,
            //                 }
            //             }
            //         ]
            //     } else {
            //         throw new Error("Report type dosen't exist");
            //     }
            // } else {
                if (reportType === ReportType.DISTRIBUTOR) {
                    console.log("TransType-Recharge ==> Role-Admin ==> reportType-Distributor....")
                    const distributorIds = await User.find({ role: UserRole.DISTRIBUTOR }, { _id: 1 })
                    const distributorsArr = distributorIds.map(distributor => distributor._id);
                    // console.log(distributorsArr);
                    conditions = {
                        ...conditions,
                        receiverId: { $in: distributorsArr }
                    }
                    subUserData = [
                        {
                            $project: {
                                "transType": 1,
                                "coins": 1,
                                "playerId": "$userData._id",
                                "userName": "$userData.userName",
                                "displayName": "$userData.displayName",
                                "remark": 1,
                                "createdAt": 1,
                            }
                        }
                    ]
                } else if (reportType === ReportType.AGENT) {
                    console.log("Role-Admin ==> reportType-Agent....")
                    const agentIds = await User.find({ role: UserRole.AGENT }, { _id: 1 })
                    const agentsArr = agentIds.map(agent => agent._id);
                    conditions = {
                        ...conditions,
                        receiverId: { $in: agentsArr }
                    }
                    subUserData = [
                        {
                            "$lookup": {
                                "from": "users",
                                "localField": "userData.distributorId",
                                "foreignField": "_id",
                                "as": "subUserData"
                            }
                        }, {
                            "$unwind": "$subUserData"
                        },
                        {
                            $project: {
                                "transType": 1,
                                "coins": 1,
                                "playerId": "$userData._id",
                                "userName": "$userData.userName",
                                "displayName": "$userData.displayName",
                                "distributorId": "$subUserData._id",
                                "distributorName": "$subUserData.userName",
                                "distributorDisplayName": "$subUserData.displayName",
                                "remark": 1,
                                "createdAt": 1,
                            }
                        }
                    ]
                } else if (reportType === ReportType.USER) {
                    console.log("TransType-Recharge ==> Role-Admin ==> reportType-User....")
                    const userIds = await User.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] } }, { _id: 1 })
                    const usersArr = userIds.map(userl => userl._id);
                    conditions = {
                        ...conditions,
                        receiverId: { $in: usersArr }
                    }
                    subUserData = [
                        {
                            "$lookup": {
                                "from": "users",
                                "localField": "userData.agentId",
                                "foreignField": "_id",
                                "as": "subUserData"
                            }
                        }, {
                            "$unwind": "$subUserData"
                        },
                        {
                            $project: {
                                "transType": 1,
                                "coins": 1,
                                "playerId": "$userData._id",
                                "userName": "$userData.userName",
                                "displayName": "$userData.displayName",
                                "agentId": "$subUserData._id",
                                "agentName": "$subUserData.userName",
                                "agentDisplayName": "$subUserData.displayName",
                                "remark": 1,
                                "createdAt": 1,
                            }
                        }
                    ]
                } else {
                    throw new Error("Report type wasn't exist");
                }
         //   }
        } else {
            throw new Error("Report type wasn't exist");
        }


    }

    let pipeline = [{
        "$match": conditions
    },
    {
        "$lookup": {
            "from": "users",
            "localField": (transType === TransactionType.RECHARGE) ? "receiverId" : "senderId",
            "foreignField": "_id",
            "as": "userData"
        }
    }, {
        "$unwind": "$userData"
    },
    ];

    if (subUserData) {
        pipeline.push(...subUserData)
    }

    pipeline.push({ "$sort": { "createdAt": -1 } })

    console.log(JSON.stringify(pipeline));

    let tr = await Transactionrecharge.aggregate(pipeline)

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await Transactionrecharge.aggregate(pipeline)

    return { result, total: tr.length };

}

module.exports = {
    settlement
}