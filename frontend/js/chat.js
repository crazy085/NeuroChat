const chatContainer = document.getElementById('chat-container');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onmessage = e => {
  const data = JSON.parse(e.data);
  const div = document.createElement('div');
  div.classList.add('message');
  div.textContent = `${data.sender}: ${data.content}`;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

sendBtn.addEventListener('click', () => {
  if (!msgInput.value) return;
  const message = { sender: currentUser.name, content: msgInput.value };
  ws.send(JSON.stringify(message));
  msgInput.value = '';
});
