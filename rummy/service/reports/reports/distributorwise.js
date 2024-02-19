const mongoose = require("mongoose");

const TransactionCommission = require("../../model/transactionCommission")

const Table = require("../../model/table");
const Player = require("../../model/player");

const distributorwise = async (data) => {
    const { startDate, endDate, distributorId, limit, skip } = data;
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

    if (distributorId && distributorId.length > 5) {
        conditions = {
            ...conditions,
            distributorId: mongoose.Types.ObjectId(distributorId)
        }
    }

    const pipeline = [{
        "$match": conditions
    }, {
        "$lookup": {
            "from": "users",
            "localField": "distributorId",
            "foreignField": "_id",
            "as": "distributors"
        }
    }, {
        "$unwind": "$distributors"
    }, {
        "$lookup": {
            "from": "users",
            "localField": "adminId",
            "foreignField": "_id",
            "as": "admins"
        }
    }, {
        "$unwind": "$admins"
    }, {
        "$group": {
            "_id": {
                "createdAt": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "distributorId": "$distributorId",
                "distributorsDisplayName": "$distributors.displayName",
                "distributorsUserName": "$distributors.userName",
                "adminId": "$adminId",
                "adminsDisplayName": "$admins.displayName",
                "adminsUserName": "$admins.userName",
                "adminPercentage": "$distributors.commission"
            },
            "totalDistributorCoins": {
                "$sum": "$distributorCommission"
            },
            "totalAdminCoins": {
                "$sum": "$adminCommission"
            }
        }
    }, {
        "$project": {
            "_id": 0,
            "date": "$_id.createdAt",
            "totalAgentCoins": "$totalAgentCoins",
            "distributorId": "$_id.distributorId",
            "distributorUserName": "$_id.distributorsUserName",
            "distributorsDisplayName": "$_id.distributorsDisplayName",
            "totalDistributorCoins": "$totalDistributorCoins",
            "adminId": "$_id.adminId",
            "adminUserName": "$_id.adminsUserName",
            "adminsDisplayName": "$_id.adminsDisplayName",
            "totalAdminCoins": "$totalAdminCoins",
            "adminPercentage": "$_id.adminPercentage"
        }
    },
    { "$sort": { "date": -1 } },
    ]

    const trc = await TransactionCommission.aggregate(pipeline);
    const totalEarning = trc.reduce((prevTR, nextTR) => {
        return {
            totalDistributorCoins: prevTR.totalDistributorCoins + nextTR.totalDistributorCoins,
            totalAdminCoins: prevTR.totalAdminCoins + nextTR.totalAdminCoins,
        }
    })

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    console.log(totalEarning);
    const result = await TransactionCommission.aggregate(pipeline);

    return {
        result, total: trc.length, totalEarning: {
            totalDistributorEarning: totalEarning.totalDistributorCoins,
            totalAdminEarning: totalEarning.totalAdminCoins
        }
    };
}

const getCommissionByDistributorId = async (data) => {
    const { distributorId } = data;

    let date = new Date(data.date);

    const commission = await TransactionCommission.find({
        distributorId: distributorId, createdAt: {
            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
        }
    }, { distributorCommission: 1, agentId: 1, tableId: 1, gameId: 1 }).populate([{
        path: 'agentId',
        select: 'userName displayName',
        model: Player
    }, {
        path: 'tableId',
        model: Table,
        select: 'name gameType'
    }]).sort({ createdAt: -1 });;

    return commission;
}

module.exports = {
    distributorwise,
    getCommissionByDistributorId,
}