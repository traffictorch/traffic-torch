// 1. Theme Toggle - Standard Tailwind 'dark' class
const toggle = document.getElementById('themeToggle');
if (toggle) {
  const html = document.documentElement;
  // Set initial icon based on current mode
  const isDark = html.classList.contains('dark');
  toggle.textContent = isDark ? '☀️' : '🌙';
  // Toggle on click
  toggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const isDarkNow = html.classList.contains('dark');
    localStorage.theme = isDarkNow ? 'dark' : 'light';
    toggle.textContent = isDarkNow ? '☀️' : '🌙';
  });
}

// 2. PWA Install 
function createInstallButton() {
  if (isInStandaloneMode()) return;

  // Remove any existing buttons to prevent duplicates
  document.querySelectorAll('#pwa-install-btn').forEach(el => el.remove());

  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.textContent = 'Install App';

  // Modern Tailwind classes – big, floating, premium feel, good mobile spacing
  btn.className =
    'fixed bottom-6 right-6 z-50 ' +
    'px-7 py-3.5 md:px-8 md:py-4 ' +
    'bg-gradient-to-r from-orange-500 to-pink-600 ' +
    'text-white font-bold text-base md:text-lg ' +
    'rounded-full shadow-2xl hover:shadow-[0_20px_35px_-10px_rgba(249,115,22,0.5),0_10px_15px_-6px_rgba(236,72,153,0.5)] ' +
    'transition-all duration-200 ease-out ' +
    'hover:scale-105 active:scale-95 ' +
    'transform-gpu';

  btn.addEventListener('click', () => {
    if (isIOS()) {
      showIOSInstallInstructions();
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA install accepted');
        }
        deferredPrompt = null;
        btn.remove();
      });
    } else {
      alert('Installation ready! Check your browser menu (usually in address bar) for Install option.');
    }
  });

  document.body.appendChild(btn);
}

// 3. Register minimal service worker for PWA readiness (detectable by audits, no caching)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered with scope:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// 4. Mobile menu (unchanged – preserved exactly)
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

// 5. Desktop Sidebar Collapse - Icons + Centered Logo Only (No Title Text)
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




  
