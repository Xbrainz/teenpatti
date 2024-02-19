const mongoose = require("mongoose");

const TransactionCommission = require("../../model/transactionCommission")
const Table = require("../../model/table");

const tablewise = async (data) => {
    const { startDate, endDate, gameType, limit, skip } = data;
    console.log("data",data);
    let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
    let tables;

    if (gameType && gameType.toLowerCase() == 'all' || (gameType < 2 && gameType > 9)) {
        tables = await Table.find({}, { _id: 1 });
    } else {
        tables = await Table.find({ gameType },{ _id: 1 });
    }

    tables = tables.map(table => mongoose.Types.ObjectId(table.id));
    console.log("tables-",tables);
    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        }
    }

    if (tables.length > 0) {
        conditions = {
            ...conditions,
            tableId: { $in: tables }
        }
    }

    const pipeline = [{
        "$match": conditions
    }, {
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
                "gameType": "$tableData.gameType",
            },
            "totalAgentCoins": {
                "$sum": "$agentCommission"
            },
            "totalDistributorCoins": {
                "$sum": "$distributorCommission"
            },
            "totalAdminCoins": {
                "$sum": "$adminCommission"
            },
        }
    }, {
        "$project": {
            "_id": 0,
            "date": "$_id.createdAt",
            "totalAgentCoins": "$totalAgentCoins",
            "totalDistributorCoins": "$totalDistributorCoins",
            "totalAdminCoins": "$totalAdminCoins",
            "tableId": "$_id.tableId",
            "tableName": "$_id.tableName",
            "gameType": "$_id.gameType",
        }
    }, { "$sort": { "date": -1 } }]

    const total = await TransactionCommission.aggregate(pipeline);

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await TransactionCommission.aggregate(pipeline);

    return { result, total: total.length };
}

module.exports = {
    tablewise,
}