const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuth = document.getElementById('switch-auth');

let isLogin = true; // true = login, false = signup

toggleAuth.addEventListener('click', () => {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? 'Login to NeuroChat' : 'Sign up for NeuroChat';
  authBtn.textContent = isLogin ? 'Login' : 'Sign Up';
  toggleAuth.textContent = isLogin ? 'Sign up' : 'Login';
});

authBtn.addEventListener('click', async () => {
  const name = nameInput.value;
  const password = passwordInput.value;

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
