const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");

const controller = require('.././controller/rm_reports')

router.get("/hand/details", controller.gameAudit);
router.get("/tablewise", controller.tablewise);
router.get("/gamewise", controller.gamewise);
router.get("/userwise",authorize(), controller.userwise);


module.exports = router;