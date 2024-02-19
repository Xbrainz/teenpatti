const mongoose = require("mongoose");

const TransactionCommission = require("../../model/transactionCommission")
const TransactionChalWin = require("../../model/transactionChalWin")
const CardInfo = require("../../model/cardInfo");
const gamed = require("../../model/game_secondary");
const transactionType = require("../../constant/transactionType");

const gamewise = async (data) => {
    const { startDate, endDate, tableId, limit, skip } = data;
    let { gameId } = data;

    console.log("game wise reportsss.....gameId : " ,gameId);

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

    console.log("game iddd reportsssss " ,gameId);
    if (gameId && gameId.length > 5) {
       
        console.log("game iddd");
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

          console.log("game iddd " ,res);
		conditions = {
            ...conditions,
            gameId: mongoose.Types.ObjectId(gameId)
        }
	}



    const pipeline = [{
        "$match": conditions
    }, {
        "$lookup": {
            "from": "games",
            "localField": "gameId",
            "foreignField": "_id",
            "as": "games"
        }
    }, {
        "$unwind": "$games"
    }, 
    // {
    //     "$lookup": {
    //         "from": "tables",
    //         "localField": "tableId",
    //         "foreignField": "_id",
    //         "as": "tableData"
    //     }
    // },
    // {
    //     "$unwind": "$tableData"
    // },
    {
        "$group": {
            "_id": {
                "createdAt": {
                    "$dateToString": {
                        "format": "%Y-%m-%d %H:%M:%S",
                        "date": "$games.createdAt"
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
                            // "playerDisplayName": "$$el.v.playerInfo.displayName",
                            // "playerProfilePic": "$$el.v.playerInfo.profilePic",
                            "win": false
                        }
                    }
                },
                // "tableName": "$tableData.name",
                // "gameType": "$tableData.gameType",
                // "tableName": "$games.tableId",
                // "gameType": "",
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
            "gameId": "$_id.gameId",
            "cardInfoId": "$_id.cardInfoId",
            "players": "$_id.players",
            "totalAgentCoins": "$totalAgentCoins",
            "totalDistributorCoins": "$totalDistributorCoins",
            "totalAdminCoins": "$totalAdminCoins",
            // "tableName": "$_id.tableName",
            "tableId": "$_id.tableId",
            // "gameType": "$_id.gameType"
        }
    }, { "$sort": { "date": -1 } }]

    pipeline.push({
        $skip: skip
    }, {
        $limit: limit
    })

    console.log("skip,limit", skip ,"   ", limit);


    let gamewise = await TransactionCommission.aggregate(pipeline);
    gamewise = await Promise.all(gamewise.map(async game => {
        let gamePlayer = await TransactionChalWin.find({ gameId: game.gameId, transType: transactionType.WIN }, { userId: 1, _id: 0 })
		
				let players = game.players.map(player => {
					for(var i=0;i<gamePlayer.length;i++){
						if (gamePlayer && gamePlayer.length > 0 && gamePlayer[i].userId == player.playerId)
							player.win = true;
					}
					return player
				})
		
		
        //comment
        let cardInfo = await CardInfo.findById({ _id: game.cardInfoId })
        game.players = players;

        //comment
          game.cardInfo = cardInfo;
        return game;
    }));

    return { gamewise};
}

module.exports = {
    gamewise,
}