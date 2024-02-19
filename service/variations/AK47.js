let _ = require("underscore");

let common = require("./common");
let Card = require("../card");

function AK47() {
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

	this.getGreatest = function (sets) {
		let setProp = "newSet";
		let jokers = [];
		jokers.push(new Card('spade', "1"));
		jokers.push(new Card('heart', "13"));
		jokers.push(new Card('diamond', "4"));
		jokers.push(new Card('diamond', "7"));
		sets = common.convertSetsAsPerJoker(sets, jokers);
		return common.findWinners(_options, sets, setProp)
	};

}

module.exports = new AK47();