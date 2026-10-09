// /apps/apps.js — PWA install flow + platform detection + UI wiring

const ua = navigator.userAgent.toLowerCase();
const isIOS = /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/.test(ua);
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

let deferredPrompt = null;

// ── Toast helper ────────────────────────────────────────────
function showToast(msg, ms = 4200) {
  const t = document.createElement('div');
  t.setAttribute('role', 'status');
  t.className =
    'fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] ' +
    'bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm ' +
    'max-w-[90vw] text-center transition-opacity duration-300';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; }, ms - 300);
  setTimeout(() => t.remove(), ms);
}

// ── Uninstall tab switcher ──────────────────────────────────
function initUninstallTabs() {
  const tabs = document.querySelectorAll('[data-os-tab]');
  const panels = document.querySelectorAll('[data-os-panel]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.osTab;
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.classList.toggle('border-orange-500', on);
        t.classList.toggle('text-orange-600', on);
        t.classList.toggle('dark:text-orange-400', on);
        t.classList.toggle('border-transparent', !on);
        t.classList.toggle('text-gray-600', !on);
        t.classList.toggle('dark:text-gray-400', !on);
      });
      panels.forEach(p => {
        p.classList.toggle('hidden', p.dataset.osPanel !== target);
      });
    });
  });

  // Default to the user's actual platform
  if (isIOS) tabs[0]?.click();
  else if (isAndroid) tabs[1]?.click();
  else tabs[2]?.click();
}

// ── Install trigger ─────────────────────────────────────────
async function handleInstallClick() {
  // Already installed
  if (isStandalone) {
    showToast('You already have Traffic Torch installed ✓');
    return;
  }

  // iOS — scroll to instructions
  if (isIOS) {
    const ios = document.getElementById('ios-install');
    ios?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Follow the 4 steps below to install');
    return;
  }

  // Chromium with a live prompt
  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Installing Traffic Torch…');
      } else {
        showToast('Install cancelled — you can try any time');
      }
    } catch (e) {
      showToast('Install failed — use your browser menu instead');
    }
    deferredPrompt = null;
    updateInstallButton();
    return;
  }

  // Desktop / fallback — point to the browser UI
  showToast('Open your browser menu and choose "Install app" or "Add to Home screen"');
}

// ── Update install button state ─────────────────────────────
function updateInstallButton() {
  const btn = document.getElementById('tt-install-trigger');
  const btnFooter = document.getElementById('tt-install-trigger-footer');
  const hint = document.getElementById('install-hint');

  if (isStandalone) {
    document.getElementById('installed-banner')?.classList.remove('hidden');
    document.getElementById('install-cta-zone')?.classList.add('hidden');
    return;
  }

  if (isIOS) {
    if (btn) btn.textContent = '📲 Show install steps';
    if (btnFooter) btnFooter.textContent = '📲 Show install steps';
    if (hint) hint.textContent = 'Safari only — takes about 15 seconds.';
    return;
  }

  if (deferredPrompt) {
    if (btn) { btn.disabled = false; btn.textContent = '📲 Install App'; }
    if (btnFooter) btnFooter.textContent = '📲 Install Traffic Torch';
    if (hint) hint.textContent = 'One tap — installs in seconds, no app store needed.';
  } else if (isAndroid) {
    if (btn) { btn.disabled = false; btn.textContent = '📲 Install App'; }
    if (btnFooter) btnFooter.textContent = '📲 Install Traffic Torch';
    if (hint) hint.textContent = 'Tap Install — or use Chrome menu → "Install app".';
  } else {
    // Desktop — button disabled but hint explains how
    if (btn) { btn.disabled = false; btn.textContent = '📲 How to install'; }
    if (btnFooter) btnFooter.textContent = '📲 How to install';
    if (hint) hint.textContent = 'Look for the install icon in your browser address bar, or use the browser menu.';
  }
}

// ── Coming-soon store buttons ───────────────────────────────
function initComingSoon() {
  document.querySelectorAll('[data-coming-soon]').forEach(btn => {
    btn.addEventListener('click', () => {
      const which = btn.dataset.comingSoon === 'ios' ? 'App Store' : 'Google Play';
      showToast(`The native ${which} app is coming 2026. Install the PWA now for the full experience.`);
    });
  });
}

// ── Boot ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Wire all install buttons
  document.getElementById('tt-install-trigger')?.addEventListener('click', handleInstallClick);
  document.getElementById('tt-install-trigger-footer')?.addEventListener('click', handleInstallClick);

  initUninstallTabs();
  initComingSoon();
  updateInstallButton();
});

// Capture Chromium install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  updateInstallButton();
});

// Post-install
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.getElementById('install-cta-zone')?.classList.add('hidden');
  document.getElementById('installed-banner')?.classList.remove('hidden');
  showToast('Traffic Torch installed ✓ — launch it from your home screen', 6000);
});
