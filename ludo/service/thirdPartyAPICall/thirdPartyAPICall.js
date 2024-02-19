const axiosAPICall = require('./axiosAPICall');
const constant = require('../../constant/constant');

const options = {
    headers: { 'X-OP-SECRET' : 'DEVREALGAMES', 
			   'X-OP-KEY' : 'REALGAMES',
			   'Content-Type' : 'application/json'},
};

function CheckUser(data) {
    console.log("urll.. ", constant.thirdPartyURL + "/checkuser/" +data);
    return axiosAPICall.getAPI(constant.thirdPartyURL + "/checkuser/" +data );
}

function GetBalance(data) {
    return axiosAPICall.getAPI(constant.thirdPartyURL + "/balance/" +data );
}


function SendTip(data) {
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/Tip",data , options);
}


function GameInitiate(data) {
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/game/init",data , options);
}


function PlaeBet(data) {
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/order/place",data , options);
}


function DecideWinner(data) {
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/ResultDeclare/declare",data , options);
}


function JackPotWinner(data) {
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/resultjackpot/jackpot",data , options);
}

function JackPotWinner(data) {
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/resultjackpot/jackpot",data , options);
}

function LudoWinner(data)
{

    console.log("url  ", constant.thirdPartyURL + "/MultiWinnerResult/declare");
    return axiosAPICall.postAPI(constant.thirdPartyURL + "/MultiWinnerResult/declare",data , options);
}


module.exports = {
   CheckUser,SendTip,GetBalance,GameInitiate,PlaeBet,DecideWinner,JackPotWinner,LudoWinner
}