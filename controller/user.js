const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../model/user");
const Table = require("../model/table");
const TransactionRecharge = require("./../model/transactionRecharge");
const transactionType = require("./../constant/transactionType")
const Role = require("../config/role");
const secret = "developersecretcode";
let gameAuditService = require("../service/gameAudit");
const staticValue = require("../constant/staticValue");
const rechargeService = require("../service/recharge");
let Settings_Model = require("./../model/settings");
const UserRole = require("../constant/userRole");
const thirdPartyAPICall = require("../service/thirdPartyAPICall/thirdPartyAPICall");
function generateJwtTokenByUser(user) {
    // create a jwt token containing the user id that expires in 15 minutes
	
	let key = jwt.sign({ sub: user.id, id: user.id }, secret, {
         expiresIn: Math.floor(Date.now() / 1000) + 60 * 60,
        //expiresIn: 3000 * 1000,
    });/*
	
	var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var random_code = '';
    var n=letters.length;
    for (var i = 0; i < 36; i++) {
		random_code += letters[Math.floor(Math.random() * n)];
    }
    key = random_code + key;
    
    random_code1 = '';
    for (var j = 0; j < 36; j++) {
		random_code1 += letters[Math.floor(Math.random() * n)];
    }
  
    key =  key + random_code1;*/

    return key;
}





function generateJwtToken(user) {
    // create a jwt token containing the user id that expires in 15 minutes
	
	let key = jwt.sign({ sub: user.id, id: user.id }, secret, {
        // expiresIn: Math.floor(Date.now() / 1000) + 60,
        expiresIn: "1000d",
    });
	
	
    return key;
}



const getUserFromApi = async function (req, res) {
    try {
        let { userId,deviceId ,audit} = req.body;
        let user = await User.findOne({ _id: userId },{userName : 1});

      
    //     const ApiResponce = await thirdPartyAPICall.CheckUser(user.userName);

    //     const ApiResponce_Balance = await thirdPartyAPICall.GetBalance(user.userName);
    //    // console.log("a...2",ApiResponce);
      

    //  //  console.log("a...1 " ,ApiResponce_Balance);

    //         let ddata = {
    //            chips:ApiResponce_Balance.data.availableBalance,
    //             operatorId:ApiResponce_Balance.data.operatorId,
    //             displayName:ApiResponce_Balance.data.name,
    //             Decrole:ApiResponce.data.role.toUpperCase(),
    //             userName:ApiResponce.data.userId,
    //             deviceId:deviceId,
    //             deck_betLock:ApiResponce.data.betLock,
              
    //             deck_isActive:ApiResponce.data.isActive,
    
    //         };
    //         // console.log("ddata",JSON.stringify(ddata));


    //         if(audit == "true"){
    //             await gameAuditService.createAudit('62318ac093b9f8bd34b71c1b', '',userId, '', 'LOGIN', 0, 0,  ApiResponce_Balance.data.availableBalance, 'LOGIN', 'LOGIN', 0, '', 0, '');
    //         }else{
    
    //         }


            
	// 		await User.update({_id: userId}, { $set: ddata });

            let userupdated = await User.findOne({ _id: userId });
          

            let gametype = 0;
        
            if(userupdated.lasttableId!="")
            {
                const table_length = await Table.findOne({ _id: userupdated.lasttableId });
                if(table_length.length <= 0){
                    await User.update({	_id: userupdated._id	}, {$set: {	lasttableId: ""}});
                    userupdated.lasttableId = "";
                }
                gametype = table_length.gameType;
            }
        
           
        
            res.json({
                msg: "success",
                gameType: gametype,
                success: true,
                data: userupdated,
            });

    } catch (err) {
        console.log("errrorrr ... ",err.message );
        res.send(401, {
            success: false,
            message: err.message,
        });
    }
}




const update = async (req, res) => {
    let { clientId, userId, tableId } = req.body;

    let table = await Table.findOne({ _id: tableId });

    let playersLength = (table.players == null) ? 0 : Object.keys(table.players).length;

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
}

const list = async function (req, res) {
    await User.find({}).populate('agentId', 'userName displayName').exec(function (err, data) {
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
}

const loginold = async function (req, res, next) {
    try {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName: userName });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({
                status: "error",
                message: "Username or password is incorrect",
            });

            
        }

        if (user && [UserRole.USER, UserRole.ADMIN_USER].includes(user.role)){
            await User.findOneAndUpdate(
                { _id: user.id },
                { $set: { deviceId: req.body.deviceId } },
                { new: true }
            )
                .then((data) => {
                    const jwtToken = generateJwtToken(user);

                    return res.json({
                        status: "success",
                        jwtToken,
                        data,
                    });
                })
                .catch(next);
        }else{
            res.json({
                status: "failed",
                message: "Wrong username / password",
            });
        }
    } catch (err) {
        console.log(err);
        next();
    }
}

const login = async function (req, res, next) {
    try {
      
        const { userName, password , refrenceId } = req.body;
        const user = await User.findOne({ userName: userName });
        console.log("loggginnnnnnnn : ", userName,"      " ,password, "   ", user);
        // if (!user ) {
        //     return res.status(401).json({
        //         status: "error",
        //         message: "Username or password is incorrect",
        //     });
        // }

        if (!user || !bcrypt.compareSync(password, user.password)) {
           

            res.json({
                success: false,
                message: "Wrong username / password",
            });
        }

        const jwtToken = generateJwtToken(user);
        console.log("loggginnnnnnnn : 2");
        if (user && [UserRole.USER, UserRole.ADMIN_USER].includes(user.role)){
            console.log("loggginnnnnnnn : 3");

            await User.findOneAndUpdate(
                { _id: user.id },
                { $set: { deviceId: req.body.deviceId , jwtToken , deck_betLock : "user"} },
                { new: true }
            )
                .then((data) => {
                    console.log("loggginnnnnnnn : 44");
                   

                    return res.json({
                        success: true,
                        jwtToken,
                        data,
                    });
                })
                .catch(next);
        }else{
            res.json({
                success: false,
                message: "Wrong username / password",
            });
        }
    } catch (err) {
        console.log(err);
        next();
    }
}



const login_olddd = async function (req, res) {
    try {
        
           const { userName, clientIp ,deviceType, role} = req.body;

           if(role == null || userName == null || clientIp==null ||deviceType==null  )
           {
          
               if(role == null)
               return res.json({
                   status:false,
                   message: "role is required.",
               });

               else if(userName == null)
               return res.json({
                   status:false,
                   message: "userName is required.",
               });


               else if(clientIp == null)
               return res.json({
                   status:false,
                   message: "clientIp is required.",
               });

               else if(deviceType == null)
               return res.json({
                   status:false,
                   message: "deviceType is required.",
               });
           }
           let user = await User.findOne({ userName });
               if (!user || user == null) {
                   //const encryptedPassword = await bcrypt.hash(password, 10);
                   
                   
                   
                   let userData = "";
                   
                   if(role.toUpperCase() == "CLIENT")
                   {
                        userData = {
                           userName,
                        //   password: encryptedPassword,
                           chips:10000,
                           Decrole : role.toUpperCase(),
                           clientIp : clientIp,
                           type: 'premium',
                           role: 'user',
                           isadmin : false,
                           deviceType : deviceType,
                           profilePic : '',
                           agentId : '623189e6bb5aceb9dd676549',
                           password : '12345',
                         
                           
                         
                          
                       };
                   
                   }else if(role.toUpperCase() == "MASTER")
                   
                   {
                        userData = {
                           userName,
                        //   password: encryptedPassword,
                           chips:10000,
                           Decrole : role.toUpperCase(),
                           clientIp : clientIp,
                       
                           deviceType : deviceType,
                           profilePic : '',
                           agentId : '623189e6bb5aceb9dd676549',
                           password : '12345',
                           isAdmin : true,
                           type : 'admin',
                           role : 'admin',
                         
                           
                         
                          
                       };
                   }else if(role.toUpperCase() == "SUSER") {
                       
                        userData = {
                           userName,
                        //   password: encryptedPassword,
                           chips:10000,
                           Decrole : role.toUpperCase(),
                           clientIp : clientIp,
                           type: 'premium',
                           role: 'adminuser',
                           isadmin : false,
                           deviceType : deviceType,
                           profilePic : '',
                           agentId : '623189e6bb5aceb9dd676549',
                           password : '12345',
                         
                          
                       };
                   }

                   console.log("new user : ",userData );
                   const newUser = new User(userData);
                   await newUser.save();
                   user = await User.findOne({ userName });
               }  				


               
           
               
               let jwtToken  = "";
               if(role.toUpperCase() == "CLIENT" || role.toUpperCase() == "SUSER")
               {
                   jwtToken = generateJwtTokenByUser(user);
               }else
               {
                   jwtToken = generateJwtToken(user);
               }
               
           
               

              // const currentBalance =chips;
               const data = await User.findOneAndUpdate(
                   { _id: user.id },
                   { $set: { clientIp: clientIp,Decrole :role.toUpperCase(), jwtToken :jwtToken } },
                   { new: true },
               )

               return res.json({
                   status: true,
                   jwtToken,
                   data,
               });
               
       } catch (err) {
          
           return res.json({
               status:false,
               message: "role or username not found",
           });
               
     //  console.log(err);
     //  next();
   }
 
}




const login__ = async function (req, res) {
	 try {
         
            const { userName, clientIp ,deviceType, role} = req.body;

            if(role == null || userName == null || clientIp==null ||deviceType==null  )
            {
           
                if(role == null)
                return res.json({
                    status:false,
                    message: "role is required.",
                });

                else if(userName == null)
                return res.json({
                    status:false,
                    message: "userName is required.",
                });


                else if(clientIp == null)
                return res.json({
                    status:false,
                    message: "clientIp is required.",
                });

                else if(deviceType == null)
                return res.json({
                    status:false,
                    message: "deviceType is required.",
                });
            }
            let user = await User.findOne({ userName });
                if (!user || user == null) {
                    //const encryptedPassword = await bcrypt.hash(password, 10);
                    
					
					
					let userData = "";
					
					if(role.toUpperCase() == "CLIENT")
					{
						 userData = {
							userName,
						 //   password: encryptedPassword,
							chips:0,
							Decrole : role.toUpperCase(),
							clientIp : clientIp,
							type: 'premium',
							role: 'user',
							isadmin : false,
							deviceType : deviceType,
							profilePic : '',
							agentId : '623189e6bb5aceb9dd676549',
							password : '12345',
                          
							
						  
						   
						};
					
					}else if(role.toUpperCase() == "MASTER")
					
					{
						 userData = {
							userName,
						 //   password: encryptedPassword,
							chips:0,
							Decrole : role.toUpperCase(),
							clientIp : clientIp,
						
							deviceType : deviceType,
							profilePic : '',
							agentId : '623189e6bb5aceb9dd676549',
							password : '12345',
							isAdmin : true,
							type : 'admin',
							role : 'admin',
                          
							
						  
						   
						};
					}else if(role.toUpperCase() == "SUSER") {
						
						 userData = {
							userName,
						 //   password: encryptedPassword,
							chips:0,
							Decrole : role.toUpperCase(),
							clientIp : clientIp,
							type: 'premium',
							role: 'adminuser',
							isadmin : false,
							deviceType : deviceType,
							profilePic : '',
							agentId : '623189e6bb5aceb9dd676549',
							password : '12345',
						  
						   
						};
					}
                    const newUser = new User(userData);
                    await newUser.save();
                    user = await User.findOne({ userName });
                }  				


				
			
				
                let jwtToken  = "";
				if(role.toUpperCase() == "CLIENT" || role.toUpperCase() == "SUSER")
				{
					jwtToken = generateJwtTokenByUser(user);
				}else
				{
                    jwtToken = generateJwtToken(user);
				}
				
			
				

               // const currentBalance =chips;
                const data = await User.findOneAndUpdate(
                    { _id: user.id },
                    { $set: { clientIp: clientIp,Decrole :role.toUpperCase(), jwtToken :jwtToken } },
                    { new: true },
                )
                console.log(JSON.stringify({ _id: user.id }));
                console.log(JSON.stringify({ $set: { clientIp: clientIp,Decrole :role.toUpperCase(), jwtToken :jwtToken } }));
                console.log(JSON.stringify({ new: true }));

                return res.json({
                    status: true,
                    jwtToken,
                    data,
                });
				
	    } catch (err) {
            console.log(err);
		    return res.json({
                status:false,
                message: "role or username not found",
            });
				
      //  console.log(err);
      //  next();
    }
  
}





const verifyDevice = async function (req, res) {
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
}

const adminLogin = async function (req, res, next) {
    try {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName: userName });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({
                status: "error",
                message: "Username or password is incorrect",
            });
        }

        if (user && [UserRole.ADMIN, UserRole.AGENT, UserRole.DISTRIBUTOR].includes(user.role) ) {
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
}

const create = async function (req, res) {
    try {
		console.log(req.body.displayName);	
        const password = await bcrypt.hash(req.body.password, 10);

        const { userName , refrenceby} = req.body;
        //  const user = await User.findOne({ userName: userName });        

        console.log("refrencebyrefrenceby:::: ",req.body );

      

        let Settings_welcome = await Settings_Model.findOne({
			type: "welcome_bonus"
		});

        let data = req.body;
        let chips =Settings_welcome.amount;


        if(req.body.chips == 0)
        {
            chips =Settings_welcome.amount;
        }else{
            chips =req.body.chips;
        }
    
        let agent;
        if (req.body.agentId)
            agent = await User.findById({ _id: req.body.agentId });

      //  console.log(agent);	

        if (!req.body.agentId || !agent) {
           

            res.json({
                success: false,
                message: "Agent wan't found",
            });

        }

        console.log("ref1: " );
        
        if (data.chips > agent.chips) {
         

            res.json({
                success: false,
                message: "Insufficient balance",
            });
        }

        console.log("ref2: " );
        var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';	
        var random_code = '';	
        for (var i = 0; i < 6; i++) {	
            random_code += letters[Math.floor(Math.random() * 36)];	
        }	

        console.log("ref3: " );
        data = {
            ...data,
            password: password,
            chips: 0,
            refrenceId : random_code,
            refrenceby : refrenceby,
        
        };

        console.log("ref4: " );
        let user = await User.findOne({ userName: req.body.userName });
        let refrenceuser ; 
        if(refrenceby != "")
        {
            refrenceuser = await User.findOne({ refrenceId: refrenceby });
        }
        
		
 

        if (user) {    
           

            res.json({
                success: false,
                message: "User already exist",
            });
        }

        const newUser = new User(data);
        const addedUser = await newUser.save();
        
        const result = await rechargeService.transferCoin(addedUser._id, chips);


        user = await User.findOne({ userName: req.body.userName });
        console.log("ref5: " , user._id);
		if(refrenceuser && refrenceby != "")
		{

            let Settings_refer = await Settings_Model.findOne({
                type: "refer_rs"
            });


            console.log("ref6: " );
			let ccchiip = refrenceuser.chips + Settings_refer.amount;
		
			await User.update({ _id: refrenceuser._id }, { $set: { chips: ccchiip  } });

            
        console.log("ref99: " );

            await User.update({ _id: user._id }, { $inc: { chips:  Settings_refer.amount  } });

            console.log("chipssss :: ",Settings_refer.amount);

            // await TransactionChalWin.create({
			// 	userId: mongoose.Types.ObjectId(user._id),
			// 	tableId: tableInfo._id,
			// 	gameId: game._id,
			// 	coins: iBoot,
			// 	transType: "Refer By"
			// });



            console.log("ref7: " );
           
            const transactionData = {
                senderId: staticValue.AGENT_ID ,
                receiverId: refrenceuser._id,
                transType: "REFER BY",
                coins: Settings_refer.amount,
            };
            const data = new TransactionRecharge(transactionData);
            await data.save();

            

            const transactionDatas = {
                senderId: staticValue.AGENT_ID ,
                receiverId: user._id,
                transType: "REFER BY",
                coins: Settings_refer.amount,
            };
            const datas = new TransactionRecharge(transactionDatas);
            await datas.save();



		}


       

        res.send(200, {
            success: true,
            result,
            message: "User Created Successfull",
        });
    } catch (err) {
        res.send(401, {
            success: false,
            message: err.message,
        });
    }
}
const editUserfromapp = async function (req, res) {
    try {
        const { userId } = req.body._id;

        var data = {
            displayName: req.body.displayName,
            userName: req.body.userName,
            deck_betLock : "user",
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
}





const changePassword = async function (req, res) {
    try {
        let { userId, newPassword, oldPassword } = req.body;
        let user = await User.findOne({ _id: userId });
        // if (bcrypt.compareSync(oldPassword, user.password)) {
        const newUpdatePassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { password: newUpdatePassword } },
            { new: true }
        );
        res.status(201).json({
            success: true,
            msg: "successfully change password",
        });
    } catch (err) {
        res.json(err);
    }
}



const changeMPIN = async function (req, res) {
    try {
        let { userId, newPassword, oldPassword } = req.body;
        let user = await User.findOne({ _id: userId });
        // if (bcrypt.compareSync(oldPassword, user.password)) {
        const newUpdatePassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { mpin: newUpdatePassword } },
            { new: true }
        );
        res.status(201).json({
            success: true,
            msg: "MPIN Changed Successfully",
        });
    } catch (err) {
        res.json(err);
        console.log("mpin catch",err);
    }
}


const usersByType = async function (req, res) {
    try {
        const { type } = req.body;
        let condition = { type: type };
        if(req.user.role === UserRole.DISTRIBUTOR) {
            let agents = await User.find({ distributorId: req.user.id }, { id: 1 });
            agents = agents.map(agent => mongoose.Types.ObjectId(agent.id));
            condition.agentId = {
                $in : agents
            };
        } else if(req.user.role === UserRole.AGENT) {
            condition.agentId = req.user.id;
        }
        const users = await User.find(condition)
            .populate('agentId', 'userName displayName')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, msg: "success", data: users });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
}


const usersByTypeMin1 = async function (req, res) {
    try {
        const { type } = req.body;
        let condition = { type: type };
        if(req.user.role === UserRole.DISTRIBUTOR) {
            let agents = await User.find({ distributorId: req.user.id }, { _id: 1 
            });
            agents = agents.map(agent => mongoose.Types.ObjectId(agent.id));
            condition.agentId = {
                $in : agents
            };
        } else if(req.user.role === UserRole.AGENT) {
            condition.agentId = req.user.id;
        }
        const users = await User.find(condition, { _id: 1 , Decrole : 1, chips : 1, clientIp :1 , deviceType : 1, createdAt :1 , isAdmin : 1,  userName : 1, type : 1, displayName : 1, agentId : 0})
            .populate('agentId', 'userName displayName')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, msg: "success", data: users });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
}



const usersByTypeMin2 = async function (req, res) {
    try {
        const { type } = req.body;
        let condition = { type: type };
        if(req.user.role === UserRole.DISTRIBUTOR) {
            let agents = await User.find({ distributorId: req.user.id }, { _id : 1});
            agents = agents.map(agent => mongoose.Types.ObjectId(agent.id));
            condition.agentId = {
                $in : agents
            };
        } else if(req.user.role === UserRole.AGENT) {
            condition.agentId = req.user.id;
        }
        const users = await User.find(condition, {_id : 1, userName :1 ,  displayName :1 , agentId : 0 }) 
            .populate('agentId', 'userName displayName')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, msg: "success", data: users });
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
}

const usersByTypeMin1_withLimit = async function (req, res) {
    try {
        let { type, skip , limit , search ,search1 } = req.body;

        let condition;

      //  console.log("req.body : " , req.body);
      //  console.log("search_userId  : ", search1 , " search : " , search);
        if(search1 != "" && search1 != undefined)
        {

            let ressss = await User.aggregate([
                {
                  $addFields: {
                    tempId: { $toString: '$_id' },
                  }
                },
                {
                  $match: {
                    tempId: { $regex: search1},
                   
                  }
                }
              ]);
            
              search1 =  ressss[0]._id.toString();
    
    
    
            
            condition = { type: type ,userName: {'$regex': search},  _id:  mongoose.Types.ObjectId(search1) ,};

        }else{
            
            condition = { type: type ,userName: {'$regex': search},};
        }

        
        // if(req.user.role === UserRole.DISTRIBUTOR) {
        //     let agents = await User.find({ distributorId: req.user.id }, { _id: 1 
        //     });
        //     agents = agents.map(agent => mongoose.Types.ObjectId(agent.id));
        //     condition.agentId = {
        //         $in : agents
        //     };
        // } else if(req.user.role === UserRole.AGENT) {
        //     condition.agentId = req.user.id;
        // }
        const users = await User.find(condition, { _id: 1 , Decrole : 1, chips : 1, clientIp :1 , deviceType : 1, createdAt :1 , isAdmin : 1,  userName : 1, type : 1, displayName : 1})
       
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            ;
        res.json({ success: true, msg: "success", data: users });
    } catch (err) {
        console.log(err);
        res.json({ success: false, msg: err.message, data: "" });
    }
}



const getUserDetails = async function (req, res) {
    try {
        const { userId } = req.body;
        const user = await User.findOne({ _id: userId }).lean().exec();
        console.log("in getuserdetailssss...");
        if (user) {

            let gametype = 0;
            console.log("in getuserdetailssss...dsdsdksdjks");
            if(user.lasttableId == ""){
                res.json({ success: true, msg: "success", data: user });
            }else{
                const table_length = await Table.findOne({ _id: user.lasttableId });
                console.log("in tableeeeee.. ",table_length , "    ");
                if(table_length !=null)
                {
                    if(table_length.length <= 0){
                        await User.update({	_id: user._id	}, {$set: {	lasttableId: ""}});
                        user.lasttableId = "";
                    }
                    
                    gametype = table_length.gameType;
                   
                    res.json({ success: true, msg: "success", gameType: gametype, data: user });
                }else{
                    res.json({ success: true, msg: "success", data: user });
                }
                
            }
        } else {
            res.json({
                success: false,
                msg: err.message,
                data: "User Not Exist",
            });
        }
    } catch (err) {
        res.json({ success: false, msg: err.message, data: "" });
    }
}

const updateProfilePic = function (req, res) {
    
    
    User.update(
        { _id: req.body.userId },
        { profilePic: req.body.url },
        function (err, done) {
            if (err) {
                res.json({ success: false, msg: "error", data: "" });
            } else {
                res.json({ success: true, msg: "success", data: "updated" });
            }
        }
    );
}

const remove = function (req, res) {
    var userId = req.body.userId;
    console.log("delte userssss : " + userId);
    User.remove({ _id: userId }, function (err, table) {
        if (err) {
            res.json({ success: false, msg: "error", data: "" });
        } else {
            res.json({ success: true, msg: "edited", data: "edited" });
        }
    });
}

const edit = async function (req, res) {

    try {
        let { userId, obj } = req.body;

        const user11 = await User.findOne({ userName :  obj.userName });

        console.log(userId , "   obj : ", obj  );

        if(user11 != null)
        {
            res.json({ success: false, msg: "Username already exists" });


        }else{

     
        var data = {
            displayName: obj.displayName,
            userName: obj.userName,
            mobile: obj.mobile,
            profilePic: obj.profilePic,
            type: obj.type,
            deck_betLock : "user",
            role: obj.role,
        };


        User.updateOne({ _id: userId }, data, function (err, table) {
            if (err) {
                res.json({ success: false, msg: "error", data: err });
            } else {
                res.json({ success: true, msg: "Successfully Edited", data: "Successfully Edited"  });
                
            }
        });
    }
    } catch (err) {
        res.status(401).send({
            success: false,
            message: err.message,
        })

        res.json({
            success: false,
            message: err.message,
        });
    }
}


const getuserfromserver = async function (req, res) {
    try {
        let { userId } = req.body;
        
        let tableId = "";

        let arrtables = await Table.find();
   
       for (let position in arrtables) {
        if(arrtables[position].players[userId])
            tableId = arrtables[position]._id;
        }
  
       
       res.json({ success: false, msg: "error", tableId: tableId });
      
       
    } catch (err) {
        res.send(401, {
            success: false,
            message: err.message,
        });
    }
}






const editNew = async function (req, res) {
    try {

        let userId = req.body.userId;
        let obj = req.body.obj;

        if(req.body.obj.audit == "true"){
            await gameAuditService.createAudit('62318ac093b9f8bd34b71c1b', '',userId, '', 'LOGIN', 0, 0,  obj.chips, 'LOGIN', 'LOGIN', 0, '', 0, '');
        }else{

        }

        let tableId = "";
        let Isplaying = "";
        let arrtables = await Table.find();
    
        for (let position in arrtables) {
            if(arrtables[position].players != null)
            {
                if(arrtables[position].players[userId] && !arrtables[position].players[userId].disconnect)
                tableId = arrtables[position]._id;

                if(arrtables[position].players[userId])
                {
                    if(arrtables[position].players[userId].playerInfo.isplaying)
                    Isplaying = arrtables[position].players[userId].playerInfo.isplaying;
                }
            
            }
        }
   


         User.findOneAndUpdate({ _id: userId }, obj, function (err, table) {
            if (err) {
            //    console.log(err);
                res.json({ success: false, msg: "error", data: "" });
            } else {
           //     console.log("else in edit  ... 5");
                res.json({ 
                    success: true, 
                    msg: "edited", 
                    data: "edited" , 
                    tableId : tableId,
                    isplaying : Isplaying, 
                    // datauser : table 
                });
            }
        });

        // let { userId, obj } = req.body;
        // var data = {
        //     chips: obj.chips,
        //     displayName: obj.displayName,
        //     operatorId: obj.operatorId,
        //     Decrole: obj.Decrole,
        //     deviceId: obj.deviceId,
        // };

        // await gameAuditService.createAudit('62318ac093b9f8bd34b71c1b', '',userId, '', 'LOGIN', 0, 0,  obj.chips, 'LOGIN', 'LOGIN', 0, '', 0, '');
		
        // await User.findByIdAndUpdate({ _id: userId }, data, function (err, table) {
        //     if (err) {
        //         res.json({ success: false, msg: "error", data: "" });
        //     } else {
        //         res.json({ success: true, msg: "edited", data: "edited" });
        //     }
        // });
    } catch (err) {
		console.log(err.message);
        res.status(401).send({
            success: false,
            message: err.message,
        })
        // res.send(401, {
        //     success: false,
        //     message: err.message,
        // });
    }
}

const listUsers = async function (req, res) {
    let { roleBase } = req.query;
    let condition = { role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } };
    if((!roleBase || roleBase.toLowerCase() === 'yes') && req.user.role === UserRole.DISTRIBUTOR) {
        let agents = await User.find({ distributorId: req.user.id }, { id: 1 });
        agents = agents.map(agent => mongoose.Types.ObjectId(agent.id));
        condition.agentId = {
            $in : agents
        };
    } else if((!roleBase || roleBase.toLowerCase() === 'yes') && req.user.role === UserRole.AGENT) {
        condition.agentId = req.user.id;
    }
    await User.find(condition).populate('agentId', 'userName displayName').exec(function (err, data) {
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
}




const guestlogin = async function (req, res) {
    // try {
 
         const { deviceId } = req.body;
     const user11 = await User.findOne({ deviceId : deviceId });
     console.log("checkdevice id.....................................  " + user11);
   //  console.log("checkdevice id.....................................  " + user11.deviceId);
 
     
     if (user11 != null ) {
 
     
            //  if(user11.displayName === "Guest")
            //  {
     
            //      console.log("already existssss..................................");
                 const jwtToken = generateJwtToken(user11);
         
                 return res.json({
                     status: "success",
                     jwtToken,
                     data : user11,
                 });
            //  }else{
            //      return res.json({
            //          status: "falied",
            //          message : "You already use Guest/Register. Please login to continue",
            //          data : user11,
            //      });
            //  }
 
       
        
 
        
     } else {
        
 
         const password = await bcrypt.hash(req.body.password, 10);
         let data = req.body;

         
         let chips = data.chips ? data.chips : 0;


         
        let Settings_welcome = await Settings_Model.findOne({
			type: "welcome_bonus"
		});

        chips =Settings_welcome.amount;
         let agent;
         
         var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
           var current_datetime = Date.parse(new Date()); //1648731376000
           var random_code = ''+current_datetime;
           for (var i = 0; i < 3; i++) {
             random_code += letters[Math.floor(Math.random() * 16)];
           }
  
         data.userName = random_code;
         
         
         var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
         //  var current_datetime = Date.parse(new Date()); //1648731376000
           var random_code = '';
           for (var i = 0; i < 6; i++) {
             random_code += letters[Math.floor(Math.random() * 36)];
           }
  
             data.refrenceId = random_code;
         
   
         if (req.body.agentId)
             agent = await User.findById({ _id: req.body.agentId });
 
         if (!req.body.agentId || !agent) {
             return res.status(401).json({
                 success: false,
                 message: "Agent wan't found",
             });
         }
 
         if (data.chips > agent.chips) {
             return res.status(400).json({
                 success: false,
                 message: "Insufficient balance",
             });
         }
 
         data = {
             ...data,
             password: password,
             deck_betLock : "guest",
             chips: 0
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
 
         const result = await rechargeService.transferCoin(addedUser._id, chips)
         const jwtToken = generateJwtToken(newUser);
                 return res.json({
                         status: "success",
                         jwtToken,
                         data : newUser,
                     });
                     
 
 
 
 
     
                 }
 
 
       
  //   } catch (err) {
    //     res.send(401, {
      //       success: false,
        //     message: err.message,
     //    });
    // }
 }
 
 const checkDeviceId = async function (req, res) {
    const { deviceId } = req.body;
    const user = await User.findOne({ deviceId });
  
    if (user != null) {
        res.json({
            success: true,
            message: "Device already registered",
        });
    } else {
        res.json({
            success: false,
            message: "New Device",
        });
    }
}

module.exports = {
    create,
    list,
    update,
    edit,
    editNew,
    remove,
    login,
    verifyDevice,
    adminLogin,
    editUserfromapp,
    changePassword,
    changeMPIN,
    usersByType,
    getUserDetails,
    updateProfilePic,
    getUserFromApi,
    listUsers,
    getuserfromserver,
    usersByTypeMin1,usersByTypeMin2,usersByTypeMin1_withLimit,guestlogin,checkDeviceId }