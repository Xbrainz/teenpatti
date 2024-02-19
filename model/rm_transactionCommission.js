const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TransactionCommissionSchema = new Schema({
    senderId: { type: Schema.ObjectId },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
	distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    transType: { type: String, default: "" },
    tableId: { type: Schema.ObjectId },
    gameId: { type: Schema.ObjectId },
    agentCommission: { type: Number },
    distributorCommission: { type: Number },
    adminCommission: { type: Number },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' }
});

//  on every save, add the date
TransactionCommissionSchema.pre('save', function(next) {
    // get the current date
    let currentDate = new Date();
    this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

const TransactionCommission = mongoose.model('rm_transactionCommission', TransactionCommissionSchema);

module.exports = TransactionCommission;