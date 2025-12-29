const express = require("express");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// 1. DATABASE CONNECTION
// Render provides the DATABASE_URL via Environment Variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for secure cloud connection to Render/Heroku
  },
});

// 2. AUTO-TABLE CREATION
// This runs every time the server starts to ensure the database is ready
async function createTable() {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log("✅ Database table verified/created successfully.");
  } catch (err) {
    console.error("❌ Database table error:", err);
  }
}
createTable();

// 3. REGISTER ROUTE
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Basic Validation
  if (!name || !email || !password) {
    return res.status(400).send("Please fill in all fields.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into PostgreSQL
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );

    res.status(201).send("Registration successful! You can now log in.");
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation error code in Postgres
      res.status(400).send("Email already exists.");
    } else {
      console.error(err);
      res.status(500).send("Server error during registration.");
    }
  }
});

// 4. LOGIN ROUTE
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      res.send(`Welcome back, ${user.name}!`);
    } else {
      res.status(400).send("Invalid email or password.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error during login.");
  }
});

// 5. SERVER START
// Use Render's dynamic port or default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
