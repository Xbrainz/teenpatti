let mongoose = require("mongoose");

const GameAudit = require("../model/gameAudit");
//const AUDITTYPE = require("../constant/audittype");

async function createAudit(tableId, cardInfoId, userId, gameId, auditType, bet, betExtra, chipLeft, click, remark, potAmount, activePlayers, winAmount, winWith) {
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
    if (userId && userId != '') gameAudit.userId = userId;
    if (gameId && gameId != '') gameAudit.gameId = gameId;
        
    const newGameAudit = new GameAudit(gameAudit);
    await newGameAudit.save();
}

function getCardStatus(players, userId, auditType) {
    let cardStatus = "";
    if(players && userId && players[userId] && (auditType == "turn" || auditType == "Click")) {
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