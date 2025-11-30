const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const loginBtn = document.getElementById('login-btn');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');

let currentUser = null;

loginBtn.addEventListener('click', async () => {
  const name = nameInput.value;
  const password = passwordInput.value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  const data = await res.json();
  if (res.ok) {
    currentUser = data;
    loginSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
  } else {
    alert(data.error);
  }
});
