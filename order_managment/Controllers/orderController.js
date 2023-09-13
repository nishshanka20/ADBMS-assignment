const axios = require("axios");
const order = require("../models/order");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await order.find();
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrderById = async (req, res) => {
  let orderId = req.params.id;
  try {
    const orders = await order.findById(orderId);
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.addOrder = async (req, res) => {
  const product_Id = Number(req.body.product_Id);
  const user_Id = Number(req.body.user_Id);
  const quantity = Number(req.body.quantity);
  const date = Date.parse(req.body.date);
  const totalAmount = Number(req.body.totalAmount);
  const currentStatus = "pending";

  try {
    const response = await axios.get(
      `http://localhost:8080/user/validate/${user_Id}`
    );
    if (!response.data.isValid) {
      return res.status(400).json({ msg: "Invalid user" });
    }

    let inventoryResponseStatus = 200;
    let availableQuantity;
    const inventoryResponse = await axios
      .get(`http://localhost:3001/inventory/${product_Id}`)
      .then((res) => (availableQuantity = res.data.product_quantity))
      .catch((err) => {
        inventoryResponseStatus = err.response.status;
      });

    if (inventoryResponseStatus !== 200) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    if (quantity > availableQuantity) {
      return res.status(400).json({ error: "Not enough quantity" });
    }

    const neworder = new order({
      product_Id,
      user_Id,
      quantity,
      date,
      totalAmount,
      currentStatus,
    });
    await neworder.save();
    const updatedQuantity = availableQuantity - quantity;
    await axios.put(`http://localhost:3001/inventory/${product_Id}`, {
      product_quantity: updatedQuantity,
    });
    return res.status(200).json("order added");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "internal server error" });
  }
};

exports.updateOrder = async (req, res) => {
  let orderId = req.params.id;
  const { quantity } = req.body;

  try {
    const existingOrder = await order.findById(orderId);

    if (existingOrder.currentStatus !== "pending") {
      return res.status(400).json({ error: "Cannot update a delivered order" });
    }

    const availableQuantity = await axios
      .get(`http://localhost:3001/inventory/${existingOrder.product_Id}`)
      .then((res) => res.data.product_quantity);

    const recoveredQuantity = availableQuantity + existingOrder.quantity;

    if (quantity > recoveredQuantity) {
      return res.status(400).json({ error: "Not enough quantity" });
    }
    existingOrder.quantity = quantity;
    await existingOrder.save();

    const updatedQuantity = recoveredQuantity - quantity;
    await axios.put(
      `http://localhost:3001/inventory/${existingOrder.product_Id}`,
      {
        product_quantity: updatedQuantity,
      }
    );

    return res.status(200).json({ status: "Order quantity updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  let orderId = req.params.id;

  try {
    await order.findByIdAndDelete(orderId);
    res.status(200).send({ status: "order deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
