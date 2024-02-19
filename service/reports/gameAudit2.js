const mongoose = require("mongoose");

const GameAudit2 = require("../../model/gameAudit")

const UserRole = require("../../constant/userRole");
const User = require("../../model/user");
const gamed = require("../../model/game_secondary");

const gameAudit2 = async (data, user) => {
	const {
		startDate,
		endDate,
		userId,
		tableId,
		skip,
		limit,
		
		remark,
		startHour,
		startMin,
		endHour,
		endMin
	} = data;
    let {gameId } = data;


	console.log(" datataaaa   ", startDate, endDate, userId, tableId, skip, limit, gameId, remark, startHour, startMin, endHour, endMin);

	let finalStartDate = new Date(startDate);
	let finalEndDate = new Date(endDate);


	console.log("gameaudittttt....");

	let conditions = {
		$expr: {
			$and: [{
					$gte: ["$createdAt", new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), parseInt(startHour), parseInt(startMin), 0)]
				},
				{
					$lte: ["$createdAt", new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), parseInt(endHour), parseInt(endMin), 59)]
				}
			]
		},
	}

	if (userId && userId.length > 5) {
		conditions = {
			...conditions,
			userId: mongoose.Types.ObjectId(userId)
		}
	}

	if (tableId && tableId.length > 5) {
		conditions = {
			...conditions,
			tableId: mongoose.Types.ObjectId(tableId)
		}
	}



	/*
	        conditions = {
	            ...conditions,
	            auditType : "JOIN_TABLE"
	        }
	        */


	if (gameId && gameId.length > 5) {
       
        let res = await gamed.aggregate([
            {
              $addFields: {
                tempId: { $toString: '$_id' },
              }
            },
            {
              $match: {
                tempId: { $regex: gameId},
               
              }
            }
          ]);
        
          gameId =  res[0]._id.toString();

		conditions = {
            ...conditions,
            gameId: mongoose.Types.ObjectId(gameId)
        }
	}
	let pipeline = "";

	console.log("call apiii.........");

	if (remark == "") {
		pipeline = [{
				"$match": conditions,
                // "$addFields" : {
                //     tempId: {
                //         $toString: '$_id'
                //     },
                // },

                
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
					//  "_id": 0,
					"playerId": "$userData._id",
					"userName": "$userData.userName",
					"displayName": "$userData.displayName",
					"tableId": "$tableData._id",
					"tableName": "$tableData.name",
					"gameId": "$gameId",
					"gameType": "$tableData.gameType",
					//   "tableRake": "$tableData.commission",
					"auditType": "$auditType",
					"activePlayers": "$activePlayers",
					// "remark": "$remark",
					//   "buy_low": "$tableData.minChip",
					//   "buy_high": "$tableData.maxChip",
					"ant": "$tableData.boot",
					"bet": "$bet",
					"betExtra": "$betExtra",
					"chipLeft": "$chipLeft",
					"potAmount": "$potAmount",
					"winAmount": "$winAmount",
					"winWith": "$winWith",
					"createdAt1": "$createdAt",
					"createdAt": {
						"$dateToString": {
							"format": "%Y-%m-%d %H:%M:%S",
							"date": "$createdAt"
						}
					},

					"cards": "$cardInfoData.info",
					// "jokers": "$cardInfoData.jokers",
					//  "joker": "$cardInfoData.joker",
					"cardStatus": "$cardStatus",
					"click": "$click"
				}
			},
			{
				"$sort": {
					"createdAt1": -1
				}
			},
		];
	} else {
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
					//   "_id": 0,
					"playerId": "$userData._id",
					"userName": "$userData.userName",
					"displayName": "$userData.displayName",
					"tableId": "$tableData._id",
					"tableName": "$tableData.name",
					"gameId": "$gameId",
					"gameType": "$tableData.gameType",
					//  "tableRake": "$tableData.commission",
					"auditType": "$auditType",
					"activePlayers": "$activePlayers",
					"remark": "$remark",
					//   "buy_low": "$tableData.minChip",
					//    "buy_high": "$tableData.maxChip",
					"ant": "$tableData.boot",
					"bet": "$bet",
					"betExtra": "$betExtra",
					"chipLeft": "$chipLeft",
					"potAmount": "$potAmount",
					"winAmount": "$winAmount",
					"winWith": "$winWith",
					"createdAt1": "$createdAt",
					"createdAt": {
						"$dateToString": {
							"format": "%Y-%m-%d %H:%M:%S",
							"date": "$createdAt"
						}
					},

					"cards": "$cardInfoData.info",
					//    "jokers": "$cardInfoData.jokers",
					//    "joker": "$cardInfoData.joker",
					"cardStatus": "$cardStatus",
					"click": "$click"
				}
			},
			{
				"$sort": {
					"createdAt1": -1
				}
			},
		];
	}



	// let total = await GameAudit.aggregate(pipeline)

	// console.log(pipeline)
	pipeline.push({
		$skip: skip
	}, {
		$limit: limit
	})
	console.log("end apiiii....");
	let result = await GameAudit2.aggregate(pipeline)

	return {
		result,
		total: 0
	};
}


module.exports = {
	gameAudit2,
}