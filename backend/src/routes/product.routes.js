const express = require("express");
const route = express.Router();

const { authenticateToken } = require("../middleware/auth.middleware");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  statusUpdateProduct,
  getProductsAdmin
} = require("../controllers/product.controller");

// admin product routes
route.get("/admin", authenticateToken, getProductsAdmin);
route.post("/add-product", authenticateToken, createProduct);
route.put("/:id/update", authenticateToken, updateProduct);
route.patch("/:id/status", authenticateToken, statusUpdateProduct);

// cutomer product routes
route.get("/", getProducts);
route.get("/:id", getProductById);

module.exports = route;