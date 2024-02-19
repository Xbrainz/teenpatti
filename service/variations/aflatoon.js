let _ = require("underscore");

let common = require("./common");
let Card = require("../card");

function joker() {
	let _options = {
		wininingPriority: {
			cardType: {
				spade: {
					priority: 4,
				},
				heart: {
					priority: 3,
				},
				diamond: {
					priority: 2,
				},
				club: {
					priority: 1,
				},
			},
			setType: {
				highcard: {
					type: "highcard",
					displayName: "High Card",
					priority: 1,
				},
				pair: {
					type: "pair",
					displayName: "Pair",
					priority: 2,
				},
				color: {
					type: "color",
					displayName: "Color",
					priority: 3,
				},
				sequence: {
					type: "sequence",
					displayName: "Sequence",
					priority: 4,
				},
				puresequence: {
					type: "puresequence",
					displayName: "Pure Sequence",
					priority: 5,
				},
				trail: {
					type: "trail",
					displayName: "Trail",
					priority: 6,
				},
			},
		},
	};

	this.getGreatest = function (sets, joker) {
		let setProp = "newSet";
		let jokers = [];
		jokers.push(joker);
		if(joker.rank === 13) {
			jokers.push(new Card(joker.type, (joker.rank - 1)));
			jokers.push(new Card(joker.type, 1));
		} else if(joker.rank === 1) {
			jokers.push(new Card(joker.type, 13));
			jokers.push(new Card(joker.type, (joker.rank + 1)));
		} else {
			jokers.push(new Card(joker.type, (joker.rank - 1)));
			jokers.push(new Card(joker.type, (joker.rank + 1)));
		}
		sets = common.convertSetsAsPerJoker(sets, jokers);
		return common.findWinners(_options, sets, setProp)
	};

}

module.exports = new joker();