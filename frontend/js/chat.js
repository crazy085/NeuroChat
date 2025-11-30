const chatContainer = document.getElementById('chat-container');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const contactSearch = document.getElementById('contact-search');
const conversationSearch = document.getElementById('conversation-search');

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onmessage = e => {
  const data = JSON.parse(e.data);
  if (data.deleted) {
    const msgDiv = document.getElementById(data.id);
    if (msgDiv) msgDiv.remove();
    return;
  }
  const div = document.createElement('div');
  div.classList.add('message');
  div.id = data.id;
  div.textContent = `${data.sender}: ${data.content}`;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  if (Notification.permission === 'granted' && data.sender !== currentUser.name) {
    new Notification(`New message from ${data.sender}`, { body: data.content });
  }
};

sendBtn.addEventListener('click', () => {
  if (!msgInput.value) return;
  const disappearTime = parseInt(document.getElementById('disappear-time')?.value) || null;
  const message = { sender: currentUser.name, content: msgInput.value, disappearTime };
  ws.send(JSON.stringify(message));
  msgInput.value = '';
});

uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  const message = { sender: currentUser.name, content: data.url, type: 'file' };
  ws.send(JSON.stringify(message));
});

contactSearch.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.message').forEach(msg => {
    msg.style.display = msg.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

conversationSearch.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.message').forEach(msg => {
    msg.style.display = msg.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});
