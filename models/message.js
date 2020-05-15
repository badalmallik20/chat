const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  to:{ type: Schema.ObjectId, ref: 'Users' },
  from:{ type: Schema.ObjectId, ref: 'Users' },
  message:{type: String, default:''},
  }, {
    timestamps: true,
  });

  messageSchema.set('toObject');
  messageSchema.set('toJSON');
module.exports = mongoose.model('Messages', messageSchema);