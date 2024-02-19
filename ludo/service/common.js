let _ = require("underscore");


let Table = require("../model/table");
let newGameService = require("../service/newGame");

//let gameType = require('./../constant/gametype');

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

function getNextActivePlayer(id, players, avialbleSlots, maxPlayer) {
	//maxPlayer = 3;

		let slot = players[id].slot,
		num = slot.substr(4) * 1;

		

		if(maxPlayer ==2)
		{
			if(slot == "slot0")
			{
				return getPlayerBySlot('slot' + 2, players);
			}else
			{
				return getPlayerBySlot('slot' + 0, players);
			}
		}else{

			
		
		
			for (let count = 0; count <= maxPlayer; count++) {
			
				num++;
				
				if (num > (maxPlayer-1)) {
					num = 0;
				}
				if (avialbleSlots['slot' + num]) {
					continue;
				}
				
			
				
				if (getPlayerBySlot('slot' + num, players)) {
				

					let playerss = getPlayerBySlot('slot' + num, players);
				


				
					if (!playerss.active || playerss.packed	|| playerss.idle || playerss.id == id || playerss.winner == true ){
						continue;
					} else {
						//currentNum = num;
						//return getPlayerBySlot('slot' + num, players);

					
						break;
					}
				}
			}

			

			return getPlayerBySlot('slot' + num, players);
	}
};




async function getNextSlotForTurn(id, players,  tableId) {

	
	let table = await Table.findOne({ _id: tableId });
	players = table.players;


	//players[id].turn = false;

	for (let player in players) {
		players[player].turn = false;
   }
	let avialbleSlots = {};
	table.slotUsedArray.forEach(function (d) {
	  avialbleSlots["slot" + d] = "slot" + d;
	});

	let newPlayer = getNextActivePlayer(id, players, avialbleSlots, table.maxPlayers);
	players[newPlayer.id].turn = true;



	await Table.update(
		{ _id:tableId},
		{
		  $set: {
			turnplayerId: newPlayer.id,
			players : players
		  },
		}
	  );

	return players;
};





module.exports = {
    getPlayerBySlot,
	getNextActivePlayer,
	getNextSlotForTurn,
	
	getLastActivePlayer,getRandom,startnewgameeee
}