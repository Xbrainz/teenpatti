const mongoose = require("mongoose");

const GameAudit = require("../../model/gameAudit")

const UserRole = require("../../constant/userRole");
const User = require("../../model/user");
let Table = require("../../model/table");
let Old_Table = require("../../model/old_table");

const gameAuditgamewise = async (data, user) => {
    const { startDate, endDate, userId, tableId, skip, limit,gameId } = data;


    let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);

    console.log("gameaudittttt....");
    let old_data = false;
    console.log("table idddd  " , tableId);

    let conditions = {
        // $expr: {
        //     $and: [
        //         { $gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0)] },
        //         { $lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59)] }
        //     ]
        // },
    }

    // if (userId && userId.length > 5) {
    //     conditions = {
    //         ...conditions,
    //         userId: mongoose.Types.ObjectId(userId)
    //     }
    // } 

    if (tableId && tableId.length > 5) {
        conditions = {
            ...conditions,
            tableId: mongoose.Types.ObjectId(tableId)
        }

        let  tablees = await Table.findOne({
            _id: tableId
        });

        if(tablees==null)
        {
            let  tablees = await Old_Table.findOne({
                _id: tableId
            });
            if(tablees!="")
            {
              old_data = true;
                
            }
            
        }


    }

    console.log("table old_data  " , old_data);
    if (gameId && gameId.length > 5) {
        conditions = {
            ...conditions,
            gameId: mongoose.Types.ObjectId(gameId)
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
        "$unwind": {
            "path": "$userData",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        "$lookup": {
            "from": "tables",
            "localField": "tableId",
            "foreignField": "_id",
            "as": "tableData"
        }
    }, {
        "$unwind": {
            "path": "$tableData",
            "preserveNullAndEmptyArrays": true
        }
    }, 
        {
            "$lookup": {
                "from": "cardinfos",
                "localField": "cardInfoId",
                "foreignField": "_id",
                "as": "cardInfoData"
            }
        }, {
            "$unwind": {
                "path": "$cardInfoData",
                "preserveNullAndEmptyArrays": true
            }
        },
    {
        $project: {
            "_id": 0,
            "playerId": "$userData._id",
            "userName": "$userData.userName",
            "displayName": "$userData.displayName",
            "tableId": "$tableData._id",
            "tableName": "$tableData.name",
            "gameId":"$gameId",
            "gameType": "$tableData.gameType",
            "tableRake": "$tableData.commission",
            "auditType":"$auditType",
            "activePlayers": "$activePlayers",
            "remark": "$remark",
            "buy_low": "$tableData.minChip",
            "buy_high": "$tableData.maxChip",
            "ant":"$tableData.boot",
            "bet":"$bet",
            "betExtra": "$betExtra",
            "chipLeft":"$chipLeft",
            "potAmount":"$potAmount",
            "winAmount":"$winAmount",
            "winWith": "$winWith",
            "createdAt":{
                "$dateToString": {
                    "format": "%Y-%m-%d %H:%M:%S",
                    "date": "$createdAt"
                }
            },
            "cards":"$cardInfoData.info",
            "jokers": "$cardInfoData.jokers",
            "joker": "$cardInfoData.joker",
            "cardStatus":"$cardStatus",
            "click":"$click"
        }
    },
    { "$sort": { "createdAt": -1 } },
    ];


    if(old_data==true)
    {
         pipeline = [{
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
            "$unwind": {
                "path": "$userData",
                "preserveNullAndEmptyArrays": true
            }
        }, 
        {
            "$lookup": {
                "from": "old_tables",
                "localField": "tableId",
                "foreignField": "_id",
                "as": "tableData"
            }
        }, {
            "$unwind": {
                "path": "$tableData",
                "preserveNullAndEmptyArrays": true
            }
        }, 
            {
                "$lookup": {
                    "from": "cardinfos",
                    "localField": "cardInfoId",
                    "foreignField": "_id",
                    "as": "cardInfoData"
                }
            }, {
                "$unwind": {
                    "path": "$cardInfoData",
                    "preserveNullAndEmptyArrays": true
                }
            },
        {
            $project: {
                "_id": 0,
                "playerId": "$userData._id",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "tableId": "$tableData._id",
                "tableName": "$tableData.name",
                "gameId":"$gameId",
                "gameType": "$tableData.gameType",
                "tableRake": "$tableData.commission",
                "auditType":"$auditType",
                "activePlayers": "$activePlayers",
                "remark": "$remark",
                "buy_low": "$tableData.minChip",
                "buy_high": "$tableData.maxChip",
                "ant":"$tableData.boot",
                "bet":"$bet",
                "betExtra": "$betExtra",
                "chipLeft":"$chipLeft",
                "potAmount":"$potAmount",
                "winAmount":"$winAmount",
                "winWith": "$winWith",
                "createdAt":{
                    "$dateToString": {
                        "format": "%Y-%m-%d %H:%M:%S",
                        "date": "$createdAt"
                    }
                },
                "cards":"$cardInfoData.info",
                "jokers": "$cardInfoData.jokers",
                "joker": "$cardInfoData.joker",
                "cardStatus":"$cardStatus",
                "click":"$click"
            }
        },
        { "$sort": { "createdAt": -1 } },
        ];
    
    }
   // let total = await GameAudit.aggregate(pipeline)

    console.log(pipeline)
    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let result = await GameAudit.aggregate(pipeline)

    return { result, total: 0};
}


module.exports = {
    gameAuditgamewise,
}