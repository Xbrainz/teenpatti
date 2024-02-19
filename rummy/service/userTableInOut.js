let UserTableInOut = require("../model/userTableInOut");

async function tableInOut(tableId, userId, type) {
    if(type === 'In') {
        let userTableInOutData = {
            userId: userId,    
            tableId: tableId,
            in: new Date().now
        }
        const userTableInOut = new UserTableInOut(userTableInOutData);
        await userTableInOut.save();
    } else if(type === 'Out') {
        let userTableInOutData = await UserTableInOut.findOne({ tableId: tableId, userId: userId }).sort({in: -1});
        userTableInOutData.out = new Date();
        await userTableInOutData.save();
    }
}

module.exports = {
    tableInOut,
};
