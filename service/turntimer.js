let _ = require("underscore");

let simpleVariation = require('./variations/simple');
let muflisVariation = require('./variations/muflis');
let AK47Variation = require('./variations/AK47');
let jokerVariation = require('./variations/joker');
let aflatoonVariation = require('./variations/aflatoon');
let fourCardVariation = require('./variations/fourCardNew');
//let fourCardVariation = require('./variations/fourCard');
let ThreeJokerVariation = require('./variations/threeJoker');
let gameType = require('./../constant/gametype');

let { startnewgameeee } = require("../service/common");

const auditType = require("../constant/audittype");
let newGameService = require("../service/newGame");
//let newGameService = require("./newGame");
let winnerService = require('../service/winner');
let playerService = require('../service/player');
let sideShowService = require('../service/sideShow');
let betService = require('../service/bet');

let gameAuditService = require("../service/gameAudit");
let seeMyCardService = require("../service/seeMyCard");
let TransactionChalWin = require("../model/transactionChalWin");
let TransactionGiftTip = require("../model/transactionGiftTip");
let transactionType = require("../constant/transactionType");
let Table = require("../model/table");
let CardInfo = require("../model/cardInfo");
let User = require("../model/user");



let { getLastActivePlayer,getRandom,getNextSlotForTurn,getNextActivePlayer } = require("../service/common");

var PlayerTimer ;

function SetTimer(userId,tableId, client)
{
	console.log("Settimer...... " + userId);
	clearTimeout(PlayerTimer);
	PlayerTimer = setTimeout(async function() {
		
		console.log("Settimer......endddddd " + userId);
		 let user = await User.findOne({ _id: userId });
		 let tablee = await Table.findOne({ _id: tableId });
		 
		 
		 
      
          if(tablee.players && tablee.players[userId])
          {
            let avialbleSlots = {};
            tablee.slotUsedArray.forEach(function (d) {
              avialbleSlots["slot" + d] = "slot" + d;
            });
            
           
			tablee.players = await betService.packPlayer(userId, tablee.players, avialbleSlots, tablee.maxPlayers, tablee);
			
	
			
            gameAuditService.createAudit(tablee._id, tablee.cardinfoId, userId, tablee.lastGameId, auditType.USER_TURN, 0, 0, tablee.players[userId].playerInfo.chips, 'Pack', 'Packed', tablee.amount, tablee.players, 0, '');
            
				  console.log("decide winner1111111111111111......8000 "  + tablee.gameStarted );		
				  
				  let bet = {
					  action : "Packed",
					  amount : 0,
					  show : false,
					  tableId : tableId,
					  blind : false
				  }
				  
				  
            if (getActivePlayers(tablee.players) < 2 && tablee.gameStarted) {
          //      console.log('inside if '+ getActivePlayers(players));   
              winnerService.decideWinner(tablee, tablee.players, tablee.cardinfoId, false, "", async function (message, players3) {
				  
                client.emit("playerPacked", {
                  bet:bet,
                  placedBy: userId,
                  players: players3,
                  table: tablee,
                });

                client.broadcast.to(tablee._id).emit("playerPacked", {
                  bet: bet,
                  placedBy:userId,
                  players:players3,
                  table: tablee,
                });

                client.emit("showWinner", {
                  message,
                  bet: bet,
                  placedBy: userId,
                  players: players3,
                  table: tablee,
                  packed: true,
                  activePlayerCount : 1,
                });

                client.broadcast.to(tablee._id).emit("showWinner", {
                  message,
                  bet: bet,
                  placedBy: userId,
                  players: players3,
                  table: tablee,
                  packed: true,
                  activePlayerCount : 1,
                });

                await Table.update({ _id: tablee._id }, { $set: { gameStarted: false, players: players3,amount : 0 } });
                              
                startNewGame(client, tablee._id, avialbleSlots);
              });
            } else {
		//		console.log('inside else '+ getActivePlayers(players));
		
              client.emit("playerPacked", {
                bet: bet,
                placedBy:userId,
                players: tablee.players,
                table: tablee,
              });
              client.broadcast.to(tablee._id).emit("playerPacked", {
                bet: bet,
                placedBy: userId,
                players: tablee.players,
                table: tablee,
              });
			  
			  for(let posi in  tablee.players)
					 {
						 if( tablee.players[posi].turn == true)
							 SetTimer( tablee.players[posi].id ,tablee._id,client );
					 }
            }
          }
		  
		  
		  
		  
		  
		
		
		
	}, 16000);
	
}




function ClearTimer(tableId)
{
	clearTimeout(PlayerTimer);
}


module.exports = {
    SetTimer,ClearTimer
}