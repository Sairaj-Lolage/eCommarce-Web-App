const express = require('express');
const route = express.Router();

const { getProducts, getProductById } = require('../controllers/product.controllers');

// cutomer product routes
route.get('/', getProducts);
route.get('/:id', getProductById);

module.exports = route;
