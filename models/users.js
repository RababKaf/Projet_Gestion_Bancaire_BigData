const mongoose = require('mongoose');


const bankAccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    accountType: {
        type: String,
        required: true,
        enum: ['Épargne', 'Chèques', 'Jeunesse']
    },
    balance: {
        type: Number,
        default: 0
    },
  
});


const userSchema = new mongoose.Schema({
   CIN: {
      type: String,
      required: true,
      unique: true
  },
   name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    bankAccounts: [bankAccountSchema]
});


module.exports = mongoose.model("users", userSchema);