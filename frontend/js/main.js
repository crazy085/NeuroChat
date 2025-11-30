const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const switchAuthBtn = document.getElementById('switch-auth');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');

let isLogin = true;

switchAuthBtn.addEventListener('click', () => {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? 'Login to NeuroChat' : 'Sign up for NeuroChat';
  authBtn.textContent = isLogin ? 'Login' : 'Sign Up';
  switchAuthBtn.textContent = isLogin ? 'Sign up' : 'Login';
});

authBtn.addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const password = document.getElementById('password').value;

  if (!name || !password) return alert('Enter name and password!');

  const url = isLogin ? '/api/login' : '/api/register';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  const data = await res.json();

  if (res.ok) {
    currentUser = data;
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
  } else {
    alert(data.error);
  }
});
