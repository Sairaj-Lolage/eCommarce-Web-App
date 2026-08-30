const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  try {
    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, phone and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, hashedPassword, role ?? "customer", phone],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log(req.headers);

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

    const token = jwt.sign({ user_id: user.id, role: user.role }, process.env.JWT_SECRET)

    res.json({ message: "Login successful", token, user : {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    } });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userDetails = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(`SELECT id, name, email, role, phone FROM users WHERE id = $1`, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const logoutUser = async (req, res) => {
  // Since JWT is stateless, logout can be handled on the client side by simply deleting the token.
  // OptionalleyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4ODAyNTIyMX0.RbnhwUYKS9UUSjObv4dSKINGYB0zbeDI-wvUwcq0mksy, you can implement token blacklisting on the server side if needed.
  res.json({ message: "Logout successful" });
};

module.exports = {
  registerUser,
  loginUser,
  userDetails,
  logoutUser
};