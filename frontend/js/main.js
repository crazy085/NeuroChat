// main.js
const authSection = document.getElementById('auth-section');
const authTitle = document.getElementById('auth-title');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');
const authBtn = document.getElementById('auth-btn');
const switchAuthBtn = document.getElementById('switch-auth');

const mainUI = document.getElementById('main-ui');
const contactsList = document.getElementById('contacts-list');
const contactSearch = document.getElementById('contact-search');
const currentTargetSpan = document.getElementById('current-target');
const btnPublic = document.getElementById('btn-public');

let isLogin = true;
let currentUser = null;
let currentTarget = null; // null = public, otherwise userId
let ws = null;

// toggle login / signup
switchAuthBtn.addEventListener('click', () => {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? 'Login to NeuroChat' : 'Sign up for NeuroChat';
  authBtn.textContent = isLogin ? 'Login' : 'Sign Up';
  switchAuthBtn.textContent = isLogin ? 'Sign up' : 'Login';
});

authBtn.addEventListener('click', async () => {
  const name = nameInput.value && nameInput.value.trim();
  const password = passwordInput.value && passwordInput.value.trim();
  if (!name || !password) return alert('Enter name and password!');

  const url = isLogin ? '/api/login' : '/api/register';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Auth failed');

    currentUser = data;
    // hide auth, show main UI
    authSection.classList.add('hidden');
    mainUI.classList.remove('hidden');

    // open websocket and init
    openWebSocket();

    // load contacts
    await loadContacts();

  } catch (e) {
    console.error('Auth error', e);
    alert('Auth error');
  }
});

btnPublic.addEventListener('click', () => {
  currentTarget = null;
  currentTargetSpan.textContent = 'Public';
});

// load contacts (initial + search)
async function loadContacts(q = '') {
  try {
    const res = await fetch('/api/users' + (q ? '?q=' + encodeURIComponent(q) : ''));
    const users = await res.json();
    renderContacts(users);
  } catch (e) {
    console.error('Failed to load contacts', e);
  }
}

function renderContacts(users) {
  contactsList.innerHTML = '';
  users.forEach(u => {
    // skip current user
    if (currentUser && u.id === currentUser.id) return;
    const div = document.createElement('div');
    div.className = 'contact';
    div.innerHTML = `<div class="name">${u.name}</div><div class="status">${u.status || ''}</div>`;
    div.addEventListener('click', () => {
      currentTarget = u.id;
      currentTargetSpan.textContent = u.name;
      // clear chat container for new convo (optional)
      document.getElementById('chat-container').innerHTML = '';
      // Could also load conversation history via API in future
    });
    contactsList.appendChild(div);
  });
}

contactSearch.addEventListener('input', async (e) => {
  await loadContacts(e.target.value);
});

// open ws and send init with user id
function openWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${window.location.host}`);

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'init', userId: currentUser.id }));
    console.log('WS connected and init sent');
  });

  ws.addEventListener('message', (ev) => {
    // pass to chat.js which also listens on window.ws?
    // we'll keep a global ws for chat.js to access
    // no-op here
  });

  ws.addEventListener('close', () => console.log('WS closed'));
  ws.addEventListener('error', (e) => console.error('WS error', e));

  // export to window so chat.js can use it
  window.__NEURO_WS = ws;
  window.__NEURO_CURRENT_USER = currentUser;
  window.__NEURO_CURRENT_TARGET = () => currentTarget;
}
