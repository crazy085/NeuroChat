// chat.js
const chatContainer = document.getElementById('chat-container');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const conversationSearch = document.getElementById('conversation-search');

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function renderMessage(m) {
  // m: { type:'chat', id, sender, to, groupId, content, msgType, timestamp }
  const div = document.createElement('div');
  div.className = 'message' + (m.sender === window.__NEURO_CURRENT_USER.name ? ' you' : '');
  div.id = 'msg-' + m.id;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${m.sender} • ${formatTime(m.timestamp)}` + (m.to ? ' • private' : (m.groupId ? ' • group' : ''));
  div.appendChild(meta);

  if (m.msgType === 'file') {
    // show preview for images and videos, otherwise link
    const lc = m.content.toLowerCase();
    if (lc.match(/\.(png|jpe?g|gif|webp)$/)) {
      const img = document.createElement('img');
      img.src = m.content;
      img.style.maxWidth = '320px';
      img.style.borderRadius = '6px';
      div.appendChild(img);
      const a = document.createElement('a');
      a.href = m.content;
      a.textContent = 'Download';
      a.className = 'file-link';
      a.download = '';
      div.appendChild(a);
    } else if (lc.match(/\.(mp4|webm|ogg)$/)) {
      const vid = document.createElement('video');
      vid.src = m.content;
      vid.controls = true;
      vid.style.maxWidth = '320px';
      div.appendChild(vid);
      const a = document.createElement('a');
      a.href = m.content;
      a.textContent = 'Download';
      a.className = 'file-link';
      a.download = '';
      div.appendChild(a);
    } else {
      const a = document.createElement('a');
      a.href = m.content;
      a.textContent = 'Download file';
      a.className = 'file-link';
      a.download = '';
      div.appendChild(a);
    }
  } else {
    const p = document.createElement('div');
    p.textContent = m.content;
    div.appendChild(p);
  }

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function initWSListeners() {
  const ws = window.__NEURO_WS;
  if (!ws) return setTimeout(initWSListeners, 200);

  ws.addEventListener('message', ev => {
    let data;
    try { data = JSON.parse(ev.data); } catch (e) { return; }

    if (data.type === 'chat') {
      // If private message and not for me, skip (server sent only to sender+target; but broadcasted messages include group/public)
      const currentUser = window.__NEURO_CURRENT_USER;
      const currentTargetGetter = window.__NEURO_CURRENT_TARGET || (() => null);
      const activeTarget = currentTargetGetter();

      // If message is private (data.to set), show if current user is sender or recipient and if activeTarget corresponds
      if (data.to) {
        if (data.to !== currentUser.id && data.sender !== currentUser.name && data.sender !== currentUser.id) {
          // not for me
          return;
        }
        // If the active target is the conversation partner OR public is fine
        // If activeTarget is null (public) and message is private skip display
        if (!activeTarget && data.to) {
          // active is public but message is private -> don't show
          if (data.sender !== currentUser.name && data.to !== currentUser.id) return;
        }
      } else {
        // public/group messages: if activeTarget is a user (private convo), skip public messages
        if (activeTarget) return;
      }

      renderMessage(data);
    } else if (data.type === 'delete') {
      const el = document.getElementById('msg-' + data.id);
      if (el) el.remove();
    } else if (data.type === 'init_ok') {
      console.log('WS init ok for', data.userId);
    }
  });
}

// send message (with to if private)
sendBtn.addEventListener('click', () => {
  const ws = window.__NEURO_WS;
  const currentUser = window.__NEURO_CURRENT_USER;
  const currentTargetGetter = window.__NEURO_CURRENT_TARGET || (() => null);
  const target = currentTargetGetter();

  if (!ws || ws.readyState !== WebSocket.OPEN) return alert('Not connected');
  const text = msgInput.value && msgInput.value.trim();
  if (!text) return;

  const disappearTime = parseInt(document.getElementById('disappear-time')?.value) || null;

  const payload = {
    type: 'chat',
    sender: currentUser.name,
    content: text,
    msgType: 'text',
    disappearTime
  };
  if (target) payload.to = target; // private
  ws.send(JSON.stringify(payload));
  msgInput.value = '';
});

// upload button
uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return alert('Select a file');
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Upload failed');
    const ws = window.__NEURO_WS;
    const currentUser = window.__NEURO_CURRENT_USER;
    const target = (window.__NEURO_CURRENT_TARGET || (() => null))();

    const payload = {
      type: 'chat',
      sender: currentUser.name,
      content: data.url,
      msgType: 'file'
    };
    if (target) payload.to = target;
    ws.send(JSON.stringify(payload));
  } catch (e) {
    console.error('Upload error', e);
    alert('Upload failed');
  }
});

// message search
conversationSearch.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.message').forEach(msg => {
    msg.style.display = msg.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

// initialize ws listeners after login
initWSListeners();
