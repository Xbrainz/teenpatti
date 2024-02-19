var express = require("express");
var router = express.Router();

/* GET Menu. */
router.get("/", function (req, res) {
  console.log(req.body);
  res.render("gameMenu", {});
});
router.get("/page", function (req, res) {
  console.log(req.body);

  res.render("gameMenu.ajax.jade", {});
});

module.exports = router;
