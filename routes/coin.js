const express = require("express");
const router = express.Router();

const UserRole = require("../constant/userRole");
const authorize = require("../config/authorize");

const controller = require("../controller/coin");

router.post("/addCoin", authorize(), controller.create);

router.post("/removeCoin", authorize(), controller.remove);

module.exports = router;
