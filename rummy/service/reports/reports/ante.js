const mongoose = require("mongoose");

const TransactionChalWin = require("../../model/transactionChalWin")

const UserRole = require("../../constant/userRole");
const TransactionType = require("./../../constant/transactionType");
const Player = require("../../model/player");


const anteTablewise = async (data) => {
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
        transType: TransactionType.BOOT
    }

    if (tableId && tableId.length > 5) {
        conditions = {
            ...conditions,
            tableId: mongoose.Types.ObjectId(tableId)
        }
    }

    console.log(conditions);

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
                "tableType": "$tableData.type"
            }, "totalAmount": {
                "$sum": "$coins"
            },
        }
    },
    {
        $project: {
            "_id": 0,
            "createdAt": "$_id.createdAt",
            "tableId": "$_id.tableId",
            "tableName": "$_id.tableName",
            "tableType": "$_id.tableType",
            "totalAmount": "$totalAmount",
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let total = await TransactionChalWin.aggregate(pipeline)

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await TransactionChalWin.aggregate(pipeline)

    return { result, total: total.length };
}

const anteTablewiseDetails = async (data) => {
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
        tableId: mongoose.Types.ObjectId(tableId),
        transType: TransactionType.BOOT
    }

    let pipeline = [{
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
            "createdAt": 1,
            "userName": "$userData.userName",
            "displayName": "$userData.displayName",
            "gameId": 1,
            "coins": 1,
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let result = await TransactionChalWin.aggregate(pipeline)

    return result;
}

const antePlayerwise = async (data, user) => {
    const { startDate, endDate, userId, skip, limit } = data;

    let users = [];
    if (user.role === UserRole.DISTRIBUTOR) {
        users = await Player.find({ distributorId: user.id.toString() }, { _id: 1 })
    } else if (user.role === UserRole.AGENT) {
        users = await Player.find({ distributorId: user.id.toString() }, { _id: 1 })
    }

    let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);

    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        },
        transType: TransactionType.BOOT
    }

    if (userId && userId.length > 5) {
        conditions = {
            ...conditions,
            userId: mongoose.Types.ObjectId(userId)
        }
    } else {
        if (users.length > 0) {
            const userArr = users.map(user => mongoose.Types.ObjectId(user._id));
            console.log(userArr);
            conditions = {
                ...conditions,
                userId: { $in: userArr }
            }
        }
    }

    console.log(conditions);

    let pipeline = [{
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
    }, {
        "$group": {
            "_id": {
                "createdAt": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "userId": "$userId",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName"
            }, "totalAmount": {
                "$sum": "$coins"
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
            "totalAmount": "$totalAmount",
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let total = await TransactionChalWin.aggregate(pipeline)

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await TransactionChalWin.aggregate(pipeline)

    return { result, total: total.length };
}

const antePlayerwiseDetails = async (data) => {
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
        transType: TransactionType.BOOT,
        userId: mongoose.Types.ObjectId(userId)
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
            "tableType": "$tableData.type",
            "gameId": 1,
            "coins": 1,
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];

    let result = await TransactionChalWin.aggregate(pipeline)

    return result;
}

module.exports = {
    anteTablewise,
    anteTablewiseDetails,
    antePlayerwise,
    antePlayerwiseDetails
}