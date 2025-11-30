const authSection = document.getElementById("auth-section");
const mainUI = document.getElementById("main-ui");

const nameInput = document.getElementById("name");
const pwInput = document.getElementById("password");
const authBtn = document.getElementById("auth-btn");
const switchBtn = document.getElementById("switch-auth");
const authTitle = document.getElementById("auth-title");

let isSignup = false;

let currentUser = null;
let currentTarget = "public"; // public or username

// -----------------------------
// SWITCH LOGIN/SIGNUP
// -----------------------------
switchBtn.addEventListener("click", () => {
    isSignup = !isSignup;

    if (isSignup) {
        authTitle.innerText = "Sign Up to NeuroChat";
        authBtn.innerText = "Sign Up";
        switchBtn.innerText = "Login";
    } else {
        authTitle.innerText = "Login to NeuroChat";
        authBtn.innerText = "Login";
        switchBtn.innerText = "Sign Up";
    }
});

// -----------------------------
// AUTH HANDLER
// -----------------------------
authBtn.addEventListener("click", async () => {
    const username = nameInput.value.trim();
    const password = pwInput.value.trim();

    if (!username || !password) {
        alert("Fill all fields");
        return;
    }

    const endpoint = isSignup ? "/signup" : "/login";

    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    currentUser = username;
    authSection.classList.add("hidden");
    mainUI.classList.remove("hidden");

    loadContacts();
    initChatSocket();
});

// -----------------------------
// LOAD CONTACT LIST
// -----------------------------
async function loadContacts() {
    const list = document.getElementById("contacts-list");
    list.innerHTML = "";

    const res = await fetch("/users");
    const users = await res.json();

    users
        .filter(u => u !== currentUser)
        .forEach(u => {
            const div = document.createElement("div");
            div.className = "contact-item";
            div.innerText = u;

            div.addEventListener("click", () => {
                currentTarget = u;
                document.getElementById("current-target").innerText = u;
                loadChat();
            });

            list.appendChild(div);
        });
}

// -----------------------------
// SEARCH CONTACTS
// -----------------------------
document.getElementById("contact-search").addEventListener("input", () => {
    const query = document.getElementById("contact-search").value.toLowerCase();
    const items = document.querySelectorAll(".contact-item");

    items.forEach(i => {
        if (i.innerText.toLowerCase().includes(query)) i.style.display = "block";
        else i.style.display = "none";
    });
});

// -----------------------------
// SWITCH TO PUBLIC ROOM
// -----------------------------
document.getElementById("btn-public").addEventListener("click", () => {
    currentTarget = "public";
    document.getElementById("current-target").innerText = "Public";
    loadChat();
});

// -----------------------------
// Load messages for selected chat
// -----------------------------
async function loadChat() {
    const box = document.getElementById("chat-container");
    box.innerHTML = "";

    const res = await fetch(`/messages?target=${currentTarget}&user=${currentUser}`);
    const data = await res.json();

    data.forEach(m => renderMessage(m));
}
