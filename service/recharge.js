const User = require("../model/user");
const TransactionRecharge = require("./../model/transactionRecharge");
const TransactionType = require("./../constant/transactionType")
const StaticValue = require("./../constant/staticValue");

const transferCoin = async (userId, chips) => {


    const reciever = await User.findOne({ _id: userId }).lean();
    if (!reciever) {
        throw new Error("User wasn't found");
    }
    
    let parentUserId = reciever.distributorId ? reciever.distributorId : reciever.agentId ? reciever.agentId : StaticValue.ADMIN_ID;

    if (!parentUserId) throw new Error("Parent wasn't found!")

    const sender = await User.findOne({ _id: parentUserId }).lean();
    if (!sender) {
        throw new Error("User wasn't found");
    }

    if (sender.role !== "admin") {
        if (sender.chips < chips) {
            throw new Error("Insufficient balance");
        } else {
            const senderData = {
                ...sender,
                chips: (sender.chips - chips)
            }
            await User.findByIdAndUpdate({ _id: sender._id }, senderData);
        }
    }

    const recieverData = {
        ...reciever,
        chips: (reciever.chips + chips)
    }

    const recieverResult = await User.findByIdAndUpdate({ _id: reciever._id }, recieverData,{ new: true });

    const transactionData = {
        senderId: sender._id,
        receiverId: reciever._id,
        transType: TransactionType.RECHARGE,
        coins: chips,
    };
    const data = new TransactionRecharge(transactionData);
    await data.save();

    return recieverResult;

}

const retainCoin = async (userId, chips, transactionType, remark) => {
    
    if (![TransactionType.RECHARGE_REVERT, TransactionType.SETTLEMENT].includes(transactionType)){
        throw new Error("Transaction type is not valid!")
    }


    const sender = await User.findOne({ _id: userId }).lean();
    if (!sender) {
        throw new Error("User wasn't found");
    }

    let parentUserId = sender.distributorId ? sender.distributorId : sender.agentId ? sender.agentId : StaticValue.ADMIN_ID;

    if (!parentUserId) throw new Error("Parent wasn't found!")

    const reciever = await User.findOne({ _id: parentUserId }).lean();
    if (!reciever) {
        throw new Error("User wasn't found");
    }

    let senderResult;
    
    if (sender.chips < chips) {
        throw new Error("Insufficient coins");
    } else {
        const senderData = {
            ...sender,
            chips: (sender.chips - chips)
        }
        senderResult = await User.findByIdAndUpdate({ _id: sender._id }, senderData, { new: true });
    }

    const recieverData = {
        ...reciever,
        chips: (reciever.chips + chips)
    }

    await User.findByIdAndUpdate({ _id: reciever._id }, recieverData, { new: true });

    const transactionData = {
        senderId: sender._id,
        receiverId: reciever._id,
        transType: transactionType,
        coins: chips,
        remark: transactionType === TransactionType.SETTLEMENT ? remark : ""
    };
    const data = new TransactionRecharge(transactionData);
    await data.save();

    return senderResult;

}

module.exports = {
    transferCoin,
    retainCoin
}