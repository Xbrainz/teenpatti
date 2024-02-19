let _ = require('lodash');

let Table = require("../model/table");
let CardInfo = require("../model/cardInfo");

let { getPlayerBySlot, getNextActivePlayer,getRandom,getLastActivePlayer } = require("./common");
let betService = require("./bet");
let commonService = require("./common");
let gameAuditService = require("./gameAudit");
const thirdPartyAPICall = require('../service/thirdPartyAPICall/thirdPartyAPICall');
let auditType = require("../constant/audittype");

//let { ,getRandom,getNextSlotForTurn,getNextActivePlayer } = require("../service/common");

async function placeSideShow(id, bet, blind, players1, table, placedTo) {
	let avialbleSlots = {};
	table.slotUsedArray.forEach(function (d) {
		avialbleSlots['slot' + d] = 'slot' + d;
	});


let requestid = getRandom();
	
	let param = {
		operatorPlayerId :players1[id].playerInfo.userName ,
			roundId: table.lastGameId,
			tableCode: table._id,
			gameCategory:table.gameCategory,
			gameCode: table.gameType+"",
			gameName:table.gameName,
			amount:bet,
			isRollBack : false,
			description: "Boot Amount ",
			requestId: requestid,
			playerStatus : "BLIND",
			device : players1[id].playerInfo.deviceType, 
			clientIP :  players1[id].playerInfo.clientIp, 
		};
		
		const ApiResponce = await thirdPartyAPICall.PlaeBet(param);
		
		console.log(ApiResponce.data);
	
	
//	ApiResponce.data.isSuccess = false;
	if(!ApiResponce.data.isSuccess)
	{
		
 console.log("ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd");
		return false;
			
	}else
	{


	let players2 = await betService.placeBetOnly(id, bet, blind, players1, table,false,ApiResponce.data.availableBalance)
	 
	let players = await setPlayerForSideShow(id, players2, avialbleSlots, table.maxPlayer);
	
	
	console.log("table amount   " + table.amount + "  " + bet);
	let tableAmount = table.amount ;
	let remark = "with "+ players[placedTo].playerInfo.userName;
	//  await Table.update({ _id: table._id }, { $set: { amount: tableAmount } });
	  
	  await Table.update({ _id: table._id }, { $set: { players: players } });
	await gameAuditService.createAudit(table._id, table.cardinfoId, id, table.lastGameId, auditType.USER_TURN, bet, 0, players[id].playerInfo.chips, 'SideShowPlace', remark, tableAmount, players, 0, '');
	
	
	
	return players;
	
	}
};

async function sideShowAccepted(id, placedTo, players1, table, avialbleSlots, cb) {
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
    
    let cardSetsWithWinners = commonService.variationWinner(table, cardsToCompare, cardinfo.joker,cardinfo.jokers);
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

	let remark = "with "+ players1[placedTo].playerInfo.userName
	await gameAuditService.createAudit(table._id, table.cardinfoId, id, table.lastGameId, auditType.USER_TURN, 0, 0, players1[id].playerInfo.chips, 'Accepted', remark, table.amount, players1, 0, '');
   
    if (result.id === id) {
        players1[placedTo].packed = true;
		await gameAuditService.createAudit(table._id, table.cardinfoId, placedTo, table.lastGameId, auditType.USER_TURN, 0, 0, players1[placedTo].playerInfo.chips, 'Pack', 'Lost Sideshow', table.amount, players1, 0, '');
    } else {
        players1[id].packed = true;
		await gameAuditService.createAudit(table._id, table.cardinfoId, id, table.lastGameId, auditType.USER_TURN, 0, 0, players1[id].playerInfo.chips, 'Pack', 'Lost Sideshow', table.amount, players1, 0, '');
    }

 


	
	if(getActivePlayers(players1) > 2)
	{

			 let newPlayer = getLastActivePlayer(result.id, players1, avialbleSlots, table.maxPlayers);
			if(!newPlayer.cardSeen)
			{
				
				let newPlayer22 = getNextActivePlayer(newPlayer.id, players1, avialbleSlots, table.maxPlayers);
				
				players1[newPlayer22.id].isSideShowAvailable = false;
				
			}else
			{
				let newPlayer22 = getNextActivePlayer(newPlayer.id, players1, avialbleSlots, table.maxPlayers);
				if(newPlayer22.cardSeen)
				{
					players1[newPlayer22.id].isSideShowAvailable = true;
				}
				else
				{
					players1[newPlayer22.id].isSideShowAvailable = false;
				}
			}

	}

    await Table.update({ _id: table._id }, { $set: { players: players1 } });
	cb(
        [players1[result.id].playerInfo.displayName, ' has won the side show'].join(''),
        players1[result.id].playerInfo,
        cardsToShow,
        players1
    );
};

async function updateSideShow(id, players, avialbleSlots, maxPlayer) {
	let nextPlayer = await getNextActivePlayer(id, players, avialbleSlots, maxPlayer);
	if (nextPlayer) {
		players[nextPlayer.id].isSideShowAvailable = true;
	}


	console.log("..............................  side show availleeee..................   " +    nextPlayer.userName);
	return players;
};

function setPlayerForSideShow(id, players, avialbleSlots, maxPlayer) {
	let newPlayer = getPrevActivePlayer(id, players, avialbleSlots, maxPlayer);
	players[newPlayer.id].sideShowTurn = true;
	return players;
};

function getPrevActivePlayer(id, players, avialbleSlots, maxPlayer) {
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
			|| getPlayerBySlot('slot' + num, players).idle || getPlayerBySlot('slot' + num, players).id == id) {
				continue;
			} else {
				break;
			}
		}
	}

	return getPlayerBySlot('slot' + num, players);
};


function getActivePlayers(players) {
	let count = 0;
	for (let player in players) {
	  if (players[player].active && !players[player].packed && !players[player].idle) {
		count++;
	  }
	}
	return count;
  }
module.exports = {
    placeSideShow,
    sideShowAccepted,
    updateSideShow
}