const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';

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

  // Auto-activate Pro after upgrade payment (checks every 5s for 60s)
  let refreshAttempts = 0;
  const refreshInterval = setInterval(async () => {
    refreshAttempts++;
    const currentToken = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
    if (!currentToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('Pro token auto-refreshed globally – active now');
          clearInterval(refreshInterval);
          // Optional: update UI or show success
          alert('Pro activated! You now have 25 daily runs.');
        }
      }
    } catch (err) {
      console.warn('Global refresh attempt failed:', err);
    }
    if (refreshAttempts > 12) clearInterval(refreshInterval); // stop after ~1 min
  }, 5000);

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
          <h3 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0;">Install Traffic Torch</h3>
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
  // Mobile menu – with close button + body scroll lock
  const button = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('close-mobile-menu');
  if (!button || !menu) return;
  // Open / toggle
  button.addEventListener('click', () => {
    menu.classList.toggle('hidden');
    document.body.classList.toggle('overflow-hidden');
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !expanded);
  });
  // Close via × button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      menu.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      button.setAttribute('aria-expanded', 'false');
    });
  }
  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      button.setAttribute('aria-expanded', 'false');
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
      if (collapseBtn) collapseBtn.textContent = isCollapsed ? '→' : '←';
      if (desktopMenuToggle) desktopMenuToggle.textContent = isCollapsed ? '☰' : '✖';
    };
    collapseBtn?.addEventListener('click', toggleSidebar);
    desktopMenuToggle?.addEventListener('click', toggleSidebar);
    // Start expanded
    if (sidebar.classList.contains('collapsed')) toggleSidebar();
  }
  // Login/Register Modal (mobile-first, Tailwind, dark mode)
  function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full text-gray-800 dark:text-gray-200">
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-6 text-center">Login or Register</h2>
          <input id="email" type="email" placeholder="Email" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <input id="password" type="password" placeholder="Password" class="w-full p-3 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div class="flex flex-col sm:flex-row gap-4">
            <button onclick="handleAuth('login')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition">Login</button>
            <button onclick="handleAuth('register')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition">Register</button>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="mt-6 text-center w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  async function handleAuth(mode) {
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    if (!email || !password) return alert('Please enter email and password');
    try {
      const response = await fetch(`${API_BASE}/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);
       
        // Refresh token to pull latest subscription_status from DB
        try {
          const refreshRes = await fetch(`${API_BASE}/api/refresh-token`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${data.token}` }
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.token) {
            localStorage.setItem('authToken', refreshData.token);
            console.log('Token refreshed with latest Pro status');
          }
        } catch (refreshErr) {
          console.warn('Token refresh failed after login:', refreshErr);
        }
        alert(mode === 'login' ? 'Logged in successfully!' : 'Registered & logged in!');
        document.querySelector('.fixed')?.remove();
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      alert('Connection error: ' + err.message);
    }
  }
  async function upgradeToPro() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('torch_token');
    if (!token) return alert('Please login first');
    try {
      const container = document.getElementById('checkout-container');
      if (!container) throw new Error('Checkout container not found – add <div id="checkout-container"> to the page');
      container.classList.remove('hidden');
      const stripe = Stripe('pk_test_51SyjNi35Al6CUgc4F7ASfuA6j5PTrD6bYzeiLSaN8kiFqe3Dx1bEzmR5GjyFmGvqWBu2am8GjFnOgO7WNIno6kdN00jnVWUo9M');
      const fetchClientSecret = async () => {
        const response = await fetch(`${API_BASE}/api/upgrade`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Failed to create checkout session');
        }
        const data = await response.json();
        if (!data.clientSecret) throw new Error('No clientSecret returned from server');
        return data.clientSecret;
      };
      console.log('Initializing Embedded Checkout...');
      const checkout = await stripe.initEmbeddedCheckout({ fetchClientSecret });
      console.log('Mounting checkout...');
      checkout.mount('#checkout-container');
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('Upgrade failed: ' + err.message);
      document.getElementById('checkout-container')?.classList.add('hidden');
    }
  }
  function updateRunsBadge(remaining) {
    const desktopBadge = document.getElementById('runs-left');
    const mobileBadge = document.getElementById('runs-left-mobile');
    const text = remaining === undefined ? '' : `Runs left today: ${remaining}`;
    if (desktopBadge) {
      desktopBadge.textContent = text;
      if (remaining !== undefined) desktopBadge.classList.remove('hidden');
    }
    if (mobileBadge) {
      mobileBadge.textContent = text;
    }
  }
  // Upgrade Modal – uses existing #upgradeModal in HTML
  function showUpgradeModal(message = "You've reached your daily limit. Upgrade to Pro for more runs.") {
    const modal = document.getElementById('upgradeModal');
    if (!modal) {
      console.warn('#upgradeModal not found in DOM – check HTML');
      return;
    }
    // Update message (keep price/default text if needed)
    const p = modal.querySelector('p.mb-6');
    if (p) {
      p.textContent = message;
    }
    // Show it
    modal.classList.remove('hidden');
    // Optional: scroll to top of modal on mobile
    modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Centralized rate limits
  export async function canRunTool(toolName = 'default') {
    const token = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
    const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
    // Persistent anon ID (stored in localStorage, survives reloads)
    let anonId = localStorage.getItem('anon_session_id');
    if (!anonId) {
      anonId = 'anon-' + crypto.randomUUID(); // modern secure ID
      localStorage.setItem('anon_session_id', anonId);
    }
    try {
      const res = await fetch(API_BASE + '/api/check-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ anonId, toolName }) // token no longer needed in body
      });
      if (!res.ok) {
        console.error('Check-rate error:', res.status, await res.text());
        showUpgradeModal('Could not check run limit – please log in or try again.');
        return false;
      }
      const data = await res.json();
      console.log('Check-rate response:', data); // keep debug
      if (data.allowed === true) {
        if (data.remaining !== undefined) updateRunsBadge?.(data.remaining);
        return true;
      }
      // Limit hit
      showUpgradeModal(data.message || 'Upgrade to Pro $48 per/year for 25 runs/day.');
      return false;
    } catch (err) {
      console.error('canRunTool failed:', err);
      showUpgradeModal('Connection error – please try again.');
      return false;
    }
  }
  // Poll for webhook completion & replace token automatically
  async function pollForProUpgrade(sessionId) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/session-status?session_id=${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'complete') {
          // Session complete → assume webhook ran, force refresh token via login or direct replace
          // For simplicity: remove old token and prompt re-login (or implement /api/refresh)
          localStorage.removeItem('authToken');
          localStorage.removeItem('traffic_torch_jwt');
          alert('Upgrade successful! Logging you back in with Pro access...');
          showLoginModal(); // or auto-re-auth if you store credentials (not recommended)
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Session status poll error:', err);
      }
    }, 5000); // every 5s
    // Stop polling after 5 min max
    setTimeout(() => clearInterval(interval), 300000);
  }
});