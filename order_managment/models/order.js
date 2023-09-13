const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  product_Id: {
    type: Number,
  },
  user_Id: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  totalAmount: {
    type: Number,
  },
  currentStatus: {
    type: String,
  },
});

const order = mongoose.model("order", orderSchema);

module.exports = order;
