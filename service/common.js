let _ = require("underscore");

let simpleVariation = require('./variations/simple');
let muflisVariation = require('./variations/muflis');
let AK47Variation = require('./variations/AK47');
let jokerVariation = require('./variations/joker');
let aflatoonVariation = require('./variations/aflatoon');
let fourCardVariation = require('./variations/fourCardNew');
//let fourCardVariation = require('./variations/fourCard');
let ThreeJokerVariation = require('./variations/threeJoker');
let Table = require("../model/table");
let newGameService = require("../service/newGame");

let gameType = require('./../constant/gametype');

function getPlayerBySlot(slot, players) {
	for (let player in players) {
		if (players[player].slot === slot) {
			return players[player];
		}
	}
	return undefined;
}


function startnewgameeee(client, id, avialbleSlots)
{
	newGameService.startNewGame(client, id, avialbleSlots);
}

function getLastActivePlayer(id, players, avialbleSlots, maxPlayer, cb) {
	maxPlayer = 5;
console.log(" in getLastActivePlayer " +  players[id].slot);
	let slot = players[id].slot,
		num = slot.substr(4) * 1;
	
	for (let count = 1; count <= maxPlayer; count++) {
		num--;
		
		if (num === 0) {
			num = maxPlayer;
		}
		if (avialbleSlots['slot' + num]) {
			continue;
		}
		

		
		if (getPlayerBySlot('slot' + num, players)) {
		
		    if (!getPlayerBySlot('slot' + num, players).active || getPlayerBySlot('slot' + num, players).packed
			|| getPlayerBySlot('slot' + num, players).idle || getPlayerBySlot('slot' + num, players).id == id){
				continue;
			} else {
				//currentNum = num;
				//return getPlayerBySlot('slot' + num, players);
				break;
			}
		}
	}
	
	return getPlayerBySlot('slot' + num, players);
};

function getRandom () {
  var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var current_datetime = Date.parse(new Date()); //1648731376000
  var random_code = '';
  for (var i = 0; i < 4; i++) {
    random_code += letters[Math.floor(Math.random() * 16)] + current_datetime;
  }
  
  return random_code;
}

function getNextActivePlayer(id, players, avialbleSlots, maxPlayer, cb) {
	maxPlayer = 5;
	console.log(" in getNextActivePlayer " +  players[id].slot);
	let slot = players[id].slot,
		num = slot.substr(4) * 1;
	
	for (let count = 1; count <= maxPlayer; count++) {
		num++;
		
		if (num > maxPlayer) {
			num = num % maxPlayer;
		}
		if (avialbleSlots['slot' + num]) {
			continue;
		}
		
	
		
		if (getPlayerBySlot('slot' + num, players)) {
			
			
		    if (!getPlayerBySlot('slot' + num, players).active || getPlayerBySlot('slot' + num, players).packed
			|| getPlayerBySlot('slot' + num, players).idle || getPlayerBySlot('slot' + num, players).id == id){
				continue;
			} else {
				//currentNum = num;
				//return getPlayerBySlot('slot' + num, players);
				break;
			}
		}
	}
	
	return getPlayerBySlot('slot' + num, players);
};




async function getNextSlotForTurn(id, players, avialbleSlots, maxPlayer,tableId) {
	players[id].turn = false;

	for (let player in players) {
		 players[player].turn = false;
	}
	let newPlayer = getNextActivePlayer(id, players, avialbleSlots, maxPlayer);
	players[newPlayer.id].turn = true;


	if(players[id].cardseen &&players[newPlayer.id].cardseen)
			players[nextPlayer.id].isSideShowAvailable = true;


	await Table.update(
		{ _id:tableId},
		{
		  $set: {
			turnplayerId: newPlayer.id,
		  },
		}
	  );
	
	
	
	return players;
};






function variationWinner(tableInfo, cardSets, joker,jokers) {
    if (tableInfo.gameType == gameType.Muflis) {
        return muflisVariation.getGreatest(cardSets);
    } else if (tableInfo.gameType == gameType.AK47) {
        return AK47Variation.getGreatest(cardSets);
    } else if (tableInfo.gameType == gameType.FourCard) {
		return fourCardVariation.getGreatest(cardSets);
    } else if (tableInfo.gameType == gameType.Joker) {
       return jokerVariation.getGreatest(cardSets, joker);
    } else if (tableInfo.gameType == gameType.Aflatoon) {
		return aflatoonVariation.getGreatest(cardSets, joker);
	} else if (tableInfo.gameType == gameType.ThreeJoker) {
		return ThreeJokerVariation.getGreatest(cardSets, jokers);
    } else {
        return simpleVariation.getGreatest(cardSets);
    }
}

function getType(cardSets)
{
	return simpleVariation.getPriority(cardSets);
}

module.exports = {
    getPlayerBySlot,
	getNextActivePlayer,
	getNextSlotForTurn,
	variationWinner,
	getType,
	getLastActivePlayer,getRandom,startnewgameeee
}