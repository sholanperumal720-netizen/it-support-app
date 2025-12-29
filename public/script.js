const messageP = document.getElementById("message");
let currentUserEmail = ""; // To remember who is logged in

async function register() {
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  messageP.innerText = await response.text();
}

async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-pass").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const user = await response.json();
    currentUserEmail = user.email;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("ticket-section").style.display = "block";
    document.getElementById("welcome-msg").innerText = `Welcome, ${user.name}`;
    messageP.innerText = "";
  } else {
    messageP.innerText = await response.text();
  }
}

async function submitTicket() {
  const title = document.getElementById("ticket-title").value;
  const description = document.getElementById("ticket-desc").value;

  if (!title || !description) {
    alert("Please fill in the ticket details.");
    return;
  }

  const response = await fetch("/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUserEmail, title, description }),
  });

  if (response.ok) {
    alert("Ticket submitted!");
    document.getElementById("ticket-title").value = "";
    document.getElementById("ticket-desc").value = "";
  } else {
    alert("Error submitting ticket.");
  }
}
