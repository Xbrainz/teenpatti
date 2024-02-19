let _ = require("underscore");

let common = require("./common");

function FourCard() {
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

	function checkAndConvertToTrail(cardSet) {
		let newCards = [];
		cardSet = _.sortBy(cardSet, 'priority');
		if(cardSet[0].rank === cardSet[1].rank && cardSet[2].rank === cardSet[0].rank) {
			newCards.push(cardSet[0]);
			newCards.push(cardSet[1]);
			newCards.push(cardSet[2]);
		} else if(cardSet[1].rank === cardSet[2].rank && cardSet[3].rank === cardSet[1].rank) {
			newCards.push(cardSet[1]);
			newCards.push(cardSet[2]);
			newCards.push(cardSet[3]);
		}
		return newCards;
	}

	function checkAndConvertToPureSequence(cardSet) {
		let newCards = [];
		let sorted = _.sortBy(cardSet, 'priority');
		let sortedRank = _.sortBy(cardSet, 'rank');
		if((sorted[1].priority + 1 === sorted[2].priority && sorted[2].priority + 1 === sorted[3].priority) 
				&& (sorted[1].type === sorted[2].type && sorted[2].type === sorted[3].type)) {
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
			newCards.push(sorted[3]);
		} else if((sortedRank[1].rank + 1 === sortedRank[2].rank && sortedRank[2].rank + 1 === sortedRank[3].rank)
				&& (sorted[1].type === sorted[2].type && sorted[2].type === sorted[3].type)) {
			newCards.push(sortedRank[1]);
			newCards.push(sortedRank[2]);
			newCards.push(sortedRank[3]);
		} else if((sorted[0].priority + 1 === sorted[1].priority && sorted[1].priority + 1 === sorted[2].priority) 
				&& (sorted[0].type === sorted[1].type && sorted[1].type === sorted[2].type)) {
			newCards.push(sorted[0]);
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
		} else if((sortedRank[0].rank + 1 === sortedRank[1].rank && sortedRank[1].rank + 1 === sortedRank[2].rank) 
				&& (sorted[0].type === sorted[1].type && sorted[1].type === sorted[2].type)) {
			newCards.push(sortedRank[0]);
			newCards.push(sortedRank[1]);
			newCards.push(sortedRank[2]);
		} 
		return newCards;
	}
	
	function checkAndConvertToSequence(cardSet) {
		let newCards = [];
		let sorted = _.sortBy(cardSet, 'priority');
		let sortedRank = _.sortBy(cardSet, 'rank');
		if(sorted[1].priority + 1 === sorted[2].priority && sorted[2].priority + 1 === sorted[3].priority) {
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
			newCards.push(sorted[3]);
		} else if(sortedRank[1].rank + 1 === sortedRank[2].rank && sortedRank[2].rank + 1 === sortedRank[3].rank) {
			newCards.push(sortedRank[1]);
			newCards.push(sortedRank[2]);
			newCards.push(sortedRank[3]);
		} else if(sorted[0].priority + 1 === sorted[1].priority && sorted[1].priority + 1 === sorted[2].priority) {
			newCards.push(sorted[0]);
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
		} else if(sortedRank[0].rank + 1 === sortedRank[1].rank && sortedRank[1].rank + 1 === sortedRank[2].rank) {
			newCards.push(sortedRank[0]);
			newCards.push(sortedRank[1]);
			newCards.push(sortedRank[2]);
		} 
		return newCards;
	}

	function checkAndConvertToColor(cardSet) {
		let newCards = [];
		let sorted = _.sortBy(cardSet, 'priority');
		if(sorted[1].type === sorted[2].type && sorted[2].type === sorted[3].type) {
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
			newCards.push(sorted[3]);
		} else if(sorted[0].type === sorted[2].type && sorted[2].type === sorted[3].type) {
			newCards.push(sorted[0]);
			newCards.push(sorted[2]);
			newCards.push(sorted[3]);
		} else if(sorted[0].type === sorted[1].type && sorted[1].type === sorted[3].type) {
			newCards.push(sorted[0]);
			newCards.push(sorted[1]);
			newCards.push(sorted[3]);
		} else if(sorted[0].type === sorted[1].type && sorted[1].type === sorted[2].type) {
			newCards.push(sorted[0]);
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
		}
		return newCards;
	}

	function checkAndConvertToPair(cardSet) {
		let newCards = [];
		let sorted = _.sortBy(cardSet, 'priority');
		if(sorted[0].priority === sorted[1].priority) {
			newCards.push(sorted[0]);
			newCards.push(sorted[1]);
			newCards.push(sorted[3]);
		} else if(sorted[1].priority === sorted[2].priority) {
			newCards.push(sorted[1]);
			newCards.push(sorted[2]);
			newCards.push(sorted[3]);
		} else if(sorted[2].priority === sorted[3].priority) {
			newCards.push(sorted[2]);
			newCards.push(sorted[3]);
			newCards.push(sorted[1]);
		}
		return newCards;
	}

	function checkAndConvertToHighCard(cardSet) {
		let newCards = [];
		let sorted = _.sortBy(cardSet, 'priority');
		newCards.push(sorted[1]);
		newCards.push(sorted[2]);
		newCards.push(sorted[3]);
		return newCards;
	}

	this.getGreatest = function (sets, setProp) {
		setProp = setProp || "set";
		for (let count = 0, len = sets.length; count < len; count++) {
			let newCards = checkAndConvertToTrail(sets[count].set);
			if(newCards.length === 0) {
				newCards = checkAndConvertToPureSequence(sets[count].set)
			}
			if(newCards.length === 0) {
				newCards = checkAndConvertToSequence(sets[count].set);
			}
			if(newCards.length === 0) {
				newCards = checkAndConvertToColor(sets[count].set);
			}
			if(newCards.length === 0) {
				newCards = checkAndConvertToPair(sets[count].set);
			}
			if(newCards.length === 0) {
				newCards = checkAndConvertToHighCard(sets[count].set);
			}
			sets[count].newSet = newCards;
		}
		return common.findWinners(_options, sets, "newSet");
	};

	this.getPriority = function (set) {
		return this.getSetType(set);
	};
}
module.exports = new FourCard();
