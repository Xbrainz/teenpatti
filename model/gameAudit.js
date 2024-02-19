const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let GameAuditSchema = new Schema({
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'table' },
    cardInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'cardinfo' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'game' },
    auditType: { type: String, default: '' },
    bet: { type: Number, default: 0 }, 
    betExtra: { type: Number, default: 0 },
    chipLeft: { type: Number, default: 0 },
    cardStatus: { type: String, default: '' },
    click: { type: String, default: '' },
    remark: { type: String, default: '' },
    potAmount: { type: Number, default: 0 },
    activePlayers: { type: String, default: '' },
    winAmount: { type: Number, default: 0 },
    winWith: { type: String, default: '' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

//  on every save, add the date
GameAuditSchema.pre('save', function(next) {
    // get the current date
    const currentDate = new Date();
    this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

const GameAudit = mongoose.model('gameAudit', GameAuditSchema);

module.exports = GameAudit;