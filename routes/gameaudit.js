const express = require("express");
const router = express.Router();
const Role = require("../config/role");
const UserRole = require("./../constant/userRole");
const authorize = require("../config/authorize");

let gameAuditService = require("../ludo/model/gameAudit");
let game = require("../ludo/model/game");


router.get("/fetchGameAudit",  async function (req, res) {

 
   
  
    const { startDate,
		endDate,
		skip,
		limit,
		startHour,
		startMin,
		endHour,
		endMin } =req.query;


        console.log("call apiss " , "asasas", startDate,
		endDate,
		skip,
		limit,
		startHour,
		startMin,
		endHour,
		endMin);

    let finalStartDate = new Date(startDate);
	let finalEndDate = new Date(endDate);


        const tables = await gameAuditService.find({  createdAt: {
        $gte: new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(),  parseInt(startHour), parseInt(startMin), 0),
        $lt: new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), parseInt(endHour), parseInt(endMin), 59),
    }})
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
           ;

            res.json({
                data: tables,
                status: "success",
            });   


});




router.get("/fetchgamewise",  async function (req, res) {

 
   
  
    const { startDate,
		endDate,
		skip,
		limit,
		startHour,
		startMin,
		endHour,
		endMin } =req.query;


        console.log("call apiss " , "asasas", startDate,
		endDate,
		skip,
		limit,
		startHour,
		startMin,
		endHour,
		endMin);

    let finalStartDate = new Date(startDate);
	let finalEndDate = new Date(endDate);


        const tables = await game.find({  createdAt: {
        $gte: new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), finalStartDate.getDate(),  parseInt(startHour), parseInt(startMin), 0),
        $lt: new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate(), parseInt(endHour), parseInt(endMin), 59),
    }})
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
           ;

            res.json({
                data: tables,
                status: "success",
            });   


});







module.exports = router;