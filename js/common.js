// ────────────────────────────────────────────────
//  Traffic Torch – Auth & Rate Limiting Utilities
// ────────────────────────────────────────────────

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';

function showLoginModal() {
  // your existing login modal open logic
  document.getElementById('login-modal')?.classList.remove('hidden');
  // or whatever mechanism you use (alpine, vanilla, etc.)
}

function showUpgradeModal(message = "You've reached your free limit. Upgrade to Pro for unlimited runs.") {
  // your existing upgrade modal logic
  const modal = document.getElementById('upgrade-modal');
  if (modal) {
    // optional: set message
    modal.querySelector('.upgrade-message')?.replaceChildren(message);
    modal.classList.remove('hidden');
  } else {
    alert(message + "\n\n→ Upgrade now?");
    // or window.location = "/pricing"
  }
}

async function updateRunsBadge(remaining) {
  const fmt = (v) => v == null ? '—' : String(v);

  const elDesktop = document.getElementById('runs-left');
  const elMobile  = document.getElementById('runs-left-mobile');

  if (elDesktop) elDesktop.textContent = fmt(remaining);
  if (elMobile)  elMobile.textContent  = fmt(remaining);

  // Optional: visual feedback
  if (remaining === 0 || remaining === '0') {
    elDesktop?.classList.add('text-red-600', 'dark:text-red-400');
    elMobile?.classList.add('text-red-600', 'dark:text-red-400');
  }
}

async function checkRateLimitAndRun(toolRunFunction) {
  const token = localStorage.getItem('torch_token');
  if (!token) {
    showLoginModal();
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`${API_BASE}/api/check-rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      if (/login|token|unauthorized/i.test(data.error)) {
        localStorage.removeItem('torch_token');
        showLoginModal();
      }
      return false;
    }

    if (data.upgrade) {
      showUpgradeModal(data.message);
      return false;
    }

    if (data.allowed) {
      await toolRunFunction();               // ← run the actual analysis
      updateRunsBadge(data.remaining);
      if (data.message) alert(data.message); // success/info message if any
      return true;
    }

    return false;

  } catch (err) {
    console.error(err);
    alert('Rate check failed: ' + (err.name === 'AbortError' ? 'Request timeout' : err.message));
    return false;
  }
}

// ─── Wrapper helper for tool buttons ─────────────────────────────
// Usage in each tool:
// document.getElementById('analyze-btn').addEventListener('click', () => {
//   checkRateLimitAndRun(runSeoUxAnalysis);
// });