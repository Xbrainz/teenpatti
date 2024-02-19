const { agentwise, getCommissionByAgentId } = require("./agentwise");
const { distributorwise, getCommissionByDistributorId } = require("./distributorwise");
const { getCommissionByAdminId } = require("./adminCommission");
const { userwise } = require("./userwise");
const { tablewise } = require("./tablewise");
const { gamewise } = require("./gamewise");
const { turnover } = require("./turnover");
const { anteTablewise, anteTablewiseDetails, antePlayerwise, antePlayerwiseDetails } = require("./ante");
const { rakeTablewise, rakeTablewiseDetails, rakePlayerwise, rakePlayerwiseDetails } = require("./rake");
const { settlement } = require("./settlement");
const { playerHourly } = require("./playerHourly");
const { gameAudit} = require("./gameAudit");

module.exports = {
    agentwise,
    getCommissionByAgentId,
    distributorwise,
    getCommissionByDistributorId,
    getCommissionByAdminId,
    userwise,
    tablewise,
    gamewise,
    turnover,
    anteTablewise,
    anteTablewiseDetails,
    antePlayerwise,
    antePlayerwiseDetails,
    rakeTablewise,
    rakeTablewiseDetails,
    rakePlayerwise,
    rakePlayerwiseDetails,
    settlement,
    playerHourly,
    gameAudit
}