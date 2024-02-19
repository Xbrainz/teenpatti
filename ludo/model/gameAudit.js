const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let GameAuditSchema = new Schema({
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'table' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'game' },
    tokens : [],
    winners : [],
  
    activePlayers :  { type: String, default: '' },
    auditType: { type: String, default: '' },
    click: { type: String, default: '' },
    remark: { type: String, default: '' },
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

const GameAudit = mongoose.model('lu_gameAudits', GameAuditSchema);

module.exports = GameAudit;