const express = require("express");
const app = express();
const mongoose = require("mongoose");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const async = require('async');
const joi = require("joi");
const ObjectId = require('objectid');
var session = require('express-session');

const messageModel=require('./models/message');
const userModel=require('./models/users');

const helper=require('./helper');
const service=require('./services/dbQuery');
const authentication = require('./sessionCheck');

app.use(express.static(__dirname));

app.use(session({
    key: 'userSession',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
    }
}));

var bodyParser = require("body-parser")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))


//routing and controller work here

app.get('/',authentication,(req, res) => {
    return res.redirect("/chats");
});

app.get('/logout',(req, res) => {
    req.session.destroy(function(err) {
        if(err){
            res.send(err);
        }else{
            return res.render('index.ejs')
        }
    })
});

app.post('/messages', (req, res) => {
    async.waterfall([
        (callback)=> {
            let newMessage = new messageModel({
                to:req.body.id,
                from:req.session.userSession._id,
                message:req.body.message
            });
            service.create(messageModel,newMessage,(data)=>{
                if (data.status ==0) {
                    return sendStatus(500); //error
                }
                else{
                    callback(null,data.data._id)
                }
            });
        },
        (id,callback)=>{
            service.find(messageModel,{_id:id},{_id:1,message:1,userData:{_id:1,name:1,email:1},userData1:{_id:1,name:1,email:1}},{userId:1,senderId:1},(data)=>{
                if(data.status==0){
                    return sendStatus(500); //error
                }else{
                    io.emit('message', data.data[0]);
                    return res.sendStatus(200);
                }
            });   
        }
    ],function (err, Data) {
        console.log(err)
    }); 
})

app.post('/addUser', (req, res) => {
    const {email, password,name} = req.body;

    var schema = joi.object().keys({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    var result = joi.validate({name:name,email:email,password :password}, schema);
    if(result.error == null){
        async.waterfall([
            (callback)=> {
                service.findOne(userModel,{email:email.toLowerCase()},{"email":1}, (data)=> {
                    if (data.status == 0) {
                        return res.send('5'); //error
                    }else{
                        if(data && data.data && data.data.email){
                            return res.send('4'); //email already exists
                        }else{
                            callback(null,true)
                        } 
                    }
                })    
            },
            async(flag, callback)=>{
                if(flag){
                    let newPassword = await helper.generateHashPassword(password);
                    let newUser = new userModel({
                        email:email.toLowerCase(),
                        password:newPassword,
                        name:name,
                    });
                    service.create(userModel,newUser,(data)=>{
                        if (data.status ==0) {
                            return res.send('5'); //error
                        }
                        else{
                            return res.send('1'); // sucess
                        }
                    });
                }else{
                    return res.send('4'); //email already exists  
                }
            }
        ],function (err, Data) {
            console.log(err)
        });  
    }
    else{
      return res.send('3'); // validation error
    }
});

app.post('/login', (req, res) => {
    let {email, password} = req.body;
    email=email.toLowerCase();
    var schema = joi.object().keys({
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    var result = joi.validate({email:email,password :password}, schema);
    if(result.error == null){
        async.waterfall([
            (cb) => {
                let fields={"_id":1,'name':1,'email':1,"password":1,};
                let condition={email:email}
                service.findOne(userModel,condition,fields,(data)=>{
                    if (data.status ==0) {
                        return res.send('5'); //error
                    }
                    else if(data && data.data && data.data.email){
                        var comparePassword = helper.comparePassword(password, data.data.password);
                        if (!comparePassword){
                            return res.send("3"); //invalid password
                        }else{
                            cb(null,data.data)
                        }
                    }
                    else{
                        return res.send('2'); //email not registered
                     }
                  });
            },
            (Data,cb)=> {
                var sessionData={
                    _id:Data._id,
                    email:Data.email,
                    name:Data.name,
                }
                req.session.userSession = sessionData;
                cb(null,'1')
            }
        ], function (err, data) {
            if (err) {
                res.send('5');
            }
            else {
                res.send('1');
            }
        });
    }
    else {
        res.send('5')
    }
});

app.get('/chats',authentication,(req, res) => {
    async.auto({
        getUsers: (cb)=> {
            service.findAll(userModel,{ _id: { $ne: req.userData._id } },{_id:1,email:1,name:1},(data)=>{
                if(data.status==0){
                    cb(data.error);
                }else{
                cb(null,data.data)
                }
            });
        },
        getRecivedChat: (cb)=> {
            service.find(messageModel,{to:req.userData._id},{_id:1,message:1,userData:{_id:1,name:1,email:1}},{userId:1,sort:1},(data)=>{
                if(data.status==0){
                    cb(data.error);
                }else{
                cb(null,data.data)
                }
            });
        },
        getSendChat: (cb)=> {
            service.find(messageModel,{from:req.userData._id},{_id:1,message:1,userData1:{_id:1,name:1,email:1}},{senderId:1,sort:1},(data)=>{
                if(data.status==0){
                    cb(data.error);
                }else{
                cb(null,data.data)
                }
            });
        },
      },function (err, Data) {
          res.render('chat.ejs',{'data':Data,"userEmail":req.userData.email});
      });
});


io.on("connection", () =>{})

//mongoDb connection
mongoose.Promise = global.Promise;
  console.log("connected with - chat db");
mongoose.connect('mongodb://localhost:27017/chat', () => {
  console.log('you are connected to MongoDb');
});
mongoose.connection.on('error', (err) => {
  console.log('Mongdb connection failed due to error : ', err);
});

var server = http.listen(3000, () => {
    console.log('server is running on port', server.address().port);
});