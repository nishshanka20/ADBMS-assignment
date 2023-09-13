const router = require("express").Router();
const axios = require("axios");
const order = require("../models/order"); // Assuming you've imported your order model

router.route("/").get((req, res) => {
  order
    .find()
    .then((orders) => {
      res.json(orders);
    })
    .catch((err) => {
      console.log(err);
    });
});

router.route("/add").post(async (req, res) => {
  const product_Id = Number(req.body.product_Id);
  const user_Id = Number(req.body.user_Id);
  const quantity = Number(req.body.quantity);
  const date = Date.parse(req.body.date);
  const totalAmount = Number(req.body.totalAmount);

  // Set the initial currentStatus to "pending"
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
      currentStatus, // Set the currentStatus here
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
});

router.route("/update/:id").put(async (req, res) => {
  let orderId = req.params.id;
  const { quantity } = req.body;

  try {
    // Find the order by ID
    const existingOrder = await order.findById(orderId);

    // Check if the order is in "pending" status
    if (existingOrder.currentStatus !== "pending") {
      return res.status(400).json({ error: "Cannot update a delivered order" });
    }

    // Calculate the available quantity
    const availableQuantity = await axios
      .get(`http://localhost:3001/inventory/${existingOrder.product_Id}`)
      .then((res) => res.data.product_quantity);

    const recoverdQuantity = availableQuantity + existingOrder.quantity;
    // Check if the requested quantity is valid
    if (quantity > recoverdQuantity) {
      return res.status(400).json({ error: "Not enough quantity" });
    }

    // Update the order quantity and save it
    existingOrder.quantity = quantity;
    await existingOrder.save();

    // Update the inventory
    const updatedQuantity = recoverdQuantity - quantity;
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
});

router.route("/delete/:id").delete(async (req, res) => {
  let orderId = req.params.id;

  await order
    .findByIdAndDelete(orderId)
    .then(() => {
      res.status(200).send({ status: "order deleted" });
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
