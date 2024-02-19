let _ = require("underscore");
let mongoose = require('mongoose');
let logger = require("tracer").colorConsole();

let Table = require("../model/po_table");
let Transactions = require("../model/transaction");
let User = require("../model/User");
let { getNextSlotForTurn } = require("../service/common");
const { max } = require("underscore");
let { getNextActivePlayer,getLastActivePlayer ,getNextActivePlayerForTurnChange} = require("../service/common");

async function placeBet(id, bet, blind, player, players1, tableInfo1, avialbleSlots, maxPlayers, idle = false) {
	logger.info("Inside placeBet - id:" + id + " bet:" + bet + " blind:" + blind + " avialbleSlots:" + avialbleSlots + " maxPlayers:" + maxPlayers + " players1:" + players1);
	await Transactions.create({
		senderId: mongoose.Types.ObjectId(id),
		userId: mongoose.Types.ObjectId(id),
		//receiverId: mongoose.Types.ObjectId("5ee4dbdb484c800bcc40bc04"),
		coins: bet,
		reason: 'Game',
		trans_type: 'Chal'
	});
	let players2 = await placeBetOnly(id, bet, blind, players1, tableInfo1, idle);
	let players = getNextSlotForTurn(id, players2, avialbleSlots, maxPlayers);
	await Table.update({ _id: tableInfo1._id }, { $set: { players: players } });
	logger.info("Leaving placeBet");
}

async function placeBetOnly(id, bet, blind, players, tableInfo, idle = false) {
	logger.info("Inside placeBetOnly - id:" + id + " bet:" + bet + " blind:" + blind);
	tableInfo.amount += bet;
	
	const userInfo = await User.findOne({ _id: id });
	players[id].playerInfo.chips = userInfo.chips;
          
	players[id].playerInfo.chips -= bet;
	await User.update(
		{ _id: id },
		{ $set: { chips: players[id].playerInfo.chips } }
	);

	players[id].noOfTurn = players[id].noOfTurn + 1;
	
	let betRoundCompleted = tableInfo.betRoundCompleted + 1;
	
	_.forEach(players, function(player) {
		if(player.noOfTurn !== betRoundCompleted && !player.packed && player.active && !player.idle) {
			betRoundCompleted = tableInfo.betRoundCompleted;
		}
	});	
	//old logic
	/*tableInfo.lastBet = bet;
	if(betRoundCompleted === 1 && betRoundCompleted === tableInfo.betRoundCompleted + 1 && tableInfo.gameType == 4) {
		tableInfo.lastBet = (bet * 2);
	}
	tableInfo.lastBlind = blind;*/

	//new logic
	if(!idle) {
		tableInfo.lastBet = bet;
		tableInfo.lastBlind = blind;
		if(betRoundCompleted === 1 && betRoundCompleted === tableInfo.betRoundCompleted + 1 && tableInfo.gameType == 4) {
			tableInfo.lastBet = (bet * 2);
		}
		players[id].lastBet = tableInfo.lastBet;
	} else {
		
		players[id].lastBet = bet;
	}

	tableInfo.betRoundCompleted++;
	///////
	
	players[id].idle_amount = 0;
	players[id].idle = idle;
	if(idle) { 
		players[id].idle_amount = tableInfo.amount;
	}
	
	
	await Table.update(
		{ _id: tableInfo._id },
		{ $set: { amount: tableInfo.amount, lastBet: tableInfo.lastBet, players: players, betRoundCompleted, lastBlind: tableInfo.lastBlind } },
	);

	logger.info("Leaving placeBetOnly");
	return players;	
};



async function packPlayerRemove(id, players, avialbleSlots, maxPlayer, table) {
	players[id].packed = true;
	players[id].remove = true;
	if(players[id].smallblind)
	{
		let lastplayer = getNextActivePlayer( id , players, avialbleSlots,maxPlayer);
		players[lastplayer.id].smallblind = true; 
	}
	/*if (players[id].turn == true) {
		players = getNextSlotForTurn(id, players, avialbleSlots, maxPlayer);

		
		let betRoundCompleted = table.betRoundCompleted + 1;
		_.forEach(players, function(player) {
			if(player.noOfTurn !== betRoundCompleted && !player.packed && player.active) {
				betRoundCompleted = table.betRoundCompleted;
			}
		});

		if(betRoundCompleted === 1 && betRoundCompleted === table.betRoundCompleted + 1 && table.gameType == 4) {
			table.lastBet = (table.lastBet * 2);
		}

		table.players = players;
		table.betRoundCompleted = betRoundCompleted;
		

	}else
	{
		
	}
	*/
	await Table.update({ _id: table._id }, { $set: { players: players } });
	//let table2 = await Table.findOne({ _id: table.id });
	return players[id];
};



async function packPlayer(id, players, avialbleSlots, maxPlayer, table) {
	players[id].packed = true;
	if(players[id].smallblind)
	{
		let lastplayer = getNextActivePlayer( id , players, avialbleSlots,maxPlayer);
	
		players[lastplayer.id].smallblind = true; 
	}
	/*if (players[id].turn == true) {
		players = getNextSlotForTurn(id, players, avialbleSlots, maxPlayer);

		let betRoundCompleted = table.betRoundCompleted + 1;
		_.forEach(players, function(player) {
			if(player.noOfTurn !== betRoundCompleted && !player.packed && player.active) {
				betRoundCompleted = table.betRoundCompleted;
			}
		});

		if(betRoundCompleted === 1 && betRoundCompleted === table.betRoundCompleted + 1 && table.gameType == 4) {
			table.lastBet = (table.lastBet * 2);
		}

		table.players = players;
		table.betRoundCompleted = betRoundCompleted;
		await Table.update({ _id: table.id }, { $set: { players: players, lastBet: table.lastBet, betRoundCompleted } });

	}
	*/
		await Table.update({ _id: table.id }, { $set: { players: players } });
		
		let table2 = await Table.findOne({ _id: table.id });
	return table2;
};

module.exports = {
    placeBet,
	placeBetOnly,
	packPlayer,packPlayerRemove
}