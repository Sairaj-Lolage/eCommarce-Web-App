const express = require("express");
const route = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  statusUpdateProduct,
  getProductsAdmin
} = require("../controllers/product.controller");

// admin product routes
route.get("/admin", getProductsAdmin);
route.post("/", createProduct);
route.put("/:id", updateProduct);
route.patch("/:id", statusUpdateProduct);

// cutomer product routes
route.get("/", getProducts);
route.get("/:id", getProductById);

module.exports = route;