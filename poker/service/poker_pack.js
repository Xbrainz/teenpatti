let _ = require('lodash');
let logger = require("tracer").colorConsole();

let Table = require("./../model/Table");
let CardInfo = require("../model/cardInfo");

let cardComparer = require('./variations/cardComparer');
let muflis = require('./variations/muflis');
let threeJoker = require('./variations/threeJoker');
let { getPlayerBySlot, getNextActivePlayer } = require("./common");
let betService = require("./bet");

async function placeSideShow(id, bet, blind, players1, table) {
    logger.info("Inside placeSideShow - id:" + id + " bet:" + bet + " blind:" + blind + " table:" + table);
	let avialbleSlots = {};
	table.slotUsedArray.forEach(function (d) {
		avialbleSlots['slot' + d] = 'slot' + d;
	});

	let players2 = await betService.placeBetOnly(id, bet, blind, players1, table)
	 
	let players = await setPlayerForSideShow(id, players2, avialbleSlots, table.maxPlayer);
	await Table.update({ _id: table._id }, { $set: { players: players } });
    logger.info("Leaving placeSideShow");
	return players;
};

async function sideShowAccepted(id, placedTo, players1, table, avialbleSlots, cb) {
	logger.info("Inside sideShowAccepted - id:" + id + " placedTo:" + placedTo + " avialbleSlots:" + avialbleSlots + " table:" + table);
	let cardinfo = await CardInfo.findOne({ _id: table.cardinfoId });
	let nextPlayer = await getNextActivePlayer(id, players1, avialbleSlots, table.maxPlayers);
    let cardsToCompare = [
        {
            id: id,
            set: cardinfo.info[id].cards,
        },
        {
            id: placedTo,
            set: cardinfo.info[placedTo].cards,
        },
    ];

    let cardsToShow = {};
    cardsToShow[id] = {
        cardSet: cardinfo.info[id].cards,
    };
    cardsToShow[placedTo] = {
        cardSet: cardinfo.info[placedTo].cards,
    };
    
    let result;
    if (table.gameType == 2) {
        result = muflis.getGreatest(cardsToCompare);
    } else if (table.gameType == 4) {
        let jokers = _.take(cardinfo.jokers, table.betRoundCompleted);
        cardSetsWithWinners = threeJoker.getGreatest(cardsToCompare, jokers);
        let noOfWinners = 0;
        
        for(let i = 0; i < cardSetsWithWinners.length; i++) {
            cardsToShow[cardSetsWithWinners[i].set.id].newSet = [];
            cardsToShow[cardSetsWithWinners[i].set.id].newSet = cardSetsWithWinners[i].set.newSet;
            if(cardSetsWithWinners[i].winner === true) {
                noOfWinners++;
                result = cardSetsWithWinners[i].set;
            }
        }
        
        if(noOfWinners === 2) {
            for(let i = 0; i < cardSetsWithWinners.length; i++) {
                if(cardSetsWithWinners[i].set.id === id) {
                    result = cardSetsWithWinners[i].set;
                }
            }
        }
    } else {
        result = cardComparer.getGreatest(cardsToCompare);
    }
    
    if (result.id === id) {
        players1[placedTo].packed = true;
    } else {
        players1[id].packed = true;
    }
    await Table.update({ _id: table._id }, { $set: { players: players1 } });
    logger.info("Leaving sideShowAccepted");
    cb(
        [players1[result.id].playerInfo.displayName, ' has won the side show with ', result.typeName].join(''),
        players1[result.id].playerInfo,
        cardsToShow,
        players1
    );
};

async function updateSideShow(id, players, avialbleSlots, maxPlayer) {
	logger.info("Inside updateSideShow - id:"+ id + " avialbleSlots:" + avialbleSlots + " maxPlayer:" + maxPlayer);
	let nextPlayer = await getNextActivePlayer(id, players, avialbleSlots, maxPlayer);
	if (nextPlayer) {
		players[nextPlayer.id].isSideShowAvailable = true;
	}
    logger.info("Leaving updateSideShow");
	return players;
};

function setPlayerForSideShow(id, players, avialbleSlots, maxPlayer) {
    logger.info("Inside setPlayerForSideShow - id:" + id + " avialbleSlots:" + avialbleSlots + " maxPlayer:" + maxPlayer);
	let newPlayer = getPrevActivePlayer(id, players, avialbleSlots, maxPlayer);
	players[newPlayer.id].sideShowTurn = true;
    logger.info("Leaving setPlayerForSideShow");
	return players;
};

function getPrevActivePlayer(id, players, avialbleSlots, maxPlayer) {
	logger.info("Inside getPrevActivePlayer - id:" + id + " avialbleSlots:" + avialbleSlots + " maxPlayer:" + maxPlayer);
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
			if (!getPlayerBySlot('slot' + num, players).active || getPlayerBySlot('slot' + num, players).packed) {
				continue;
			} else {
				break;
			}
		}
	}
    logger.info("Leaving getPrevActivePlayer");
	return getPlayerBySlot('slot' + num, players);
};

module.exports = {
    placeSideShow,
    sideShowAccepted,
    updateSideShow
}