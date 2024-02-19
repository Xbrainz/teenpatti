const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let GameSchema = new Schema({
    tableId: { type: Schema.ObjectId, ref: 'dt_tables' },
    gameId: { type: Schema.ObjectId, ref: 'dt_games' },
	userId: { type: Schema.ObjectId, ref: 'users' },
   
	dt_dragon: { type: 'number', default: 0 },
	dt_tie: { type: 'number', default: 0 },
	dt_tiger: { type: 'number', default: 0 },
	winner: { type: String, default: '' },
	winningamount: { type: 'number', default: 0 },
	
});

//  on every save, add the date
GameSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();
    this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

const Game = mongoose.model('dt_game_player', GameSchema);

module.exports = Game;