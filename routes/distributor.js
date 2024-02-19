const express = require("express");
const router = express.Router();

const authorize = require("../config/authorize");
const UserRole = require("./../constant/userRole");
const controller = require("./../controller/distributor");

router.post("/createDistributor", authorize(), controller.create);

router.get("/fetchAllDistributor", authorize(), controller.list);

router.put("/editDistributor", authorize(), controller.update);

router.delete("/deleteDistributor", authorize(UserRole.ADMIN), controller.remove);

module.exports = router;
