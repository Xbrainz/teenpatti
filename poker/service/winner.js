let _ = require('lodash');
let mongoose = require('mongoose');
let logger = require("tracer").colorConsole();

let CardInfo = require("./../model/cardInfo");
let User = require("./../model/User");
let Transactions = require("./../model/transaction");

let cardComparer = require('./variations/cardComparer');
let muflis = require('./variations/muflis');
let threeJoker = require('./variations/threeJoker');
let createcardset = require('./createcardset');
const TransactionCommission = require("./../model/transactionCommission");
let gameAuditService = require("../service/gameAudit");
let TransactionChalWin = require("../model/transactionChalWin");
let arr_winplayer = [];


async function WinnerDecide(players, table) {

	let cardsInfo = await CardInfo.findOne({
		_id: table.cardinfoId
	});


	for (let position in players) {
		if (players[position].active && !players[position].packed) {
			players[position] = await createset(players[position], cardsInfo.jokers);

		}
	}


	let win_ishighest = 11;
	let winn_players = []

	for (let position in players) {

		if (players[position].active && !players[position].packed) {
			if (win_ishighest > players[position].cardSet.NewCards[0]) {
				win_ishighest = players[position].cardSet.NewCards[0];
				winn_players = [];
				winn_players.push(players[position]);

			} else if (win_ishighest == players[position].cardSet.NewCards[0]) {
				winn_players.push(players[position]);
			}
		}
	}



	arr_winplayer = [];
	arr_winplayer.push(winn_players[0]);


	let highest = 0;
	let winplayer;
	if (winn_players.length > 1) {

		arr_winplayer = [];

		if (winn_players[0].cardSet.NewCards[0] == 2 || winn_players[0].cardSet.NewCards[0] == 5 ||
			winn_players[0].cardSet.NewCards[0] == 6 || winn_players[0].cardSet.NewCards[0] == 8 || winn_players[0].cardSet.NewCards[0] == 11 || winn_players[0].cardSet.NewCards[0] == 10 || winn_players[0].cardSet.NewCards[0] == 1) {


			for (let position in winn_players) {


				if (highest < winn_players[position].cardSet.NewCards[3]) {
					highest = winn_players[position].cardSet.NewCards[3];
					winplayer = winn_players[position];


					arr_winplayer = [];
					arr_winplayer.push(winn_players[position]);

				} else if (highest == winn_players[position].cardSet.NewCards[3]) {

					//	arr_winplayer = [];
					arr_winplayer.push(winn_players[position]);

				}

			}







			if (arr_winplayer.length > 1) {


				if(winn_players[0].cardSet.NewCards[0] == 8)
				{
					let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[9]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[9];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[9]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;
				}


			}


			if (arr_winplayer.length > 1) {


				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[3]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[3];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[3]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}




			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[5]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[5];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[5]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}


			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[6]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[6];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[6]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}



			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[7]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[7];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[7]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}



			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[8]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[8];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[8]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}

		} else if (winn_players[0].cardSet.NewCards[0] == 3 || winn_players[0].cardSet.NewCards[0] == 4 ||
			winn_players[0].cardSet.NewCards[0] == 9 || winn_players[0].cardSet.NewCards[0] == 7) {
			for (let position in winn_players) {
				if (highest < winn_players[position].cardSet.NewCards[4]) {
					highest = winn_players[position].cardSet.NewCards[4];
					winplayer = winn_players[position];

					arr_winplayer = [];
					arr_winplayer.push(winn_players[position]);

				} else if (highest == winn_players[position].cardSet.NewCards[4]) {

					//	arr_winplayer = [];
					arr_winplayer.push(winn_players[position]);

				}

			}

			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[3]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[3];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[3]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}




			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[5]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[5];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[5]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}


			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[6]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[6];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[6]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}



			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[7]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[7];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[7]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}



			if (arr_winplayer.length > 1) {

				let arr_winplayer_temp = [];
				let arr_winplayer_backup = arr_winplayer;
				highest = 0;
				for (let position in arr_winplayer_backup) {
					if (highest < arr_winplayer_backup[position].cardSet.NewCards[8]) {
						highest = arr_winplayer_backup[position].cardSet.NewCards[8];
						winplayer = arr_winplayer_backup[position];
						arr_winplayer_temp = [];
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					} else if (highest == arr_winplayer_backup[position].cardSet.NewCards[8]) {
						arr_winplayer_temp.push(arr_winplayer_backup[position]);

					}

				}

				arr_winplayer = [];
				arr_winplayer = arr_winplayer_temp;

			}


		}

	

	} else {

		winplayer = winn_players[0];
	}

	return winplayer;

}



async function createset(players, jokers) {



	//players[player].cardSet.cards.push(deckCards[index++]);
	//players[player].cardSet.cardsAll.push(deckCards[index++]);
	let cardset = [];
	let cardsetof5 = [];

	cardset.push(players.cardSet.cards[0]);
	cardset.push(players.cardSet.cards[1]);

	cardset.push(jokers[0]);
	cardset.push(jokers[1]);
	cardset.push(jokers[2]);
	cardset.push(jokers[3]);
	cardset.push(jokers[4]);


	cardsetof5.push(cardset[0]);
	cardsetof5.push(cardset[1]);


	cardsetof5.push(cardset[2]);



	/*			
				
	let cardss = [{
	    type: 'hearts',
	    rank: 2,
	    name: '2',
	    priority: 2,
	    id: 0.25425812907462264
	  },
	  {
	    type: 'club',
	    rank: 6,
	    name: '6',
	    priority: 6,
	    id: 0.5808251052336868
	  },
	  {
	    type: 'club',
	    rank: 4,
	    name: '4',
	    priority: 4,
	    id: 0.8154435361604679
	  },
	  {
		  
	    type: 'diamond',
	    rank: 8,
	    name: '8',
	    priority: 8,
	    id: 0.3663589947784527
	  },
	  {
	    type: 'spade',
	    rank: 10,
	    name: 'J',
	    priority: 10,
	    id: 0.050571416871151076
	  }
	];

	try{
	let type = createcardset.getSetType(cardss);

	}catch(error)
	{
	}

	*/


	let store_highest = [];



	store_highest[0] = 11;
	store_highest[1] = "high card";



	for (let ii = 3; ii < 7; ii++) {
		cardsetof5.push(cardset[ii]);
		for (let j = 4; j < 7; j++) {
			if (j != ii) {
				cardsetof5.push(cardset[j]);
				let returntype = createcardset.getSetType(cardsetof5);
				if (returntype[0] < store_highest[0]) {
					store_highest = returntype;
				}
				cardsetof5.splice(-1);
			}
		}
		cardsetof5.splice(-1);


	}




	players.cardSet.NewCards = store_highest;



	return players;
}





async function calculatewinningamout(players, table) {
	var winplayer = "",
		winplayer2 = "",
		winplayer3 = "",
		winplayer4 = "",
		winoriginal = "";
	let totalwinningamout = table.amount;

	let card = await CardInfo.findOne({
		_id: table.cardinfoId
	});
	let cardsInfo = card.info;

	for (let position in players) {
		if (players[position].active && !players[position].packed) {
			players[position].cardSet.cards = cardsInfo[players[position].id].cards;
			players[position].cardSet.closed = false;
		}
	}

	




	winplayer = await WinnerDecide(players, table);
	

	totaltableamount = table.amount;

	let commission = (parseInt(totaltableamount) * parseInt(table.commission)) / 100;
	console.warn("win amount : totalamount  : ",totaltableamount);
	//totaltableamount = totaltableamount - commission;


	let transactionCommissionData = {
		senderId: mongoose.Types.ObjectId(winplayer.id),

		tableId: table._id,
		gameId: table.lastGameId,

		adminCommission: commission,
		transType: "Commission",
	}
	const newTransactionCommission = new TransactionCommission(transactionCommissionData);
	await newTransactionCommission.save();



	if (getOnlyActivePlayersforWinner(players) > 2 && winplayer.idle == true) {
		let players2 = [];
		for (let position in players) {
			if (players[position].active) {
				if (winplayer.id != players[position].id) {
					players2.push(players[position]);
				}
			}
		}

		winplayer2 = await WinnerDecide(players2, table);
		//original winner

		let players3 = [];
		for (let position in players) {
			if (players[position].active) {
				if (!players[position].idle) {
					players3.push(players[position]);
				}
			}
		}


		
		winoriginal = await WinnerDecide(players3, table);
		////

		if (winplayer2.idle == true && winplayer2.idle_amount != winplayer.idle_amount) {
			let players2 = [];
			for (let position in players) {
				if (players[position].active) {
					if (winplayer.id == players[position].id || winplayer2.id == players[position].id) {} else {
						players2.push(players[position]);
					}
				}
			}

			winplayer3 = await WinnerDecide(players2, table);
			if (winplayer3.idle == true && winplayer3.idle_amount != winplayer.idle_amount) {
				let players2 = [];
				for (let position in players) {
					if (players[position].active) {
						if (winplayer.id == players[position].id || winplayer2.id == players[position].id || winplayer3.id == players[position].id) {} else {
							players2.push(players[position]);
						}
					}
				}

				winplayer4 = await WinnerDecide(players2, table);

				commission = commission/4;
				commission = commission.toFixed(0);

				players[winplayer.id].winner = true;
				var winamiount1 =  players[winplayer.id].idle_amount ;

				
				totaltableamount = totaltableamount - winamiount1;
				let commiss1 = (parseInt(winamiount1) * parseInt(table.commission)) / 100;
				winamiount1 = winamiount1 - commiss1.toFixed(0);


				players[winplayer.id].winningAmount = winamiount1;
				console.log("win amount : 1 : ", players[winplayer.id].winningAmount , " idle :" ,players[winplayer.id].idle_amount );
				let user = await User.findOne({
					_id: players[winplayer.id].id
				});

				let chipppp = user.chips + winamiount1;
			//	totaltableamount = totaltableamount - winamiount1;
				

				await User.update({
						_id: user._id
					}, 
					{
						$set: {	chips: chipppp	},
						$inc: { winPoker: winamiount1 }
					}
				);




				players[winplayer.id].playerInfo.chips = chipppp;

				await gameAuditService.createAudit(table._id, table.cardinfoId, winplayer.id, table.lastGameId, "Winner", 0, 0, players[winplayer.id].idle_amount, "Winner", "game", table.amount, table.players, 0, '');

				await Transactions.create({
					userName: players[winplayer.id].playerInfo.userName,
					userId: mongoose.Types.ObjectId(winplayer.id),
					receiverId: mongoose.Types.ObjectId(winplayer.id),
					coins: winamiount1,
					reason: 'Game',
					trans_type: 'win'
				});

				await TransactionChalWin.create({
					userId: mongoose.Types.ObjectId(winplayer.id),
					tableId: table._id,
					gameId: table.lastGameId,
					coins: winamiount1,
					transType: 'WIN'
				});

				if (players[winplayer.id].idle_amount < players[winplayer2.id].idle_amount) {
					players[winplayer2.id].winner = true;
					var winningcoin = (players[winplayer2.id].idle_amount - players[winplayer.id].idle_amount) ;

					totaltableamount = totaltableamount - winningcoin;
					let commiss2 = (parseInt(winningcoin) * parseInt(table.commission)) / 100;
					winningcoin = winningcoin - commiss2.toFixed(0);


					winningcoin = winningcoin.toFixed(0);
					players[winplayer2.id].winningAmount = winningcoin;
					console.log("win amount : 2 : ", players[winplayer2.id].winningAmount, " idle :" ,players[winplayer2.id].idle_amount );
					let user = await User.findOne({
						_id: players[winplayer2.id].id
					});

					let chipppp = user.chips + winningcoin;
					//totaltableamount = totaltableamount - winningcoin;
					
					await User.update({
							_id: user._id
						}, 
						{
							$set: {	chips: chipppp	},
							$inc: { winPoker: winningcoin }
						}
					);


					players[winplayer2.id].playerInfo.chips = chipppp;

					await gameAuditService.createAudit(table._id, table.cardinfoId, winplayer2.id, table.lastGameId, "Winner", 0, 0, winningcoin, "Winner", "game", table.amount, table.players, 0, '');

					await TransactionChalWin.create({
						userId: mongoose.Types.ObjectId(winplayer2.id),
						tableId: table._id,
						gameId: table.lastGameId,
						coins: winningcoin,
						transType: 'WIN'
					});

					await Transactions.create({
						userName: players[winplayer2.id].playerInfo.userName,
						userId: mongoose.Types.ObjectId(winplayer2.id),
						receiverId: mongoose.Types.ObjectId(winplayer2.id),
						coins: winningcoin,
						reason: 'Game',
						trans_type: 'win'
					});

					if (players[winplayer2.id].idle_amount < players[winplayer3.id].idle_amount) {


						players[winplayer3.id].winner = true;
						
						let winningcoin2 = (players[winplayer3.id].idle_amount - players[winplayer2.id].idle_amount) ;
						

						totaltableamount = totaltableamount - winningcoin2;
						let commiss3 = (parseInt(winningcoin2) * parseInt(table.commission)) / 100;
						winningcoin2 = winningcoin2 - commiss3.toFixed(0);


						players[winplayer3.id].winningAmount = winningcoin2;
						console.log("win amount : 3 : ", players[winplayer3.id].winningAmount, " idle :" ,players[winplayer3.id].idle_amount );
						let user = await User.findOne({
							_id: players[winplayer3.id].id
						});

						let chipppp = user.chips + winningcoin;
					//	totaltableamount = totaltableamount - winningcoin;
						

						await User.update({
							_id: user._id
						}, 
						{
							$set: {	chips: chipppp	},
							$inc: { winPoker: winningcoin }
						}
						);

						

						players[winplayer3.id].playerInfo.chips = chipppp;

						await gameAuditService.createAudit(table._id, table.cardinfoId, winplayer3.id, table.lastGameId, "Winner", 0, 0, winningcoin, "Winner", "game", table.amount, table.players, 0, '');


						await TransactionChalWin.create({
							userId: mongoose.Types.ObjectId(winplayer3.id),
							tableId: table._id,
							gameId: table.lastGameId,
							coins: winningcoin,
							transType: 'WIN'
						});

						await Transactions.create({
							userName: players[winplayer3.id].playerInfo.userName,
							userId: mongoose.Types.ObjectId(winplayer3.id),
							receiverId: mongoose.Types.ObjectId(winplayer3.id),
							coins: winningcoin,
							reason: 'Game',
							trans_type: 'win'
						});

					}


				}

				await TransactionChalWin.create({
					userId: mongoose.Types.ObjectId(winoriginal.id),
					tableId: table._id,
					gameId: table.lastGameId,
					coins: totaltableamount,
					transType: 'WIN'
				});
				await Transactions.create({
					userName: players[winoriginal.id].playerInfo.userName,
					userId: mongoose.Types.ObjectId(winoriginal.id),
					receiverId: mongoose.Types.ObjectId(winoriginal.id),
					coins: totaltableamount,
					reason: 'Game',
					trans_type: 'win'
				});

				await gameAuditService.createAudit(table._id, table.cardinfoId, winoriginal.id, table.lastGameId, "Winner", 0, 0, totaltableamount, "Winner", "game", table.amount, table.players, 0, "");

		

				
				//totaltableamount = totaltableamount - winningcoin2;
				let commiss4 = (parseInt(totaltableamount) * parseInt(table.commission)) / 100;

				totaltableamount = totaltableamount - commiss4.toFixed(0);

				players[winoriginal.id].winner = true;
				players[winoriginal.id].winningAmount = totaltableamount;


				console.log("win amount : 5 : ", players[winoriginal.id].winningAmount, " totaltableamount :" ,totaltableamount);
				user = await User.findOne({
					_id: players[winoriginal.id].id
				});
				chipppp = user.chips + totaltableamount;
			
				await User.update({
					_id: user._id
				}, 
				{
					$set: {	chips: chipppp	},
					$inc: { winPoker: totaltableamount }
				}
			);

				players[winoriginal.id].playerInfo.chips = chipppp;



			} else {

				commission = commission/3;
				commission = commission.toFixed(0);
				await gameAuditService.createAudit(table._id, table.cardinfoId, winplayer.id, table.lastGameId, "Winner", 0, 0, players[winplayer.id].idle_amount, "Winner", "game", table.amount, table.players, 0, '');
				players[winplayer.id].winner = true;
				let amou1 =  players[winplayer.id].idle_amount;

				totaltableamount = totaltableamount - amou1;
				let commissiongg = (parseInt(amou1) * parseInt(table.commission)) / 100;
				amou1 = amou1 - commissiongg.toFixed(0);


				amou1 = amou1.toFixed(0);
				players[winplayer.id].winningAmount = amou1;
				console.log("win amount : 6 : ", amou1, " idle :" ,players[winplayer.id].idle_amount );
				let user = await User.findOne({
					_id: players[winplayer.id].id
				});

				chipppp = user.chips + amou1;
			//	totaltableamount = totaltableamount - amou1;
			
				await User.update({
					_id: user._id
				}, 
				{
					$set: {	chips: chipppp	},
					$inc: { winPoker: amou1 }
				}
			);

				players[winplayer.id].playerInfo.chips = chipppp;


				await TransactionChalWin.create({
					userId: mongoose.Types.ObjectId(winplayer.id),
					tableId: table._id,
					gameId: table.lastGameId,
					coins: amou1,
					transType: 'WIN'
				});

				await Transactions.create({
					userName: players[winplayer.id].playerInfo.userName,
					userId: mongoose.Types.ObjectId(winplayer.id),
					receiverId: mongoose.Types.ObjectId(winplayer.id),
					coins:amou1,
					reason: 'Game',
					trans_type: 'win'
				});


				if (players[winplayer.id].idle_amount < players[winplayer2.id].idle_amount) {

					players[winplayer2.id].winner = true;
					winningcoin = (players[winplayer2.id].idle_amount - players[winplayer.id].idle_amount)  ;
					winningcoin = winningcoin.toFixed(0);


					totaltableamount = totaltableamount - winningcoin;
					let commissionggss = (parseInt(winningcoin) * parseInt(table.commission)) / 100;
					winningcoin = winningcoin - commissionggss.toFixed(0);




					players[winplayer2.id].winningAmount = winningcoin;
					console.log("win amount : 8 : ", players[winplayer2.id].winningAmount, " idle :" ,players[winplayer2.id].idle_amount );
					user = await User.findOne({
						_id: players[winplayer2.id].id
					});

					chipppp = user.chips + winningcoin;
				
					
					await User.update({
						_id: user._id
					}, 
					{
						$set: {	chips: chipppp	},
						$inc: { winPoker: winningcoin }
					}
				);


					players[winplayer2.id].playerInfo.chips = chipppp;



					await TransactionChalWin.create({
						userId: mongoose.Types.ObjectId(winplayer2.id),
						tableId: table._id,
						gameId: table.lastGameId,
						coins: players[winplayer2.id].winningAmount,
						transType: 'WIN'
					});

					await Transactions.create({
						userName: players[winplayer2.id].playerInfo.userName,
						userId: mongoose.Types.ObjectId(winplayer2.id),
						receiverId: mongoose.Types.ObjectId(winplayer2.id),
						coins: players[winplayer2.id].winningAmount,
						reason: 'Game',
						trans_type: 'win'
					});


					await gameAuditService.createAudit(table._id, table.cardinfoId, winplayer2.id, table.lastGameId, "Winner", 0, 0, players[winplayer2.id].winningAmount, "Winner", "game", table.amount, table.players, 0, '');



				}


				await TransactionChalWin.create({
					userId: mongoose.Types.ObjectId(winoriginal.id),
					tableId: table._id,
					gameId: table.lastGameId,
					coins: totaltableamount,
					transType: 'WIN'
				});

				await Transactions.create({
					userName: players[winoriginal.id].playerInfo.userName,
					userId: mongoose.Types.ObjectId(winoriginal.id),
					receiverId: mongoose.Types.ObjectId(winoriginal.id),
					coins: totaltableamount,
					reason: 'Game',
					trans_type: 'win'
				});

				await gameAuditService.createAudit(table._id, table.cardinfoId, winoriginal.id, table.lastGameId, "Winner", 0, 0, totaltableamount, "Winner", "game", table.amount, table.players, 0, '');

			//	totaltableamount = totaltableamount - winningcoin;
				let commissionggssg = (parseInt(totaltableamount) * parseInt(table.commission)) / 100;
				totaltableamount = totaltableamount - commissionggssg.toFixed(0);


				players[winoriginal.id].winner = true;
				players[winoriginal.id].winningAmount = totaltableamount;
				console.log("win amount : 9 : ", players[winoriginal.id].winningAmount, " totaltableamount :" ,totaltableamount);
				user = await User.findOne({
					_id: players[winoriginal.id].id
				});
				chipppp = user.chips + totaltableamount;
			
				await User.update({
					_id: user._id
				}, 
				{
					$set: {	chips: chipppp	},
					$inc: { winPoker: totaltableamount }
				}
				);


				players[winoriginal.id].playerInfo.chips = chipppp;

			}

		} else {


			console.log("commission :  ", commission);

			//commission = commission/2;

			await TransactionChalWin.create({
				userId: mongoose.Types.ObjectId(winplayer.id),
				tableId: table._id,
				gameId: table.lastGameId,
				coins: players[winplayer.id].idle_amount,
				transType: 'WIN'
			});

			await Transactions.create({
				userName: players[winplayer.id].playerInfo.userName,
				userId: mongoose.Types.ObjectId(winplayer.id),
				receiverId: mongoose.Types.ObjectId(winplayer.id),
				coins: players[winplayer.id].idle_amount,
				reason: 'Game',
				trans_type: 'win'
			});

			await gameAuditService.createAudit(table._id, table.cardinfoId, winplayer.id, table.lastGameId, "Winner", 0, 0, players[winplayer.id].idle_amount, "Winner", "game", table.amount, table.players, 0, '');
			players[winplayer.id].winner = true;
			let winningamount = players[winplayer.id].idle_amount;
			totaltableamount = totaltableamount - winningamount;
			let commissiong = (parseInt(winningamount) * parseInt(table.commission)) / 100;
			commissiong = commissiong.toFixed(0);
			winningamount = players[winplayer.id].idle_amount - commissiong;

			players[winplayer.id].winningAmount = winningamount;
			console.log("win amount : 10 : ", players[winplayer.id].winningAmount, " idle :" ,players[winplayer.id].idle_amount + "  table amount : " );
			let user = await User.findOne({
				_id: players[winplayer.id].id
			});

			console.log("user chips : ",user.chips);
			chipppp = user.chips + winningamount;
		

			let commissions = (parseInt(totaltableamount) * parseInt(table.commission)) / 100;
			commissions = commissions.toFixed(0);
			totaltableamount = totaltableamount - commissions;
			console.log("win amount : commission : ", commission, " totaltableamount :" ,totaltableamount  , "  chips : ", chipppp);
		
			await User.update({
				_id: user._id
			}, 
			{
				$set: {	chips: chipppp	},
				$inc: { winPoker: winningamount }
			}
			);

			
			players[winplayer.id].playerInfo.chips = chipppp;



			await gameAuditService.createAudit(table._id, table.cardinfoId, winoriginal.id, table.lastGameId, "Winner", 0, 0, totaltableamount, "Winner", "game", table.amount, table.players, 0, '');


			await TransactionChalWin.create({
				userId: mongoose.Types.ObjectId(winoriginal.id),
				tableId: table._id,
				gameId: table.lastGameId,
				coins: totaltableamount,
				transType: 'WIN'
			});

			await Transactions.create({
				userName: players[winoriginal.id].playerInfo.userName,
				userId: mongoose.Types.ObjectId(winoriginal.id),
				receiverId: mongoose.Types.ObjectId(winoriginal.id),
				coins: totaltableamount,
				reason: 'Game',
				trans_type: 'win'
			});


			players[winoriginal.id].winner = true;
			players[winoriginal.id].winningAmount = totaltableamount;
			console.log("win amount : 11 : ", players[winoriginal.id].winningAmount, " totaltableamount :" ,totaltableamount);
			user = await User.findOne({
				_id: players[winoriginal.id].id
			});

			console.log("chips : ",user.chips ,"  totaltableamount : ", totaltableamount);
			chipppp = user.chips + totaltableamount;

			
			await User.update({
				_id: user._id
			}, 
			{
				$set: {	chips: chipppp	},
				$inc: { winPoker: totaltableamount }
			}
			);

			
			players[winoriginal.id].playerInfo.chips = chipppp;


		}

	} else {


		let totalwinamount = parseInt(totaltableamount / arr_winplayer.length);

		for (let ii in arr_winplayer) {
			let t_winplayer = arr_winplayer[ii];

			await TransactionChalWin.create({
				userId: mongoose.Types.ObjectId(t_winplayer.id),
				tableId: table._id,
				gameId: table.lastGameId,
				coins: totalwinamount,
				transType: 'WIN'
			});

			await Transactions.create({
				userName: players[t_winplayer.id].playerInfo.userName,
				userId: mongoose.Types.ObjectId(t_winplayer.id),
				receiverId: mongoose.Types.ObjectId(t_winplayer.id),
				coins: totalwinamount,
				reason: 'Game',
				trans_type: 'win'
			});

			await gameAuditService.createAudit(table._id, table.cardinfoId, t_winplayer.id, table.lastGameId, "Winner", 0, 0, totalwinamount, "Winner", "game", table.amount, table.players, 0, '');

			let commissions = (parseInt(totalwinamount) * parseInt(table.commission)) / 100;
			commissions = commissions.toFixed(0);
			totalwinamount = totalwinamount - commissions;


			players[t_winplayer.id].winner = true;
			players[t_winplayer.id].winningAmount = totalwinamount;
			console.log("win amount : 12 : ", players[t_winplayer.id].winningAmount , "  totalwinamount ",totalwinamount );
			let user = await User.findOne({
				_id: players[t_winplayer.id].id
			});

			let chipppp = user.chips + totalwinamount;
		

			await User.update({
				_id: user._id
			}, 
			{
				$set: {	chips: chipppp	},
				$inc: { winPoker: totalwinamount }
			}
			);

			

		//	console.log("Amounttt........... ", user._id, " chipsss  ", user.chips + " winning : " + totalwinamount + ".....................................................................................................................................");

		}


	}

	return players;


}


function getActivePlayers(players) {
	logger.info("Inside getActivePlayers");
	let count = 0;
	for (let player in players) {
		if (players[player].active && !players[player].packed && !players[player].idle) {
			count++;
		}
	}
	logger.info("Leaving getActivePlayers - count:" + count);
	return count;
}


function getOnlyActivePlayersforWinner(players) {
	logger.info("Inside getOnlyActivePlayers");
	let count = 0;
	for (let player in players) {
		if (players[player].active && !players[player].packed) {
			count++;
		}
	}
	logger.info("Leaving getOnlyActivePlayers - count:" + count);
	return count;
}



module.exports = {

	createset,
	WinnerDecide,
	calculatewinningamout,
	getActivePlayers,
	getOnlyActivePlayersforWinner
}