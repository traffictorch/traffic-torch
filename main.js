    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    menuToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

    const toggle = document.getElementById('themeToggle');
    if (localStorage.theme === 'light') document.documentElement.classList.add('light');
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      localStorage.theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
      toggle.textContent = document.documentElement.classList.contains('light') ? '☀️' : '🌙';
    });

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
});