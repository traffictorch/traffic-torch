// Traffic Torch — Leaderboard submission helper
(function () {
  const ENDPOINT = 'https://traffic-torch-high-scores.traffictorch.workers.dev';
  const FP_KEY = 'tt_lb_fp';

  async function getFingerprint() {
    let fp = localStorage.getItem(FP_KEY);
    if (fp) return fp;
    try {
      const c = document.createElement('canvas');
      c.width = 220; c.height = 40;
      const ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f97316';
      ctx.fillText('TT-LB', 4, 4);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(60, 10, 140, 18);
      const data = c.toDataURL() + navigator.userAgent + screen.width + 'x' + screen.height;
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      fp = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
      localStorage.setItem(FP_KEY, fp);
    } catch {
      fp = 'fp_' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem(FP_KEY, fp);
    }
    return fp;
  }

  async function submit({ tool, url, title, score, moduleScores }) {
    const fp = await getFingerprint();
    const res = await fetch(`${ENDPOINT}/api/high-scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-fingerprint': fp },
      body: JSON.stringify({
        tool,
        url,
        title,
        overall_score: Math.round(score),
        module_scores: moduleScores || null
      })
    });
    return res.json();
  }

  function injectButton(container, payload) {
    if (!container) return;
    container.querySelector('.tt-lb-submit-wrap')?.remove();

    const wrap = document.createElement('div');
    wrap.className = 'tt-lb-submit-wrap';
    wrap.innerHTML = `
      <div class="tt-lb-submit-inner">
        <div class="tt-lb-submit-text">
          <strong>🏆 Want to be on the leaderboard?</strong>
          <p>Submit this audit to the public high-scores board. Only the URL, page title, score and module breakdown are stored. One entry per URL per tool — a higher re-audit replaces the old one.</p>
        </div>
        <button type="button" class="tt-lb-submit-btn">Submit to Leaderboard</button>
      </div>
      <div class="tt-lb-submit-status" aria-live="polite"></div>
    `;
    container.appendChild(wrap);

    const btn = wrap.querySelector('.tt-lb-submit-btn');
    const status = wrap.querySelector('.tt-lb-submit-status');

    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      try {
        const result = await submit(payload);
        if (result.success) {
          status.innerHTML = `✅ ${result.message} <a href="#tt-lb-anchor" class="tt-lb-jump">See the leaderboard ↑</a>`;
          btn.textContent = 'Submitted ✓';
          // Bust widget cache and refresh
          sessionStorage.removeItem(`tt_lb_${payload.tool}`);
          sessionStorage.removeItem('tt_lb_all');
          document.querySelectorAll('.tt-lb').forEach((w) => w.dispatchEvent(new Event('tt-lb-reload')));
        } else {
          status.textContent = `⚠️ ${result.error || result.message || 'Submission failed'}`;
          btn.disabled = false;
          btn.textContent = 'Try again';
        }
      } catch (err) {
        status.textContent = `❌ ${err.message}`;
        btn.disabled = false;
        btn.textContent = 'Try again';
      }
    });
  }

  window.TrafficTorchLeaderboard = { submit, injectButton, getFingerprint };
})();
