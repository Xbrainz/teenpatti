const mongoose = require("mongoose");

const TransactionCommission = require("../../model/transactionCommission")
const Table = require("../../model/table");
const Player = require("../../model/player");

const UserRole = require("../../constant/userRole");

const agentwise = async (data, user) => {
    const { startDate, endDate, agentId, limit, skip } = data;
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

    if (user.role === UserRole.DISTRIBUTOR) {
        conditions = {
            ...conditions,
            distributorId: mongoose.Types.ObjectId(user.id)
        }
    }

    if (agentId && agentId.length > 5) {
        conditions = {
            ...conditions,
            agentId: mongoose.Types.ObjectId(agentId)
        }
    }

    const pipeline = [{
        "$match": conditions
    }, {
        "$lookup": {
            "from": "users",
            "localField": "agentId",
            "foreignField": "_id",
            "as": "agents"
        }
    }, {
        "$unwind": "$agents"
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
                "agentId": "$agentId",
                "agentUserName": "$agents.userName",
                "agentDisplayName": "$agents.displayName",
                "distributorId": "$distributorId",
                "distributorsDisplayName": "$distributors.displayName",
                "distributorsUserName": "$distributors.userName",
                "adminId": "$adminId",
                "adminsDisplayName": "$admins.displayName",
                "adminsUserName": "$admins.userName",
                "distributorPercentage": "$agents.commission",
                "adminPercentage": "$distributors.commission"
            },
            "totalAgentCoins": {
                "$sum": "$agentCommission"
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
            "agentId": "$_id.agentId",
            "agentUserName": "$_id.agentUserName",
            "agentDisplayName": "$_id.agentDisplayName",
            "agentsDisplayName": "$_id.agentsDisplayName",
            "totalAgentCoins": "$totalAgentCoins",
            "distributorId": "$_id.distributorId",
            "distributorUserName": "$_id.distributorsUserName",
            "distributorsDisplayName": "$_id.distributorsDisplayName",
            "distributorPercentage": "$_id.distributorPercentage",
            "totalDistributorCoins": "$totalDistributorCoins",
            "adminId": "$_id.adminId",
            "adminUserName": "$_id.adminsUserName",
            "adminsDisplayName": "$_id.adminsDisplayName",
            "adminPercentage": "$_id.adminPercentage",
            "totalAdminCoins": "$totalAdminCoins"
        }
    }, { "$sort": { "date": -1 } }]

    const trc = await TransactionCommission.aggregate(pipeline);

    const totalEarning = trc.reduce((prevTR, nextTR) => {
        return {
            totalAgentCoins: prevTR.totalAgentCoins + nextTR.totalAgentCoins,
            totalDistributorCoins: prevTR.totalDistributorCoins + nextTR.totalDistributorCoins,
            totalAdminCoins: prevTR.totalAdminCoins + nextTR.totalAdminCoins,
        }
    })

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    const result = await TransactionCommission.aggregate(pipeline)

    return {
        result, total: trc.length, totalEarning: {
            totalAgentEarning: totalEarning.totalAgentCoins,
            totalDistributorEarning: totalEarning.totalDistributorCoins,
            totalAdminEarning: totalEarning.totalAdminCoins
        }
    };
}


const getCommissionByAgentId = async (data) => {
    const { agentId } = data;
    let date = new Date(data.date);

    const commission = await TransactionCommission.find({
        agentId: agentId,
        createdAt: {
            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
        }
    }, { agentCommission: 1, senderId: 1, tableId: 1, gameId: 1 }).populate([{
        path: 'senderId',
        select: 'userName displayName',
        model: Player
    }, {
        path: 'tableId',
        model: Table,
        select: 'name gameType'
    }]).sort({ createdAt: -1 });

    return commission;
}

module.exports = {
    agentwise,
    getCommissionByAgentId,
}