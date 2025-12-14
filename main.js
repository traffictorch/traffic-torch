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
    
    
    
// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('menuToggle');
  const menu   = document.getElementById('mobileMenu');

  // If missing on a page, just exit (404 page etc)
  if (!button || !menu) return;

  button.addEventListener('click', () => {
    menu.classList.toggle('hidden');
    
    // Optional: change aria for screen readers
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !expanded);
  });

  // Close when clicking a link (nice UX)
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => menu.classList.add('hidden'));
  });
});

// main.js – Apply mode before DOM load
(function () {
  const mode = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.add(mode);
})();
