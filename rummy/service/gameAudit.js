const GameAudit = require("../model/gameAudit");

async function createAudit(tableId, cardInfoId, userId, gameId, auditType, chipLeft, click, remark, potAmount, activePlayers, winAmount, winWith) {

    
     
//	await gameAuditService.createAudit(table._id, '', args.userId, table.lastGameId, "Reconnect", 0, " ", "", 0,table.players, 0, '');



    const gameAudit = {
        tableId,
        auditType,
        chipLeft,
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

function getJoinedPlayerName(players) {
    let usernames = '';
    for (let player in players) {
        if(!players[player].packed && players[player].active) {
            usernames += players[player].playerInfo.userName + ",";
        }

        // console.log("activePlaue----.....players....", usernames += players[player].playerInfo.userName + ",");
    }
    return usernames;
}

module.exports = {
    createAudit
}