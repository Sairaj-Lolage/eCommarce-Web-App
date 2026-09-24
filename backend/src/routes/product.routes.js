const express = require("express");
const route = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/auth.middleware");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  statusUpdateProduct,
  getProductsAdmin
} = require("../controllers/product.controller");

// cutomer product routes
route.get("/", getProducts);
route.get("/:id", getProductById);

// admin product routes

route.use(authenticateToken, authorizeRoles("admin"));

route.get("/admin", getProductsAdmin);
route.post("/add-product", createProduct);
route.put("/:id/update", updateProduct);
route.patch("/:id/status", statusUpdateProduct);

module.exports = route;