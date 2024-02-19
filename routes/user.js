const express = require("express");
const router = express.Router();

const UserRole = require("../constant/userRole");
const authorize = require("../config/authorize");
const controller = require("../controller/user");

router.post("/updateUser", authorize(), controller.update);

router.get("/fetchAllUsers", controller.list);

//router.post("/loginold", controller.loginold);

router.post("/login", controller.login);

router.post("/verifyDevice", authorize(), controller.verifyDevice);

router.post("/adminLogin", controller.adminLogin);

router.post("/createUser", authorize(), controller.create);

router.post("/createUserApp", controller.create);

router.post("/editUserfromapp", authorize(), controller.editUserfromapp);

router.post("/editUser", controller.edit);

router.post("/getuserfromserver", authorize(), controller.getuserfromserver);

router.post("/editUserNew",  controller.editNew);

router.post("/deleteUser", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]),controller.remove);

router.post("/updateProfilePic", authorize(), controller.updateProfilePic);

router.post("/changePassword", authorize(), controller.changePassword);

router.post("/changeMPIN", authorize(), controller.changeMPIN);

router.post("/usersByType", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), controller.usersByType);

router.post("/getUserDetails",  controller.getUserDetails);

router.post("/usersByTypeMin1", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), controller.usersByTypeMin1);

router.post("/usersByTypeMin2", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), controller.usersByTypeMin2);

router.post("/usersByTypeMin1_withLimit", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), controller.usersByTypeMin1_withLimit);

router.post("/getUserFromApi", controller.getUserFromApi);

router.get("/listUsers", authorize([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.AGENT]), controller.listUsers);


router.post("/guestlogin", controller.guestlogin);

router.post("/checkDeviceId", controller.checkDeviceId);

module.exports = router;
