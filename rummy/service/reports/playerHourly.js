const mongoose = require("mongoose");

const UserTableInOut = require("../../model/userTableInOut")

const UserRole = require("../../constant/userRole");
const Player = require("../../model/player");


const playerHourly = async (data, user) => {
    const { startDate, endDate, userId, skip, limit } = data;

    let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);

    let conditions = {
        $expr: {
            $and: [
                { $gte: ["$in", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
                { $lte: ["$in", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
            ]
        },
    }

    if (userId && userId.length > 5) {
        conditions = {
            ...conditions,
            userId: mongoose.Types.ObjectId(userId)
        }
    }else{
        if (user.role === UserRole.DISTRIBUTOR) {
            const agentIds = await Player.find({ role: UserRole.AGENT, distributorId: user.id }, { _id: 1 })
            const agentsArr = agentIds.map(agent => agent._id);
            const userIds = await Player.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] }, agentId: { $in: agentsArr } }, { _id: 1 })
            const usersArr = userIds.map(userl => userl._id);
            conditions = {
                ...conditions,
                userId: { $in: usersArr}
            }
        } else if (user.role === UserRole.AGENT){
            const userIds = await Player.find({ role: { $in: [UserRole.ADMIN_USER, UserRole.USER] }, agentId: user.id }, { _id: 1 })
            const usersArr = userIds.map(userl => userl._id);
            conditions = {
                ...conditions,
                userId: { $in: usersArr }
            }
        }
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
        }, {
            "$lookup": {
                "from": "tables",
                "localField": "tableId",
                "foreignField": "_id",
                "as": "tableData"
            }
        }, {
            "$unwind": "$tableData"
        },{
        "$group": {
            "_id": {
                "in": "$in",
                "out": "$out",
                "userId": "$userId",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "tableId": "$tableId",
                "tableName":"$tableData.name",
                "tableType": "$tableData.type",
                "gameType": "$tableData.gameType"
            }
        }
    },
    {
        $project: {
            "_id": 0,
            "in": "$_id.in",
            "out": "$_id.out",
            "playerId": "$_id.userId",
            "userName": "$_id.userName",
            "displayName": "$_id.displayName",
            "tableId": "$_id.tableId",
            "tableName": "$_id.tableName",
            "tableType": "$_id.tableType",
            "gameType": "$_id.gameType"
        }
    },
        { "$sort": { "in": -1 } },
    ];

    let total = await UserTableInOut.aggregate(pipeline)

    console.log(total.length)
    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await UserTableInOut.aggregate(pipeline)

    return { result, total: total.length };
}


module.exports = {
    playerHourly,
}