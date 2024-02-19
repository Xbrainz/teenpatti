const mongoose = require('mongoose');
const { Schema } = mongoose;

let GameTypeMasterSchema = new Schema(
    {
        GameTypeName: { type: 'string', required: true },
        GameTypeDesc: { type: 'string', default: '' },
        GameTypeImage: { type: 'string', default: '' },
        GameSequence: { type: Number, default: '' },
        GameStatus: { type: Number, default: '' },
        Sku: { type: 'string', default: '' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
    }, {
        timestamps: true
    }
);

GameTypeMasterSchema.pre('save', function (next) {
    // get the current date
	let currentDate = new Date();

	// change the updated_at field to current dat
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt) this.createdAt = currentDate;

	next();
});


const gametypemaster = mongoose.model('gametype_masters', GameTypeMasterSchema);

module.exports = gametypemaster;
