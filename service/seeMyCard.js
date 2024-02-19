let Card = require("./card");
const variationCommonService = require("../service/variations/common");
const gametype = require("../constant/gametype");

function convertSetsForAK47AndJoker(table, playerId, cardInfo) {
    let cardSets = [];
    cardSets.push({
        id: playerId,
        set: cardInfo.info[playerId].cards,
    });
    if(table.gameType === gametype.AK47) {
        let jokers = [];
		jokers.push(new Card('spade', "1"));
		jokers.push(new Card('heart', "13"));
		jokers.push(new Card('diamond', "4"));
		jokers.push(new Card('diamond', "7"));
        cardSets = variationCommonService.convertSetsAsPerJoker(cardSets, jokers);
    } 
    if(table.gameType === gametype.Joker) {
        let jokers = [];
        jokers.push(cardInfo.joker);
        cardSets = variationCommonService.convertSetsAsPerJoker(cardSets, jokers);
    }
    if(table.gameType === gametype.ThreeJoker) {
        cardSets = variationCommonService.convertSetsAsPerJoker(cardSets, cardInfo.jokers);
    }
    return cardSets[0].newSet;
}

module.exports = {
    convertSetsForAK47AndJoker    
}