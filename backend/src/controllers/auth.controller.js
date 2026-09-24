const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  let { first_name, last_name, phone, email, password, role } = req.body;

  try {
    if (!first_name || !last_name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, phone and password are required" });
    }

    email = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email],
    );

    if (rows.length > 0) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    phone = phone.trim();

    const phoneCheck = await pool.query(
      "SELECT id FROM users WHERE phone = $1 LIMIT 1",
      [phone],
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({
        error: "Phone number already exists",
      });
    } 

    if (typeof first_name !== "string" && typeof last_name !== "string") {
      return res.status(400).json({
        error: "first_name or last_name must be a string",
      });
    }

    first_name = first_name.trim().replace(/\s+/g, " ");

    if (
      first_name.length < 3 ||
      first_name.length > 20 ||
      !/^[a-zA-Z\s]+$/.test(first_name)
    ) {
      return res.status(400).json({
        error:
          "First Name must contain only letters and spaces and length between 3 and 20 characters",
      });
    }

    last_name = last_name.trim().replace(/\s+/g, " ");

    if (
      last_name.length < 3 ||
      last_name.length > 20 ||
      !/^[a-zA-Z\s]+$/.test(last_name)
    ) {
      return res.status(400).json({
        error:
          "First Name must contain only letters and spaces and length between 3 and 20 characters",
      });
    }

    if (typeof email !== "string") {
      return res.status(400).json({
        error: "Email must be a string",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length < 5 ||
      email.length > 50
    ) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        error: "Phone must contain exactly 10 digits",
      });
    }

    if (typeof password !== "string") {
      return res.status(400).json({
        error: "Password must be a string",
      });
    }

    if (
      !/^(?=.{8,}$)(?=.*[A-Z])(?=.*[0-9].*[0-9])(?=.*[^A-Za-z0-9]).+$/.test(
        password,
      )
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and contain at least 1 uppercase letter, 2 numbers, and 1 special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (first_name, email, password_hash, role, phone, last_name)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, email, hashedPassword, role ?? "customer", phone, last_name],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET, { expiresIn: "1h"}
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userDetails = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}; 

const logoutUser = async (req, res) => {
  // Since JWT is stateless, logout can be handled on the client side by simply deleting the token.
  // OptionalleyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4ODAyNTIyMX0.RbnhwUYKS9UUSjObv4dSKINGYB0zbeDI-wvUwcq0mksy, you can implement token blacklisting on the server side if needed.
  res.json({ message: "Logout successful" });
};

module.exports = {
  registerUser,
  loginUser,
  userDetails,
  logoutUser,
};