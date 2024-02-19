let mongoose = require("mongoose");

const GameAudit = require("../model/gameAudit");
const AUDITTYPE = require("../constant/audittype");

async function createAudit(tableId,  userId, gameId, players,auditType,click,remark,winners) {

    const gameAudit = {
        tableId,
        winners,
        tokens : gettokenarray(players),
        auditType,
        click,
        remark,
        activePlayers: getJoinedPlayerName(players),
     
    }
    if (userId && userId != '') gameAudit.userId = userId;
    if (gameId && gameId != '') gameAudit.gameId = gameId;
    const newGameAudit = new GameAudit(gameAudit);
    await newGameAudit.save();
	
}

function gettokenarray(players)
{
 let usernames = [];
    for (let player in players) {
        let playerssstoken = [];
       
      
           
            playerssstoken.push(players[player].playerInfo.userName);
            playerssstoken.push(players[player].playerInfo.chips);
            playerssstoken.push(players[player].token_0);
            playerssstoken.push(players[player].token_1);
            playerssstoken.push(players[player].token_2);
            playerssstoken.push(players[player].token_3);
          
      
        usernames.push(playerssstoken);
    }
    return usernames;
}

function getChipppssss(players)
{
 let chipsss = [];
    for (let player in players) {
        let playerssstoken = [];
        playerssstoken.push(players[player].playerInfo.userName);
        playerssstoken.push(players[player].playerInfo.chips);
        chipsss.push(playerssstoken);

    }
    return chipsss;
}


function getJoinedPlayerName(players) {
    let usernames = '';
    for (let player in players) {
       
            usernames += players[player].playerInfo.userName + ",";
    
    }
    return usernames;
}

module.exports = {
    createAudit
}