let mongoose = require("mongoose");

const GameAudit = require("../model/gameAudit");
const AUDITTYPE = require("../constant/audittype");

async function createAudit(tableId, cardInfoId, userId, gameId, auditType, bet, betExtra, chipLeft, click, remark, potAmount, activePlayers, winAmount, winWith) {

    console.log("Active playerss .. " + getJoinedPlayerName(activePlayers)); 

    const gameAudit = {
        tableId,
        auditType,
        bet, 
        betExtra,
        chipLeft,
        cardStatus: getCardStatus(activePlayers, userId, auditType),
        click,
        remark,
        potAmount,
        activePlayers: getJoinedPlayerName(activePlayers),
        winAmount,
        winWith,
    }
    if (cardInfoId && cardInfoId != '') gameAudit.cardInfoId = cardInfoId;
	//   if (tableId && tableId != '') gameAudit.tableId = "62318ac093b9f8bd34b71c1b";
    if (userId && userId != '') gameAudit.userId = userId;
    if (gameId && gameId != '') gameAudit.gameId = gameId;
        
    const newGameAudit = new GameAudit(gameAudit);
  // console.warn("game audit : ", gameAudit);
    await newGameAudit.save();

}

function getCardStatus(players, userId, auditType) {
    let cardStatus = "";
    if(players && userId && players[userId] && (auditType == AUDITTYPE.USER_TURN || auditType == AUDITTYPE.SEE_BTN_CLICK)) {
        cardStatus = "Blind";
        if(players[userId].cardSeen) {
            cardStatus = "Card_Seen";
        }
    }
    return cardStatus;
}

function getJoinedPlayerName(players) {
    let usernames = '';
    for (let player in players) {
        if(!players[player].packed && players[player].active) {
            usernames += players[player].playerInfo.userName + ",";
        }
    }
    return usernames;
}

module.exports = {
    createAudit
}