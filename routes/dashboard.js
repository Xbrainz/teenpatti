const express = require("express");
const router = express.Router();

const UserRole = require("../constant/userRole");
const authorize = require("../config/authorize");
const controller = require("../controller/dashboard");

router.get("/userCount", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), controller.dashboard);

module.exports = router;
