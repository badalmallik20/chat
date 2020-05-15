const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name:{type: String, default:''},
  email:{type: String, default:'',unique:true},
  password: { type: String, hide: true },
}, {
    timestamps: true,
});

  userSchema.set('toObject');
  userSchema.set('toJSON');
module.exports = mongoose.model('Users', userSchema);


  