const mongoose = require('mongoose');
const { Schema } = mongoose;

let GameMasterSchema = new Schema(
    {
        GameName: { type: 'string', default: '' },
        SkuGameType: { type: 'string', default: ''},
        GameRules: { type: 'string', default: '' },
        GameCommission: { type: 'string', default: '' },
        ProviderCommission: { type: 'string', default: '' },
        GameImage: { type: 'string', default: '' },
        GameStatus: { type: Number, default: '' },
        GameSequence: { type: Number, default: 0 },
        Sku: { type: 'string', default: '' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },

    }, {
        timestamps: true
    }
);

GameMasterSchema.pre('save', function (next) {
    // get the current date
	let currentDate = new Date();

	// change the updated_at field to current dat
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt) this.createdAt = currentDate;

	next();
});


const gamemaster = mongoose.model('game_masters', GameMasterSchema);

module.exports = gamemaster;
