const express = require("express");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTable() {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
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

// AUTH ROUTES
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
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

// TICKET ROUTES
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
  const { email } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE user_email = $1 ORDER BY created_at DESC",
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching tickets.");
  }
});

// NEW: Delete Ticket Route
app.delete("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tickets WHERE id = $1", [id]);
    res.send("Ticket deleted successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting ticket.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
