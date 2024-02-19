const express = require("express");
const router = express.Router();

const authorize = require("../config/authorize");
const controller = require("./../controller/reports")

router.get("/turnover", authorize(), controller.turnover);
router.get("/tablewise", authorize(), controller.tablewise);
router.get("/gamewise", authorize(), controller.gamewise);
router.get("/agentwise", authorize(), controller.agentwise);
router.get("/distributorwise", authorize(), controller.distributorwise);
router.get("/userwise", authorize(), controller.userwise);

router.get("/commission/agent", authorize(), controller.getCommissionByAgentId)
router.get("/commission/distributor", authorize(), controller.getCommissionByDistributorId)
router.get("/commission/admin", authorize(), controller.getCommissionByAdminId)

router.get("/ante/tablewise", authorize(), controller.anteTablewise)
router.get("/ante/tablewise/details", authorize(), controller.anteTablewiseDetails)
router.get("/ante/playerwise", authorize(), controller.antePlayerwise)
router.get("/ante/playerwise/details", authorize(), controller.antePlayerwiseDetails)

router.get("/rake/tablewise", authorize(), controller.rakeTablewise)
router.get("/rake/tablewise/details", authorize(), controller.rakeTablewiseDetails)
router.get("/rake/playerwise", authorize(), controller.rakePlayerwise)
router.get("/rake/playerwise/details", authorize(), controller.rakePlayerwiseDetails)

router.get("/settlement", authorize(), controller.settlement)
router.get("/player/hourly", authorize(), controller.playerHourly)

router.get("/hand/details", authorize(), controller.gameAudit)





module.exports = router;
