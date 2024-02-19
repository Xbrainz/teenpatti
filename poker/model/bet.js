let _ = require("underscore");
let mongoose = require('mongoose');

let Table = require("../model/table");
let TransactionChalWin = require("../model/transactionChalWin");
let User = require("../model/user");
let gameAuditService = require("./gameAudit");
let auditType = require("../constant/audittype");
let transactionType = require("../constant/transactionType");
let { getNextSlotForTurn } = require("../service/common");

async function placeBet(id, bet, blind, player, players1, tableInfo1, avialbleSlots, maxPlayers, isShow, idle = false) {
	
	await TransactionChalWin.create({
		userId: mongoose.Types.ObjectId(id),
		tableId: tableInfo1._id,
		gameId: tableInfo1.lastGameId,
		coins: bet,
		transType: transactionType.CHAL
	});
	let remark = "Chaal";
	if(isShow) remark = "Show";
	if(blind) remark = "Blind";
	if(tableInfo1.lastBet < bet) remark = "Increased_Bet";
	
	let click = "Chaal"
	if(isShow) click = "Show";
	if(blind) click = "Blind";

	let players2 = await placeBetOnly(id, bet, blind, players1, tableInfo1, idle);
	
	console.log("calling function");
	let players = await getNextSlotForTurn(id, players2, avialbleSlots, maxPlayers, tableInfo1._id);
	await Table.update({ _id: tableInfo1._id }, { $set: { players: players } });

	let table = await Table.findOne({ _id: tableInfo1._id });
	await gameAuditService.createAudit(table._id, table.cardinfoId, id, table.lastGameId, auditType.USER_TURN, bet, 0, players[id].playerInfo.chips, click, remark, table.amount, players, 0, '');
}

async function placeBetOnly(id, bet, blind, players, tableInfo, idle = false) {
	tableInfo.amount += bet;
	
	const userInfo = await User.findOne({ _id: id });
	players[id].playerInfo.chips = userInfo.chips;
	
	players[id].playerInfo.chips -= bet;
	await User.update(
		{ _id: id },
		{ $set: { chips: players[id].playerInfo.chips } }
	);

	players[id].totalChalAmount += bet;
	players[id].noOfTurn = players[id].noOfTurn + 1;
	
	let betRoundCompleted = tableInfo.betRoundCompleted + 1;
	_.forEach(players, function(player) {
		/*if(player.noOfTurn !== (tableInfo.betRoundCompleted + 1) && !player.packed && player.active && !player.idle) {
			betRoundCompleted = tableInfo.betRoundCompleted;
		}*/
		//24-08-21
		if(player.noOfTurn !== (tableInfo.betRoundCompleted + 1) && !player.packed && player.active && !player.idle) {
			betRoundCompleted = tableInfo.betRoundCompleted;
		}
	});

	
	
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
	
	
	
//	tableInfo.lastBlind = blind;
//	players[id].lastBet = tableInfo.lastBet
//	await Table.update(
//		{ _id: tableInfo._id },
//		{ $set: { amount: tableInfo.amount, lastBet: tableInfo.lastBet, players: players, betRoundCompleted, //lastBlind: blind } },
//	);

	return players;	
};

async function packPlayer(id, players, avialbleSlots, maxPlayer, table) {
	players[id].packed = true;
	if (players[id].turn == true) {
		//old
		//return getNextSlotForTurn(id, players, avialbleSlots, maxPlayer, tableId);
		
		//new ////24-08-21
		players = getNextSlotForTurn(id, players, avialbleSlots, maxPlayer, table);
		
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
	//return players;
	return table.players;
};

module.exports = {
    placeBet,
	placeBetOnly,
	packPlayer
}