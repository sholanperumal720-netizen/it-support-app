// 1. IMPORT TOOLS
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();

// 2. MIDDLEWARE (The "Pre-processors")
// This allows the server to read JSON data sent from the frontend
app.use(express.json());
// This tells the server to show the files in the "public" folder (HTML, CSS, JS)
app.use(express.static("public"));

// 3. MOCK DATABASE
// For now, users are stored in this list.
// Note: If you restart the server, this list clears! We'll fix this in Phase 8.
let users = [];

// 4. REGISTER ROUTE (Create a new account)
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // VALIDATION: Make sure no fields are empty
    if (!name || !email || !password) {
      return res.status(400).send("Please fill in all fields.");
    }

    // SCRAMBLE PASSWORD: Turn "password123" into a safe hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // SAVE USER: Add them to our temporary list
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: hashedPassword,
    };
    users.push(newUser);

    res.status(201).send("User registered successfully!");
    console.log("New user registered. Current count:", users.length);
  } catch (error) {
    res.status(500).send("Server error during registration.");
  }
});

// 5. LOGIN ROUTE (Check credentials)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIND USER: Look for the email in our list
    const user = users.find((u) => u.email === email);

    if (user) {
      // COMPARE: Check if the typed password matches the scrambled one
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        res.send(`Welcome back, ${user.name}!`);
      } else {
        res.status(400).send("Invalid password.");
      }
    } else {
      // No user found with that email
      res.status(400).send("User not found.");
    }
  } catch (error) {
    res.status(500).send("Server error during login.");
  }
});

// 6. START THE SERVER
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
