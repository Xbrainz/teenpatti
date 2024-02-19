const Mongoose = require("mongoose");

const TransactionCommission = require("../../model/transactionCommission")

const UserRole = require("./../../constant/userRole");
const StaticValue = require("./../../constant/staticValue");
const { cond } = require("lodash");

const rakeTablewise = async (data) => {
    const { startDate, endDate, tableId, skip, limit } = data;

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

    if (tableId && tableId.length > 5) {
        conditions = {
            ...conditions,
            tableId: Mongoose.Types.ObjectId(tableId)
        }
    }

    let pipeline = [{
        "$match": conditions
    },
    {
        "$lookup": {
            "from": "tables",
            "localField": "tableId",
            "foreignField": "_id",
            "as": "tableData"
        }
    }, {
        "$unwind": "$tableData"
    }, {
        "$group": {
            "_id": {
                "createdAt": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "tableId": "$tableId",
                "tableName": "$tableData.name",
                "gameType": "$tableData.gameType"
            }, "totalAgentCoins": {
                "$sum": "$agentCommission"
            },
            "totalDistributorCoins": {
                "$sum": "$distributorCommission"
            },
            "totalAdminCoins": {
                "$sum": "$adminCommission"
            },
        }
    },
    {
        $project: {
            "_id": 0,
            "createdAt": "$_id.createdAt",
            "tableId": "$_id.tableId",
            "tableName": "$_id.tableName",
            "gameType": "$_id.gameType",
            "totalAgentCoins": "$totalAgentCoins",
            "totalDistributorCoins": "$totalDistributorCoins",
            "totalAdminCoins": "$totalAdminCoins",

        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let total = await TransactionCommission.aggregate(pipeline)

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await TransactionCommission.aggregate(pipeline)

    return { result, total: total.length };
}

const rakeTablewiseDetails = async (data) => {
    const { date, tableId } = data;

    let finalStartDate = new Date(date);
    let finalEndDate = new Date(date);

    if (!tableId) {
        return new Error("TableId is required")
    }

    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        },
        tableId: Mongoose.Types.ObjectId(tableId),
    }

    let pipeline = [{
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
            "createdAt": 1,
            "userName": "$userData.userName",
            "displayName": "$userData.displayName",
            "gameId": 1,
            "agentCommission": 1,
            "distributorCommission": 1,
            "adminCommission": 1,
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let result = await TransactionCommission.aggregate(pipeline)

    return result;
}

const rakePlayerwise = async (data, user) => {
    const { startDate, endDate, userId, skip, limit } = data;

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

    if (userId && userId.length > 5) {
        conditions = {
            ...conditions,
            senderId: Mongoose.Types.ObjectId(userId)
        }
    }


    if (user.role === UserRole.DISTRIBUTOR) {
        conditions = {
            ...conditions,
            distributorId: Mongoose.Types.ObjectId(user.id)
        }
    } else if (user.role === UserRole.AGENT) {
        conditions = {
            ...conditions,
            agentId: Mongoose.Types.ObjectId(user.id)
        }
    } else if (user.role === UserRole.ADMIN) {
        conditions = {
            ...conditions,
            adminId: Mongoose.Types.ObjectId(StaticValue.ADMIN_ID)
        }
    }

    let pipeline = [{
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
    }, {
        "$group": {
            "_id": {
                "createdAt": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "userId": "$senderId",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName"
            }, "totalAgentCoins": {
                "$sum": "$agentCommission"
            },
            "totalDistributorCoins": {
                "$sum": "$distributorCommission"
            },
            "totalAdminCoins": {
                "$sum": "$adminCommission"
            },
        }
    },
    {
        $project: {
            "_id": 0,
            "createdAt": "$_id.createdAt",
            "playerId": "$_id.userId",
            "userName": "$_id.userName",
            "displayName": "$_id.displayName",
            "totalAgentCoins": "$totalAgentCoins",
            "totalDistributorCoins": "$totalDistributorCoins",
            "totalAdminCoins": "$totalAdminCoins",
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let total = await TransactionCommission.aggregate(pipeline)

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await TransactionCommission.aggregate(pipeline)

    return { result, total: total.length };
}

const rakePlayerwiseDetails = async (data) => {
    const { date, userId, skip, limit } = data;
    let finalStartDate = new Date(date);
    let finalEndDate = new Date(date);

    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        },
        senderId: Mongoose.Types.ObjectId(userId)
    }

    let pipeline = [{
        "$match": conditions
    },
    {
        "$lookup": {
            "from": "tables",
            "localField": "tableId",
            "foreignField": "_id",
            "as": "tableData"
        }
    }, {
        "$unwind": "$tableData"
    },
    {
        $project: {
            "createdAt": 1,
            "tableName": "$tableData.name",
            "gameType": "$tableData.gameType",
            "gameId": 1,
            "agentCommission": 1,
            "distributorCommission": 1,
            "adminCommission": 1,
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let result = await TransactionCommission.aggregate(pipeline)

    return result;
}

module.exports = {
    rakeTablewise,
    rakeTablewiseDetails,
    rakePlayerwise,
    rakePlayerwiseDetails
}