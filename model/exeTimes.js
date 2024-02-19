const mongoose = require('mongoose');
const { Schema } = mongoose;

let exeTimes = new Schema(
    {
       
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'game' },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
		remark: { type: 'string', default: '' },
        exetime: { type: 'string', default: ''},
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },

    }, {
        timestamps: true
    }
);

exeTimes.pre('save', function (next) {
    // get the current date
	let currentDate = new Date();

	// change the updated_at field to current dat
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt) this.createdAt = currentDate;

	next();
});


const exeTimess = mongoose.model('exeTimes', exeTimes);

module.exports = exeTimess;
