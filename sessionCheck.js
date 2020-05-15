const userModel = require('./models/users');
const ObjectId = require('objectid');
const service = require('./services/dbQuery');

module.exports = (req, res, next) => {
  if (req.session.userSession) {
      let fields={name:1,email:1,_id:1}
      let condition={_id:ObjectId(req.session.userSession._id)}
      service.findOne(userModel,condition,fields,(data)=>{
          if (data && data.data && data.data.email != '') {
            req.userData = data.data;
            next(); 
          }else{
            return res.render('index.ejs')
          }
      })
    }
    else {
      return res.render('index.ejs')
    }
};
