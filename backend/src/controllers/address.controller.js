const pool = require("../db/db");

const getAddresses = async (req, res) => {
  try {
    const userId = req.user.user_id; // Get the user ID from the authenticated request
    const result = await pool.query(
      `SELECT * FROM addresses WHERE user_id = $1`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching addresses:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the authenticated request
    const { full_name, phone, address_line, city, state, pincode } = req.body;
    const result = await pool.query(
      `INSERT INTO addresses (user_id, full_name, phone, address_line, city, state, pincode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, full_name, phone, address_line, city, state, pincode],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding address:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the authenticated request
    const addressId = req.params.id; // Get the address ID from the request parameters
    const { full_name, phone, address_line, city, state, pincode } = req.body;

    // Check if the address belongs to the authenticated user
    const checkResult = await pool.query(
      `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId],
    );

    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Address not found or does not belong to the user" });
    }

    console.log(checkResult.rows[0]); // Log the existing address details for debugging

    const oldAddress = checkResult.rows[0];

    // Update the address
    const updateResult = await pool.query(
      `UPDATE addresses SET full_name = $1, phone = $2, address_line = $3, city = $4, state = $5, pincode = $6 WHERE id = $7 RETURNING *`,
      [
        full_name ?? oldAddress.full_name,
        phone ?? oldAddress.phone,
        address_line ?? oldAddress.address_line,
        city ?? oldAddress.city,
        state ?? oldAddress.state,
        pincode ?? oldAddress.pincode,
        addressId,
      ],
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("Error updating address:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the authenticated request
    const addressId = req.params.id; // Get the address ID from the request parameters

    // Check if the address belongs to the authenticated user
    const checkResult = await pool.query(
      `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId],
    );

    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Address not found or does not belong to the user" });
    }

    // Delete the address
    await pool.query(`DELETE FROM addresses WHERE id = $1`, [addressId]);
    
    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error("Error deleting address:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};          

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };