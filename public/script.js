const messageP = document.getElementById("message");
let currentUserEmail = "";
const ADMIN_EMAIL = "sholanperumal720@gmail.com";

function showMsg(text, isError = false) {
  messageP.innerText = text;
  messageP.style.display = "block";
  messageP.style.color = isError ? "#ef4444" : "#10b981";
  messageP.style.background = isError ? "#fee2e2" : "#d1fae5";
}

function clearUI() {
  messageP.style.display = "none";
  messageP.innerText = "";
  document.querySelectorAll("input, textarea").forEach((i) => (i.value = ""));
}

async function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  if (!email || !password)
    return showMsg("⚠️ Please enter email and password", true);

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
    showMsg(await response.text(), true);
  }
}

async function register() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-pass").value.trim();

  if (!name || !email || !password)
    return showMsg("⚠️ All fields are required!", true);

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  showMsg(await response.text(), !response.ok);
}

// USER FUNCTIONS
async function submitTicket() {
  const title = document.getElementById("ticket-title").value;
  const description = document.getElementById("ticket-desc").value;
  await fetch("/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUserEmail, title, description }),
  });
  loadTickets();
  showMsg("Ticket submitted successfully!");
}

async function loadTickets() {
  const container = document.getElementById("tickets-container");
  const response = await fetch(`/tickets/${currentUserEmail}`);
  const tickets = await response.json();

  container.innerHTML = tickets
    .map(
      (t) => `
        <div class="ticket-card">
            <div class="ticket-header">
                <strong>${t.title}</strong>
                <span class="status-badge status-${t.status
                  .toLowerCase()
                  .replace(" ", "-")}">${t.status}</span>
            </div>
            <p>${t.description}</p>
            <div style="margin-top:10px; text-align:right;">
                 <button onclick="deleteTicket(${
                   t.id
                 })" style="background:#ef4444; width:auto; padding:5px 10px; font-size:0.8rem;">Delete</button>
            </div>
        </div>
    `
    )
    .join("");
}

async function deleteTicket(id) {
  if (confirm("Are you sure you want to delete this ticket?")) {
    await fetch(`/tickets/${id}`, { method: "DELETE" });
    loadTickets();
  }
}

// ADMIN FUNCTIONS
async function loadAdminTickets() {
  const container = document.getElementById("admin-tickets-container");
  const response = await fetch("/admin/tickets");
  const tickets = await response.json();

  container.innerHTML = tickets
    .map(
      (t) => `
        <div class="ticket-card" style="border-left: 4px solid #ef4444;">
            <small>${t.user_email}</small>
            <h4>${t.title}</h4>
            <p>${t.description}</p>
            <select onchange="updateStatus(${
              t.id
            }, this.value)" style="margin-top:10px;">
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
}

// RESET PASSWORD UI
function toggleForgot(show) {
  clearUI();
  document.getElementById("login-box").style.display = show ? "none" : "block";
  document.getElementById("reg-box").style.display = show ? "none" : "block";
  document.getElementById("forgot-box").style.display = show ? "block" : "none";
}

async function requestReset() {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) return showMsg("Please enter your email", true);

  const response = await fetch("/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  showMsg(await response.text(), !response.ok);
}

function logout() {
  location.reload();
}
