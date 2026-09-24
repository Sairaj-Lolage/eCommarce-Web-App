const pool = require("../db/db");

// Product Controller - Customer routes

const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE is_active = true`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
 
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE id = $1 AND is_active = true`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching product by ID:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Product Controller - Admin routes

const createProduct = async (req, res) => {
  const { name, description, price, discount_percent, stock } = req.body;
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `     INSERT INTO products 
            (name, description, price, discount_percent, stock, image_url, is_active, created_by)
            VALUES 
            ($1, $2, $3, $4, $5, DEFAULT, DEFAULT, $6) RETURNING *`,
      [name, description, price, discount_percent ?? 0, stock, userId],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const { name, description, price, discount_percent, stock, is_active } =
    req.body;
  try {
    const existingProduct = await pool.query(
      `SELECT * FROM products WHERE id = $1 AND created_by = $2`,
      [id, userId],
    );

    if (existingProduct.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Product not found or not authorized" });
    }

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, discount_percent = $4, stock = $5, is_active = $6
       WHERE id = $7 RETURNING *`,
      [name, description, price, discount_percent ?? 0, stock, is_active, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found or inactive" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const statusUpdateProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const { is_active } = req.body;
  try {
    const existingProduct = await pool.query(
      `SELECT * FROM products WHERE id = $1 AND created_by = $2`,
      [id, userId],
    );

    if (existingProduct.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Product not found or not authorized" });
    }

    const result = await pool.query(
      `UPDATE products 
       SET is_active = $1
       WHERE id = $2 RETURNING *`,
      [is_active, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating product status:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductsAdmin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      "SELECT * FROM products WHERE created_by = $1",
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getProducts,
  getProductById,

  createProduct,
  updateProduct,
  statusUpdateProduct,
  getProductsAdmin,
};
