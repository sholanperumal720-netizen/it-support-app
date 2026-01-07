const messageDiv = document.getElementById("message");
let currentUserEmail = "";
const ADMIN_EMAIL = "sholanperumal720@gmail.com";

// --- UI HELPERS ---
function showMsg(text, isError = false) {
  messageDiv.innerText = text;
  messageDiv.className = isError ? "msg-error" : "msg-success";
  messageDiv.style.display = "block";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

function showLogin() {
  document.getElementById("register-card").style.display = "none";
  document.getElementById("forgot-card").style.display = "none";
  document.getElementById("login-card").style.display = "block";
}

function showRegister() {
  document.getElementById("login-card").style.display = "none";
  document.getElementById("register-card").style.display = "block";
}

function toggleForgot(show) {
  document.getElementById("login-card").style.display = show ? "none" : "block";
  document.getElementById("forgot-card").style.display = show
    ? "block"
    : "none";
}

function clearInputs() {
  document.querySelectorAll("input, textarea").forEach((el) => (el.value = ""));
}

// --- AUTH LOGIC ---
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

    // Hide Auth, Show Nav & Dashboard
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("logout-btn").style.display = "block";

    if (currentUserEmail === ADMIN_EMAIL) {
      document.getElementById("admin-section").style.display = "block";
      loadAdminTickets();
    } else {
      document.getElementById("ticket-section").style.display = "block";
      document.getElementById("welcome-msg").innerText = `Hello, ${user.name}`;
      loadTickets();
    }
    showMsg("Welcome back!");
  } else {
    showMsg(await response.text(), true);
  }
}

async function register() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-pass").value.trim();

  if (!name || !email || !password)
    return showMsg("⚠️ All fields are required", true);

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (response.ok) {
    showMsg("Account created! Please login.");
    showLogin();
    clearInputs();
  } else {
    showMsg(await response.text(), true);
  }
}

// --- TICKET LOGIC ---
async function submitTicket() {
  const title = document.getElementById("ticket-title").value.trim();
  const description = document.getElementById("ticket-desc").value.trim();

  if (!title || !description)
    return showMsg("⚠️ Please fill in ticket details", true);

  await fetch("/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUserEmail, title, description }),
  });

  clearInputs();
  loadTickets();
  showMsg("Ticket submitted successfully!");
}

async function loadTickets() {
  const container = document.getElementById("tickets-container");
  const response = await fetch(`/tickets/${currentUserEmail}`);
  const tickets = await response.json();

  if (tickets.length === 0) {
    container.innerHTML =
      '<p style="text-align:center; color:#999;">No tickets yet.</p>';
    return;
  }

  container.innerHTML = tickets
    .map((t) => {
      // Dynamic class for badge color
      let badgeClass = "badge-open";
      if (t.status === "In Progress") badgeClass = "badge-progress";
      if (t.status === "Resolved") badgeClass = "badge-resolved";

      return `
        <div class="ticket-card">
            <div class="ticket-top">
                <span class="ticket-title">${t.title}</span>
                <span class="badge ${badgeClass}">${t.status}</span>
            </div>
            <p style="color:#4b5563; font-size:0.95rem; margin-bottom:25px;">${
              t.description
            }</p>
            
            <div class="ticket-meta">
                Created: ${new Date(t.created_at).toLocaleDateString()}
            </div>
            <button class="btn-delete" onclick="deleteTicket(${
              t.id
            })">Delete Ticket</button>
        </div>
        `;
    })
    .join("");
}

async function deleteTicket(id) {
  if (confirm("Are you sure you want to delete this ticket?")) {
    await fetch(`/tickets/${id}`, { method: "DELETE" });
    loadTickets();
    showMsg("Ticket deleted.");
  }
}

// --- ADMIN LOGIC ---
async function loadAdminTickets() {
  const container = document.getElementById("admin-tickets-container");
  const response = await fetch("/admin/tickets");
  const tickets = await response.json();

  container.innerHTML = tickets
    .map(
      (t) => `
        <div class="ticket-card">
            <div class="ticket-top">
                <span class="ticket-title">${t.user_email}</span>
                <span class="badge badge-open">${t.status}</span>
            </div>
            <p style="font-weight:600; margin-bottom:5px;">${t.title}</p>
            <p style="color:#666; font-size:0.9rem;">${t.description}</p>
            
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                <label style="font-size:0.8rem; font-weight:bold;">Update Status:</label>
                <select onchange="updateStatus(${
                  t.id
                }, this.value)" style="margin-top:5px; padding:8px;">
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
  showMsg("Status updated");
}

function logout() {
  location.reload();
}

// --- FORGOT PASSWORD ---
async function requestReset() {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) return showMsg("Please enter email", true);

  const response = await fetch("/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  showMsg(await response.text(), !response.ok);
}
