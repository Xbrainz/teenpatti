function decideWinner2Player(data, tableId, table, cardInfoId, cardInfoId, cardInfo, openedCard, pointValue) {
    let winningAmount;
    let declarePlayer;
    let opponentPlayer;
    let winner;
    let looser;

    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
        if (Object.keys(updatedPlayers)[i] == data.player.id) {
            declarePlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
            // declarePlayer.cards = staticCards;                  //.############################ STATIC CARDS #######################
            let playerPoints = groupPointCounter(declarePlayer.cards, cardInfo.joker);
            console.log("playerPoints.cardsetPoints : ", playerPoints.cardsetPoints);
            // updatedPlayers[Object.keys(updatedPlayers)[i]].cards = playerPoints.cards;
            if (playerPoints.totalPoints == null) {
                playerPoints.totalPoints = 0;
            }
            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;
            if (!updatedPlayers[Object.keys(updatedPlayers)[i]].winner) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].winner = Boolean;
            }
            if (!updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = Boolean;
            }
            updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;

        // }  
        } else {
            opponentPlayer = updatedPlayers[Object.keys(updatedPlayers)[i]];
            // console.log("opponentPlayer.cards : ", opponentPlayer.cards);
            let playerPoints = groupPointCounter(opponentPlayer.cards, cardInfo.joker);
            updatedPlayers[Object.keys(updatedPlayers)[i]].cards = playerPoints.cards;
            updatedPlayers[Object.keys(updatedPlayers)[i]].totalPoints = playerPoints.totalPoints;
            updatedPlayers[Object.keys(updatedPlayers)[i]].cardsetPoints = playerPoints.cardsetPoints;
            if (!updatedPlayers[Object.keys(updatedPlayers)[i]].winner) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].winner = Boolean;
            }
        }
    }

    if (declarePlayer.totalPoints == 0) {
        declarePlayer.winner = true;
        declarePlayer.playerInfo.winner = true;
        opponentPlayer.winner = false;
        opponentPlayer.playerInfo.winner = false;
        declarePlayer.wrongDeclare = false;
    } else {
        declarePlayer.winner = false;
        declarePlayer.playerInfo.winner = false;
        opponentPlayer.playerInfo.winner = true;
        opponentPlayer.winner = true;
        declarePlayer.wrongDeclare = true;
    }

    if (declarePlayer.wrongDeclare == true) {
        for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
            updatedPlayers[Object.keys(updatedPlayers)[i]].playerDeclared = true;    
        }
        updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = true;
        updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = true;
    }

    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == declarePlayer.id) {
            updatedPlayers[Object.keys(updatedPlayers)[i]] = declarePlayer;
        } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == opponentPlayer.id) {
            updatedPlayers[Object.keys(updatedPlayers)[i]] = opponentPlayer;
        } else {
            console.log("Something wrong with winnerId and opponentId");
        }

        if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == true) {
            winner = updatedPlayers[Object.keys(updatedPlayers)[i]];
        } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].winner == false) {
            looser = updatedPlayers[Object.keys(updatedPlayers)[i]];
        }
    };

    console.log("looser.totalPoints : ", looser.totalPoints);
    if (looser.totalPoints > 80) {
        winningAmount = 80 * pointValue;
    } else if (looser.totalPoints <= 80 && looser.totalPoints >= 0) {
        winningAmount = looser.totalPoints * pointValue;
    }

    console.log("pointValue : ", pointValue);
    let commissionAmount = (winningAmount * table.commission) / 100
    winningAmount = winningAmount - commissionAmount;
    // winningAmount = winningAmount.toFixed(0);

    for (let i = 0; i < Object.keys(updatedPlayers).length; i++) {
        if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == winner.id) {
            updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (winningAmount + table.boot);
            updatedPlayers[Object.keys(updatedPlayers)[i]].winningAmount = winningAmount;
            await Players.findOneAndReplace({ _id: winner.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
        } else if (updatedPlayers[Object.keys(updatedPlayers)[i]].id == looser.id) {
            if (table.boot > (winningAmount + commissionAmount)) {
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += (table.boot - winningAmount - commissionAmount);
                updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = winningAmount + commissionAmount;
                await Players.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
            } else {
                let substractAmount = table.boot - (winningAmount + commissionAmount);
                updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo.chips += substractAmount;
                updatedPlayers[Object.keys(updatedPlayers)[i]].losingAmount = winningAmount + commissionAmount;
                await Players.findOneAndReplace({ _id: looser.id }, updatedPlayers[Object.keys(updatedPlayers)[i]].playerInfo);
            }
        }
    };

    let newInfo = {
        updatedPlayers: updatedPlayers,
        winner: winner
    }
    await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
    data.updatedPlayers = updatedPlayers;
    data.openedCard = openedCard;

    client.emit("showWinner", data);
    console.log("SHOW WINNER EMITS : ");
    client.broadcast.to(tableId).emit("showWinner", data);

    await Table.updateOne({ _id: tableId }, { $set: { gameStarted: false } }, { upsert: true });
    console.log("player111 playerDeclare &*&*&*& : ", updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared);
    console.log("player222 playerDeclare &*&*&*& : ", updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared);

    if (updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared == true && updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared == true) {
        updatedPlayers[Object.keys(updatedPlayers)[0]].playerDeclared = false;
        updatedPlayers[Object.keys(updatedPlayers)[1]].playerDeclared = false;
        await CardInfo.updateOne({ _id: cardInfoId }, { $set: { info: newInfo } }, { upsert: true });
        newGameService.startNewGame(client, tableId, availableSlots);
    }
};

function decideWinnerMorethan2Player( ) {

};



module.exports = { decideWinner2Player, decideWinnerMorethan2Player };