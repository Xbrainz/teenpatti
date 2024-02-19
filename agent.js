const express = require("express");
const router = express.Router();

const authorize = require("../config/authorize");
const UserRole = require("./../constant/userRole");
const controller = require("./../controller/agent")

router.post("/createAgent", authorize(), controller.create);

router.get("/fetchAllAgent", authorize(), controller.list);

router.put("/editAgent", authorize(), controller.update);

router.delete("/deleteAgent", authorize(UserRole.ADMIN), controller.remove);

router.get("/distributor/:id", authorize(), controller.getByDistributorId);

module.exports = router;
