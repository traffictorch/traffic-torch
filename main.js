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
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function createInstallButton() {
  if (isInStandaloneMode()) return;

  document.querySelectorAll('#pwa-install-btn').forEach(el => el.remove());

  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.textContent = 'Install App';

  btn.className =
    'fixed bottom-6 right-6 z-[9999] ' +
    'px-7 py-3.5 md:px-8 md:py-4 ' +
    'bg-gradient-to-r from-orange-500 to-pink-600 ' +
    'text-white font-bold text-base md:text-lg ' +
    'rounded-full shadow-2xl hover:shadow-[0_20px_35px_-10px_rgba(249,115,22,0.5),0_10px_15px_-6px_rgba(236,72,153,0.5)] ' +
    'transition-all duration-200 ease-out ' +
    'hover:scale-105 active:scale-95 transform-gpu pointer-events-auto';

  // Force new stacking context + GPU layer
  btn.style.position = 'fixed';
  btn.style.inset = 'auto 1.5rem 1.5rem auto'; // bottom-6 right-6 in rem
  btn.style.zIndex = '9999';
  btn.style.transform = 'translate3d(0,0,0)';
  btn.style.willChange = 'transform';

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

  // Append to documentElement (html) instead of body → bypasses body stacking contexts
  document.documentElement.appendChild(btn);
}

// iOS popup (unchanged)
function showIOSInstallInstructions() {
  if (document.getElementById('ios-install-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'ios-install-modal';
  modal.className = 'fixed inset-0 bg-black/70 flex items-end justify-center z-[2147483646] pb-10 transition-opacity duration-300';
modal.innerHTML = `
  <div class="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-cyan-500/30 animate-slide-up">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold text-white">Install Traffic Torch</h3>
      <button class="text-gray-400 hover:text-cyan-300 text-3xl leading-none transition-colors" onclick="this.closest('#ios-install-modal').remove()">×</button>
    </div>
    
    <ol class="text-gray-300 space-y-6 text-lg leading-relaxed">
      <li class="flex items-start gap-3">
        <span class="font-bold text-cyan-400 shrink-0">1.</span>
        <div>
          Tap the <strong class="text-white">Share</strong> button
          <!-- REAL Apple Share Icon -->
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00eaff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="inline h-8 w-8 align-middle mx-2">
  <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
  <path d="M12 14V1"></path>           <!-- shaft starts higher -->
  <path d="m8 5 4-4 4 4"></path>       <!-- chevron moved up -->
</svg>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="font-bold text-cyan-400 shrink-0">2.</span>
        Scroll down and tap Add to Home Screen
      </li>
    </ol>
    
    <p class="mt-8 text-center text-sm text-gray-400">
      PWA quick access app! 📱
    </p>
  </div>
`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ── Event Listeners ─────────────────────────────────────────────────────
// ── PWA Install Event Handlers ──────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt fired (Chromium) → showing install button');
  createInstallButton();
});

// Fallback for Firefox (and other non-Chromium browsers that don't fire beforeinstallprompt)
// Show button after load if no prompt appeared after short delay
window.addEventListener('load', () => {
  setTimeout(() => {
    // Only show if we didn't already show via Chromium event
    if (!deferredPrompt && !document.getElementById('pwa-install-btn')) {
      console.log('No beforeinstallprompt detected → fallback mode for Firefox/etc');
      createInstallButton();
    }
  }, 2000); // 2 second delay to feel natural, not pushy
});

window.addEventListener('appinstalled', () => {
  console.log('PWA was successfully installed');
  document.getElementById('pwa-install-btn')?.remove();
  deferredPrompt = null;
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




  
