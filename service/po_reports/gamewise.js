const mongoose = require("mongoose");

const TransactionCommission = require("../../poker/model/transactionCommission")
const TransactionChalWin = require("../../poker/model/transactionChalWin")
const CardInfo = require("../../poker/model/cardInfo");


const gamewise = async (data) => {
    const { startDate, endDate, tableId, limit, skip } = data;

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

    const pipeline = [{
        "$match": conditions
    }, {
        "$lookup": {
            "from": "po_games",
            "localField": "gameId",
            "foreignField": "_id",
            "as": "games"
        }
    }, {
        "$unwind": "$games"
    }, {
        "$lookup": {
            "from": "po_tables",
            "localField": "tableId",
            "foreignField": "_id",
            "as": "tableData"
        }
    }, {
        "$unwind": "$tableData"
    },{
        "$group": {
            "_id": {
                "createdAt": {
                    "$dateToString": {
                        "format": "%Y-%m-%d %H:%M:%S",
                        "date": "$createdAt"
                    }
                },
                "gameId": "$gameId",
                "cardInfoId": "$games.cardInfoId",
                "players": {
                    "$map": {
                        "input": {
                            $objectToArray: "$games.players"
                        },
                        "as": "el",
                        "in": {
                            "playerId": "$$el.v.id",
                            "playerUserName": "$$el.v.playerInfo.userName",
                            "playerDisplayName": "$$el.v.playerInfo.displayName",
                            "playerProfilePic": "$$el.v.playerInfo.profilePic",
                            "win": false
                        }
                    }
                },
                "tableName": "$tableData.name",
                "gameType": "$tableData.gameType",
            },
        //    "totalAgentCoins": {
        //        "$sum": "$agentCommission"
        //    },
         //   "totalDistributorCoins": {
         //       "$sum": "$distributorCommission"
         //   },
            "totalAdminCoins": {
                "$sum": "$adminCommission"
            },

        }
    }, {
        "$project": {
            "_id": 0,
            "date": "$_id.createdAt",
         //   "totalAgentCoins": "$totalAgentCoins",
         //   "totalDistributorCoins": "$totalDistributorCoins",
          "totalAdminCoins": "$totalAdminCoins",
            "gameId": "$_id.gameId",
            "cardInfoId": "$_id.cardInfoId",
            "players": "$_id.players",
            "tableName": "$_id.tableName",
            "gameType": "$_id.gameType"
        }
    }, { "$sort": { "date": -1 } }]

    const total = await TransactionCommission.aggregate(pipeline);

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    let gamewise = await TransactionCommission.aggregate(pipeline);
    gamewise = await Promise.all(gamewise.map(async game => {
        let gamePlayer = await TransactionChalWin.find({ gameId: game.gameId, transType: "WIN" }, { userId: 1, _id: 0 })
		
				let players = game.players.map(player => {
					for(var i=0;i<gamePlayer.length;i++){
						if (gamePlayer && gamePlayer.length > 0 && gamePlayer[i].userId == player.playerId)
							player.win = true;
					}
					return player
				})
		
		
        let cardInfo = await CardInfo.findById({ _id: game.cardInfoId })
        game.players = players;
        game.cardInfo = cardInfo;
        return game;
    }));

    return { gamewise, total: total.length };
}

module.exports = {
    gamewise,
}