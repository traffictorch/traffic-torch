// main.js Day Night Mode 
document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  // Apply saved theme (or default to light if none)
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  if (toggle) {
    // Set icon
    toggle.textContent = html.classList.contains('dark') ? '☀️' : '🌙';

    // Toggle handler
    toggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      const isDark = html.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toggle.textContent = isDark ? '☀️' : '🌙';
    });
  }
});


// PWA Install
let deferredPrompt = null;

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.includes('ios-app://');

function isIOS() {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function createInstallButton() {
  if (isInStandaloneMode()) return;
  console.log('createInstallButton() called');

  document.querySelectorAll('#pwa-install-btn').forEach(el => el.remove());

  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.textContent = '📱 Install Apps 💻';

  btn.className =
    'fixed bottom-6 right-6 z-[9999] ' +
    'px-7 py-3.5 md:px-8 md:py-4 ' +
    'bg-gradient-to-r from-orange-500 to-pink-600 ' +
    'text-white font-bold text-base md:text-lg ' +
    'rounded-full shadow-2xl hover:shadow-[0_20px_35px_-10px_rgba(249,115,22,0.5),0_10px_15px_-6px_rgba(236,72,153,0.5)] ' +
    'transition-all duration-200 ease-out ' +
    'hover:scale-105 active:scale-95 transform-gpu pointer-events-auto';

  btn.style.position = 'fixed';
  btn.style.inset = 'auto 1.5rem 1.5rem auto';
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

  document.documentElement.appendChild(btn);
}

function showIOSInstallInstructions() {
  if (document.getElementById('ios-install-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'ios-install-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.8)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '2147483647';
  modal.style.overflow = 'hidden';
  modal.style.backdropFilter = 'blur(8px)';
  modal.style.transition = 'opacity 300ms';

  modal.innerHTML = `
    <div style="background: rgba(17,24,39,0.95); backdrop-filter: blur(16px); border-radius: 24px; padding: 32px; max-width: 420px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); border: 1px solid rgba(165,180,252,0.2); animation: slide-up 0.3s ease-out;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h3 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 0;">Install Traffic Torch</h3>
        <button style="font-size: 32px; line-height: 1; color: #9ca3af; background: none; border: none; cursor: pointer;" onclick="this.closest('#ios-install-modal').dispatchEvent(new Event('click'))">×</button>
      </div>

      <ol style="color: #f3f4f6; margin: 0; padding-left: 20px; font-size: 18px; line-height: 1.7; font-weight: 500;">
        <li style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px;">
          <span style="font-weight: 700; color: #a5b4fc; flex-shrink: 0;">1.</span>
          <div style="color: #f3f4f6;">
            In Safari tap the <strong style="color: #ffffff; font-weight: 600;">Share</strong> button
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00eaff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-left: 8px;">
              <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
              <path d="M12 14V1"></path>
              <path d="m8 5 4-4 4 4"></path>
            </svg>
          </div>
        </li>
        <li style="display: flex; align-items: flex-start; gap: 16px;">
          <span style="font-weight: 700; color: #a5b4fc; flex-shrink: 0;">2.</span>
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; color: #f3f4f6;">
            Scroll down and tap Add to Home Screen
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00eaff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle;">
              <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
              <path d="M12 7v10"></path>
              <path d="M7 12h10"></path>
            </svg>
          </div>
        </li>
      </ol>

      <p style="margin-top: 32px; text-align: center; font-size: 14px; color: #9ca3af;">
        PWA quick access apps! 📱 💻
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    document.body.style.overflow = 'hidden';
    modal.focus();
  }, 80);

  const closeModal = (e) => {
    if (e.target === modal || e.target.closest('button')?.textContent === '×') {
      modal.remove();
      const scrollY = window.pageYOffset;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.documentElement.style.touchAction = '';
      setTimeout(() => window.scrollTo(0, scrollY), 0);
    }
  };
  modal.addEventListener('click', closeModal);
}

// ── Event Listeners ─────────────────────────────────────────────────────
//if (!isInStandaloneMode() && !document.getElementById('pwa-install-btn')) {
//  console.log('Immediate fallback: creating PWA install button');
//  createInstallButton();
//}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt fired (Chromium) → showing install button');
  createInstallButton();
});

window.addEventListener('load', () => {
  setTimeout(() => {
    if (!document.getElementById('pwa-install-btn')) {
      console.log('Load fallback: creating PWA install button');
      createInstallButton();
    }
  }, 5000);
});

window.addEventListener('appinstalled', () => {
  console.log('PWA was successfully installed');
  document.getElementById('pwa-install-btn')?.remove();
  deferredPrompt = null;
});

// Minimal service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}


// Mobile menu (unchanged – preserved exactly)
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

