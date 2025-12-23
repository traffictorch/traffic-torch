// 1. Theme Toggle - Fixed to match original custom 'light' class setup
const toggle = document.getElementById('themeToggle');

if (toggle) {
  const html = document.documentElement;

  // Determine if we should start in light mode
  const preferLight = localStorage.theme === 'light' ||
                      (!localStorage.theme && window.matchMedia('(prefers-color-scheme: light)').matches);

  if (preferLight) {
    html.classList.add('light');
    toggle.textContent = '☀️';  // In light mode: show sun = invite to dark
  } else {
    html.classList.remove('light');
    toggle.textContent = '🌙';  // In dark mode: show moon = invite to light
  }

  // Toggle on click
  toggle.addEventListener('click', () => {
    html.classList.toggle('light');
    const isLight = html.classList.contains('light');

    localStorage.theme = isLight ? 'light' : 'dark';
    toggle.textContent = isLight ? '☀️' : '🌙';
  });
}

// 2. PWA Install (unchanged)
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

// 3. Mobile menu (unchanged – preserved exactly)
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
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

// Desktop Sidebar Collapse - Icons + Centered Logo Only (No Title Text)
const sidebar = document.getElementById('desktopSidebar');
const collapseBtn = document.getElementById('sidebarCollapse');
const desktopMenuToggle = document.getElementById('desktopMenuToggle');

if (sidebar && (collapseBtn || desktopMenuToggle)) {
  const toggleSidebar = () => {
    sidebar.classList.toggle('collapsed');

    const isCollapsed = sidebar.classList.contains('collapsed');
    
    // Button icons
    if (collapseBtn) {
      collapseBtn.textContent = isCollapsed ? '→' : '←';
    }
    if (desktopMenuToggle) {
      desktopMenuToggle.textContent = isCollapsed ? '☰' : '✖';
    }
  };

  collapseBtn?.addEventListener('click', toggleSidebar);
  desktopMenuToggle?.addEventListener('click', toggleSidebar);

  // Start expanded
  if (sidebar.classList.contains('collapsed')) toggleSidebar();
}




  
