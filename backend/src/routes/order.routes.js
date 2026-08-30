const express = require("express");

const route = express.Router();

const { createOrder, getOrders, getOrderById, cancelOrder } = require("../controllers/orders.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

route.post("/create", authenticateToken, createOrder);
route.get("/get", authenticateToken, getOrders);
route.get("/:id", authenticateToken, getOrderById);
route.post("/:id/cancel", authenticateToken, cancelOrder);

module.exports = route;