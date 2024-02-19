const TransactionCommission = require("../../model/transactionCommission")

const Table = require("../../model/table");
const Player = require("../../model/player");

const StaticValue = require("../../constant/staticValue");

const getCommissionByAdminId = async (data) => {
    let date = new Date(data.date);

    const commission = await TransactionCommission.find({
        adminId: StaticValue.ADMIN_ID, createdAt: {
            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
        }
    }, { adminCommission: 1, distributorId: 1, tableId: 1, gameId: 1 }).populate([{
        path: 'distributorId',
        select: 'userName displayName',
        model: Player
    }, {
        path: 'tableId',
        model: Table,
        select: 'name gameType'
    }]).sort({ createdAt: -1 });

    return commission;
}

module.exports = {
    getCommissionByAdminId
}