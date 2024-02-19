let _ = require("underscore");

let common = require("./common");

function Simple() {
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


	this.getGreatest = function (sets, setProp) {
		setProp = setProp || "set";
		return common.findWinners(_options, sets, setProp);
	};

	this.getPriority = function (set) {
	//	return common.getSetType(_options,set);

	console.log("get priorityyy ", set);
		return common.getSetType(_options, set["set"])


	};
}
module.exports = new Simple();
