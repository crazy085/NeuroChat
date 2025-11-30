const toggleBtn = document.getElementById('toggle-dark');

function applyTheme() {
  const theme = localStorage.getItem('neuro_theme') || 'light';
  if (theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

function toggleTheme() {
  if (document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    localStorage.setItem('neuro_theme', 'light');
  } else {
    document.body.classList.add('dark');
    localStorage.setItem('neuro_theme', 'dark');
  }
}

toggleBtn.addEventListener('click', toggleTheme);
applyTheme();

// request notification permission (HTTPS only)
if (window.location.protocol === 'https:' && Notification.permission !== 'granted') {
  Notification.requestPermission().then(p => console.log('Notification permission:', p));
}
