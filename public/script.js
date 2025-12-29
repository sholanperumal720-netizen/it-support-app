const messageP = document.getElementById("message");
let currentUserEmail = "";

// Set your Admin Email here
const ADMIN_EMAIL = "sholanperumal720@gmail.com";

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
    document.getElementById("logout-btn").style.display = "block";

    if (currentUserEmail === ADMIN_EMAIL) {
      document.getElementById("admin-section").style.display = "block";
      loadAdminTickets();
    } else {
      document.getElementById("ticket-section").style.display = "block";
      document.getElementById(
        "welcome-msg"
      ).innerText = `Welcome, ${user.name}`;
      loadTickets();
    }
  } else {
    messageP.innerText = await response.text();
  }
}

function logout() {
  currentUserEmail = "";
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("ticket-section").style.display = "none";
  document.getElementById("admin-section").style.display = "none";
  document.getElementById("logout-btn").style.display = "none";
  messageP.innerText = "Logged out successfully.";
}

// --- USER FUNCTIONS ---
async function submitTicket() {
  const title = document.getElementById("ticket-title").value;
  const description = document.getElementById("ticket-desc").value;
  await fetch("/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUserEmail, title, description }),
  });
  loadTickets();
}

async function loadTickets() {
  const container = document.getElementById("tickets-container");
  const response = await fetch(`/tickets/${currentUserEmail}`);
  const tickets = await response.json();
  container.innerHTML = tickets
    .map(
      (t) => `
        <div style="border: 1px solid #ccc; padding: 10px; margin-top: 10px; border-radius: 5px; background: #f9f9f9; position: relative;">
            <button onclick="deleteTicket(${t.id})" style="position: absolute; top: 10px; right: 10px; background: red; color: white; border: none; cursor: pointer;">X</button>
            <strong>${t.title}</strong> - <span style="color: blue;">${t.status}</span>
            <p>${t.description}</p>
        </div>
    `
    )
    .join("");
}

async function deleteTicket(id) {
  if (confirm("Delete this ticket?")) {
    await fetch(`/tickets/${id}`, { method: "DELETE" });
    loadTickets();
  }
}

// --- ADMIN FUNCTIONS ---
async function loadAdminTickets() {
  const container = document.getElementById("admin-tickets-container");
  const response = await fetch("/admin/tickets");
  const tickets = await response.json();

  container.innerHTML = tickets
    .map(
      (t) => `
        <div style="border: 2px solid red; padding: 10px; margin-top: 10px; border-radius: 5px;">
            <strong>From: ${t.user_email}</strong><br>
            <strong>Issue: ${t.title}</strong>
            <p>${t.description}</p>
            <select onchange="updateStatus(${t.id}, this.value)">
                <option value="Open" ${
                  t.status === "Open" ? "selected" : ""
                }>Open</option>
                <option value="In Progress" ${
                  t.status === "In Progress" ? "selected" : ""
                }>In Progress</option>
                <option value="Resolved" ${
                  t.status === "Resolved" ? "selected" : ""
                }>Resolved</option>
            </select>
        </div>
    `
    )
    .join("");
}

async function updateStatus(id, newStatus) {
  await fetch(`/tickets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  loadAdminTickets();
}
