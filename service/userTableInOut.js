let mongoose = require("mongoose");

let UserTableInOut = require("../model/userTableInOut");

async function tableInOut(tableId, userId, type) {
    try{
   
    if(type === 'In') {
        let userTableInOutData = {
            userId: mongoose.Types.ObjectId(userId),    
            tableId: mongoose.Types.ObjectId(tableId),
            in: new Date(),
        }
        const userTableInOut = new UserTableInOut(userTableInOutData);
        await userTableInOut.save();
    } else if(type === 'Out') {
        let userTableInOutData = await UserTableInOut.findOne({ tableId: tableId, userId: userId }).sort({in: -1});
        userTableInOutData.out = new Date();
        await userTableInOutData.save();
    }
         
}catch(error)
{
    console.log(error);
}
}

module.exports = {
    tableInOut,
};
