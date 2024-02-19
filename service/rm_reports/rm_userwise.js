const mongoose = require('mongoose');
const _ = require('lodash')
const TransactionChalWin = require("../../rummy/model/transactionChalWin")
const Transactionrecharge = require("./../../model/transactionRecharge")
const TransactionGiftTip = require("./../../model/transactionGiftTip");
const TransactionType = require('../../constant/transactionType');
const Transaction = require('../../rummy/model/transaction')
const UserRole = require('./../../constant/userRole');
const User = require('../../model/user');

const userwise = async (data, user) => {
    const { startDate, endDate, userId, skip, limit, transType } = data;


    console.log('userId--', userId)
    
    console.log('user--', userId.length)


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

    let transactionResult1 = [];

    if (transType && transType.toLowerCase() === "all") {

        let conditionsTR1, conditionsTR2;
        let lookupTR1, lookupTR2;
        lookupTR1 = {
            "$lookup": {
                "from": "users",
                "localField": "receiverId",
                "foreignField": "_id",
                "as": "userData"
            }
        }
        lookupTR2 = {
            "$lookup": {
                "from": "users",
                "localField": "senderId",
                "foreignField": "_id",
                "as": "userData"
            }
        }
        if (userId && userId.length > 5) {
            console.log("TransType-All ==> Selected userId....")
            conditions = {
                ...conditions,
                userId: mongoose.Types.ObjectId(userId)
            }
            
        } else {
            if (user.role === UserRole.USER) {
                console.log("TransType-All ==> User-ALL ===> Role ==> Distributor")
                const userIds = await User.find({ _id : user.id.toString() }, { _id: 1 })
                const usersArr = userIds.map(user => user._id);
                // const userList = await User.find({ agentId: { $in: usersArr } }, { _id: 1 });
                // const userArr = userList.map(userl => userl._id);
                conditions = {
                    ...conditions,
                    receiverId: { $in: usersArr }
                }

            } else if (user.role === UserRole.ADMIN) {
                console.log("TransType-All ==> User-ALL ===> Role ==> AGENT")
                const userList = await User.find({ _id: user.id.toString() }, { _id: 1 })
                const userArr = userList.map(userl => userl._id);
                conditions = {
                    ...conditions,
                    senderId: { $in: userArr },
                    trans_type: transType
                }

            } else {
                console.log("TransType-All ==> User-ALL ===> Role . ==> Admin")
                const userListTR = await User.find({ role: { $in: [UserRole.USER, UserRole.ADMIN] } }, { _id: 1 })
                const userArrTR = userListTR.map(user => user._id);

                conditions = {
                    ...conditions,
                    userId: { $in: userArrTR }
                }

            }

        }
         
        let pipelineTCW = [{
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
                "trans_type": 1,
                "coins": 1,
                "playerId": "$userData._id",
                "userName": "$userData.userName",
                "displayName": "$userData.displayName",
                "createdAt": 1
            }
        },
        { "$sort": { "createdAt": -1 } },
        ];

        transactionResult1 = await Transaction.aggregate(pipelineTCW);

    
     
    } else {

        if ([TransactionType.WIN, TransactionType.BOOT, TransactionType.COMMISSION].includes(transType)) {

            // if (userId && userId.length > 5) {
            //     console.log("TransType-[Boot,Chal,Win] ==> User-Selected")
            //     conditions = {
            //         ...conditions,
            //         trans_type: transType,
            //         userId: mongoose.Types.ObjectId(userId)
            //     }
            // } else {
                if (user.role === UserRole.USER) {
                    console.log("TransType-[Boot,Chal,Win] ==> User-All ===> Role ==> USER")
                    const userIds = await User.find({ _id: user.id.toString() }, { _id: 1 })
                    const usersArr = userIds.map(agent => agent._id);

                 
                    conditions = {
                        ...conditions,
                        userId: { $in: usersArr }
                    }

                } else {
                    console.log("TransType-[Boot,Chal,Win] ==> User-All ===> Role ==> Admin")
                    conditions = {
                        ...conditions,
                        trans_type: transType
                    }
                }
            // }

            console.log("conditions-----",conditions)
            let pipelineTCW = [{
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
                    "trans_type": 1,
                    "coins": 1,
                    "playerId": "$userData._id",
                    "userName": "$userData.userName",
                    "displayName": "$userData.displayName",
                    "createdAt": 1
                }
            },
            { "$sort": { "createdAt": -1 } },
            ];
        
    
            transactionResult1 = await Transaction.aggregate(pipelineTCW);

            console.log('transactionResult1-----',transactionResult1)
     
    }
}  

    transactionResult = transactionResult1
    let result = transactionResult
    let total = result.length;


    result = _.orderBy(result, ['createdAt'], ['desc'])
    result = result.slice(skip, skip + limit)

    return { result, total };
  
}


module.exports = {
    userwise,
}