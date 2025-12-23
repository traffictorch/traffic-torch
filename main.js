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

// 4. Desktop Sidebar Collapse - Clean & Consistent (uses .collapsed class + CSS)
const sidebar = document.getElementById('desktopSidebar');
const collapseBtn = document.getElementById('sidebarCollapse');
const desktopMenuToggle = document.getElementById('desktopMenuToggle');
const sidebarTitle = document.getElementById('sidebarTitle');

if (sidebar && (collapseBtn || desktopMenuToggle) && sidebarTitle) {
  const toggleSidebar = () => {
    sidebar.classList.toggle('collapsed');

    // Sync title visibility
    if (sidebar.classList.contains('collapsed')) {
      sidebarTitle.classList.add('hidden');
    } else {
      sidebarTitle.classList.remove('hidden');
    }

    // Update button icons
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (collapseBtn) {
      collapseBtn.textContent = isCollapsed ? '→' : '←';
    }
    if (desktopMenuToggle) {
      desktopMenuToggle.textContent = isCollapsed ? '☰' : '✖';
    }
  };

  // Attach to both buttons
  if (collapseBtn) collapseBtn.addEventListener('click', toggleSidebar);
  if (desktopMenuToggle) desktopMenuToggle.addEventListener('click', toggleSidebar);

  // Ensure EXPANDED by default on load
  if (sidebar.classList.contains('collapsed')) {
    toggleSidebar();
  }
}




  
