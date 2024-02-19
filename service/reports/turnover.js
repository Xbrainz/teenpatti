const TransactionCommission = require("../../model/transactionCommission")
const TransactionGiftTip = require("../../model/transactionGiftTip")

const transactionType = require("../../constant/transactionType");

const turnover = async (data) => {
    const { startDate, endDate } = data;
    let rechargeTotals;
    let tipTotals = 0, giftTotals = 0;
    let agentTotalCommission = 0, distributorTotalCommission = 0, adminTotalCommission = 0;
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

    const tipTotal = await TransactionGiftTip.aggregate([
        {
            $match: {
                transType: transactionType.TIP,
                ...conditions
            },
        },
        {
            $group: {
                _id: "",
                Amount: {
                    $sum: "$coins",
                },
            },
        },
        {
            $project: {
                Total: "$Amount",
            },
        },
    ]);

    const giftTotal = await TransactionGiftTip.aggregate([
        {
            $match: {
                transType: transactionType.GIFT,
                ...conditions
            },
        },
        {
            $group: {
                _id: "",
                Amount: {
                    $sum: "$coins",
                },
            },
        },
        {
            $project: {
                Total: "$Amount",
            },
        },
    ]);

    const commissionAmount = await TransactionCommission.aggregate([
        {
            $match: {
                transType: transactionType.COMMISSION,
                ...conditions
            },
        },
        {
            $group: {
                _id: "",
                agentCommission: {
                    $sum: "$agentCommission",
                },
                distributorCommission: {
                    $sum: "$distributorCommission",
                },
                adminCommission: {
                    $sum: "$adminCommission",
                },
            },
        },
        {
            $project: {
                agentDistributorTotalCommission: { "$sum": ["$agentCommission", "$distributorCommission"] },
                agentTotalCommission: "$agentCommission",
                distributorTotalCommission: "$distributorCommission",
                adminTotalCommission: "$adminCommission"
            },
        },
    ]);

    giftTotals = giftTotal.length > 0 ? giftTotal[0].Total : 0;
    tipTotals = tipTotal.length > 0 ? tipTotal[0].Total : 0;

    if (commissionAmount.length > 0) {
        agentTotalCommission = commissionAmount[0].agentTotalCommission;
        distributorTotalCommission = commissionAmount[0].distributorTotalCommission;
        adminTotalCommission = commissionAmount[0].adminTotalCommission;
    }

    return {
        rechargeTotals,
        tipTotals,
        giftTotals,
        agentTotalCommission,
        distributorTotalCommission,
        adminTotalCommission
    };

}

module.exports = {
    turnover,
}