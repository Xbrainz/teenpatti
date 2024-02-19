const Table = require("../model/table");
let gameAuditService = require("../service/gameAudit");
const commonServices = require("../service/common");
const User = require("../model/user");
// async function addPlayer(table, player, client, sit, cb){
//     let availableSlots = {};
// 	let clients = {};
// 	let currentIndex;
// 	let totalIndex = 0;

//     table.slotUsedArray.map((element) => {
// 		availableSlots['slot' + element] = 'slot' + element;
// 		currentIndex = element;
// 		totalIndex++;
// 	});

//     if (totalIndex == 1) {
// 		table.slotUsedArray = [];
// 	} else {
// 		table.slotUsedArray.splice(table.slotUsedArray.indexOf(sit), 1);
// 	}
    

//     if (getActivePlayers(table.players) <= table.maxPlayers) {
// 		for (let slot in availableSlots) {
// 			if('slot'+sit == slot) {
// 				player.slot = 'slot'+sit;
// 				break;
// 			} else {
// 				player.slot = slot;
// 			}
// 		}

// 		console.log("new player ....players......",player.slot )

//         if (table.players == null) {
// 			table.players = {};
// 		}

// 		player.turn = false;

//         table.players[player.id] = player;
// 		clients[player.id] = client;
// 		table.players[player.id].active = !table.gameStarted;
// 		let length = Object.keys(table.players).length;

	



// 		if (table.maxPlayers < length) {
// 			cb(null);
// 		} else {
// 			await Table.updateOne({ _id: table._id }, { $set: { slotUsedArray: table.slotUsedArray, players: table.players } });
// 			cb(player, availableSlots);
// 		}
//     } 
// 	else {
// 		cb(null);
// 	}
// };


async function addPlayer(table, player, client, sit = 1, cb) {
	
	
	
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
		let slorrrr = [1, 2, 3, 4, 5,6];
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

		
		player.packed = false;
		player.left = false;
		player.contipack = 0;
		player.turn = false;
		player.lastAction= 'new';
		player.disconnect = false;
		player.forcedisconnect = false;
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
			


			await User.update({ _id:player.id }, { $set: {forcedisconnect :  false, disconnect : false ,lasttableId: table._id, game :  table.gameType,} });

		
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

function getActivePlayersOriginal(players) {
	var count = 0;
	for (var player in players) {
		
			count++;
		
	}
	return count;
}


function getActivePlayers(players) {
	var count = 0;
	for (var player in players) {
		if (players[player].active) {
			count++;
		}
	}
	return count;
};


async function removePlayer(id, players, avialbleSlots, slotUsedArray, table) {


	
	console.warn("remove player.....", id);
	
	
	
	
	
			
		if(table.turnplayerId == id ||  players[id].turn == true)
		{
			players = await commonServices.getNextSlotForTurn(id, players, avialbleSlots, table.maxPlayers, table._id);
		
	
		}
		
		
		if (id && players[id]) {
			let player = players[id];
			avialbleSlots[player.slot] = player.slot;
			let slot = player.slot.replace(/[^\d.]/g, '');
			slot = parseInt(slot);
			slotUsedArray.push(slot);
	
	
			
			
		
			delete players[id];
		
			
			
	
	
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
	
	
		
			
			await User.update({ _id:id }, { $set: {lasttableId :  "" ,forcedisconnect: true,disconnect : true, game : 0 } });
	
			
			
				
		
	/*
			let counttt = 0;
			for (var playessr in players) {
				counttt++;
				
			}
	
			*/
	
			let counttt = 0;
			counttt = getActivePlayersOriginal(players);
	
		
	
	
	
	
	
	
			if(counttt == 1)
				await Table.update({ _id: table._id }, { $set: { players: players, slotUsedArray: slorrrr, playersLeft : counttt,turnplayerId : "" ,gameInit: false } });
			else
				await Table.update({ _id: table._id.toString() }, { $set: { players: players, slotUsedArray: slorrrr, playersLeft : counttt } });
	
			
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

	


// async function removePlayer(id, players, availableSlots, slotUsedArray, table) {	
// 	try {
// 		if (id && players[id]) {
	
// 			let player = players[id];
// 			availableSlots[player.slot] = player.slot;
// 			let slot = player.slot.replace(/[^\d.]/g, '');
// 			slot = parseInt(slot);
// 			slotUsedArray.push(slot);
			
// 			// if(table.cardinfoId)
// 			// {
// 			// 	let cardsInfo = await CardInfo.findOne({ _id: table.cardinfoId });
// 			// 	if(cardsInfo && cardsInfo.info) {
// 			// 		delete cardsInfo.info[id];
// 			// 		await CardInfo.update({ _id: table.cardinfoId }, { $set: cardsInfo });
// 			// 	} 
// 			// }
			
// 			 if(players[id]) {
// 				//await commissionService.calculateCommission(table._id, id);
// 				delete players[id];
// 			}
				
// 			await Table.updateOne({ _id: table._id }, { $set: { players: players, slotUsedArray: slotUsedArray } });
						
// 			return player;
// 		}
// 	} catch(err) {
// 		console.log(err);
// 	}
	
// };


module.exports = { addPlayer, removePlayer };