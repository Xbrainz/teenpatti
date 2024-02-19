let _ = require("underscore");
let logger = require("tracer").colorConsole();

let CardInfo = require("./../model/cardInfo");
let Table = require("../model/po_table");
let { getNextSlotForTurn } = require("../service/common");
let { getNextActivePlayer,getLastActivePlayer ,getNextActivePlayerForTurnChange} = require("../service/common");
let User = require("../model/User");
async function addPlayersss(table, player, client) {
	//logger.info("Inside addPlayer");
	let avialbleSlots = {};
	let clients = {};
	let currentIndex;
	let totalIndex = 0;
    
    table.slotUsedArray.map((element) => {
		avialbleSlots['slot' + element] = 'slot' + element;
		currentIndex = element;
		totalIndex++;
	});
	
	if (totalIndex == 1) {
		table.slotUsedArray = [];
	} else {
		table.slotUsedArray.splice(totalIndex - 1, 1);
	}
    
    if (getActivePlayers(table.players) <= table.maxPlayers) {

		for (let slot in avialbleSlots) {
			player.slot = slot;
		}
		if (table.players == null) {
			table.players = {};
		}
		player.packed = false;
		player.remove = false;
		player.cardSeen = false;
		player.idle = false;
		player.turn = false;
		player.idle_amount = 0;
player.lastBet = 0;
player.lastAction = "";
player.nextAmount = 0;
player.nextAction = "";

		table.players[player.id] = player;
		clients[player.id] = client;
		table.players[player.id].active = !table.gameStarted;
		let length = Object.keys(table.players).length
		if (table.maxPlayers < length) {
		//	logger.info("Leaving addPlayer");
			return null;
		} else {
			await Table.update({ _id: table._id }, { $set: { slotUsedArray: table.slotUsedArray, players: table.players } });
			
		//	logger.info("Leaving addPlayer - avialbleSlots:" + avialbleSlots);
			return {
				player, avialbleSlots, table
			};
		}
	} else {
	//	logger.info("Leaving addPlayer");
		return null;
	}
};


async function addPlayer(table, player, client, sit = 0, cb) {
	
	
	
	let avialbleSlots = {};
	let clients = {};
	let currentIndex;
	let totalIndex = 0;
	table = await Table.findOne({ _id: table._id });


	if(table.slotUsedArray.length == 0)
	{

	
		let tableGG = await Table.findOne({
			_id: table._id
		});
		let slorrrr = [1, 2, 3, 4, 5];
		for (var playeraaa in tableGG.players) {
			let slotttofplayer = tableGG.players[playeraaa].slot;
			var slotuu = slotttofplayer.slice(-1);;
			for (var i = 0; i < slorrrr.length; i++) {
				if (slorrrr[i] == slotuu) {
					slorrrr.splice(i, 1);
				}
			}
		}
		await Table.update({
			_id: table._id
		}, {
			$set: {
				slotUsedArray: slorrrr
			}
		});
		table.slotUsedArray = slorrrr;
	
	}




    table.slotUsedArray.map((element) => {
		avialbleSlots['slot' + element] = 'slot' + element;
		currentIndex = element;
		totalIndex++;
	});




		


	


    if (getActivePlayers(table.players) <= table.maxPlayers) {
		for (let slot in avialbleSlots) {
	
			if('slot'+sit == slot) {
		
				player.slot = 'slot'+ sit;
		
				break;
			} else {
				player.slot = slot;
			}
				
		}
		


		if(player.slot == undefined || player.slot == null)
		{
			
			cb(null);
			
		}else{

		
		

			sit = player.slot.slice(-1);;

		


		if (totalIndex == 1) {
			table.slotUsedArray = [];
		} else {
			//table.slotUsedArray.splice(totalIndex - 1, 1);
			table.slotUsedArray.splice(table.slotUsedArray.indexOf(sit), 1);
		}
		
	//	logger.info("slottttttttttttttttttttttttttttttttttttttttttt  table.slotUsedArray :: 1",table.slotUsedArray);
		if (table.players == null) {
			table.players = {};
		}

		
	
		player.remove = false;
	
		player.idle = false;
		
	
player.lastBet = 0;

player.nextAmount = 0;
player.nextAction = "";


		player.packed = false;
		player.idle = false;
		player.contipack = 0;
		player.turn = false;
		player.idle_amount = 0;
		player.lastAction= 'new';
		player.disconnect = false;
		player.forcedisconnect = false;
		player.smallblind = false;
		player.bigblind = false;
		player.cardSeen = false;

		table.players[player.id] = player;
		clients[player.id] = client;
		table.players[player.id].active = false;
		let length = Object.keys(table.players).length

		
		if (table.maxPlayers < length) {
			cb(null);
		} else {
		
			let counttt = 0;
			counttt = getActivePlayersOriginal(table.players);
			


			let userssss = await User.findOne({ _id: player.id });


			await User.update({ _id:player.id }, { $set: {forcedisconnect :  false, lasttableId: table._id} });

			await Table.update({ _id: table._id }, { $set: { slotUsedArray: table.slotUsedArray, players: table.players, playersLeft : counttt } });
	


	
			let tabless = await Table.findOne({ _id: table._id });

	
		while(tabless.players[player.id] == undefined || tabless.players[player.id] == null)
		{
			
			await Table.update({ _id: table._id }, { $set: { slotUsedArray: table.slotUsedArray, players: table.players, playersLeft : counttt } });

		
			tabless = await Table.findOne({ _id: table._id });
		}

			cb(player, avialbleSlots, table);
		}
	}
	} else {

		cb(null);
	}
	
	
};


async function removePlayer(id, players,   table) {
//	logger.info("Inside removePlayer - id:" + id + " avialbleSlots:" + slotUsedArray +" slotUsedArray:" + slotUsedArray + " players: "+ players);

	if(players[id].smallblind)
	{
		
		let avialbleSlots = [];
		table.slotUsedArray.forEach(function (f) {
		avialbleSlots["slot" + f] = "slot" + f;
		});
			  
		let lastplayer = getNextActivePlayer( id , players, avialbleSlots,table.maxPlayers);
		players[lastplayer.id].smallblind = true; 
	}
	
	let slotUsedArray =	  table.slotUsedArray;
  	let avialbleSlots = {};
              table.slotUsedArray.forEach(function (f) {
                avialbleSlots["slot" + f] = "slot" + f;
              });
              
	
			
			   
	if (id && players[id]) {
		let player = players[id];
		avialbleSlots[player.slot] = player.slot;
		let slot = player.slot.replace(/[^\d.]/g, '');
		slot = parseInt(slot);
		slotUsedArray.push(slot);
        
		if(table.cardsInfo) {
			let cardsInfo = await CardInfo.findOne({ _id: table.cardinfoId });
			delete cardsInfo.info[id];
			await CardInfo.update({ _id: table.cardinfoId }, { $set: cardsInfo });
		}
		
		delete players[id];
		
		await User.update({ _id:id }, { $set: {lasttableId :  "" ,forcedisconnect: true} });

		let betRoundCompleted = table.betRoundCompleted + 1;
		_.forEach(players, function(player) {
			if(player.noOfTurn !== betRoundCompleted && !player.packed) {
				betRoundCompleted = table.betRoundCompleted;
			}
		});

		if(table.lastBet && betRoundCompleted === 1 && betRoundCompleted === table.betRoundCompleted + 1 && table.gameType == 4) {
			table.lastBet = (table.lastBet * 2);
		}

	
		let counttt = 0;
		counttt = getActivePlayersOriginal(players);

			let slorrrr = [1,2,3,4,5,6];
	
				for (var playeraaa in players) {
					let slotttofplayer =  players[playeraaa].slot;
					var slotuu = slotttofplayer.slice(-1);;
		
					for( var i = 0; i < slorrrr.length; i++){ 
						if ( slorrrr[i] == slotuu) { 
							slorrrr.splice(i, 1); 
						}
					
					}
				}
	


		
		if(counttt == 1)
			await Table.update({ _id: table._id }, { $set: { players: players, slotUsedArray: slorrrr, playersLeft : counttt,turnplayerId : "" ,gameInit: false ,betRoundCompleted} });
		else
			await Table.update({ _id: table._id.toString() }, { $set: { players: players, slotUsedArray: slorrrr, playersLeft : counttt,betRoundCompleted } });

		
		//	await Table.update({ _id: table._id }, { $set: { players: players } });

			let tableInfo = await Table.findOne({ _id: table._id });
			let players11 = tableInfo.players;
			let counttt222 = getActivePlayersOriginal(players11);

			while( counttt222 !=counttt )
			{
				await Table.update({ _id: table._id }, { $set: { players: players } });
				let tableInfo = await Table.findOne({ _id: table._id });
				counttt222 = getActivePlayersOriginal(tableInfo.players);
			
			}
			

		
	


        return player;
	}
}

function setNextPlayerTurn(players, avialbleSlots, tableId) {
	//logger.info("Inside setNextPlayerTurn - avialbleSlots:" + avialbleSlots + " tableId:" + tableId + "players:" + players);
	let activeTurnPlayer = getActionTurnPlayer(players);
	let maxPlayers = 5;
//	logger.info("Leaving setNextPlayerTurn");
	return getNextSlotForTurn(activeTurnPlayer.id, players, avialbleSlots, maxPlayers);
}

function getActivePlayers(players) {
	//logger.info("Inside getActivePlayers - players:" + players);
	var count = 0;
	for (var player in players) {
		if (players[player].active && !players[player].packed) {
			count++;
		}
	}
	//logger.info("Leaving getActivePlayers - count:" + count);
	return count;
}

function getActivePlayersOriginal(players) {
	//logger.info("Inside getActivePlayers - players:" + players);
	var count = 0;
	for (var player in players) {
		
			count++;
		
	}
	//logger.info("Leaving getActivePlayers - count:" + count);
	return count;
}


function getActionTurnPlayer(players) {
	//logger.info("Inside getActionTurnPlayer");
	let activePlayer;
	for (let player in players) {
		if (players[player].turn) {
			activePlayer = players[player];
			break;
		}
	}
	//logger.info("Leaving getActionTurnPlayer - activePlayer:" + activePlayer);
	return activePlayer;
}

module.exports = {
    addPlayer,
	removePlayer,
	setNextPlayerTurn
}