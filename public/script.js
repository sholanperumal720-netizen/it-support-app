const messageP = document.getElementById("message");
let currentUserEmail = "";

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
    loadTickets();
  } else {
    messageP.innerText = await response.text();
  }
}

async function submitTicket() {
  const title = document.getElementById("ticket-title").value;
  const description = document.getElementById("ticket-desc").value;

  const response = await fetch("/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUserEmail, title, description }),
  });

  if (response.ok) {
    document.getElementById("ticket-title").value = "";
    document.getElementById("ticket-desc").value = "";
    loadTickets();
  }
}

// NEW: Function to delete a ticket
async function deleteTicket(id) {
  if (!confirm("Are you sure you want to delete this ticket?")) return;

  const response = await fetch(`/tickets/${id}`, {
    method: "DELETE",
  });

  if (response.ok) {
    loadTickets(); // Refresh list immediately
  } else {
    alert("Failed to delete ticket.");
  }
}

async function loadTickets() {
  const container = document.getElementById("tickets-container");
  const response = await fetch(`/tickets/${currentUserEmail}`);
  const tickets = await response.json();

  if (tickets.length === 0) {
    container.innerHTML = "<p>No tickets found.</p>";
    return;
  }

  // Updated to include the Delete Button
  container.innerHTML = tickets
    .map(
      (t) => `
        <div style="border: 1px solid #ccc; padding: 15px; margin-top: 10px; border-radius: 5px; background: #f9f9f9; position: relative;">
            <button onclick="deleteTicket(${
              t.id
            })" style="position: absolute; top: 10px; right: 10px; background: #ff4d4d; color: white; border: none; border-radius: 3px; cursor: pointer; padding: 5px 10px; font-size: 12px;">Delete</button>
            <strong>${t.title}</strong> - <span style="color: blue;">${
        t.status
      }</span>
            <p>${t.description}</p>
            <small>${new Date(t.created_at).toLocaleString()}</small>
        </div>
    `
    )
    .join("");
}
