const express = require("express");

const route = express.Router();

const { createOrder, getOrdersCustomer, getOrderById, cancelOrder, getOrdersAdmin, updateOrderStatus} = require("../controllers/orders.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/auth.middleware");

route.use(authenticateToken);

// customer routes
route.post("/create", authorizeRoles("customer"),createOrder);
route.get("/get", authorizeRoles("customer"), getOrdersCustomer);
route.get("/:id", authorizeRoles("customer"),getOrderById);
route.post("/:id/cancel", authorizeRoles("customer"), cancelOrder);

//admin routes
route.get("/admin/get", authorizeRoles("admin"), getOrdersAdmin);
route.post("/:id/status", authorizeRoles("admin"), updateOrderStatus);


module.exports = route; 