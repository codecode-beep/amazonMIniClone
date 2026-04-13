const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type: String,
        reuired: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: [
        {
          productId: { type: Schema.Types.ObjectId, ref: 'Product' },
          quantity: { type: Number, default: 1 }
        }
      ]
});

module.exports = mongoose.model('User', userSchema);

