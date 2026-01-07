const express = require("express");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const crypto = require("crypto");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTable() {
  try {
    // Updated to include reset_token and reset_expires
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                reset_token TEXT,
                reset_expires TIMESTAMP
            );
        `);
    await pool.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                user_email TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log("✅ Database tables verified.");
  } catch (err) {
    console.error("❌ Database table error:", err);
  }
}
createTable();

// --- AUTH ROUTES ---
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  // Strict Validation
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).send("All fields are required.");
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );
    res.status(201).send("Registered successfully!");
  } catch (err) {
    res.status(400).send("Email already exists.");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim())
    return res.status(400).send("Email and password required.");

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ name: user.name, email: user.email });
    } else {
      res.status(400).send("Invalid credentials");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// --- PASSWORD RESET ROUTES ---
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(20).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hour

  try {
    const result = await pool.query(
      "UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3",
      [token, expires, email]
    );
    if (result.rowCount === 0) return res.status(404).send("User not found.");

    // Log link to console for testing
    console.log(
      `Reset Link: https://${req.get(
        "host"
      )}/reset-password.html?token=${token}`
    );
    res.send("Reset link generated! (Check server logs)");
  } catch (err) {
    res.status(500).send("Error generating link.");
  }
});

app.post("/complete-reset", async (req, res) => {
  const { token, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE reset_token = $2 AND reset_expires > NOW()",
      [hashedPassword, token]
    );
    if (result.rowCount === 0)
      return res.status(400).send("Invalid or expired token.");
    res.send("Password updated successfully!");
  } catch (err) {
    res.status(500).send("Error updating password.");
  }
});

// --- TICKET ROUTES ---
app.post("/tickets", async (req, res) => {
  const { email, title, description } = req.body;
  try {
    await pool.query(
      "INSERT INTO tickets (user_email, title, description) VALUES ($1, $2, $3)",
      [email, title, description]
    );
    res.status(201).send("Ticket submitted!");
  } catch (err) {
    res.status(500).send("Error saving ticket.");
  }
});

app.get("/tickets/:email", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE user_email = $1 ORDER BY created_at DESC",
      [req.params.email]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching user tickets.");
  }
});

app.delete("/tickets/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM tickets WHERE id = $1", [req.params.id]);
    res.send("Ticket deleted.");
  } catch (err) {
    res.status(500).send("Error deleting ticket.");
  }
});

// --- ADMIN ROUTES ---
app.get("/admin/tickets", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching all tickets.");
  }
});

app.put("/tickets/:id", async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE tickets SET status = $1 WHERE id = $2", [
      status,
      req.params.id,
    ]);
    res.send("Status updated!");
  } catch (err) {
    res.status(500).send("Error updating status.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
