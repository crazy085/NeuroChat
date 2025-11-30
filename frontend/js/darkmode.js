const toggleBtn = document.getElementById('toggle-dark');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

if (Notification.permission !== 'granted') Notification.requestPermission();
