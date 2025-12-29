// This will show in the console immediately if the file loads
console.log("script.js loaded successfully");

const messageP = document.getElementById("message");

async function register() {
  console.log("Register button clicked"); // Debugging line

  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await response.text();
    messageP.innerText = result;

    // Change color based on success or error
    messageP.style.color = response.ok ? "green" : "red";
  } catch (error) {
    console.error("Fetch error:", error);
    messageP.innerText = "Cannot connect to server.";
    messageP.style.color = "red";
  }
}

async function login() {
  console.log("Login button clicked"); // Debugging line

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-pass").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.text();
    messageP.innerText = result;
    messageP.style.color = response.ok ? "green" : "red";
  } catch (error) {
    console.error("Fetch error:", error);
    messageP.innerText = "Cannot connect to server.";
    messageP.style.color = "red";
  }
}
