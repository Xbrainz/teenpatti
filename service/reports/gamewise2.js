const mongoose = require("mongoose");

const TransactionCommission = require("../../model/transactionCommission")
const TransactionChalWin = require("../../model/transactionChalWin")
const games = require("../../model/game_secondary")
const CardInfo = require("../../model/cardInfo");

const transactionType = require("../../constant/transactionType");

const gamewise2 = async (data) => {
    const { startDate, endDate, tableId, limit, skip } = data;

    console.log("game wise reportsss.....");

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

    if (tableId && tableId.length > 5) {
        conditions = {
            ...conditions,
            tableId: mongoose.Types.ObjectId(tableId)
        }
    }


    let gamewise2 = await games.find({
        createdAt: {
            $gte: new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(), 0, 0, 0),
            $lt: new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), 23, 59, 59),
        },
    },
    {
        _id:1,
        players:0,
        updatedAt:0,
       
        cardInfoId:0
    }
    );


    // const pipeline = [{
    //     "$match": conditions
    // }, {
    //     "$lookup": {
    //         "from": "games",
    //         "localField": "gameId",
    //         "foreignField": "_id",
    //         "as": "games"
    //     }
    // }, {
    //     "$unwind": "$games"
    // }, {
    //     "$lookup": {
    //         "from": "tables",
    //         "localField": "tableId",
    //         "foreignField": "_id",
    //         "as": "tableData"
    //     }
    // }, {
    //     "$unwind": "$tableData"
    // },{
    //     "$group": {
    //         "_id": {
    //             "createdAt": {
    //                 "$dateToString": {
    //                     "format": "%Y-%m-%d %H:%M:%S",
    //                     "date": "$games.createdAt"
    //                 }
    //             },
    //             "gameId": "$gameId",
    //             "cardInfoId": "$games.cardInfoId",
    //             "players": {
    //                 "$map": {
    //                     "input": {
    //                         $objectToArray: "$games.players"
    //                     },
    //                     "as": "el",
    //                     "in": {
    //                         "playerId": "$$el.v.id",
    //                         "playerUserName": "$$el.v.playerInfo.userName",
    //                         "playerDisplayName": "$$el.v.playerInfo.displayName",
    //                         "playerProfilePic": "$$el.v.playerInfo.profilePic",
    //                         "win": false
    //                     }
    //                 }
    //             },
    //             "tableName": "$tableData.name",
    //             "gameType": "$tableData.gameType",
    //         },
    //         "totalAgentCoins": {
    //             "$sum": "$agentCommission"
    //         },
    //         "totalDistributorCoins": {
    //             "$sum": "$distributorCommission"
    //         },
    //         "totalAdminCoins": {
    //             "$sum": "$adminCommission"
    //         },

    //     }
    // }, {
    //     "$project": {
    //         "_id": 0,
    //         "date": "$_id.createdAt",
    //         "totalAgentCoins": "$totalAgentCoins",
    //         "totalDistributorCoins": "$totalDistributorCoins",
    //         "totalAdminCoins": "$totalAdminCoins",
    //         "gameId": "$_id.gameId",
    //         "cardInfoId": "$_id.cardInfoId",
    //         "players": "$_id.players",
    //         "tableName": "$_id.tableName",
    //         "tableId": "$_id.tableId",
    //         "gameType": "$_id.gameType"
    //     }
    // }, { "$sort": { "date": -1 } }]

    // const total = await TransactionCommission.aggregate(pipeline);









    // const pipeline = [{
    //     "$match": conditions
    // }, {
    //     "$lookup": {
    //         "from": "games",
    //         "localField": "gameId",
    //         "foreignField": "_id",
    //         "as": "games"
    //     }
    // }, {
    //     "$unwind": "$games"
    // }, {
    //     "$lookup": {
    //         "from": "tables",
    //         "localField": "tableId",
    //         "foreignField": "_id",
    //         "as": "tableData"
    //     }
    // }, {
    //     "$unwind": "$tableData"
    // },{
    //     "$group": {
    //         "_id": {
    //             "createdAt": {
    //                 "$dateToString": {
    //                     "format": "%Y-%m-%d %H:%M:%S",
    //                     "date": "$games.createdAt"
    //                 }
    //             },
    //             "gameId": "$gameId",
    //             "cardInfoId": "$games.cardInfoId",
    //             "players": {
    //                 "$map": {
    //                     "input": {
    //                         $objectToArray: "$games.players"
    //                     },
    //                     "as": "el",
    //                     "in": {
    //                         "playerId": "$$el.v.id",
    //                         "playerUserName": "$$el.v.playerInfo.userName",
    //                         "playerDisplayName": "$$el.v.playerInfo.displayName",
    //                         "playerProfilePic": "$$el.v.playerInfo.profilePic",
    //                         "win": false
    //                     }
    //                 }
    //             },
    //             "tableName": "$tableData.name",
    //             "gameType": "$tableData.gameType",
    //         },

    //     }
    // }, {
    //     "$project": {
    //         "_id": 0,
    //         "date": "$_id.createdAt",
    //         "gameId": "$_id.gameId",
    //         "cardInfoId": "$_id.cardInfoId",
    //         "players": "$_id.players",
    //         "tableName": "$_id.tableName",
    //         "tableId": "$_id.tableId",
    //         "gameType": "$_id.gameType"
    //     }
    // }, { "$sort": { "date": -1 } }]


    // pipeline.push({
    //     $skip: skip
    // }, {
    //     $limit: limit
    // })

    // let gamewise = await TransactionCommission.aggregate(pipeline);
    // gamewise = await Promise.all(gamewise.map(async game => {
    //     let gamePlayer = await TransactionChalWin.find({ gameId: game.gameId, transType: transactionType.WIN }, { userId: 1, _id: 0 })
		
	// 			let players = game.players.map(player => {
	// 				for(var i=0;i<gamePlayer.length;i++){
	// 					if (gamePlayer && gamePlayer.length > 0 && gamePlayer[i].userId == player.playerId)
	// 						player.win = true;
	// 				}
	// 				return player
	// 			})
		
		
    //     let cardInfo = await CardInfo.findById({ _id: game.cardInfoId })
    //     game.players = players;
    //     game.cardInfo = cardInfo;
    //     return game;
    // }));

    // return { gamewise, total: gamewise.length };

  
  

    return { gamewise2, total: gamewise2.length}
}

module.exports = {
    gamewise2,
}