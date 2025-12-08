const toggle = document.getElementById('themeToggle');

// Load saved theme or respect OS preference
if (localStorage.theme === 'light' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
  document.documentElement.classList.add('light');
  toggle.textContent = '☀️';
} else {
  document.documentElement.classList.remove('light');
  toggle.textContent = '🌙';
}

// Toggle on click
toggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  localStorage.theme = isLight ? 'light' : 'dark';
  toggle.textContent = isLight ? '☀️' : '🌙';
});


// 2. PWA Install
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.createElement('button');
      btn.textContent = 'Install App';
      btn.className = 'fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 rounded-full shadow-2xl text-white font-bold';
      btn.onclick = () => deferredPrompt.prompt();
      document.body.appendChild(btn);
    });
