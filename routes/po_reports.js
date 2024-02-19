const express = require("express");
const router = express.Router();

const authorize = require("../config/authorize");
const controller = require("./../controller/po_reports")

let TransactionChalWin = require("../poker/model/transactionChalWin");


router.get("/tablewise",  controller.tablewise);
router.get("/gamewise",  controller.gamewise);
router.get("/userwise",controller.userwise);
router.get("/hand/details", controller.gameAudit);





router.get("/alltransaction",  function (req, res) {
	
	const { startDate, endDate,  limit, skip ,gameId} = req.body;
	
	console.log("startdate" + startDate);
	   let finalStartDate = new Date(startDate);
    let finalEndDate = new Date(endDate);
	
		console.log("gameeee");
	console.log(gameId ,limit );
    TransactionChalWin.find(
	{
		"gameId" : gameId
		
    }
	
	, function (err, data) {
        if (err) {
            res.json({
                status: "error",
				datee : startDate,
                data: err,
            });
        } else {
            res.json({
                status: "success",
                data: data,
            });
        }
    }).sort({createdAt: -1}).limit(limit).skip(skip);
});




/*

///
router.get("/tablewise", authorize(), controller.tablewise);
router.get("/gamewise", authorize(), controller.gamewise);
router.get("/userwise", authorize(), controller.userwise);
router.get("/hand/details", authorize(), controller.gameAudit)


//// option
router.get("/rake/tablewise", authorize(), controller.rakeTablewise)
router.get("/rake/tablewise/details", authorize(), controller.rakeTablewiseDetails)
router.get("/rake/playerwise", authorize(), controller.rakePlayerwise)
router.get("/rake/playerwise/details", authorize(), controller.rakePlayerwiseDetails)

*/


module.exports = router;
