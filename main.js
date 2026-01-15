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
let deferredPrompt = null;
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.includes('ios-app://');

function isIOS() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

// Create / manage install button
function createInstallButton() {
  const btn = document.createElement('button');
  btn.textContent = 'Install App';
  btn.className =
    'fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 rounded-full shadow-2xl text-white font-bold transition transform hover:scale-105 active:scale-95';
  btn.id = 'pwa-install-btn';

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
        btn.style.display = 'none';
      });
    }
  });

  // Hide if already installed / running in standalone
  if (isInStandaloneMode()) {
    btn.style.display = 'none';
  }

  document.body.appendChild(btn);
  return btn;
}

// iOS instructions popup (simple native-looking modal)
function showIOSInstallInstructions() {
  const existing = document.getElementById('ios-install-modal');
  if (existing) return;

  const modal = document.createElement('div');
  modal.id = 'ios-install-modal';
  modal.className =
    'fixed inset-0 bg-black/70 flex items-end justify-center z-50 pb-10 transition-opacity duration-300';

  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-t-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Install Traffic Torch</h3>
        <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none" onclick="this.closest('#ios-install-modal').remove()">×</button>
      </div>
      <ol class="text-gray-700 dark:text-gray-300 space-y-4 text-lg">
        <li>1. Tap the <strong>Share</strong> button <img src="https://via.placeholder.com/28x28?text=Share" alt="Share icon" class="inline h-7 w-7 align-middle mx-1"></li>
        <li>2. Scroll down and tap <strong>Add to Home Screen</strong></li>
        <li>3. Tap <strong>Add</strong> in the top-right corner</li>
      </ol>
      <p class="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        You'll get quick access like a real app!
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ── Events ───────────────────────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Button will be shown by default (unless already installed)
});

window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  document.getElementById('pwa-install-btn')?.style.display = 'none';
  deferredPrompt = null;
});

// Create button after load (safe)
window.addEventListener('load', () => {
  createInstallButton();
});

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




  
