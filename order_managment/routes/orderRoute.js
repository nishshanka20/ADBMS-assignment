const express = require("express");
const router = express.Router();
const orderController = require("../Controllers/orderController");

// Define routes
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.post("/add", orderController.addOrder);
router.put("/update/:id", orderController.updateOrder);
router.delete("/delete/:id", orderController.deleteOrder);

module.exports = router;
