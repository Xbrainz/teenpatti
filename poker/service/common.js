let _ = require("underscore");
let logger = require("tracer").colorConsole();
let Table = require("../model/po_table");

function getPlayerBySlot(slot, players) {
//	logger.info("Inside getPlayerBySlot - slot:" + slot);
	for (let player in players) {
		if (players[player].slot === slot) {
			//logger.info("Leaving getPlayerBySlot");
			return players[player];
		}
	}
//	logger.info("Leaving getPlayerBySlot");
	return undefined;
}


function getLastActivePlayer(id, players, avialbleSlots, maxPlayer, cb) {
	let slot = players[id].slot,
		num = slot.substr(4) * 1;
	console.log("first slot    " + num);
	
	for (let count = 1; count <= maxPlayer; count++) {
		num--;
		console.log("number   " + num);
		console.log(avialbleSlots);
		if (num === 0) {
			num = maxPlayer;
		}
		if (avialbleSlots['slot' + num]) {
			continue;
		}
		
		console.log("next active player   " + num);
		
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
		console.log("last player by slot    " + num);
	return getPlayerBySlot('slot' + num, players);
};




function getNextActivePlayer(id, players, avialbleSlots, maxPlayer, cb) {
//	logger.info("Inside getNextActivePlayer - id:" + id + " avialbleSlots: " + avialbleSlots + " maxPlayer:" + maxPlayer);
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
			if (!getPlayerBySlot('slot' + num, players).active || getPlayerBySlot('slot' + num, players).packed  || getPlayerBySlot('slot' + num, players).idle) {
				continue;
			} else {
				break;
			}
		}
	}
	console.log();
	return getPlayerBySlot('slot' + num, players);
};



function getNextActivePlayerForTurnChange(id, players, avialbleSlots, maxPlayer, cb) {
//	logger.info("Inside getNextActivePlayer - id:" + id + " avialbleSlots: " + avialbleSlots + " maxPlayer:" + maxPlayer);
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
			if (!getPlayerBySlot('slot' + num, players).active ) {
				continue;
			} else {
				break;
			}
		}
	}
//	logger.info("Leaving getNextActivePlayer");
	return getPlayerBySlot('slot' + num, players);
};





async function getNextSlotForTurn(id, players, avialbleSlots, maxPlayer,tableId) {
	//logger.info("Inside getNextSlotForTurn - id:" + id + " avialbleSlots:" + avialbleSlots + " maxPlayer:" + maxPlayer);
	players[id].turn = false;
	let newPlayer = getNextActivePlayer(id, players, avialbleSlots, maxPlayer);
	players[newPlayer.id].turn = true;
//	logger.info("Leaving getNextSlotForTurn");

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

module.exports = {
    getPlayerBySlot,
	getNextActivePlayer,
	getNextSlotForTurn,getLastActivePlayer,getNextActivePlayerForTurnChange
}