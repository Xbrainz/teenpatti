const { agentwise, getCommissionByAgentId } = require("./agentwise");
const { distributorwise, getCommissionByDistributorId } = require("./distributorwise");
const { getCommissionByAdminId } = require("./adminCommission");
const { userwise } = require("./userwise");
const { tablewise } = require("./tablewise");
const { gamewise } = require("./gamewise");
const { gamewise2 } = require("./gamewise2");
const { turnover } = require("./turnover");
const { anteTablewise, anteTablewiseDetails, antePlayerwise, antePlayerwiseDetails } = require("./ante");
const { rakeTablewise, rakeTablewiseDetails, rakePlayerwise, rakePlayerwiseDetails } = require("./rake");
const { settlement } = require("./settlement");
const { playerHourly } = require("./playerHourly");
const { gameAudit} = require("./gameAudit");
const { gameAudit2} = require("./gameAudit2");
const { gameAuditgamewise} = require("./gameAuditgamewise");

module.exports = {
    agentwise,
    getCommissionByAgentId,
    distributorwise,
    getCommissionByDistributorId,
    getCommissionByAdminId,
    userwise,
    tablewise,
    gamewise,
    gamewise2,
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
    gameAudit,
    gameAudit2,
    gameAuditgamewise
}