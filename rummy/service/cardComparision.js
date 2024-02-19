const { data } = require("jquery");
const { JSDOM } = require("jsdom");
const { indexOf, sortedIndex } = require("underscore");
const _ = require("underscore");
const Card = require("./card");

function isSetOf3(cardSet) {
    return ((cardSet[0].rank === cardSet[1].rank && cardSet[2].rank === cardSet[0].rank) && (cardSet[0].type !== cardSet[1].type && cardSet[1].type !== cardSet[2].type && cardSet[2].type !== cardSet[0].type));
};

function isPureSeq(cardSet) {
    let sorted = _.sortBy(cardSet, 'priority');
    let sortedRank = _.sortBy(cardSet, 'rank');
	
    return ((sorted[0].priority + 1 == sorted[1].priority && sorted[1].priority + 1 == sorted[2].priority) || (sortedRank[0].rank + 1 == sortedRank[1].rank && sortedRank[1].rank + 1 == sortedRank[2].rank)) && (sorted[0].type == sorted[1].type && sorted[1].type == sorted[2].type);
};

function isPureSeq4(cardSet) {


    let sorted = _.sortBy(cardSet, 'priority');
    let sortedRank = _.sortBy(cardSet, 'rank');
	console.log("seq 4 : : : " ,sorted[0].type , " ", sorted[1].type , " ", sorted[2].type, "  ",sorted[3].type );
	if (sorted[0].type == sorted[1].type && sorted[1].type == sorted[2].type && sorted[2].type == sorted[3].type) {
		if (((sorted[0].priority + 1 == sorted[1].priority && sorted[1].priority + 1 == sorted[2].priority && sorted[2].priority + 1 === sorted[3].priority) || (sortedRank[0].rank + 1 == sortedRank[1].rank && sortedRank[1].rank + 1 == sortedRank[2].rank && sortedRank[2].rank + 1 == sortedRank[3].rank))) {
			return true;
		} else {
			return false;
		}
	}

};

function isSetOf4(cardSet) {
    let sorted = _.sortBy(cardSet, 'priority');
    let sortedRank = _.sortBy(cardSet, 'rank');
	
    return (((sorted[0].priority === sorted[1].priority && sorted[1].priority === sorted[2].priority && sorted[2].priority === sorted[3].priority) || (sortedRank[0].rank === sortedRank[1].rank && sortedRank[1].rank === sortedRank[2].rank && sortedRank[2].rank === sortedRank[3].rank)) && ((sorted[0].type !== (sorted[1].type && sorted[2].type && sorted[3].type)) && (sorted[1].type !== (sorted[2].type && sorted[3].type)) && (sorted[2].type !== sorted[3].type)));
};

function isPureSeqMoreThan4(cardSet) {
	let sorted;
	let sortByPriority = _.sortBy(cardSet, 'priority');
    let sortByRank = _.sortBy(cardSet, 'rank');

	let count = 0;
	if (sortByPriority[0].rank == 2) {
		sorted = sortByRank;
		for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {
			if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank == 1)) {
				count++;		
				if (count == sorted.length-1) {
					return true;
				} 
			} else {
				return false;
			}
		}
	} else {
		sorted = sortByPriority;
		for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {
			if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority == 1)) {
				count++;		
				if (count == sorted.length-1) {
					return true;
				} 
			} else {
				return false;
			}
		}
	}

	
};

function sortCards(player) {
	if (!player.totalPoints) {
		player.totalPoints = null;
	} else {
		player.totalPoints = null;
	}

	if (!player.groupCard) {
		player.groupCard = [];
		player.groupCard[0] = {};
		player.groupCard[1] = {};
		player.groupCard[2] = {};
		player.groupCard[3] = {};
		player.groupCard[4] = {};
		player.groupCard[5] = {};

		player.groupCard[0].cards = [];
		player.groupCard[1].cards = [];
		player.groupCard[2].cards = [];
		player.groupCard[3].cards = [];
		player.groupCard[4].cards = [];
		player.groupCard[5].cards = [];

		if (player.cards.length > 6) {
			player.cards.map(element => {
				if (element.type == "diamond") {
					player.groupCard[0].cards.push(element);
				} else if (element.type == "heart") {
					player.groupCard[1].cards.push(element);
				} else if (element.type == "spade") {
					player.groupCard[2].cards.push(element);
				} else if (element.type == "club") {
					player.groupCard[3].cards.push(element);
				} else if (element.type == "joker") {
					player.groupCard[4].cards.push(element);
				}
			});    
		} else if (player.cards.length <= 6) {
			for (let i = 0; i < player.cards.length; i++) {
				player.cards[i].cards.map(element => {
					if (element.type == "diamond") {
						player.groupCard[0].cards.push(element);
					} else if (element.type == "heart") {
						player.groupCard[1].cards.push(element);
					} else if (element.type == "spade") {
						player.groupCard[2].cards.push(element);
					} else if (element.type == "club") {
						player.groupCard[3].cards.push(element);
					} else if (element.type == "joker") {
						player.groupCard[4].cards.push(element);
					}
				});
			}
		}

		player.groupCard[0].cards.sort(function(a, b){return a.rank - b.rank});
		player.groupCard[1].cards.sort(function(a, b){return a.rank - b.rank});
		player.groupCard[2].cards.sort(function(a, b){return a.rank - b.rank});
		player.groupCard[3].cards.sort(function(a, b){return a.rank - b.rank});
		player.groupCard[4].cards.sort(function(a, b){return a.rank - b.rank});
		player.groupCard[5].cards.sort(function(a, b){return a.rank - b.rank});

		if (!player.cardsetPoints) {
			player.cardsetPoints = [];
		}	

		for(let i = 0; i < player.groupCard.length; i++) {
			if (player.groupCard[i].cards.length == 0) {  
				player.cardsetPoints.splice(i, 1, 0);   
			} else if (player.groupCard[i].cards.length < 3) {
				let point = 0;
				player.groupCard[i].cards.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {					
						point += card.rank;	
					} else if (card.rank == 15) {
						point += 0	
					} else {
						point += 10;				
					}
				});
				player.cardsetPoints.splice(i, 1, point); 
				player.totalPoints += point;
				player.groupCard[i].msg = "Invalid";
			} else if (player.groupCard[i].cards.length == 3) {
				if (isSetOf3(player.groupCard[i].cards)) {
					player.cardsetPoints.splice(i, 1, 0); 
					player.groupCard[i].msg = "Set";

				} else if (isPureSeq(player.groupCard[i].cards)) {
					player.cardsetPoints.splice(i, 1, 0); 
					player.groupCard[i].msg = "Pure Sequence";

				} else {
					let point = 0;
					player.groupCard[i].cards.forEach(card => {
						if (card.rank > 1 && card.rank < 11) {					
							point += card.rank;				
						} else {
							point += 10;				
						}
					});
					player.cardsetPoints.splice(i, 1, point); 
					player.totalPoints += point;
					player.groupCard[i].msg = "Invalid";

				}
			} else if (player.groupCard[i].cards.length == 4) {   
				
			

				if (isPureSeq4(player.groupCard[i].cards)) {
					player.cardsetPoints.splice(i, 1, 0); 
					player.groupCard[i].msg = "Pure Sequence";

					
				} else if (isSetOf4(player.groupCard[i].cards)) {
					player.cardsetPoints.splice(i, 1, 0); 
					player.groupCard[i].msg = "Pure Set";

				} else {
					let point = 0;
					player.groupCard[i].cards.forEach(card => {
						if (card.rank > 1 && card.rank < 11) {					
							point += card.rank;				
						} else {
							point += 10;				
						}
					});
					player.cardsetPoints.splice(i, 1, point); 
					player.totalPoints += point;
					player.groupCard[i].msg = "Invalid";
				}
			} else {
				let point = 0;
				player.groupCard[i].cards.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {					
						point += card.rank;				
					} else {
						point += 10;				
					}
				});
				player.cardsetPoints.splice(i, 1, point); 
				player.totalPoints += point;
				player.groupCard[i].msg = "Invalid";
			}
		
		}
	

		
	} 

    return player;
};

function groupPointCounter(cards, joker) {

	//let cards = tocards;
	//var cards = JSON.parse(JSON.stringify(tocards));
	
	
	
	



	let cardsetPoints = [];
	let totalPoints = null;
	let convertedCards;
	let jokers;

	if (joker !== undefined) {

		

		convertedCards = convertSetsAsPerJoker(cards, joker);
		// cards[0].cards = convertedCards[0].newSet;
		// cards[1].cards = convertedCards[1].newSet;
		// cards[2].cards = convertedCards[2].newSet;
		// cards[3].cards = convertedCards[3].newSet;
		// cards[4].cards = convertedCards[4].newSet;
		// cards[5].cards = convertedCards[5].newSet;
		jokers = joker;


	}	

	if (cards.length > 6) {
		let groupCard = [];
		groupCard[0] = {};
		groupCard[1] = {};
		groupCard[2] = {};
		groupCard[3] = {};
		groupCard[4] = {};
		groupCard[5] = {};

		groupCard[0].cards = [];
		groupCard[1].cards = [];
		groupCard[2].cards = [];
		groupCard[3].cards = [];
		groupCard[4].cards = [];
		groupCard[5].cards = [];

		cards.forEach(card => {
			groupCard[0].cards.push(card);
		})

		for(let i = 0; i < groupCard.length; i++) {
			if (groupCard[i].cards !== undefined) {
				let point = 0;
				groupCard[i].cards.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {
						point += card.rank;
					} else {
						point += 10;
					}
				});
				cardsetPoints.push(point);
				totalPoints += point;
			} else {
				cardsetPoints.push(0);
			}
		}
		cards = groupCard;

	} else {
		for(let i = 0; i < cards.length; i++) {
			// console.info("info : : : : :cardsss : " , "  ii ::  ", i , " cardss : : ", cards[i].cards);
			// console.error("errorrrr");

			if(cards[i].cards!= undefined)
			{

			
			let sorted = _.sortBy(cards[i].cards, "priority");
			if (sorted.length == 0) {  
				cardsetPoints.push(0);  
				delete cards[i].msg; 
			} else if (sorted.length < 3) {
			
				let point = 0;
				sorted.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += card.rank;
						}
					} else {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += 10;
						}
					}
				});
				cardsetPoints.push(point);
				totalPoints += point;
				cards[i].msg = "Invalid";
	
			} else if (sorted.length == 3) {
				

				if (cards[i].msg == "Pure Sequence") {
				//	cardsetPoints.push(0);
				
				} else if (cards[i].msg == "Impure Sequence") {
				//	cardsetPoints.push(0);
				

				} else if (cards[i].msg == "Pure Set") {
				//	cardsetPoints.push(0);

				} else if (cards[i].msg == "Impure Set") {
				
				//	cardsetPoints.push(0);

				} else if (isPureSeq(sorted)) {
				//	cardsetPoints.push(0);
					cards[i].msg = "Pure Sequence";

				} else if (isSetOf3(sorted)) {
				//	cardsetPoints.push(0);
					cards[i].msg = "Pure Set";
		
				} else {
				
					// sorted.forEach(card => {
					// 	if (card.rank > 1 && card.rank < 11) {
					// 		if (card.rank == jokers[0].rank || card.type == "joker") {
					// 			point += 0;
					// 		} else {
					// 			point += card.rank;
					// 		}
					// 	} else {
					// 		if (card.rank == jokers[0].rank || card.type == "joker") {
					// 			point += 0;
					// 		} else {
					// 			point += 10;
					// 		}
					// 	}
					// });
					// cardsetPoints.push(point);
					// totalPoints += point;
					cards[i].msg = "Invalid";
	
				}

				let point = 0;
				sorted.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += card.rank;
						}
					} else {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += 10;
						}
					}
				});
				cardsetPoints.push(point);
				totalPoints += point;
	
			} else if (sorted.length == 4) {          
				
				if (cards[i].msg == "Pure Sequence") {
				//	cardsetPoints.push(0);
				
				} else if (cards[i].msg == "Impure Sequence") {
				//	cardsetPoints.push(0);
				
				} else if (cards[i].msg == "Pure Set") {
				//	cardsetPoints.push(0);

				} else if (cards[i].msg == "Impure Set") {	
				
					//cardsetPoints.push(0);

				} else if (isPureSeq4(sorted)) {
				
					//cardsetPoints.push(0);
					cards[i].msg = "Pure Sequence";
					
				} else if (isSetOf4(sorted)) {
					//cardsetPoints.push(0);
					cards[i].msg = "Pure Set";

				} else {
					
					// sorted.forEach(card => {
					// 	if (card.rank > 1 && card.rank < 11) {
					// 		if (card.rank == jokers[0].rank || card.type == "joker") {
					// 			point += 0;
					// 		} else {
					// 			point += card.rank;
					// 		}
					// 	} else {
					// 		if (card.rank == jokers[0].rank || card.type == "joker") {
					// 			point += 0;
					// 		} else {
					// 			point += 10;
					// 		}
					// 	}
					// });
					// cardsetPoints.push(point);
					// totalPoints += point;
					cards[i].msg = "Invalid";
				}


				let point = 0;
				sorted.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += card.rank;
						}
					} else {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += 10;
						}
					}
				});
				cardsetPoints.push(point);
				totalPoints += point;


			} else if (sorted.length > 4) {    
				
				let point = 0;

				if (cards[i].msg == "Pure Sequence") {
					//cardsetPoints.push(0);
					cards[i].msg = "Pure Sequence";
				
				} else if (cards[i].msg == "Impure Sequence") {
					//cardsetPoints.push(0);
					cards[i].msg = "Impure Sequence";
			

				} else if (isPureSeqMoreThan4(sorted)) {
				//	cardsetPoints.push(0);
					cards[i].msg = "Pure Sequence";

				} else {
					// sorted.forEach(card => {
					// 	if (card.rank > 1 && card.rank < 11) {
					// 		if (card.rank == jokers[0].rank || card.type == "joker") {
					// 			point += 0;
					// 		} else {
					// 			point += card.rank;
					// 		}
					// 	} else {
					// 		if (card.rank == jokers[0].rank || card.type == "joker") {
					// 			point += 0;
					// 		} else {
					// 			point += 10;
					// 		}
					// 	}
					// });
					// cardsetPoints.push(point);
					// totalPoints += point;
					cards[i].msg = "Invalid";
					
				}

				sorted.forEach(card => {
					if (card.rank > 1 && card.rank < 11) {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += card.rank;
						}
					} else {
						if (card.rank == jokers[0].rank || card.type == "joker") {
							point += 0;
						} else {
							point += 10;
						}
					}
				});
				cardsetPoints.push(point);
				totalPoints += point;
			}
		}
		}
	}






	var ispureseq =0,isseq = 0 ; 
	for(let i = 0; i < cards.length; i++) {
		if (cards[i].msg == "Pure Sequence") {
			ispureseq++;
			isseq++;
		} else if (cards[i].msg == "Impure Sequence") {
			isseq++;
		} 

	}

	totalPoints = 0;

	if(ispureseq > 0 && isseq > 1 )
	{
		for(let i = 0; i < cards.length; i++) {
			if (cards[i].msg == "Pure Sequence") {
				cardsetPoints[i] = 0;
			} else if (cards[i].msg == "Impure Sequence") {
				cardsetPoints[i] = 0;
			} else if (cards[i].msg == "Pure Set") {
				cardsetPoints[i] = 0;
			} else if (cards[i].msg == "Impure Set") {	
				cardsetPoints[i] = 0;	
			} else {

			}
	

			totalPoints += cardsetPoints[i];
		}
	
	}else{
		for(let i = 0; i < cards.length; i++) {
			if (cards[i].msg == "Pure Sequence") {
				cardsetPoints[i] = 0;
			} 

			totalPoints += cardsetPoints[i];
	
		}
	}





	if (totalPoints > 80) {
		totalPoints = 80
	} else if (totalPoints == null) {
		totalPoints = 0;
	}
	
	let groupPointObj = {
		cards : cards,
		cardsetPoints, 
		totalPoints
	}


	return groupPointObj;
};


function groupPointCounteroldd(cards, joker)
{

	for(let i = 0; i < cards.length; i++) {
	}



	let groupPointObj = {
		cards : cards,
		cardsetPoints, 
		totalPoints
	}

	
	return groupPointObj;
};





function addCardToHand(data) {
	let cardss = data.cards;
	// for (let i = 0; i < data.cards.length; i++) {
	// 	console.log("before add card json : ", i , "   ", 	data.cards[i].cards);
	// }
	let removedCard = data.removedOpenCard;
	let obj = {};
	//console.log("before removedCard ",  	removedCard);
	if (cardss.length > 6) {
		if (!obj.cardJson) {
			obj.cardJson = [];
		}
		obj.cardJson[0] = {};
		obj.cardJson[1] = {};
		obj.cardJson[2] = {};
		obj.cardJson[3] = {};
		obj.cardJson[4] = {};
		obj.cardJson[5] = {};

		for (let i = 0; i <= 5; i++) {
			obj.cardJson[i].cards = [];
		}
		obj.cardJson[0].cards = cardss;

		for (let i = 0; i < obj.cardJson.length; i++) {
			if (obj.cardJson[i].cards.length == 0) {
				obj.cardJson[i].cards.push(removedCard);
				break;
			}
		}

	} else {
		for (let i = 0; i < cardss.length; i++) {
			if (cardss[i].cards.length == 0) {
				cardss[i].cards.push(removedCard);
				obj.cardJson = cardss;
				break;
			} else if (i == (cardss.length - 1)) {
				cardss[i].cards.push(removedCard);
				obj.cardJson = cardss;
				break;
			}
		}
	}

	// for (let i = 0; i < obj.cardJson.length; i++) {
	// 	console.log("add card json : ", i , "   ", 	 obj.cardJson[i].cards);
	// }

	return obj.cardJson;
};

let staticCards = [ 
	{
		"cards" : [ 
			{
				"type" : "diamond",
				"rank" : 5,
				"name" : "5",
				"priority" : 5,
				"id" : 0.635065583587227
			}, 
			{
				"type" : "diamond",
				"rank" : 9,
				"name" : "9",
				"priority" : 9,
				"id" : 0.669520757436631
			}
		],
		"msg" : "Invalid"
	}, 
	{
		"cards" : [ 
			{
				"type" : "heart",
				"rank" : 2,
				"name" : "2",
				"priority" : 2,
				"id" : 0.553140748521908
			}, 
			{
				"type" : "heart",
				"rank" : 4,
				"name" : "4",
				"priority" : 4,
				"id" : 0.358312931233186
			}, 
			{
				"type" : "heart",
				"rank" : 7,
				"name" : "7",
				"priority" : 7,
				"id" : 0.773402602016742
			}, 
			{
				"type" : "heart",
				"rank" : 9,
				"name" : "9",
				"priority" : 9,
				"id" : 0.862184218108856
			}, 
			{
				"type" : "heart",
				"rank" : 11,
				"name" : "J",
				"priority" : 11,
				"id" : 0.765862998721642
			}, 
			{
				"type" : "heart",
				"rank" : 12,
				"name" : "Q",
				"priority" : 12,
				"id" : 0.341003722317985
			}
		],
		"msg" : "Invalid"
	}, 
	{
		"cards" : [ 
			{
				"type" : "spade",
				"rank" : 12,
				"name" : "Q",
				"priority" : 12,
				"id" : 0.113868907458057
			}
		],
		"msg" : "Invalid"
	}, 
	{
		"cards" : [ 
			{
				"type" : "club",
				"rank" : 4,
				"name" : "4",
				"priority" : 4,
				"id" : 0.256806931746281
			}, 
			{
				"type" : "club",
				"rank" : 5,
				"name" : "5",
				"priority" : 5,
				"id" : 0.615244784213185
			}, 
			{
				"type" : "club",
				"rank" : 7,
				"name" : "7",
				"priority" : 7,
				"id" : 0.975497424490673
			}
		],
		"msg" : "Invalid"
	}, 
	{
		"cards" : [ 
			{
				"type" : "club",
				"rank" : 6,
				"name" : "6",
				"priority" : 6,
				"id" : 0.123521438714268
			}
		],
		"msg" : "Invalid"
	}, 
	{
		"cards" : []
	}
];

let staticJokers = [{
	"type":"club",
    "rank":10,
    "name":"10",
    "priority":10,
}];

function convertSetsAsPerJoker(sets, jokers) {

	

    for (let count = 0, len = sets.length; count < len; count++) {
        let newCards = [];
        let remainCards = [];
        let noOfJoker = 0;
		let matchedJoker;
		let jokerForMatch;
		let jokersInGroup = [];
		let globalJoker = { 
			type : "joker", 
			rank : 15,
			name : "joker", 
			priority : 15
		};
		//****** START ****** THIS IS FOR TESTING IF GROUP IS PURE SEQUENCE OR NOT
		let gapOf0Card = 0;
		if (sets[count].cards.length > 2) {
			let sorted;
			let sortedPriority = _.sortBy(sets[count].cards, "priority");
			let sortedRank = _.sortBy(sets[count].cards, "rank");	
			if (sortedPriority[0].rank == 2) {
				sorted = sortedRank;
			} else {
				sorted = sortedPriority;
			}

			if(sorted == sortedPriority)
			{
				for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {
			
					if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority == 1)) {
						gapOf0Card += 1;
					} else {
						break;
					}
				}
			}else{
				for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {
			
					if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank == 1)) {
						gapOf0Card += 1;
					} else {
						break;
					}
				}
			}
			
				
		}
		if (gapOf0Card == sets[count].cards.length - 1) {
			newCards = sets[count].cards;
			sets[count].newSet = newCards;
			sets[count].msg = "Pure Sequence";
			continue;
		}


		if (sets[count].cards.length > 2) {
			let sorted;
			let sortedPriority = _.sortBy(sets[count].cards, "priority");
			let sortedRank = _.sortBy(sets[count].cards, "rank");	
			if (sortedPriority[0].rank == 2) {
				sorted = sortedRank;
			} else {
				sorted = sortedPriority;
			}
	
			if (sorted.length == 3) {
				if (sorted[0].rank == sorted[1].rank && sorted[1].rank == sorted[2].rank && (sorted[0].type !== sorted[1].type && sorted[0].type !== sorted[2].type && sorted[1].type == sorted[2].type)) {
					newCards = sets[count].cards;
					sets[count].newSet = newCards;
					sets[count].msg = "Pure Set";
					continue;
				}
			} else if (sorted.length == 4) {
				if (((sorted[0].priority === sorted[1].priority && sorted[1].priority === sorted[2].priority && sorted[2].priority === sorted[3].priority) || (sortedRank[0].rank === sortedRank[1].rank && sortedRank[1].rank === sortedRank[2].rank && sortedRank[2].rank === sortedRank[3].rank)) && ((sorted[0].type !== (sorted[1].type && sorted[2].type && sorted[3].type)) && (sorted[1].type !== (sorted[2].type && sorted[3].type)) && (sorted[2].type !== sorted[3].type))) {
					newCards = sets[count].cards;
					sets[count].newSet = newCards;
					sets[count].msg = "Pure Set";
				
					continue;
				}
			}
				
		}
		//*****END OF checking for Pure Set*******/



		
        for (let i = 0; i < sets[count].cards.length; i++) {
            matchedJoker = jokers.filter(j => j.rank == sets[count].cards[i].rank || sets[count].cards[i].type == "joker" );
			jokerForMatch = jokers.filter(j => { 
				if (j.rank == sets[count].cards[i].rank || sets[count].cards[i].type == "joker") {
					jokersInGroup.push(sets[count].cards[i]);
				} 
			});

            if (matchedJoker.length > 0) {
                noOfJoker++;
				newCards[i] = undefined;
            } else {
                newCards[i] = sets[count].cards[i];
                remainCards.push(sets[count].cards[i]);
            }
			
        }


		
		
		if (sets[count].cards.length < 3) {
			if (noOfJoker == 1) {
				let joker1;
				joker1 = JSON.parse(JSON.stringify(new Card(jokersInGroup[0].type, jokersInGroup[0].rank)));
				for (let i = 0; i < newCards.length; i++) {
					if (newCards[i] == undefined) {
						newCards[i] = joker1;
					}
				}
			}	
			
		} else if (sets[count].cards.length == 3) {
			if (noOfJoker == 0) {
				delete sets[count].msg;	
			} else if (noOfJoker == 1) {
				let joker1;
				let sorted;
				let sortedPriority = _.sortBy(remainCards, "priority");
				let sortedRank = _.sortBy(remainCards, "rank");
				let msg;

				if (sortedPriority[0].rank == 2) {
					sorted = sortedRank;
				} else {
					sorted = sortedPriority;
				}
	
				if (remainCards[0].rank === remainCards[1].rank) {
					// one joker with same card
					if (remainCards[0].type !== 'spade' && remainCards[1].type !== 'spade') {
						joker1 = JSON.parse(JSON.stringify(new Card('spade', remainCards[0].rank)));
					} else if (remainCards[0].type !== 'heart' && remainCards[1].type !== 'heart') {
						joker1 = JSON.parse(JSON.stringify(new Card('heart', remainCards[0].rank)));
					} else if (remainCards[0].type !== 'club' && remainCards[1].type !== 'club') {
						joker1 = JSON.parse(JSON.stringify(new Card('club', remainCards[0].rank)));
					} else {
						joker1 = JSON.parse(JSON.stringify(new Card('diamond', remainCards[0].rank)));
					}
					msg = "Impure Set"
				} else if ((sorted[0].priority + 1 === sorted[1].priority || sorted[0].priority + 2 === sorted[1].priority
					|| sortedRank[0].rank + 1 === sortedRank[1].rank || sortedRank[0].rank + 2 === sortedRank[1].rank  )  && sorted[0].type  === sorted[1].type  ) {

				
					if (sorted[0].priority === 13 && sorted[1].priority === 14) {
						joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, 12)));
					} else if (sorted[0].priority === 12 && sorted[1].priority === 14) {
						joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, 13)));
					} else if (sortedRank[0].rank === 1 && sortedRank[1].rank === 2) {
						joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, 3)));
					} else if (sortedRank[0].rank === 1 && sortedRank[1].rank === 3) {
						joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, 2)));
					} else if ((sorted[0].rank === 12 && sorted[1].rank === 13) || (sorted[0].rank === 2 && sorted[1].rank === 3)) {
						joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, 1)));
					} else {
						if ((sorted[1].priority - sorted[0].priority) === 1) {
							joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, (sorted[1].rank + 1))));
						} else {
							joker1 = JSON.parse(JSON.stringify(new Card(remainCards[1].type, (sorted[0].rank + 1))));
						}
					}
				
					msg = "Impure Sequence"
					
				} else {
					joker1 = jokers[0];
					msg = "Invalid"
				}	

				if (newCards[0] == undefined) {
					newCards[0] = joker1;
				} else if (newCards[1] == undefined) {
					newCards[1] = joker1;
				} else {
					newCards[2] = joker1;
				}
				
				sets[count].msg = msg;

			} else if (noOfJoker == 2) {
				let joker1, joker2;
				let msg;


				if (remainCards[0].type !== 'club') {
					joker1 = JSON.parse(JSON.stringify(new Card('spade', remainCards[0].rank)));
					joker2 = JSON.parse(JSON.stringify(new Card('heart', remainCards[0].rank)));
				} else if (remainCards[0].type !== 'heart') {
					joker1 = JSON.parse(JSON.stringify(new Card('spade', remainCards[0].rank)));
					joker2 = JSON.parse(JSON.stringify(new Card('diamond', remainCards[0].rank)));
					
				} else if (remainCards[0].type !== 'club' ) {
					joker1 = JSON.parse(JSON.stringify(new Card('spade', remainCards[0].rank)));
					joker2 = JSON.parse(JSON.stringify(new Card('diamond', remainCards[0].rank)));
				} else {
					joker1 = JSON.parse(JSON.stringify(new Card('spade', remainCards[0].rank)));
					joker2 = JSON.parse(JSON.stringify(new Card('heart', remainCards[0].rank)));
				}


				// joker1 = matchedJoker[0];
				// joker2 = matchedJoker[1];
				
				msg = "Impure Set";
				
				for (let i = 0; i < newCards.length; i++) {

					if (newCards[i] == undefined) {
						newCards[i] = joker1;
						break;
					}
				}
				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = joker2;
						break;
					}
				}
				

				sets[count].msg = msg;
			} else if (noOfJoker == 3) {

				let joker1, joker2, joker3;
				let msg;

				if (jokersInGroup[0].type !== jokersInGroup[1].type && jokersInGroup[1].type !== jokersInGroup[2].type && jokersInGroup[2].type !== jokersInGroup[0].type) {
					joker1 = jokersInGroup[0];
					joker2 = jokersInGroup[1];
					joker3 = jokersInGroup[2];
					msg = "Pure Set";

					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker1;
							break;
						}
					}
					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker2;
							break;
						}
					}
					for (let i = newCards.length - 1; i >= 0; i--) {
						if (newCards[i] == undefined) {
							newCards[i] = joker3;
							break;
						}
					}

					sets[count].msg = msg;
				} else {
					if (jokersInGroup[0].type !== "joker") {
						joker1 = jokersInGroup[0];
					} else {
						joker1 = globalJoker;
					}

					if (jokersInGroup[1].type !== "joker") {
						joker2 = jokersInGroup[1];
					} else {
						joker2 = globalJoker;
					}

					if (jokersInGroup[2].type !== "joker") {
						joker3 = jokersInGroup[2];
					} else {
						joker3 = globalJoker;
					}

					msg = "Invalid";

					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker1;
							break;
						}
					}
					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker2;
							break;
						}
					}
					for (let i = newCards.length - 1; i >= 0; i--) {
						if (newCards[i] == undefined) {
							newCards[i] = joker3;
							break;
						}
					}

					sets[count].msg = msg;

				}
				
			}

		} else if (sets[count].cards.length == 4) {

			if (noOfJoker == 0) {
				delete sets[count].msg;	
			} else if (noOfJoker == 1) {
				let joker1;
				let msg;
				let sorted;
				let sortedPriority = _.sortBy(remainCards, "priority");
				let sortedRank = _.sortBy(remainCards, "rank");

				if (sortedPriority[0].rank == 2) {
					sorted = sortedRank;
				} else {
					sorted = sortedPriority;
				}
				if((sortedRank[0].rank == 1 && sortedRank[1].rank == 2) || (sortedRank[0].rank == 1 && sortedRank[1].rank == 3) )
				{
					sorted = sortedRank;
				}
				
				
				

				
				if (sorted[0].rank == sorted[1].rank &&  sorted[1].rank == sorted[2].rank) {
					// one joker with same card
					if (sorted[0].type !== 'spade' && sorted[1].type !== 'spade' && sorted[2].type !== 'spade') {
						joker1 = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
					} else if (sorted[0].type !== 'heart' && sorted[1].type !== 'heart' && sorted[2].type !== 'heart') {
						joker1 = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
					} else if (sorted[0].type !== 'club' && sorted[1].type !== 'club' && sorted[2].type !== 'club') {
						joker1 = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
					} else {
						joker1 = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
					}
					msg = "Impure Set";

				} else if (sorted[0].type === sorted[1].type && sorted[1].type === sorted[2].type) {
					// one joker with sequence 

					if (sorted == sortedRank) {
					
						if (sorted[0].rank + 1 == sorted[1].rank && sorted[1].rank + 1 == sorted[2].rank) {	
							if (sorted[0].rank == 1) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 1)));
							} else if (sorted[2].rank == 1) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank - 1)));
							}
							msg = "Impure Sequence";
							
							
						} else if (sorted[0].rank + 1 == sorted[1].rank && sorted[1].rank + 2 == sorted[2].rank) {
							joker1 = joker1 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
							msg = "Impure Sequence";
						
	
						} else if (sorted[0].rank + 2 == sorted[1].rank && sorted[1].rank + 1 == sorted[2].rank) {
							joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
							msg = "Impure Sequence";
						
						
						} else {
							// one joker with color
							if (sorted[2].rank !== 1) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 1)));
							} else if (sorted[2].rank !== 13) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 13)));
							} else if (sorted[2].rank !== 12) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 12)));	
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 11)));
							}
	
							msg = "Invalid";
						}
					} else {
					
			
						if (sorted[0].priority + 1 == sorted[1].priority && sorted[1].priority + 1 == sorted[2].priority) {	
							if (sorted[2].rank == 1) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank - 1)));
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 1)));
							}
							msg = "Impure Sequence";
							
						} else if (sorted[0].priority + 1 == sorted[1].priority && sorted[1].priority + 2 == sorted[2].priority) {
							joker1 = joker1 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
							msg = "Impure Sequence";
	
						} else if (sorted[0].priority + 2 == sorted[1].priority && sorted[1].priority + 1 == sorted[2].priority) {
							joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
							msg = "Impure Sequence";
	
						} else {
							// one joker with color
							if (sorted[2].rank !== 1) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 1)));
							} else if (sorted[2].rank !== 13) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 13)));
							} else if (sorted[2].rank !== 12) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 12)));	
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, 11)));
							}
	
							msg = "Invalid";
						}
					}
					
					
				} else {
					if (sorted[1].type !== sorted[2].type) {
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[2].rank)));
					} else {
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[2].rank)));
					}
					msg = "Invalid"
				}

				sets[count].msg = msg;

				if (newCards[0] == undefined) {
					newCards[0] = joker1;
				} else if (newCards[1] == undefined) {
					newCards[1] = joker1;
				} else if (newCards[2] == undefined) {
					newCards[2] = joker1;	
				} else {
					newCards[3] = joker1;
				}
				
				// if((sortedPriority[0].rank == 1 && sortedPriority[0].rank == 2) || (sortedPriority[0].rank == 1 && sortedPriority[0].rank == 3) )
				// sortedPriority[0].priority = 14;

			} else if(noOfJoker == 2)
			{
				 

				let sortedPriority = _.sortBy(remainCards, "priority");
				let sortedRank = _.sortBy(remainCards, "rank");

				let joker1card, joker2card;


				if((sortedRank[0].rank == 1 && sortedRank[1].rank == 2) || (sortedRank[0].rank == 1 && sortedRank[1].rank == 3) ||(sortedRank[0].rank == 1 && sortedRank[1].rank == 4) )
				{
					sorted = sortedRank;


					if(sorted[0].type ==sorted[1].type )
					{

					
							if(sorted[0].priority == sorted[1].priority)
							{
								msg = "Impure Set"
							
							
								if (sorted[0].type !== 'spade' && sorted[1].type !== 'spade') {
									joker1card = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
								} else if (sorted[0].type !== 'heart' && sorted[1].type !== 'heart') {
									joker1card = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
								} else if (sorted[0].type !== 'club' && sorted[1].type !== 'club') {
									joker1card = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
								} else {
									joker1card = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
								}

								if (sorted[0].type !== 'spade' && sorted[1].type !== 'spade' && joker1card.type != 'spade' ) {
									joker2card = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
								} else if (sorted[0].type !== 'heart' && sorted[1].type !== 'heart' && joker1card.type != 'heart') {
									joker2card = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
								} else if (sorted[0].type !== 'club' && sorted[1].type !== 'club' && joker1card.type != 'club') {
									joker2card = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
								} else {
									joker2card = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
								}


							
							}else if((sorted[0].rank +1) == (sorted[1].rank))
							{
								msg = "Impure Sequence";

								joker1card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
								joker2card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));

							}else if(sorted[0].rank +2 == sorted[1].rank)
							{
								msg = "Impure Sequence";

								joker1card = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
								joker2card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));

							}else if(sorted[0].rank +3 == sorted[1].rank){
								msg = "Impure Sequence";
								joker1card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
								joker2card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
							}else{
								msg = "Invalid"	;
							}
						}else
						{
							msg = "Invalid"	;
						}

				}else{
					sorted = sortedRank;

					if(sorted[0].type ==sorted[1].type )
					{
					if(sorted[0].priority == sorted[1].priority)
					{
						msg = "Impure Set"
					
					
						if (sorted[0].type !== 'spade' && sorted[1].type !== 'spade') {
							joker1card = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
						} else if (sorted[0].type !== 'heart' && sorted[1].type !== 'heart') {
							joker1card = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
						} else if (sorted[0].type !== 'club' && sorted[1].type !== 'club') {
							joker1card = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
						} else {
							joker1card = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
						}
	
						if (sorted[0].type !== 'spade' && sorted[1].type !== 'spade' && joker1card.type != 'spade' ) {
							joker2card = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
						} else if (sorted[0].type !== 'heart' && sorted[1].type !== 'heart' && joker1card.type != 'heart') {
							joker2card = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
						} else if (sorted[0].type !== 'club' && sorted[1].type !== 'club' && joker1card.type != 'club') {
							joker2card = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
						} else {
							joker2card = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
						}
	
	
					
					}else if((sorted[0].priority +1) == (sorted[1].priority))
					{
						msg = "Impure Sequence";
	
						joker1card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
						joker2card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
	
					}else if(sorted[0].priority +2 == sorted[1].priority)
					{
						msg = "Impure Sequence";
	
						joker1card = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
	
					}else if(sorted[0].rank +3 == sorted[1].rank){
						msg = "Impure Sequence";
						joker1card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
						joker2card = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
					}else{
						msg = "Invalid"	
					}
				}else{
					msg = "Invalid"	
				}
	
				}


			
				


			

				let isset1 = true;
				if (newCards[0] == undefined) {
					newCards[0] = joker1card;
					isset1 = false;
				} 
				 if (newCards[1] == undefined) {
					if(!isset1)
					{
						newCards[1] = joker2card;
					}else
					{
						newCards[1] = joker1card;
						isset1 = false;
					}
				
				} 
				 if (newCards[2] == undefined) {
					if(!isset1)
					{
						newCards[2] = joker2card;
					}else
					{
						newCards[2] = joker1card;
						isset1 = false;
					}
				} 
				
				if (newCards[3] == undefined) {
					if(!isset1)
					{
						newCards[3] = joker2card;
					}else
					{
						newCards[3] = joker1card;
						isset1 = false;
					}
				}
				sets[count].msg = msg;
			}else if(noOfJoker == 3)
			{
				let sortedRank = _.sortBy(remainCards, "rank");
				let joker1cards, joker2cards, joker3cards;

				sorted = sortedRank;
				if (sorted[0].type == 'spade' ) {
					joker1cards = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
					joker2cards = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
					joker3cards = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
				} else if (sorted[0].type == 'heart') {
					joker1cards = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
					joker2cards = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
					joker3cards = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
				} else if (sorted[0].type == 'club') {
					joker1cards = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
					joker2cards = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
					joker3cards = JSON.parse(JSON.stringify(new Card('diamond', sorted[0].rank)));
				} else {
					joker1cards = JSON.parse(JSON.stringify(new Card('spade', sorted[0].rank)));
					joker2cards = JSON.parse(JSON.stringify(new Card('heart', sorted[0].rank)));
					joker3cards = JSON.parse(JSON.stringify(new Card('club', sorted[0].rank)));
				}

				msg = "Impure Set"

				sets[count].msg = msg;
				let isset1 = true, isset2 = true;
				if (newCards[0] == undefined) {
					newCards[0] = joker1cards;
					isset1 = false;
				} 
				 if (newCards[1] == undefined) {
					if(!isset1)
					{
						newCards[1] = joker2cards;
						isset2 = true;
					}else
					{
						newCards[1] = joker1cards;
						isset1 = false;
					}
				
				} 
				 if (newCards[2] == undefined) {
					 if (!isset2)
					 {
						newCards[2] = joker3cards;
					 }else	if(!isset1)
					{
						newCards[2] = joker2cards;
						isset2 = true;
					}else
					{
						newCards[2] = joker1cards;
						isset1 = false;
					}
				} 
				
				if (newCards[3] == undefined) {
					if (!isset2)
					{
					   newCards[3] = joker3cardss;
					}else if(!isset1)
					{
						newCards[3] = joker2cards;
						isset2 = true;
					}else
					{
						newCards[3] = joker1cards;
						isset1 = false;
					}
				}



			}else if (noOfJoker == 4) {
				let joker1, joker2, joker3, joker4;
				let msg;

				if (jokersInGroup[0].type !== jokersInGroup[1].type && jokersInGroup[1].type !== jokersInGroup[2].type && jokersInGroup[2].type !== jokersInGroup[3].type && jokersInGroup[3].type !== jokersInGroup[0].type) {
					joker1 = jokersInGroup[0];
					joker2 = jokersInGroup[1];
					joker3 = jokersInGroup[2];
					joker4 = jokersInGroup[3];
					msg = "Pure Set";

					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker1;
							break;
						}
					}
					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker2;
							break;
						}
					}
					for (let i = newCards.length - 1; i >= 0; i--) {
						if (newCards[i] == undefined) {
							newCards[i] = joker3;
							break;
						}
					}
					for (let i = newCards.length - 1; i >= 0; i--) {
						if (newCards[i] == undefined) {
							newCards[i] = joker4;
							break;
						}
					}

					sets[count].msg = msg;
				} else {

					if (jokersInGroup[0].type !== "joker") {
						joker1 = jokersInGroup[0];
					} else {
						joker1 = globalJoker;
					}

					if (jokersInGroup[1].type !== "joker") {
						joker2 = jokersInGroup[1];
					} else {
						joker2 = globalJoker;
					}

					if (jokersInGroup[2].type !== "joker") {
						joker2 = jokersInGroup[2];
					} else {
						joker2 = globalJoker;
					}

					if (jokersInGroup[3].type !== "joker") {
						joker3 = jokersInGroup[3];
					} else {
						joker3 = globalJoker;
					}

					msg = "Invalid";

					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker1;
							break;
						}
					}
					for (let i = 0; i < newCards.length; i++) {
						if (newCards[i] == undefined) {
							newCards[i] = joker2;
							break;
						}
					}
					for (let i = newCards.length - 1; i >= 0; i--) {
						if (newCards[i] == undefined) {
							newCards[i] = joker3;
							break;
						}
					}
					for (let i = newCards.length - 1; i >= 0; i--) {
						if (newCards[i] == undefined) {
							newCards[i] = joker4;
							break;
						}
					}

					sets[count].msg = msg;
				}
			}	 	
		} else if(sets[count].cards.length == 5)
		{
			if (noOfJoker == 0) {
				delete sets[count].msg;	
			} else if (noOfJoker == 1) {
				let joker1;
				let sorted;
				let sortByPriority = _.sortBy(remainCards, "priority");
				let sortByRank = _.sortBy(remainCards, "rank");

				// if((sortByPriority[0].rank == 1 && sortByPriority[1].rank == 2) || (sortByPriority[0].rank == 1 && sortByPriority[1].rank == 3) ||(sortByPriority[0].rank == 1 && sortByPriority[1].rank == 4) )
				// {
				// 	sorted = sortedRank;

				let msg;
				let point1;
				let point2;
				let pure = true;
				let gapOf2Cards = 0;
				let gapMoreThan2Cards = 0;
				let sameCardsDetected = false;

				console.log("rankkk : ",sortByRank[0].rank , "   ", sortByPriority[1].rank);
				if ((sortByRank[0].rank == 1 && sortByRank[1].rank == 2) || (sortByRank[0].rank == 1 && sortByRank[1].rank == 3)) {
					sorted = sortByRank;

					for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {
						if (sorted[j].rank == sorted[i].rank) {
							sameCardsDetected = true;
							break; 
						}
						if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank == 1)) {
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank == 2)) {
							gapOf2Cards += 1;
							point1 = i;
							point2 = j;
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank > 2)) {	
							gapMoreThan2Cards += 1;
	
						} else {
							pure = false;
	
						}
					}
	
					console.log("no of gappp : ",gapOf2Cards , "  ",gapMoreThan2Cards , "  " , pure);
					if (sameCardsDetected) {
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokersInGroup[0].type, jokersInGroup[0].rank)));
					}else if (gapOf2Cards == 1 && gapMoreThan2Cards == 0) {
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[point2].type, sorted[point2].rank - 1)));
					} else if (gapOf2Cards > 1 || gapMoreThan2Cards > 0) {
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokers[0].type, jokers[0].rank)));
					} else if (gapOf2Cards == 0 && gapMoreThan2Cards == 0 && pure == true) {
						msg = "Impure Sequence";
							if (sorted.slice(-1).priority == 14) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank - 1)))
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[sorted.length - 1].rank + 1)));
							}
					} else {
						joker1 = JSON.parse(JSON.stringify(new Card(jokersInGroup[0].type, jokersInGroup[0].rank)));
						msg = "Invalid";
						
					}
				} else {
					sorted = sortByPriority;
					

					for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {

						if (sorted[j].type != sorted[i].type) {
							sameCardsDetected = true;
							break; 
						}

						if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority == 1)) {
						
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority == 2)) {
						
							gapOf2Cards += 1;
							point1 = i;
							point2 = j;
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority > 2)) {	
						
							gapMoreThan2Cards += 1;
	
						} else {
						
							pure = false;
	
						}
					}

					console.log("no of gappp 2 : ",gapOf2Cards , "  ",gapMoreThan2Cards , "  " , pure);
					if (sameCardsDetected) {
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokersInGroup[0].type, jokersInGroup[0].rank)));
					} else if (gapOf2Cards == 1 && gapMoreThan2Cards == 0) {
					
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[point2].type, sorted[point2].rank - 1)));
					
					} else if (gapOf2Cards > 1 || gapMoreThan2Cards > 0) {
					
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokers[0].type, jokers[0].rank)));
					
					} else if (gapOf2Cards == 0 && gapMoreThan2Cards == 0 && pure == true) {
				
						msg = "Impure Sequence";
							if (sorted.slice(-1).priority == 14) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank - 1)))
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[sorted.length - 1].rank + 1)));
							}
					
					} else {

						if (jokersInGroup[0].type !== "joker") {
							joker1 = jokersInGroup[0];
						} else {
							joker1 = globalJoker;
						}

						
						msg = "Invalid";
	
						
					}
				}

				for (let i = 0; i < newCards.length; i++) {
					if (newCards[i] == undefined) {
						newCards[i] = joker1;
					}
				}

				sets[count].msg = msg;
				
			
			} else if(noOfJoker == 2)
			{
				let joker1,joker2;
				let sorted;
				let sortedPriority = _.sortBy(remainCards, "priority");
				let sortedRank = _.sortBy(remainCards, "rank");
				let msg;

				

				// if (sortedPriority[0].rank == 2) {
				// 	sorted = sortedRank;
				// } else {
				// 	sorted = sortedPriority;
				// }
			

				if((sortedRank[0].rank == 1 && sortedRank[1].rank == 2) || (sortedRank[0].rank == 1 && sortedRank[1].rank == 3) ||(sortedRank[0].rank == 1 && sortedRank[1].rank == 4) )
				{
					sorted = sortedRank;

					if ((sorted[0].rank + 1 === sorted[1].rank &&  sorted[1].rank === sorted[2].rank - 1 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type) {
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 2)));
	
					}else if ((sorted[0].rank + 2 === sorted[1].rank &&  sorted[1].rank === sorted[2].rank - 1 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
					}else if ((sorted[0].rank + 3 === sorted[1].rank &&  sorted[1].rank === sorted[2].rank - 1 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 2)));
	
					}else 	if ((sorted[0].rank + 2 === sorted[1].rank &&  sorted[1].rank === sorted[2].rank - 2 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) {
						//2_4_6
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
	
					}else 	if ((sorted[0].rank + 1 === sorted[1].rank &&  sorted[1].rank === sorted[2].rank - 2 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) {
						//34_6_
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 1)));
	
					}else 	if ((sorted[0].rank + 1 === sorted[1].rank &&  sorted[1].rank === sorted[2].rank - 3 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) {
						//34_6_
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
	
					}else{
						newCards = sets[count].cards.concat(matchedJoker);
						msg = "Invalid";
						sets[count].msg = msg;
					}

					
				}else{

					sorted = sortedPriority;
					if ((sorted[0].priority + 1 === sorted[1].priority &&  sorted[1].priority === sorted[2].priority - 1 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type) {
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 2)));
	
					}else if ((sorted[0].priority + 2 === sorted[1].priority &&  sorted[1].priority === sorted[2].priority - 1 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
					}else if ((sorted[0].priority + 3 === sorted[1].priority &&  sorted[1].priority === sorted[2].priority - 1 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 2)));
	
					}else 	if ((sorted[0].priority + 2 === sorted[1].priority &&  sorted[1].priority === sorted[2].priority - 2 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) {
						//2_4_6
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
	
					}else 	if ((sorted[0].priority + 1 === sorted[1].priority &&  sorted[1].priority === sorted[2].priority - 2 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) {
						//34_6_
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[2].rank + 1)));
	
					}else 	if ((sorted[0].priority + 1 === sorted[1].priority &&  sorted[1].priority === sorted[2].priority - 3 ) && sorted[0].type  == sorted[1].type && sorted[1].type ==  sorted[2].type ) {
						//34_6_
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[2].type, sorted[1].rank + 1)));
	
					}else{
						newCards = sets[count].cards.concat(matchedJoker);
						msg = "Invalid";
						sets[count].msg = msg;
					}
	
				}
				

				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = joker1;
						break;
					}
				}
				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = joker2;
						break;
					}
				}
			
				sets[count].msg = msg;

			}else if(noOfJoker == 3)
			{
				let joker1,joker2,joker3;
				let sorted;
				let sortedPriority = _.sortBy(remainCards, "priority");
				let sortedRank = _.sortBy(remainCards, "rank");
				let msg;

				if (sortedPriority[0].rank == 2) {
					sorted = sortedRank;
				} else {
					sorted = sortedPriority;
				}

				if((sortedRank[0].rank == 1 && sortedRank[1].rank == 2) || (sortedRank[0].rank == 1 && sortedRank[1].rank == 3) ||(sortedRank[0].rank == 1 && sortedRank[1].rank == 4) || (sortedRank[0].rank == 1 && sortedRank[1].rank == 5) )
				{
					sorted = sortedRank;
					if ((sorted[0].rank + 1 === sorted[1].rank  ) && sorted[0].type  == sorted[1].type) {
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 3)));
	
					}else if (sorted[0].rank + 2 === sorted[1].rank  && sorted[0].type  == sorted[1].type ) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
					}else if ((sorted[0].rank + 3 === sorted[1].rank && sorted[0].type  == sorted[1].type )) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 2)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
	
					}else 	if ((sorted[0].rank + 4 === sorted[1].rank   && sorted[0].type  == sorted[1].type)) {
						//2_4_6
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 2)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[0].rank + 3)));
	
					}else{
						newCards = sets[count].cards.concat(matchedJoker);
						msg = "Invalid";
						sets[count].msg = msg;
					}

					

				}else{
					sorted = sortedPriority;

					if ((sorted[0].priority + 1 === sorted[1].priority  ) && sorted[0].type  == sorted[1].type) {
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 3)));
	
					}else if (sorted[0].priority + 2 === sorted[1].priority  && sorted[0].type  == sorted[1].type ) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 2)));
					}else if ((sorted[0].priority + 3 === sorted[1].priority && sorted[0].type  == sorted[1].type )) 
					{
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 2)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[1].rank + 1)));
	
					}else 	if ((sorted[0].priority + 4 === sorted[1].priority   && sorted[0].type  == sorted[1].type)) {
						//2_4_6
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 1)));
						joker2 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank + 2)));
						joker3 = JSON.parse(JSON.stringify(new Card(sorted[1].type, sorted[0].rank + 3)));
	
					}else{
						newCards = sets[count].cards.concat(matchedJoker);
						msg = "Invalid";
						sets[count].msg = msg;
					}
	
				}


			

				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = joker1;
						break;
					}
				}
				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = joker2;
						break;
					}
				}
				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = joker3;
						break;
					}
				}
				
				sets[count].msg = msg;

			}else if (noOfJoker > 3) {
				let msg;
				newCards = sets[count].cards.concat(matchedJoker);
				msg = "Invalid";
				sets[count].msg = msg;
			}
		}else if(sets[count].cards.length > 5)
		{

				let joker1,joker2;
				let sorted;
				let sortedPriority = _.sortBy(remainCards, "priority");
				let sortedRank = _.sortBy(remainCards, "rank");
				let msg;

				// if (sortedPriority[0].rank == 2) {
				// 	sorted = sortedRank;
				// } else {
					sorted = sortedPriority;
			//	}

				// for(var i =0 ; i< sorted.length;i++ )
				// {
				// 	console.warn("sorted : " ,i, " : : : "  , sorted[i]);
				// }
			//	sorted = sortedRank;
			//	sorted = sortedPriority;
		
			var isTypeSame = true;
				for(var i =0 ; i< sorted.length-1;i++ )
				{
					for(var j =1; j < sorted.length; j++)
					{
						if(sorted[i].type != sorted[j].type)
						{
							isTypeSame = false;
							break;
						}
					}
					if(isTypeSame == false)
					break;
				}


				if(isTypeSame)
				{
					var jokerss = [];
					var isallsqu = true,isonegap=0, istwogap =0,isgapthree =0,isgapfour =0, isgapfive = 0;


					var isfromrank = false;
					sorted = sortedRank;
					for(var i =0 ,j=1 ; i< sorted.length-1 , j<sorted.length;i++,j++ )
					{
						if((sorted[0].rank == 1 && (sorted[1].rank  == 2 || sorted[1].rank  == 3  ) && noOfJoker == 1)  || 
						(sorted[0].rank == 1 && (sorted[1].rank  == 2 || sorted[1].rank  == 3 || sorted[1].rank  == 4 ) && noOfJoker == 2) ||
						(sorted[0].rank == 1 && (sorted[1].rank  == 2 || sorted[1].rank  == 3 || sorted[1].rank  == 4 || sorted[1].rank  == 5 ) && noOfJoker == 3) ||
						(sorted[0].rank == 1 && (sorted[1].rank  == 2 || sorted[1].rank  == 3 || sorted[1].rank  == 4 || sorted[1].rank  == 5  || sorted[1].rank  == 6) && noOfJoker == 4) )
							isfromrank = true;
							
					}

					if(isfromrank)
					{	sorted = sortedRank;
						
						for(var i =0 ,j=1 ; i< sorted.length-1 , j<sorted.length;i++,j++ )
						{
							
								if(sorted[i].rank + 1 == sorted[j].rank)
								{
		
								}else {
									isallsqu = false;
									if(sorted[i].rank + 2 == sorted[j].rank)
									{
										isonegap++;
									
										
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
									}else if(sorted[i].rank + 3 == sorted[j].rank)
									{
										istwogap++;
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 2))));
	
									}else if(sorted[i].rank + 4 == sorted[j].rank)
									{
										isgapthree++;
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 2))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 3))));
	
									}else if(sorted[i].rank + 5 == sorted[j].rank)
									{
										isgapfour++;
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 2))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 3))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 4))));
	
									}else{
										isgapfive++;
									}
	
								}
							
						}
					}else{
						sorted = sortedPriority;
						for(var i =0 ,j=1 ; i< sorted.length-1 , j<sorted.length;i++,j++ )
						{
							
								if(sorted[i].priority + 1 == sorted[j].priority)
								{
		
								}else {
									isallsqu = false;
									if(sorted[i].priority + 2 == sorted[j].priority)
									{
										isonegap++;
									
									
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
									}else if(sorted[i].priority + 3 == sorted[j].priority)
									{
										istwogap++;
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 2))));
	
									}else if(sorted[i].priority + 4 == sorted[j].priority)
									{
										isgapthree++;
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 2))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 3))));
	
									}else if(sorted[i].priority + 5 == sorted[j].priority)
									{
										isgapfour++;
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 1))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 2))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 3))));
										jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[i].type, sorted[i].rank + 4))));
	
									}else{
										isgapfive++;
									}
	
								}
							
						}
					}





					//////
					if(isgapfive !=0)
					{
						newCards = sets[count].cards.concat(matchedJoker);
						msg = "Invalid";
						sets[count].msg = msg;

					}else{

					
					if(noOfJoker > jokerss.length)
					{
						var i =1;
						for(var kkk = jokerss.length; kkk < noOfJoker; kkk++ )
						{

							if(sorted[sorted.length-1].rank == 13)
							{
								jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[sorted.length-1].type, 2))));
							}
								
							else
							{
								jokerss.push(JSON.parse(JSON.stringify(new Card(sorted[sorted.length-1].type, sorted[sorted.length-1].rank + i))));


							}
									

							i++;
						}
						msg = "Impure Sequence";
					}else if(noOfJoker < jokerss.length)
					{
					
						newCards = sets[count].cards.concat(matchedJoker);
						msg = "Invalid";
						sets[count].msg = msg;


					}else{
							msg = "Impure Sequence";
					}

				}
					
					

				}else{
					
					newCards = sets[count].cards.concat(matchedJoker);
					msg = "Invalid";
					sets[count].msg = msg;
				}
				
				var jj = 0;
				for (let i = newCards.length - 1; i >= 0; i--) {
					if (newCards[i] == undefined) {
						newCards[i] = jokerss[jj];
						jj++;
					}
				}
				sets[count].msg = msg;
				
			
		}
		
		
		else if (sets[count].cards.length > 4) {
			if (noOfJoker == 0) {
				delete sets[count].msg;	
			} else if (noOfJoker == 1) {
				let joker1;
				let sorted;
				let sortByPriority = _.sortBy(remainCards, "priority");
				let sortByRank = _.sortBy(remainCards, "rank");
				let msg;
				let point1;
				let point2;
				let pure = true;
				let gapOf2Cards = 0;
				let gapMoreThan2Cards = 0;
				let sameCardsDetected;

				if (sortByPriority[0].rank == 2) {
					sorted = sortByRank;

					for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {;
						if (sorted[j].rank == sorted[i].rank) {
							sameCardsDetected = true;
							break; 
						}
						if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank == 1)) {
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank == 2)) {
							gapOf2Cards += 1;
							point1 = i;
							point2 = j;
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].rank - sorted[i].rank > 2)) {	
							gapMoreThan2Cards += 1;
	
						} else {
							pure = false;
	
						}
					}
	
					if (sameCardsDetected) {
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokersInGroup[0].type, jokersInGroup[0].rank)));
					} else if (gapOf2Cards == 1 && gapMoreThan2Cards == 0) {
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[point2].type, sorted[point2].rank - 1)));
					} else if (gapOf2Cards > 1 || gapMoreThan2Cards > 0) {
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokers[0].type, jokers[0].rank)));
					} else if (gapOf2Cards == 0 && gapMoreThan2Cards == 0 && pure == true) {
						msg = "Impure Sequence";
							if (sorted.slice(-1).priority == 14) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank - 1)))
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[sorted.length - 1].rank + 1)));
							}
					} else {
						joker1 = JSON.parse(JSON.stringify(new Card(jokersInGroup[0].type, jokersInGroup[0].rank)));
						msg = "Invalid";
						
					}
				} else {
					sorted = sortByPriority;
					

					for (let i = 0, j = 1; i < sorted.length - 1, j < sorted.length; i++, j++) {;
						if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority == 1)) {
						
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority == 2)) {
						
							gapOf2Cards += 1;
							point1 = i;
							point2 = j;
	
						} else if ((sorted[j].type == sorted[i].type) && (sorted[j].priority - sorted[i].priority > 2)) {	
						
							gapMoreThan2Cards += 1;
	
						} else {
						
							pure = false;
	
						}
					}
	
					if (gapOf2Cards == 1 && gapMoreThan2Cards == 0) {
					
						msg = "Impure Sequence";
						joker1 = JSON.parse(JSON.stringify(new Card(sorted[point2].type, sorted[point2].rank - 1)));
					
					} else if (gapOf2Cards > 1 || gapMoreThan2Cards > 0) {
					
						msg = "Invalid";
						joker1 = JSON.parse(JSON.stringify(new Card(jokers[0].type, jokers[0].rank)));
					
					} else if (gapOf2Cards == 0 && gapMoreThan2Cards == 0 && pure == true) {
				
						msg = "Impure Sequence";
							if (sorted.slice(-1).priority == 14) {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[0].rank - 1)))
							} else {
								joker1 = JSON.parse(JSON.stringify(new Card(sorted[0].type, sorted[sorted.length - 1].rank + 1)));
							}
					
					} else {

						if (jokersInGroup[0].type !== "joker") {
							joker1 = jokersInGroup[0];
						} else {
							joker1 = globalJoker;
						}

						
						msg = "Invalid";
	
						
					}
				}

				for (let i = 0; i < newCards.length; i++) {
					if (newCards[i] == undefined) {
						newCards[i] = joker1;
					}
				}

				sets[count].msg = msg;
				
			
			} else if (noOfJoker > 1) {
				let msg;
				newCards = sets[count].cards.concat(matchedJoker);
				msg = "Invalid";
				sets[count].msg = msg;
			}
			
		}	
		   
        sets[count].newSet = newCards;
		jokersInGroup = [];
    }
	
    return sets;
};


module.exports = { sortCards, groupPointCounter, addCardToHand };

