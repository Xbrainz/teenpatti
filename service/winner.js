let _ = require("lodash");
let mongoose = require("mongoose");
const Table = require("../model/table");
let CardInfo = require("./../model/cardInfo");
let User = require("../model/user");
const staticValue = require("../constant/staticValue");
const TransactionCommission = require("./../model/transactionCommission");

let TransactionChalWin = require("./../model/transactionChalWin");
let Transactions = require("./../model/transaction");
let transactionType = require("./../constant/transactionType");
let commonService = require("./common");
let commissionService = require("./commission");
let gameAuditService = require("./gameAudit");
let gameType = require('./../constant/gametype');
const thirdPartyAPICall = require('../service/thirdPartyAPICall/thirdPartyAPICall');
let auditType = require("../constant/audittype");
let threeJoker = require('./variations/threeJoker');
let Game = require("../model/game");


async function decideWinner(tableInfo, players, cardinfoId, showCards, showPlayerId, cb) {
	await Table.update({
		_id: tableInfo._id.toString()
	}, {
		$set: {
			gameInit: false,
			gameStarted: false,
			turnplayerId : ""
		},
	});
	let card = await CardInfo.findOne({
		_id: cardinfoId
	});
	let cardsInfo = card.info;
	//   let cardSets = [],
	//      msg = "";

	let cardSets = [],
		winnerCard,
		msg = '';
	let idleCardSets = [];
	let combinedCardSets = [];


	let Commissionplayerwise = 0;
	for (let key in players) {

		let variation = await commissionService.calculateCommission(tableInfo._id, key);
		//	console.log(variation);
		Commissionplayerwise = Number(Commissionplayerwise) + Number(variation);
		players[key].totalChalAmount = 0
	}

	//console.log("total commision player wise : " + Commissionplayerwise);
	//console.log(players);
	for (let player in players) {
		players[player].turn = false;
		if (players[player].active && !players[player].packed && !players[player].idle) {
			if (showCards) {
				players[player].cardSet.cards = cardsInfo[players[player].id].cards;
				players[player].cardSet.closed = false;
			}
			cardSets.push({
				id: players[player].id,
				set: cardsInfo[players[player].id].cards,
			});
		}
	}

	//	console.log(cardSets);


	//idle players card set with list
	for (let player in players) {
		players[player].turn = false;
		if (players[player].active && !players[player].packed && players[player].idle) {
			if (showCards) {
				players[player].cardSet.cards = cardsInfo[players[player].id].cards;
				players[player].cardSet.closed = false;
			}
			idleCardSets.push({
				id: players[player].id,
				set: cardsInfo[players[player].id].cards,
			});
		}
	}

	//	console.log(idleCardSets); 

	// Added winners based on game type
	// let winners = getWinners(tableInfo, players, cardSets, card.joker,card);

	/// get winner function
	let winners = [];
	if (cardSets.length === 1) {

		winners.push(players[cardSets[0].id]);
		msg = players[cardSets[0].id].playerInfo.displayName + " won the game.";

		// let getCardInfo = await CardInfo.findOne({ _id: args.current.cardInfo });
		//    let cardsInfo = card.info[players[cardSets[0].id].cards;


		combinedCardSets.push(cardSets[0]);


	} else {


		if (tableInfo.gameType == gameType.ThreeJoker) {

			let jokers = _.take(card.jokers, tableInfo.betRoundCompleted);
			let convertedCardSets = threeJoker.getGreatest(cardSets, jokers, tableInfo);
			for (let i = 0; i < convertedCardSets.length; i++) {
				players[convertedCardSets[i].set.id].newSet = [];
				players[convertedCardSets[i].set.id].newSet = convertedCardSets[i].set.newSet;
				if (convertedCardSets[i].winner === true) {
					winners.push(players[convertedCardSets[i].set.id]);
					winnerCard = convertedCardSets[i].set;
					//new logic
					combinedCardSets.push({
						id: convertedCardSets[i].set.id,
						set: players[convertedCardSets[i].set.id].newSet,
					});
				}
			}
		} else {

			let cardSetsWithWinners = commonService.variationWinner(
				tableInfo,
				cardSets,
				card.joker
			);
			for (let i = 0; i < cardSetsWithWinners.length; i++) {
				if (cardSetsWithWinners[i].set.newSet) {

					players[cardSetsWithWinners[i].set.id].newSet = [];
					players[cardSetsWithWinners[i].set.id].newSet = cardSetsWithWinners[i].set.newSet;
					if (cardSetsWithWinners[i].winner === true) {
						winnerCard = cardSetsWithWinners[i].set;
						winners.push(players[cardSetsWithWinners[i].set.id]);
						combinedCardSets.push({
							id: cardSetsWithWinners[i].set.id,
							set: players[cardSetsWithWinners[i].set.id].newSet,
						});
					}
				} else {

					players[cardSetsWithWinners[i].set.id].newSet = [];
					players[cardSetsWithWinners[i].set.id].newSet = cardSetsWithWinners[i].set.set;
					if (cardSetsWithWinners[i].winner === true) {
						winnerCard = cardSetsWithWinners[i].set;
						winners.push(players[cardSetsWithWinners[i].set.id]);
						combinedCardSets.push({
							id: cardSetsWithWinners[i].set.id,
							set: players[cardSetsWithWinners[i].set.id].newSet,
						});
					}
				}

			}
		}
	}







	let totalOriginalWinner = winners.length;

	if (showPlayerId != "" && winners.length > 1) {

		winners = winners.filter((winner) => winner.id !== showPlayerId);
	}


	


	let winnersAfterCombinedIdles = [];
	let countinueOldSteps = 0;
	let displayName = '';

	if (idleCardSets.length > 0) {

		for (i = 0; i < idleCardSets.length; i++) {
			combinedCardSets.push({
				id: idleCardSets[i].id,
				set: idleCardSets[i].set
			});
		}


	
		if (tableInfo.gameType == gameType.ThreeJoker) {

			let jokers = _.take(card.jokers, tableInfo.betRoundCompleted);
			let convertedCardSets = threeJoker.getGreatest(combinedCardSets, jokers, tableInfo);

			for (let i = 0; i < convertedCardSets.length; i++) {

				players[convertedCardSets[i].set.id].newSet = [];
				players[convertedCardSets[i].set.id].newSet = convertedCardSets[i].set.newSet;
				if (convertedCardSets[i].winner === true) {
					winnersAfterCombinedIdles.push(players[convertedCardSets[i].set.id]);
				}
			}
		} else {


			let convertedCardSets = commonService.variationWinner(
				tableInfo,
				combinedCardSets,
				card.joker
			);
			for (let i = 0; i < convertedCardSets.length; i++) {

				players[convertedCardSets[i].set.id].newSet = [];
				players[convertedCardSets[i].set.id].newSet = convertedCardSets[i].set.newSet;
				if (convertedCardSets[i].winner === true) {
					winnersAfterCombinedIdles.push(players[convertedCardSets[i].set.id]);
				}
			}


		}
	

		let totalIdlesWinners = 0;
		let totalPlayingWinners = 0;
		let totalIdleAmountToDeduct = 0;
		let idleIsGreater = false;
		let idleIsEqual = false;

		if (winnersAfterCombinedIdles.length > 0) {

			for (i = 0; i < winnersAfterCombinedIdles.length; i++) {
				if (players[winnersAfterCombinedIdles[i].id].idle == true) {
					totalIdlesWinners++;
					//totalIdleAmountToDeduct+=players[winnersAfterCombinedIdles[i].id].idle_amount;
				} else {
					totalPlayingWinners++;
				}
			}
		}
		//temp


		if (totalIdlesWinners == 0) {
			//same old logic for amount for winers

			countinueOldSteps = 1;

		} else {

			if (totalPlayingWinners == 0) {
				idleIsGreater = true;
			} else {
				idleIsEqual = true;
			}
			//when idle players is/are winner from combined cards set (greater cards then normal)
			if (idleIsGreater) {

				let totalCommissionAmt = 0;
				//set the idle rank and amount array for divide the amount 
				let idleAmountsArr = [];
				for (i = 0; i < winnersAfterCombinedIdles.length; i++) {

					if (players[winnersAfterCombinedIdles[i].id].idle == true) {

						idleAmountsArr.push({
							id: winnersAfterCombinedIdles[i].id,
							idle_amount: players[winnersAfterCombinedIdles[i].id].idle_amount,
						});
					}
				}
				idleAmountsArr.sort(function(a, b) {
					var keyA = a.idle_amount,
						keyB = b.idle_amount;
					// Compare the 2 dates
					if (keyA < keyB) return -1;
					if (keyA > keyB) return 1;
					return 0;
				});
				for (i = 0; i < idleAmountsArr.length; i++) {

					idleAmountsArr[i].idle_sequence = (i + 1);
					players[idleAmountsArr[i].id].idle_sequence = (i + 1);
				}

				for (i = 0; i < winnersAfterCombinedIdles.length; i++) {

					if (players[winnersAfterCombinedIdles[i].id].idle == true) {

						let winAmount = 0;
						let totalDecresedPlayer = winnersAfterCombinedIdles.length;
						for (j = 0; j < players[winnersAfterCombinedIdles[i].id].idle_sequence; j++) {

							let deductedIdleAmount = idleAmountsArr[j].idle_amount;
							if (j > 0) {

								deductedIdleAmount = idleAmountsArr[j].idle_amount - idleAmountsArr[j - 1].idle_amount;
							}
							winAmount = deductedIdleAmount / totalDecresedPlayer
							totalDecresedPlayer--;

							
						}
						

						winAmount = Math.round(winAmount);
						totalIdleAmountToDeduct += winAmount;
						
						players[winnersAfterCombinedIdles[i].id].winner = true;
						players[winnersAfterCombinedIdles[i].id].winningAmount = winAmount;
				
						winners.push(players[winnersAfterCombinedIdles[i].id]);
					}
				}

				let playingPlayerAmount = tableInfo.amount - totalIdleAmountToDeduct;
				for (let i = 0; i < winners.length; i++) {

					if (!players[winners[i].id].idle) {

						let amount = 0;
						amount = Math.round(parseInt(playingPlayerAmount / totalOriginalWinner));
						players[winners[i].id].winner = true;
						players[winners[i].id].winningAmount = Math.round(amount);

					}
				}
				//array for set commission and transations
				for (let i = 0; i < winners.length; i++) {

					let user = await User.findOne({
						_id: winners[i].id
					});

					let newCommission = Math.ceil((players[winners[i].id].winningAmount * tableInfo.commission) / 100);

				

					newCommission = Math.round((Commissionplayerwise * players[winners[i].id].winningAmount) / tableInfo.amount);



					totalCommissionAmt += newCommission;

					players[winners[i].id].winningAmount -= newCommission;
					winners[i].playerInfo.chips = user.chips;
					winners[i].playerInfo.chips += Math.round(players[winners[i].id].winningAmount);





					let winnerCardSet = winners[i].cardSet.cards;
					if (winners[i].newSet) {

						winnerCardSet = winners[i].newSet;
					}

					let amount = players[winners[i].id].winningAmount;

						await processTransaction(tableInfo, winners[i].id, amount, winnerCardSet)



					    await Transactions.create({
                        userName: user.userName,
                        userId: mongoose.Types.ObjectId(winners[i].id),
                        receiverId: mongoose.Types.ObjectId(winners[i].id),
                        coins: amount,
                        reason: 'Game',
                        trans_type: 'win'
                    });
				

					await gameAuditService.createAudit(tableInfo._id, tableInfo.cardinfoId, winners[i].id, tableInfo.lastGameId, auditType.WINNER, 0, 0, players[winners[i].id].playerInfo.chips, 'Won', 'Won', tableInfo.amount, players, winningAmount, winnerCard ? winnerCard.typeName : '');
			  

					   await User.update({ _id: winners[i].id }, {
					     $set: {
					          chips: parseInt(winners[i].playerInfo.chips),
					     },
						 
						$inc: {
								winTp: Math.round(players[winners[i].id].winningAmount)
						}

					   });
					displayName += winners[i].playerInfo.displayName + ","
				}

				let user = await User.findOne({
					_id: winners[0].id
				});
				   await Transactions.create({
                    userName: user.userName,
                    userId: winners[0].id,
                    senderId: mongoose.Types.ObjectId(winners[0].id),
                    receiverId: mongoose.Types.ObjectId("5ee4dbdb484c800bcc40bc04"),
                    coins: totalCommissionAmt,
                    reason: 'Game',
                    trans_type: 'Commission'
                });
				
				
			


			}
			//When all winners have equal cards with idle and normal players
			if (idleIsEqual) {

				let totalCommissionAmt = 0;
				//set the idle rank and amount array for divide the amount 
				let idleAmountsArr = [];
				for (i = 0; i < winnersAfterCombinedIdles.length; i++) {

					if (players[winnersAfterCombinedIdles[i].id].idle == true) {

						idleAmountsArr.push({
							id: winnersAfterCombinedIdles[i].id,
							idle_amount: players[winnersAfterCombinedIdles[i].id].idle_amount,
						});
					}
				}
				idleAmountsArr.sort(function(a, b) {
					var keyA = a.idle_amount,
						keyB = b.idle_amount;
					// Compare the 2 dates
					if (keyA < keyB) return -1;
					if (keyA > keyB) return 1;
					return 0;
				});
				for (i = 0; i < idleAmountsArr.length; i++) {

					idleAmountsArr[i].idle_sequence = (i + 1);
					players[idleAmountsArr[i].id].idle_sequence = (i + 1);
				}
				let totalIdleAmountToAdd = 0
				for (i = 0; i < winnersAfterCombinedIdles.length; i++) {

					if (players[winnersAfterCombinedIdles[i].id].idle == true) {

						let winAmount = 0;
						let totalDecresedPlayer = winnersAfterCombinedIdles.length;
						for (j = 0; j < players[winnersAfterCombinedIdles[i].id].idle_sequence; j++) {

							let deductedIdleAmount = idleAmountsArr[j].idle_amount;
							if (j > 0) {
								deductedIdleAmount = idleAmountsArr[j].idle_amount - idleAmountsArr[j - 1].idle_amount;
							}
							winAmount = deductedIdleAmount / totalDecresedPlayer
							totalDecresedPlayer--;
						}

						/*let idleAmount = players[winnersAfterCombinedIdles[i].id].idle_amount;*/
						//let commision = Math.ceil((winAmount * tableInfo.commission) / 100);
						winAmount = Math.round(winAmount);
						totalIdleAmountToDeduct += winAmount;
						//totalCommissionAmt+=commision;
						// winAmount = parseInt(winAmount - commision);
						totalIdleAmountToAdd += winAmount;
						players[winnersAfterCombinedIdles[i].id].winner = true;
						players[winnersAfterCombinedIdles[i].id].winningAmount = winAmount;

						winners.push(players[winnersAfterCombinedIdles[i].id]);


					}
				}
				//add amount of normal player win amount for idle amounts
				totalIdleAmountToDeduct += (totalIdleAmountToDeduct * totalOriginalWinner);

				let playingPlayerAmount = tableInfo.amount - totalIdleAmountToDeduct;
				for (let i = 0; i < winners.length; i++) {

					if (!players[winners[i].id].idle) {

						//let commissionAmount = (playingPlayerAmount * tableInfo.commission) / 100;
						//newCommission = Math.ceil(commissionAmount);
						//amount = playingPlayerAmount - newCommission;
						let amount = 0;
						amount = parseInt(playingPlayerAmount / totalOriginalWinner);
						amount = parseInt(amount + totalIdleAmountToAdd);
						players[winners[i].id].winner = true;
						players[winners[i].id].winningAmount = Math.round(amount);


					}
				}
				//totalCommissionAmt+=newCommission;
				//array for set commission and transations
				for (let i = 0; i < winners.length; i++) {

					let user = await User.findOne({
						_id: winners[i].id
					});

					let newCommission = Math.ceil((players[winners[i].id].winningAmount * tableInfo.commission) / 100);





					newCommission = (Commissionplayerwise * players[winners[i].id].winningAmount) / tableInfo.amount;

					newCommission = 0;
					totalCommissionAmt += newCommission;



					players[winners[i].id].winningAmount -= newCommission;
					winners[i].playerInfo.chips = user.chips;
					winners[i].playerInfo.chips += Math.round(players[winners[i].id].winningAmount);







					let amount = Math.round(players[winners[i].id].winningAmount);
					 await Transactions.create({
                        userName: user.userName,
                        userId: mongoose.Types.ObjectId(winners[i].id),
                        receiverId: mongoose.Types.ObjectId(winners[i].id),
                        coins: amount,
                        reason: 'Game',
                        trans_type: 'win'
                    });
    
					     await User.update({ _id: winners[i].id }, {
					          $set: {
					             chips: parseInt(winners[i].playerInfo.chips),
					        },
						
						 
						$inc: {
								winTp: Math.round(players[winners[i].id].winningAmount)
						}
					   });

					await gameAuditService.createAudit(tableInfo._id, tableInfo.cardinfoId, winners[i].id, tableInfo.lastGameId, auditType.WINNER, 0, 0, players[winners[i].id].playerInfo.chips, 'Won', 'Won', tableInfo.amount, players, winningAmount, winnerCard ? winnerCard.typeName : '');


					let winnerCardSet = winners[i].cardSet.cards;
					if (winners[i].newSet) {

						winnerCardSet = winners[i].newSet;
					}

						await processTransaction(tableInfo, winners[i].id, amount, winnerCardSet)


					displayName += winners[i].playerInfo.displayName + ","
				}


				let user = await User.findOne({
					_id: winners[0].id
				});
				    await Transactions.create({
                    userName: user.userName,
                    userId: winners[0].id,
                    senderId: mongoose.Types.ObjectId(winners[0].id),
                    receiverId: mongoose.Types.ObjectId("5ee4dbdb484c800bcc40bc04"),
                    coins: Commissionplayerwise,
                    reason: 'Game',
                    trans_type: 'Commission'
                });
			
			}
		}
	} else {
		countinueOldSteps = 1;

	}


	


	if (countinueOldSteps == 1) {

		let commissionAmount = (tableInfo.amount * tableInfo.commission) / 100;
		commissionAmount = Commissionplayerwise;
		let newCommission = Math.ceil(commissionAmount);
		let user = await User.findOne({
			_id: winners[0].id
		});


		await Transactions.create({
            userName: user.userName,
            userId: winners[0].id,
            senderId: mongoose.Types.ObjectId(winners[0].id),
            receiverId: mongoose.Types.ObjectId("5ee4dbdb484c800bcc40bc04"),
            coins: newCommission,
            reason: 'Game',
            trans_type: 'Commission'
        });
		


		//let displayName = '';
		let amount = tableInfo.amount - newCommission

		//OLD LOGIC OF WINNER WITHOUT ZERO CHIPS IN BETWEEN GAME
		amount = parseInt(amount / winners.length);
		for (let i = 0; i < winners.length; i++) {


			players[winners[i].id].winner = true;
			let winnerCardSet = winners[i].cardSet.cards;
			if (winners[i].newSet) {
				winnerCardSet = winners[i].newSet;
			}

			let winningAmount = amount; 
			await processTransaction(tableInfo, winners[i].id, amount, winnerCardSet)


			players[winners[i].id].winningAmount = winningAmount;
			user = await User.findOne({
				_id: winners[i].id
			});
			winners[i].playerInfo.chips = user.chips;


			winners[i].playerInfo.chips += Math.round(amount);

			
			await Transactions.create({
                userName: user.userName,
                userId: mongoose.Types.ObjectId(winners[i].id),
                receiverId: mongoose.Types.ObjectId(winners[i].id),
                coins: amount,
                reason: 'Game',
                trans_type: 'win'
            });


			await gameAuditService.createAudit(tableInfo._id, tableInfo.cardinfoId, winners[i].id, tableInfo.lastGameId, auditType.WINNER, 0, 0, players[winners[i].id].playerInfo.chips, 'Won', 'Won', tableInfo.amount, players, winningAmount, winnerCard ? winnerCard.typeName : '');
			  

			
			await User.update({ _id: winners[i].id }, {
				$set: {
				   chips: parseInt(winners[i].playerInfo.chips),
			  }, $inc: {
				  winTp: Math.round(players[winners[i].id].winningAmount)
		  		}
		 });



			displayName += winners[i].playerInfo.displayName + ","
			
		}





		
	}
	


	await User.update({
		isAdmin: true
	}, {
		$inc: {
			chips: (tableInfo.amount * 5) / 100,
			winTp :  (tableInfo.amount * 5) / 100
		}
		
	});

	if (winnerCard) {

		msg = [displayName.substr(0, (displayName.length - 1)), ' won with ', winnerCard.typeName].join('');
	}

	let isjackpot = false;
	if (tableInfo.gameType == 10) {
	
		if (winnerCard) {
			if (winnerCard.typeName == "Trail") {
				isjackpot = true;
			}
		}else{
			
			let type = "";
			if(cardSets.length == 1)
			{
			
				if(players[cardSets[0]["id"]].cardSeen)
				{
					type = commonService.getType(cardSets[0]).displayName;
					if (type == "Trail") {
						isjackpot = true;
						players[cardSets[0]["id"]].cardSet.cards = cardsInfo[cardSets[0]["id"]].cards;
						players[cardSets[0]["id"]].cardSet.closed = false;

					}

				}
				

			}
		
			
		}
	}








	cb(msg, players);
}

function getWinners(tableInfo, players, cardSets, joker, card) {

	return winners;
}

async function processTransaction(tableInfo, userId, amount, winnerCardSet) {

	// Update user win amount and add transactoin for it.



	let transactionChalWindata = {
		userId: mongoose.Types.ObjectId(userId),
		coins: amount,
		tableId: tableInfo._id,
		gameId: tableInfo.lastGameId,
		transType: transactionType.WIN,
		cardSet: winnerCardSet
	}


	//console.log(transactionChalWindata);
	const newTransactionChalWin = new TransactionChalWin(transactionChalWindata);
	newTransactionChalWin.save();
	//	await updateUserChips({_id: userId }, amount);

	return amount;
}

async function updateUserChips(condition, chips) {
	await User.update(condition, {
		$inc: {
			chips,
		},
	});
}

module.exports = {
	decideWinner,
};