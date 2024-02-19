const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Role = require("../config/role");
const authorize = require("../config/authorize");
const User = require("./../model/User");
const Table = require("./../model/Table");
// const CardInfo = require("./../model/cardInfo");
// const Game = require("./../model/game");
const Coins = require("./../model/coins");
const Transaction = require("./../model/transaction");
const secret = "developersecretcode";

router.get("/", function (req, res) {
  res.send("respond with a resource");
});

// router.get("/createTable", function (req, res) {
//   var name = req.query.name;
//   DAL.db.query("insert into gameTable set name=?", [name], function (
//     err,
//     data
//   ) {
//     if (err) {
//       res.json({
//         status: "error",
//         data: "not created",
//       });
//     } else {
//       DAL.db.query("select * from gameTable where name=?", [name], function (
//         err,
//         data
//       ) {
//         if (err) {
//           res.json({
//             status: "error",
//             data: "not fetched",
//           });
//         } else {
//           // console.log((data[0].tableId).toString())
//           // io.create((data[0].tableId).toString());
//           res.json({
//             status: "success",
//             data: { tableId: data[0].tableId, name: name },
//           });
//         }
//       });
//     }
//   });
// });

router.post("/updateUser", authorize(), async function (req, res) {
  var clientId = req.body.clientId;
  var userId = req.body.userId;
  var tableId = req.body.tableId;
  let table = await Table.findOne({ _id: tableId });
  let playersLength;
  if (table.players == null) {
    playersLength = 0;
  } else {
    playersLength = Object.keys(table.players).length;
  }
  User.findOneAndUpdate(
    { _id: userId },
    { $set: { clientId: clientId } },
    { new: true },
    function (err, result) {
      if (err) {
        res.json({
          status: "error",
          data: "not updated",
        });
      } else {
        res.json({
          totalpayer: playersLength,
          result,
          status: "success",
          data: "Inserted",
        });
      }
    }
  );
});

// router.get("/getMyData", function (req, res) {
//   User.findOne({ _id: req.query.userId }, function (err, user) {
//     res.json({
//       status: "success",
//       data: user,
//     });
//   });
// });

// router.get("/restartTable", function (req, res) {
//   Table.update(
//     { _id: "5a6c91e82ccf76abdbd0b8ca" },
//     {
//       $set: {
//         playersLeft: 0,
//         amount: 0,
//         slotUsed: 0,
//         gameStarted: false,
//         players: null,
//       },
//     },
//     function (err, data) {
//       console.log("vacent");
//       res.json("Table Has been restarted");
//     }
//   );
// });

router.get("/fetchTables", authorize(), function (req, res) {
  Table.find({}, function (err, data) {
    if (err) {
      res.json({
        status: "error",
        data: "can not get",
      });
    } else {
      res.json({
        status: "success",
        data: data,
      });
    }
  });
});

router.get("/fetchAllUsers", authorize(), function (req, res) {
  User.find({}, function (err, data) {
    if (err) {
      res.json({
        status: "error",
        data: "can not get",
      });
    } else {
      res.json({
        status: "success",
        data: data,
      });
    }
  });
});

// router.post("/register", function (req, res) {
//   var user;
//   if (req.body.userName) {
//     DAL.db.query(
//       "select * from  user  where userName=?",
//       [req.body.userName],
//       function (err, users, fields) {
//         //logger.info('user update result: ' + users);
//         if (!users || users.length === 0) {
//           user = {
//             displayName: req.body.userName,
//             userName: req.body.userName,
//             chips: 250000,
//           };
//           var data = [];
//           DAL.db.query(
//             "insert  into user set  userName=?,displayName=?,chips=?",
//             [req.body.userName, req.body.userName, 250000],
//             function (err, userr) {
//               //logger.info("inserted", user)
//               res.json({
//                 status: "success",
//                 data: user,
//               });
//             }
//           );
//         } else {
//           user = users[0];
//           res.json({
//             status: "success",
//             data: user,
//           });
//         }
//       }
//     );
//   } else {
//     res.json({
//       status: "failed",
//     });
//   }
// });

router.post("/login", async function (req, res, next) {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName: userName });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        status: "error",
        message: "Username or password is incorrect",
      });
    }

    // Check player is exists in game or not
    let tablePlayers = await Table.find({}, { players:1 });
    for(let i=0; i<tablePlayers.length; i++) {
      if(tablePlayers[i].players && tablePlayers[i].players != null) {
        let playerIds = Object.keys(tablePlayers[i].players);
        const found = playerIds.find(playerId => playerId === user.id);
        if(found) {
          return res.status(409).json({
            status: "error",
            message: "User is already logged in with another device.",
          });
        }
      }
    }

    await User.findOneAndUpdate(
      { _id: user.id },
      { $set: { deviceId: req.body.deviceId } },
      { new: true }
    )
      .then((data) => {
        // authentication successful so generate jwt and refresh tokens
        const jwtToken = generateJwtToken(user);

        return res.json({
          status: "success",
          jwtToken,
          data,
        });
      })
      .catch(next);
  } catch (err) {
    console.log(err);
    next();
  }
});

router.post("/totalplayer", authorize(), async function (req, res) {
  var tableId = req.body.tableId;
  let table = await Table.findOne({ _id: tableId });
  let playersLength;
  if (table.players == null) {
    playersLength = 0;
  } else {
    playersLength = Object.keys(table.players).length;
  }
  res.json({
    totalpayer: playersLength,
    status: "success",
  });
});

router.post("/verifyDevice", authorize(), async function (req, res) {
  const { userName, deviceId } = req.body;
  const user = await User.findOne({ userName });

  if (user.deviceId === deviceId) {
    res.json({
      success: true,
    });
  } else {
    res.json({
      success: false,
      message: "Device does not match",
    });
  }
});

router.post("/adminLogin", async function (req, res, next) {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName: userName });
	
	if (!user || !bcrypt.compareSync(password, user.password)) {
	  return res.status(401).json({
		status: "error",
		message: "Username or password is incorrect"
	  });
	}
	/*
	*/
    if (user && user.isAdmin) {
      await User.findOneAndUpdate(
        { _id: user.id },
        { $set: { deviceId: req.body.deviceId } },
        { new: true }
      )
        .then((data) => {
          // authentication successful so generate jwt and refresh tokens
          const jwtToken = generateJwtToken(user);

          return res.json({
            status: "success",
            message: "Successfully Login",
            jwtToken,
            data,
          });
        })
        .catch(next);
    } else {
      res.json({
        status: "failed",
        message: "Wrong username / password",
      });
    }
  } catch (err) {
    console.log(err);
    next();
  }
});

// router.post("/freeUserLogin", async function (req, res) {
// const { userName } = req.body;

// const user = await User.findOne({ userName: userName });
// if (user) {
// res.send(200, {
// success: true,
// user,
// });
// } else {
// const newUser = new User(req.body);
// const addedUser = await newUser.save();
// res.send(200, {
// success: true,
// addedUser,
// });
// }
// });

router.post("/getAdminTransaction", authorize(), async function (req, res) {
  try {
    const { userId } = req.body;
    const { skip } = req.body;
    const { limit } = req.body;
    if (userId) {
      const data = await Transaction.find({ receiverId: userId, trans_type: { $nin: ["recharge", "rechargeRevert"] } })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      res.send(200, {
        success: true,
        data,
      });
    } else {
      res.send({ success: false, message: "userId not found" });
    }
  } catch (err) {
    res.send(401, { success: false, message: err.name });
  }
});

router.post("/getAdminRechargeTransaction", authorize(Role.Admin), async function (req, res) {
  try {
    const { type } = req.body;
    const { skip } = req.body;
    const { limit } = req.body;
    let trans_type = [];
    if(type === 'recharge' || type === 'rechargeRevert') {
      trans_type.push(type);
    } else {
      trans_type.push("recharge");
      trans_type.push("rechargeRevert");
    }

    let rechargeTransactionTotal = await Transaction.aggregate([{
          "$match": { "trans_type": "recharge" }
      },
      { "$group": {
          _id: null,
          totalValue: { $sum: "$coins" }
      }
    }]);
    let rechargeTotal = rechargeTransactionTotal[0].totalValue;

    const rechargeTransaction = await Transaction.find({ trans_type: { $in: trans_type }}).skip(skip).limit(limit).sort({ createdAt: -1 });
    res.send(200, {
      success: true,
      rechargeTransaction,
      rechargeTotal
    });
    
  } catch (err) {
    res.send(401, { success: false, message: err.name });
  }
});

router.post("/getAdminRechargeTransactionDatewise", authorize(Role.Admin), async function (req, res) {
  try {
    const rechargeTransaction = await Transaction.aggregate([{
          "$match": { "trans_type": "recharge" }
      },
      { "$group": {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalCoins: { $sum: "$coins" }
      }
    }, {$sort:{"_id":-1}}]);
    let response = [];
    for(let i = 0; i < rechargeTransaction.length; i++) {
      response.push({
        date: rechargeTransaction[i]._id,
        totalCoins: rechargeTransaction[i].totalCoins
      })
    }
    res.send(200, {
      success: true,
      response,
    });
    
  } catch (err) {
    res.send(401, { success: false, message: err.name });
  }
});

router.post("/getAdminGiftTipTransactionDatewise", authorize(Role.Admin), async function (req, res) {
  try {
      const rechargeTransaction = await Transaction.aggregate([{
          "$match": { $or:[{"trans_type": "gift"}, {"trans_type": "Tip"}, {"trans_type": "Commission"}] }
      },
      { "$group": {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalCoins: { $sum: "$coins" }
      }
    }, {$sort:{"_id":-1}}]);
    let response = [];
    for(let i = 0; i < rechargeTransaction.length; i++) {
      response.push({
        date: rechargeTransaction[i]._id,
        totalCoins: rechargeTransaction[i].totalCoins
      })
    }
    res.send(200, {
      success: true,
      response,
    });
    
  } catch (err) {
    res.send(401, { success: false, message: err.name });
  }
});

router.post("/userTransactions", authorize(Role.Admin), async function (req, res) {
  try {
    const { userId } = req.body;
    const { skip } = req.body;
    const { limit } = req.body;
    if (userId) {
      const userTransactions = await Transaction.find({ userId: userId })
        .skip(skip)
        .limit(limit)
	    .sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        userTransactions,
      });
    } else {
      res.status(200).json({ success: false, message: "userId not found" });
    }
  } catch (err) {
    res.status(401).json({ success: false, message: err });
  }
});

router.get("/hitHighest", function (req, res) {
  var cardSet = [
    {
      set: [
        {
          type: "heart",
          rank: 6,
          name: "6",
          priority: 6,
          id: 0.821374815702129,
        },
        {
          type: "diamond",
          rank: 5,
          name: "5",
          priority: 5,
          id: 0.924271319640736,
        },
        {
          type: "heart",
          rank: 9,
          name: "9",
          priority: 9,
          id: 0.709345920038595,
        },
      ],
    },
  ];
  Table.makeMeHighest(cardSet, 12, function (cards) {
    res.json({ newCard: cards });
  });
});

router.get("/dashboard", authorize(Role.Admin), function (req, res) {
  User.count({}, function (err, user) {
    Table.count({}, function (err, table) {
      User.find({}, function (err, allUser) {
        var obj = {
          numberOfUser: user,
          numberOfTable: table,
          userDetails: allUser,
        };
        res.json({ success: true, data: obj });
      });
    });
  });
});

router.post("/createUser", async function (req, res) {
  try {
    const password = await bcrypt.hash(req.body.password, 10);
    var data = {
      userName: req.body.userName,
      password: password,
      chips: req.body.chips,
      profilePic: req.body.profilePic,
      type: req.body.type,
      mobile: req.body.mobile,
      role: req.body.role,
      displayName: req.body.displayName,
    };

    const user = await User.findOne({ userName: req.body.userName });
    if (user) {
      return res.send(401, {
        success: false,
        message: "User already exist",
      });
    }
    const newUser = new User(data);
    const addedUser = await newUser.save();

    if (addedUser.id) {
      let adminId = "5ee4dbdb484c800bcc40bc04";
      const transactionData = {
        userName: addedUser.userName,
        userId: addedUser.id,
        senderId: mongoose.Types.ObjectId(adminId),
        receiverId: addedUser.id,
        trans_type: "recharge",
        coins: addedUser.chips,
      };
      const data = new Transaction(transactionData);
      const newTransaction = await data.save();
    }

    res.send(200, {
      success: true,
      addedUser,
      message: "User Created Successfull",
    });
  } catch (err) {
    res.send(401, {
      success: false,
      message: err.message,
    });
  }
});


router.post("/editUserfromapp", authorize(), async function (req, res) {
  try {
   
	  const { userId } = req.body._id;

    // var passwordEncr = await bcrypt.hash(obj.password, 10);
    var data = {
      displayName: req.body.displayName,
      userName: req.body.userName,
      // password: passwordEncr,
      mobile: req.body.mobile,
      profilePic: req.body.profilePic,
      type: req.body.type,
      role: req.body.role,
    };
    await User.update({ _id: userId }, data, function (err, table) {
      if (err) {
        res.json({ success: false, msg: "error", data: "" });
      } else {
        res.json({ success: true, msg: "edited", data: "edited" });
      }
    });
  } catch (err) {
    res.send(401, {
      success: false,
      message: err.message,
    });
  }
});


router.post("/editUser", authorize(), async function (req, res) {
  try {
    let { userId, obj } = req.body;
    // var passwordEncr = await bcrypt.hash(obj.password, 10);
    var data = {
      displayName: obj.displayName,
      userName: obj.userName,
      // password: passwordEncr,
      mobile: obj.mobile,
      profilePic: obj.profilePic,
      type: obj.type,
      role: obj.role,
    };
    await User.update({ _id: userId }, data, function (err, table) {
      if (err) {
        res.json({ success: false, msg: "error", data: "" });
      } else {
        res.json({ success: true, msg: "edited", data: "edited" });
      }
    });
  } catch (err) {
    res.send(401, {
      success: false,
      message: err.message,
    });
  }
});

router.post("/createTable", authorize(), function (req, res) {
  var slotArray = [];
  for (var i = 1; i <= 5; i++) {
    slotArray.push(i);
  }
  var obj = {
    name: req.body.name,
    maxPlayers: req.body.maxPlayers,
    slotUsed: req.body.slotUsed,
    boot: req.body.boot,
    maxBet: req.body.maxBet,
    potLimit: req.body.potLimit,
    type: req.body.tableType,
    slotUsedArray: slotArray,
    gameType: req.body.gameType,
    isShowAvailable: req.body.isShowAvailable,
    type: req.body.type,
    color: req.body.color,
    color_code: req.body.color_code,
    tableSubType: req.body.tableSubType,
    password: req.body.password,
    commission: req.body.commission,
  };

  Table.create(obj, function (err, table) {
    if (err) {
      res.json({ success: false, msg: "error", data: "" });
    } else {
      res.json({ success: true, msg: "created", data: "created" });
    }
  });
});

router.post("/editTable", authorize(), function (req, res) {
  var tableId = req.body.tableId;
  var obj = req.body.obj;
  Table.update({ _id: tableId }, obj, function (err, table) {
    if (err) {
      res.json({ success: false, msg: "error", data: "" });
    } else {
      res.json({ success: true, msg: "edited", data: "edited" });
    }
  });
});

router.post("/addCoin", authorize(Role.Admin), function (req, res) {
  var userId = req.body.userId;
  var coins = req.body.coins;
  Coins.create({ userId: userId, coins: coins }, function (err, done) {
    User.update({ _id: userId }, { $inc: { chips: coins } }, function (
      err,
      table
    ) {
      if (err) {
        res.json({ success: false, msg: "error", data: "" });
      } else {
        User.update(
          { isAdmin: true },
          { $inc: { chips: coins * -1 } },
          async function (err, table) {
            if (err) {
              res.json({ success: false, msg: "error", data: "" });
            } else {
              let user = await User.findOne({ _id: userId });
              Transaction.create(
                {
                  userName: user.userName,
                  senderId: mongoose.Types.ObjectId("5ee4dbdb484c800bcc40bc04"),
                  userId: req.body.userId,
                  receiverId: req.body.userId,
                  trans_type: "recharge",
                  coins: coins,
                  reason: "admin",
                },
                function (err, table) {
                  if (err) {
                    res.json({ success: false, msg: "error", data: "" });
                  } else {
                    res.json({ success: true, msg: "success", data: "added" });
                  }
                }
              );
            }
          }
        );
      }
    });
  });
});

router.post("/removeCoin", authorize(Role.Admin), function (req, res) {
  var userId = req.body.userId;
  var coins = req.body.coins * -1;
  Coins.create({ userId: userId, coins: coins }, function (err, done) {
    User.update({ _id: userId }, { $inc: { chips: coins } }, function (
      err,
      table
    ) {
      if (err) {
        res.json({ success: false, msg: "error", data: "" });
      } else {
        User.update(
          { isAdmin: true },
          { $inc: { chips: coins * -1 } },
          async function (err, table) {
            if (err) {
              res.json({ success: false, msg: "error", data: "" });
            } else {
              let user = await User.findOne({ _id: userId });
              Transaction.create(
                {
                  userName: user.userName,
                  userId: req.body.userId,
                  senderId: req.body.userId,
                  receiverId: mongoose.Types.ObjectId(
                    "5ee4dbdb484c800bcc40bc04"
                  ),
                  trans_type: "rechargeRevert",
                  coins: coins,
                  reason: "admin",
                },
                function (err, table) {
                  if (err) {
                    res.json({ success: false, msg: "error", data: "" });
                  } else {
                    res.json({
                      success: true,
                      msg: "success",
                      data: "removed",
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  });
});

router.get("/deleteUser", authorize(Role.Admin), function (req, res) {
  var userId = req.query.userId;
  User.remove({ _id: userId }, function (err, table) {
    if (err) {
      res.json({ success: false, msg: "error", data: "" });
    } else {
      res.json({ success: true, msg: "edited", data: "edited" });
    }
  });
});

router.get("/deleteTable", authorize(Role.Admin), function (req, res) {
  var tableId = req.query.tableId;
  Table.remove({ _id: tableId }, function (err, table) {
    if (err) {
      res.json({ success: false, msg: "error", data: "" });
    } else {
      res.json({ success: true, msg: "edited", data: "edited" });
    }
  });
});

router.get("/getTransactions", function (req, res) {
  Transaction.find({ userId: req.query.userId }, function (err, table) {
    if (err) {
      res.json({ success: false, msg: "error", data: "" });
    } else {
      res.json({ success: true, msg: "success", data: table });
    }
  });
});

router.post("/updateProfilePic", authorize(), function (req, res) {
  User.update(
    { userId: req.query.userId },
    { profilePic: req.body.url },
    function (err, done) {
      if (err) {
        res.json({ success: false, msg: "error", data: "" });
      } else {
        res.json({ success: true, msg: "success", data: "updated" });
      }
    }
  );
});
router.post("/changePassword", authorize(), async function (req, res) {
  try {
    let { userId, newPassword, oldPassword } = req.body;
    let user = await User.findOne({ _id: userId });
   // if (bcrypt.compareSync(oldPassword, user.password)) {
	const newUpdatePassword = await bcrypt.hash(newPassword, 10);		
      await User.findOneAndUpdate(
        { _id: userId },
       { $set: { password: newUpdatePassword} },
        { new: true }
      );
      res
        .status(201)
        .json({ success: true, msg: "successfully change password" });
 //   }else{
  //  res
   //   .status(400)
    //  .json({ success: false, msg: "Your current password is wrong." });
	//}
  } catch (err) {
    res.json(err);
  }
});
router.post("/tablesByType", authorize(Role.Admin), async function (req, res) {
  try {
    const { type } = req.body;
    const tables = await Table.find({ type: type })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, msg: "success", data: tables });
  } catch (err) {
    res.json({ success: false, msg: err.message, data: "" });
  }
});

router.post("/usersByType", authorize(Role.Admin), async function (req, res) {
  try {
    const { type } = req.body;
    const users = await User.find({ type: type })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, msg: "success", data: users });
  } catch (err) {
    res.json({ success: false, msg: err.message, data: "" });
  }
});

router.post("/checkTableByPlayerLeft", async function (req, res) {
  try {
    const { boot } = req.body;
    const tables = await Table.find({
      tableSubType: "public",
      boot: boot,
      playersLeft: { $lt: 5 },
    })
      .sort({ playersLeft: -1 })
      .limit(1)
      .lean()
      .exec();
    res.json({ success: true, msg: "success", data: tables });
  } catch (err) {
    res.json({ success: false, msg: err.message, data: "" });
  }
});

router.post("/checkTableBootAmounts", authorize(), async function (req, res) {
  try {
    const tables = await Table.find().lean().exec();
    let bootAmount = [];
    for (let i = 0; i < tables.length; i++) {
      let tableBoot = tables[i].boot;
      if (tables[i].tableSubType !== "private" && tables[i].type == "premium") {
        bootAmount.push(tableBoot);
      }
    }
    const uniqueBootAmount = [...new Set(bootAmount)];
    const sortedBootAmount = uniqueBootAmount.sort(function (a, b) {
      return a - b;
    });
    res.json({ success: true, msg: "success", data: sortedBootAmount });
  } catch (err) {
    res.json({ success: false, msg: err.message, data: "" });
  }
});

router.post("/getPrivateTables", authorize(), async function (req, res) {
  try {
    const tables = await Table.find({ tableSubType: "private" }).lean().exec();
    res.json({ success: true, msg: "success", data: tables });
  } catch (err) {
    res.json({ success: false, msg: err.message, data: "" });
  }
});

router.post("/getUserDetails", authorize(), async function (req, res) {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ _id: userId }).lean().exec();
    if (user) {
      res.json({ success: true, msg: "success", data: user });
    } else {
      res.json({ success: false, msg: err.message, data: "User Not Exist" });
    }
  } catch (err) {
    res.json({ success: false, msg: err.message, data: "" });
  }
});

function generateJwtToken(user) {
  // create a jwt token containing the user id that expires in 15 minutes
  return jwt.sign({ sub: user.id, id: user.id }, secret, {
    expiresIn: Math.floor(Date.now() / 1000) + 60 * 60,
  });
}

module.exports = router;
