// -----------------------------
// GLOBAL ELEMENTS
// -----------------------------
const chatContainer = document.getElementById("chat-container");
const msgInput       = document.getElementById("msg-input");
const sendBtn        = document.getElementById("send-btn");
const fileInput      = document.getElementById("file-input");
const uploadBtn      = document.getElementById("upload-btn");
const conversationSearch = document.getElementById("conversation-search");

let ws = null;
let ACTIVE_TARGET = "public";   // username or "public"
let CURRENT_USER = null;

// main.js updates this
window.__setUser = function (u) {
  CURRENT_USER = u;
};

window.__setTarget = function (t) {
  ACTIVE_TARGET = t;
};

// -----------------------------
// TIME FORMAT
// -----------------------------
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

// -----------------------------
// RENDER A MESSAGE
// -----------------------------
function renderMessage(m) {
  const div = document.createElement("div");

  const isMe = m.sender === CURRENT_USER;
  div.className = "message" + (isMe ? " you" : "");
  div.id = "msg-" + m.id;

  // META
  const meta = document.createElement("div");
  meta.className = "meta";

  meta.textContent = `${m.sender} • ${formatTime(m.timestamp)}`
        + (m.to ? " • private" : "");

  div.appendChild(meta);

  // BODY
  if (m.msgType === "file") {
    const lower = m.content.toLowerCase();

    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lower)) {
      const img = document.createElement("img");
      img.src = m.content;
      img.className = "chat-image";
      div.appendChild(img);
    } else if (/\.(mp4|webm|ogg)$/i.test(lower)) {
      const vid = document.createElement("video");
      vid.src = m.content;
      vid.controls = true;
      vid.className = "chat-video";
      div.appendChild(vid);
    }

    // Download link
    const a = document.createElement("a");
    a.href = m.content;
    a.download = "";
    a.textContent = "Download";
    a.className = "file-link";
    div.appendChild(a);

  } else {
    // TEXT
    const p = document.createElement("div");
    p.className = "text-msg";
    p.textContent = m.content;
    div.appendChild(p);
  }

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// -----------------------------
// INIT WEBSOCKET
// -----------------------------
function initChatSocket() {
  ws = new WebSocket(location.origin.replace("http", "ws"));

  ws.onopen = () => {
    console.log("WebSocket connected");

    ws.send(JSON.stringify({
      type: "identify",
      user: CURRENT_USER
    }));
  };

  ws.onmessage = (ev) => {
    let data;
    try { data = JSON.parse(ev.data); }
    catch (e) { return; }

    if (data.type === "chat") {
      // PRIVATE MESSAGE FILTER
      if (data.to) {
        // Only show if I'm sender or recipient AND target is this user
        if (data.to !== CURRENT_USER && data.sender !== CURRENT_USER) return;
        if (ACTIVE_TARGET !== data.sender && ACTIVE_TARGET !== data.to) return;
      } else {
        // PUBLIC message filter: only show in public mode
        if (ACTIVE_TARGET !== "public") return;
      }

      renderMessage(data);
    }

    else if (data.type === "delete") {
      const el = document.getElementById("msg-" + data.id);
      if (el) el.remove();
    }
  };

  ws.onclose = () => {
    console.warn("WebSocket closed, reconnecting...");
    setTimeout(initChatSocket, 1200);
  };

  window.__NEURO_WS = ws;
}

// Export for main.js
window.__initChatSocket = initChatSocket;

// -----------------------------
// SEND MESSAGE
// -----------------------------
sendBtn.addEventListener("click", () => {
  const text = msgInput.value.trim();
  if (!text) return;

  if (!ws || ws.readyState !== 1) {
    alert("Not connected!");
    return;
  }

  const disappearTime = parseInt(
    document.getElementById("disappear-time").value
  ) || null;

  ws.send(JSON.stringify({
    type: "chat",
    sender: CURRENT_USER,
    content: text,
    msgType: "text",
    to: ACTIVE_TARGET !== "public" ? ACTIVE_TARGET : null,
    disappearTime
  }));

  msgInput.value = "";
});

// -----------------------------
// UPLOAD FILE
// -----------------------------
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Select a file");

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form
  });

  const data = await res.json();

  if (!data.url) {
    alert("Upload failed");
    return;
  }

  ws.send(JSON.stringify({
    type: "chat",
    sender: CURRENT_USER,
    content: data.url,
    msgType: "file",
    to: ACTIVE_TARGET !== "public" ? ACTIVE_TARGET : null
  }));
});

// -----------------------------
// SEARCH MESSAGES
// -----------------------------
conversationSearch.addEventListener("input", () => {
  const term = conversationSearch.value.toLowerCase();

  document.querySelectorAll(".message").forEach(m => {
    m.style.display = m.textContent.toLowerCase().includes(term)
        ? "block" : "none";
  });
});
