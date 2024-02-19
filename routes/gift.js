const express = require("express");
const router = express.Router();
const authorize = require("../config/authorize");
const Gift = require("./../model/gift");
const Role = require("../config/role");

router.post("/addGift", authorize(Role.Admin), async function (req, res) {
  try {
    const data = {
      name: req.body.name,
      price: req.body.price,
      display_name: req.body.display_name,
      pictureUrl: req.body.pictureUrl,
      mp3Url: req.body.mp3Url,
    };
    const getGift = await Gift.findOne({ name: data.name });
    if (getGift) {
      res.send(401, {
        success: false,
        message: "Gift Name Already Exist",
      });
    } else {
      const newGift = new Gift(data);
      const addGift = await newGift.save();

      res.send(200, {
        success: true,
        addGift,
        message: "Gift Add Successfull",
      });
    }
  } catch (err) {
    res.send({ success: false, message: err.name });
  }
});

router.get("/getGifts", authorize(Role.Admin), async function (req, res) {
  try {
    const Gifts = await Gift.find().sort({ createdAt: -1 });

    res.send(200, {
      success: true,
      Gifts,
      message: "Gifts Get Successfull",
    });
  } catch (err) {
    res.send({ success: false, message: err.name });
  }
});

router.post("/updateGift", authorize(Role.Admin), async function (req, res) {
  try {
    var giftId = req.body.giftId;
    const obj = req.body.obj;

    const gift = await Gift.findOneAndUpdate(
      { _id: giftId },
      { $set: obj },
      { new: true }
    );

    res.send(200, {
      success: true,
      gift,
      message: "Gifts Update Successfull",
    });
  } catch (err) {
    res.send({ success: false, message: err.name });
  }
});

router.post("/deleteGift", authorize(Role.Admin), async function (req, res) {
  try {
    const { giftId } = req.body;

    const gift = await Gift.findById({ _id: giftId });

    if (gift) {
      const deleteGift = await Gift.findByIdAndRemove(giftId).exec();

      res.send(200, {
        success: true,
        message: "Gift Delete Successfull",
      });
    } else {
      res.send(401, {
        success: false,
        message: "Gift Not Found",
      });
    }
  } catch (err) {
    res.send({ success: false, message: err.name });
  }
});

module.exports = router;
