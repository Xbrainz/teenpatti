//let CardInfo = require("./../model/cardInfo");
let Table = require("../model/table");
let User = require("../model/user");



let {
	getLastActivePlayer,
	getRandom,
	getNextSlotForTurn,
	getNextActivePlayer
} = require("../service/common");




async function addPlayer(table, player, client, sit = 0, cb) {



	let avialbleSlots = {};
	let clients = {};


	console.log("joinn  : 1 : ", player.id);
	if (getActivePlayers(table.players) <= table.maxPlayers) {

		console.log("joinn  : 26 : ", player.id);

		if (table.slotUsedArray.length > 0) {
			let sit = table.slotUsedArray[0];
			player.slot = "slot" + sit;
			//table.slotUsedArray.splice(sit, 0);
			let removeddd = table.slotUsedArray.shift();



			if (table.players == null) {
				table.players = {};
			}
			player.packed = false;

			player.contipack = 0;
			player.disconnect = false;
			player.forcedisconnect = false;
			player.current_dise_number = 0;
			player.turn = false;
			player.action = "New";

			player.token_0 = -1;
			player.token_1 = -1;
			player.token_2 = -1;
			player.token_3 = -1;

			table.players[player.id] = player;

			clients[player.id] = client;
			table.players[player.id].active = !table.gameStarted;
			let length = Object.keys(table.players).length


			if (table.maxPlayers < length) {
				console.log("joinn  : 11 : ", player.id);
				cb(null);
			} else {


				let counttt = 0;
				counttt = getActivePlayersOriginal(table.players);





				await User.update({
					_id: player.id
				}, {
					$set: {
						forcedisconnect: false,
						disconnect: false,
						lasttableId: table._id,
						game : table.gameType
					}
				});

				await Table.update({
					_id: table._id
				}, {
					$set: {
						slotUsedArray: table.slotUsedArray,
						players: table.players,
						playersLeft: counttt
					}
				});




				let tabless = await Table.findOne({
					_id: table._id
				});


				while (tabless.players[player.id] == undefined || tabless.players[player.id] == null) {

					await Table.update({
						_id: table._id
					}, {
						$set: {
							slotUsedArray: table.slotUsedArray,
							players: table.players,
							playersLeft: counttt
						}
					});


					tabless = await Table.findOne({
						_id: table._id
					});
				}


				console.log("joinn  : 2 : ", player.id);

				cb(player, avialbleSlots);



			}
		}else{
			console.log("joinn  : 322 : ", player.id);
		cb(null);
		}
	} else {
		console.log("joinn  : 3 : ", player.id);
		cb(null);
	}


};
async function removePlayer(id, players, avialbleSlots, slotUsedArray, table) {



	//	slotUsedArray = 
	//  let newPlayer = getLastActivePlayer(id, players, avialbleSlots, table.maxPlayers);

	// 				if(!newPlayer.cardSeen)
	// 				{

	// 					let newPlayer22 = getNextActivePlayer(newPlayer.id, players, avialbleSlots, table.maxPlayers);

	// 					players[newPlayer22.id].isSideShowAvailable = false;
	// 						console.log("Sideshowavailable 76" + players[newPlayer22.id].isSideShowAvailable);



	// 				}else
	// 				{
	// 					let newPlayer22 = getNextActivePlayer(newPlayer.id, players, avialbleSlots, table.maxPlayers);
	// 					if(newPlayer22.cardSeen)
	// 					{
	// 						players[newPlayer22.id].isSideShowAvailable = true;
	// 						console.log("Sideshowavailable 5" + players[newPlayer22.id].isSideShowAvailable);
	// 					}
	// 					else
	// 					{
	// 						players[newPlayer22.id].isSideShowAvailable = false;
	// 						console.log("Sideshowavailable 6" + players[newPlayer22.id].isSideShowAvailable);
	// 					}
	// 				}




	if (table.turnplayerId == id && getActivePlayers(table.players) != 1) {

		table.players = await getNextSlotForTurn(id, table.players, table._id);



	}



	if (id && players[id]) {
		console.log("player  service  : remove player 1");
		let player = players[id];
		avialbleSlots[player.slot] = player.slot;
		let slot = player.slot.replace(/[^\d.]/g, '');
		slot = parseInt(slot);
		slotUsedArray.push(slot);





		let winningno = 4;
		if (table.maxPlayers == 4)
			winningno = 4;
		else
			winningno = 2;

		for (let ll in table.winners) {
			if (table.winners[ll].winningposition == winningno)
				winningno--;
		}

		//table.lastwinnerno++;
		if(table.players[id].action != "New")
		{
					

			var winneradd = {
				id: id,
				name: table.players[id].playerInfo.displayName,
				status: "left",
				winningposition: winningno
			}
			table.winners.push(winneradd);
		}

		if (players[id]) {

			delete players[id];


		}




		//	await User.update({ _id:id }, { $set: {lasttableId :  ""} });





		/*
				let counttt = 0;
				for (var playessr in players) {
					counttt++;
					
				}

				*/








		let slorrrr = [0, 1, 2, 3];
		if (table.maxPlayers == 2) {
			slorrrr = [0, 2];
		} else {
			slorrrr = [0, 1, 2, 3];
		}


		for (var playeraaa in players) {
			let slotttofplayer = players[playeraaa].slot;
			var slotuu = slotttofplayer.slice(-1);;

			for (var i = 0; i < slorrrr.length; i++) {
				if (slorrrr[i] == slotuu) {
					slorrrr.splice(i, 1);
				}

			}
		}




		await User.update({
			_id: id
		}, {
			$set: {
				lasttableId: "",
				forcedisconnect: true,
				game : 10
			}
		});

		/*
				let counttt = 0;
				for (var playessr in players) {
					counttt++;
					
				}

				*/

		let counttt = 0;
		counttt = getActivePlayersOriginal(players);

		console.log("player  service  : remove player 01 playerlength :  ", counttt);


		if (counttt == 1)
			await Table.update({
				_id: table._id
			}, {
				$set: {
					winners: table.winners,
					players: players,
					slotUsedArray: slorrrr,
					playersLeft: counttt,
					turnplayerId: "",
					gameInit: false
				}
			});
		else
			await Table.update({
				_id: table._id.toString()
			}, {
				$set: {
					winners: table.winners,
					players: players,
					slotUsedArray: slorrrr,
					playersLeft: counttt
				}
			});


		//	await Table.update({ _id: table._id }, { $set: { players: players } });

		let tableInfosss = await Table.findOne({
			_id: table._id
		});
		let counttt222 = getActivePlayersOriginal(tableInfosss.players);

		while (counttt222 != counttt) {
			await Table.update({
				_id: table._id
			}, {
				$set: {
					players: players
				}
			});
			let tableInfo = await Table.findOne({
				_id: table._id
			});
			counttt222 = getActivePlayersOriginal(tableInfo.players);

			console.log("whileee... ", counttt222);
		}


		console.log("player  service  : remove player 1 playerlength :  ", counttt222);


		let ttttttttt = await Table.findOne({
			_id: table._id
		});
		console.log("player  service  : remove player 55 playerlength :  ", getActivePlayersOriginal(ttttttttt.players));



		return player;
	}
}

function getJoinedPlayerName(players) {
	let usernames = '';
	for (let player in players) {

		usernames += players[player].id + ",";


		//	Log.e("playerss : : 11 ", players[player].playerInfo.displayName);

	}
	return usernames;
}


function setNextPlayerTurn(players, avialbleSlots, tableId) {
	let activeTurnPlayer = getActionTurnPlayer(players);
	let maxPlayers = 9;
	return getNextSlotForTurn(activeTurnPlayer.id, players, avialbleSlots, maxPlayers, tableId);
}

function getActivePlayers(players) {
	var count = 0;
	for (var player in players) {
		if (players[player].active && !players[player].packed) {
			count++;
		}
	}
	return count;
}

function getActivePlayersOriginal(players) {
	var count = 0;
	for (var player in players) {

		count++;

	}
	return count;
}



function getActionTurnPlayer(players) {
	let activePlayer;
	for (let player in players) {
		if (players[player].turn) {
			activePlayer = players[player];
			break;
		}
	}
	return activePlayer;
}

module.exports = {
	addPlayer,
	removePlayer,
	setNextPlayerTurn
}