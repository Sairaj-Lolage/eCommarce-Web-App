const pool = require("../db/db");

// Order Controller - Customer routes
const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;

    const { items, address_id, payment_method = "COD" } = req.body;

    // 1. Basic validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        error: "Order must contain at least one product",
      });
    }

    if (!address_id) {
      return res.status(400).json({
        error: "Address is required",
      });
    }

    // 2. Check address belongs to this user
    const addressResult = await client.query(
      `SELECT *
       FROM addresses
       WHERE id = $1 AND user_id = $2`,
      [address_id, userId],
    );

    if (addressResult.rows.length === 0) {
      return res.status(404).json({
        error: "Address not found",
      });
    }

    const address = addressResult.rows[0];

    // 3. Start transaction
    await client.query("BEGIN");

    let totalAmount = 0;
    const orderItems = [];

    // 4. Check every product
    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, name, price, stock
         FROM products
         WHERE id = $1 AND is_active = true`,
        [item.product_id],
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found or inactive`);
      }

      const product = productResult.rows[0];

      // 5. Check stock
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      // 6. Calculate price
      const itemTotal = Number(product.price) * item.quantity;

      totalAmount += itemTotal;

      // Save information for order_items
      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // 7. Create order
    const orderResult = await client.query(
      `INSERT INTO orders
       (
         user_id,
         customer_name,
         phone,
         address,
         total_amount,
         payment_method
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        address.full_name,
        address.phone,
        address.address_line +
          ", " +
          address.city +
          ", " +
          address.state +
          " - " +
          address.pincode,
        totalAmount,
        payment_method,
      ],
    );

    const order = orderResult.rows[0];

    // 8. Create order items + reduce stock
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items
         (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price],
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.product_id],
      );
    }

    // 9. Everything worked
    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    // Something failed → undo everything
    await client.query("ROLLBACK");

    console.error("Error creating order:", err);

    res.status(400).json({
      error: err.message,
    });
  } finally {
    client.release();
  }
};

const getOrdersCustomer = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    let ordersResult;

    ordersResult = await pool.query(
      `SELECT *
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    const orders = ordersResult.rows;

    for (const order of orders) {
      const itemsResult = await pool.query(
        `SELECT oi.product_id, p.name, oi.quantity, oi.price
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id],
      );

      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const getOrderById = async (req, res) => {
  const userId = req.user.userId;
  const orderId = req.params;

  console.log(userId, orderId);

  try {
    const orderResult = await pool.query(
      `SELECT *
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId.id, userId],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.product_id, p.name, oi.quantity, oi.price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id],
    );

    order.items = itemsResult.rows;

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const cancelOrder = async (req, res) => {
  const userId = req.user.userId;
  const orderId = req.params;

  try {
    // Check if the order exists and belongs to the user
    const orderResult = await pool.query(
      `SELECT *
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId.id, userId],
    );

    console.log(orderResult.rows);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    // Check if the order is already cancelled or completed
    if (order.status !== "pending") {
      return res.status(400).json({
        error: "Order cannot be cancelled",
      });
    }

    // Update the order status to cancelled
    await pool.query(
      `UPDATE orders
       SET status = 'cancelled'
       WHERE id = $1`,
      [orderId.id],
    );

    // Optionally, you can also restock the products in the order
    const itemsResult = await pool.query(
      `SELECT product_id, quantity
       FROM order_items
       WHERE order_id = $1`,
      [orderId.id],
    );

    for (const item of itemsResult.rows) {
      await pool.query(
        `UPDATE products
         SET stock = stock + $1
         WHERE id = $2`,
        [item.quantity, item.product_id],
      );
    }

    res.json({
      message: "Order cancelled successfully",
    });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

// Order Controller - Admin routes

const getOrdersAdmin = async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT * FROM orders ORDER BY created_at DESC;`,
    );

    const orders = ordersResult.rows;

    for (const order of orders) {
      const itemsResult = await pool.query(
        `SELECT oi.product_id, p.name, oi.quantity, oi.price
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id],
      );

      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    // Check if the order exists
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Update the order status
    await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [status, orderId],
    );

    res.json({
      message: "Order status updated successfully",
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

module.exports = {
  createOrder,
  getOrdersCustomer,
  getOrderById,
  cancelOrder,

  getOrdersAdmin,
  updateOrderStatus
};
