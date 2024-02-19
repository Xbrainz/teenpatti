let mongoose = require("mongoose");

const User = require("../model/user");
const Table = require("../model/table");
const TransactionCommission = require("./../model/transactionCommission");

const staticValue = require("../constant/staticValue");
const transactionType = require("../constant/transactionType");

async function calculateCommission(tableId, playerId) {
    let user = await User.findOne({ _id: playerId });
    let table = await Table.findOne({ _id: tableId });
    let agentCommission = 0;
    let distributorCommission = 0;
    let adminCommission = 0;
    let agent = await User.findOne({ _id: staticValue.AGENT_ID });

    console.log("disctrrrr : ", staticValue.DISTRIBUTE_ID );
    let distributor = await User.findOne({ _id: staticValue.DISTRIBUTE_ID });
let totalCommissionoriginal = 0;
    if(table.commission > 0 && table.players[playerId].totalChalAmount > 0) {
         let totalCommission = ((table.players[playerId].totalChalAmount * table.commission) / 100).toFixed();
		 totalCommissionoriginal = totalCommission;
		 
        if(agent.commission > 0 && totalCommission > 0) {
            distributorCommission = ((totalCommission * agent.commission) / 100).toFixed();
        }
        if(distributor.commission > 0 && totalCommission > 0) {
            adminCommission = ((totalCommission * distributor.commission) / 100).toFixed();
        }
        agentCommission = totalCommission - distributorCommission - adminCommission;
    

console.log("----------------------------------------------------------------------");

console.log("table.players[playerId].totalChalAmount : " + table.players[playerId].totalChalAmount);
console.log("table.commission : " + table.commission );

console.log(" totalCommission : " + totalCommission );
console.log(" distributorCommission : " + distributorCommission );
console.log(" adminCommission : " + adminCommission );
console.log(" agentCommission : " + agentCommission );
console.log("----------------------------------------------------------------------");

        // Update agent, distributor, admin commission amount and add transactoin for it.
        let transactionCommissionData = {
            senderId: mongoose.Types.ObjectId(playerId),
            agentId: agent._id,
            distributorId: distributor._id,
            adminId: staticValue.ADMIN_ID,
            tableId: table._id,
            gameId: table.lastGameId,
            agentCommission: agentCommission,
            distributorCommission: distributorCommission,
            adminCommission: adminCommission,
            transType: transactionType.COMMISSION,
        }
		console.log(transactionCommissionData);
        const newTransactionCommission = new TransactionCommission(transactionCommissionData);
        await newTransactionCommission.save();

        await updateUserChips({_id: mongoose.Types.ObjectId(staticValue.ADMIN_ID) }, adminCommission);
        await updateUserChips({_id: distributor._id }, distributorCommission);       
        await updateUserChips({_id: agent._id }, agentCommission);
    }
	
	return totalCommissionoriginal;
}

async function updateUserChips(condition, chips) {
    await User.update(condition, { $inc: { chips } });
}

module.exports = {
    calculateCommission
}