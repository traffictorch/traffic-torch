// Traffic Torch — Submit actions (Leaderboard + Community + Contribute)
(function () {
  const LB_ENDPOINT = 'https://traffic-torch-high-scores.traffictorch.workers.dev';
  const AUTH_ENDPOINT = 'https://traffic-torch-auth.traffictorch.workers.dev';
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

  async function submitLeaderboard({ tool, url, title, score, moduleScores }) {
    const fp = await getFingerprint();
    const res = await fetch(`${LB_ENDPOINT}/api/high-scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-fingerprint': fp },
      body: JSON.stringify({
        tool, url, title,
        overall_score: Math.round(score),
        module_scores: moduleScores || null
      })
    });
    return res.json();
  }

  async function submitContribution({ message, tool, pageUrl }) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Please log in to contribute.');
    const res = await fetch(`${AUTH_ENDPOINT}/api/contributions`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bug',
        subject: `${tool} contribution`,
        message,
        tool,
        page_url: pageUrl
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed');
    return data;
  }

  async function submitPost({ category, note, tool, url, title, score, moduleScores }) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Please log in to post.');
    const res = await fetch(`${AUTH_ENDPOINT}/api/posts`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category, note, tool, url,
        page_title: title,
        score,
        domain_mode: 'domain',
        module_scores: moduleScores
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed');
    return data;
  }

  function refreshAllWidgets() {
    document.querySelectorAll('.tt-lb').forEach((w) => w.dispatchEvent(new Event('tt-lb-reload')));
    document.querySelectorAll('.tt-contrib').forEach((w) => w.dispatchEvent(new Event('tt-contrib-reload')));
  }

  function injectStylesOnce() {
    if (document.getElementById('tt-actions-style')) return;
    const style = document.createElement('style');
    style.id = 'tt-actions-style';
    style.textContent = `
      .tt-actions-wrap { display:flex; flex-direction:column; gap:1.5rem; margin-top:1.5rem; }
      .tt-action-block { padding:2.5rem 1.5rem; border-radius:1rem; background:rgba(255,240,245,0.5); border:2px dashed rgba(249,115,22,0.5); text-align:center; }
      .dark .tt-action-block { background:rgba(40,15,30,0.35); border-color:rgba(251,146,60,0.35); }
      .tt-action-title { font-size:1.15rem; font-weight:800; margin-bottom:0.75rem; display:flex; justify-content:center; align-items:center; gap:0.5rem; }
      .tt-action-desc { font-size:1rem; color:#4b5563; max-width:640px; margin:0 auto 1.5rem; line-height:1.55; }
      .dark .tt-action-desc { color:#9ca3af; }
      .tt-action-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.9rem 2.5rem; border-radius:0.75rem; background:linear-gradient(135deg,#f97316,#ec4899); color:#fff; font-weight:700; font-size:1.05rem; border:none; cursor:pointer; transition:opacity 0.15s,transform 0.15s; box-shadow:0 4px 12px rgba(249,115,22,0.35); font-family:inherit; }
      .tt-action-btn:hover { opacity:0.92; transform:translateY(-1px); }
      .tt-action-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
      .tt-action-form { display:none; margin-top:1.25rem; max-width:560px; margin-left:auto; margin-right:auto; text-align:left; }
      .tt-action-form.open { display:block; }
      .tt-action-cats { display:flex; gap:0.75rem; margin-bottom:0.75rem; justify-content:center; flex-wrap:wrap; }
      .tt-action-cats label { display:flex; align-items:center; gap:0.35rem; font-size:0.9rem; font-weight:600; cursor:pointer; }
      .tt-action-note { width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid rgba(0,0,0,0.15); background:#fff; color:#111; font-size:0.95rem; resize:vertical; min-height:90px; font-family:inherit; box-sizing:border-box; }
      .dark .tt-action-note { background:#1f2937; color:#e5e7eb; border-color:#374151; }
      .tt-action-meta { display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:#6b7280; margin-top:0.4rem; }
      .tt-action-submit { display:block; width:100%; margin-top:0.75rem; padding:0.7rem 1.5rem; border-radius:0.5rem; background:#f97316; color:#fff; font-weight:700; border:none; cursor:pointer; font-size:0.95rem; font-family:inherit; }
      .tt-action-submit:hover { background:#ea580c; }
      .tt-action-submit:disabled { opacity:0.6; cursor:not-allowed; }
      .tt-action-status { margin-top:1rem; font-size:0.9rem; text-align:center; min-height:1.2em; color:#6b7280; }
      .tt-action-status.success { color:#16a34a; font-weight:600; }
      .tt-action-status.error { color:#dc2626; font-weight:600; }
      .tt-action-links { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin-top:0.6rem; }
      .tt-action-links a { color:#ea580c; font-weight:600; text-decoration:none; font-size:0.9rem; }
      .tt-action-links a:hover { text-decoration:underline; }
    `;
    document.head.appendChild(style);
  }

  function injectActions(container, payload) {
    if (!container) return;
    container.querySelector('.tt-actions-wrap')?.remove();
    injectStylesOnce();

    const wrap = document.createElement('div');
    wrap.className = 'tt-actions-wrap';
    wrap.innerHTML = `
      <!-- 1. Post to Community -->
      <div class="tt-action-block" id="tt-action-community">
        <div class="tt-action-title">🗣️ Share with the community</div>
        <p class="tt-action-desc">Post this audit to the UX / SEO / AEO feed. Add a short note. Shows up in the dashboard Network feed.</p>
        <button type="button" class="tt-action-btn" data-act="community-open">Post to Community</button>
        <div class="tt-action-form" data-form="community">
          <div class="tt-action-cats">
            <label><input type="radio" name="tt-pc-cat" value="ux"> UX</label>
            <label><input type="radio" name="tt-pc-cat" value="seo" checked> SEO</label>
            <label><input type="radio" name="tt-pc-cat" value="aeo"> AEO</label>
          </div>
          <input type="text" class="tt-action-note" data-title="community" maxlength="60" placeholder="Optional title (60 chars) — defaults to tool name" style="min-height:auto; padding:0.6rem 0.75rem; margin-bottom:0.6rem;">
          <textarea class="tt-action-note" data-note="community" maxlength="360" placeholder="What did you learn? (360 chars max)"></textarea>
          <div class="tt-action-meta">
            <span class="tt-pc-count">0 / 360</span>
          </div>
          <button type="button" class="tt-action-submit" data-act="community-submit">Publish to Feed</button>
        </div>
        <div class="tt-action-status" data-status="community"></div>
      </div>

      <!-- 2. Contribute to Development -->
      <div class="tt-action-block" id="tt-action-contribute">
        <div class="tt-action-title">🏅 Contribute to Development</div>
        <p class="tt-action-desc">Found a bug? Have a feature idea? Tell us. Each verified report earns 10 points on the contributors leaderboard.</p>
        <button type="button" class="tt-action-btn" data-act="contribute-open">Report a Bug or Feature</button>
        <div class="tt-action-form" data-form="contribute">
          <textarea class="tt-action-note" data-note="contribute" maxlength="2000" placeholder="Describe the bug or feature… (min 10 chars)"></textarea>
          <div class="tt-action-meta">
            <span class="tt-cont-count">0 / 2000</span>
          </div>
          <button type="button" class="tt-action-submit" data-act="contribute-submit">Submit Contribution (+10)</button>
        </div>
        <div class="tt-action-status" data-status="contribute"></div>
      </div>

      <!-- 3. Leaderboard -->
      <div class="tt-action-block" id="tt-action-leaderboard">
        <div class="tt-action-title">🏆 Want to be on the leaderboard?</div>
        <p class="tt-action-desc">Submit this audit to the public high-scores board. Only the URL, page title, score and module breakdown are stored. One entry per URL per tool — a higher re-audit replaces the old one.</p>
        <button type="button" class="tt-action-btn" data-act="lb-submit">Submit to Leaderboard</button>
        <div class="tt-action-status" data-status="leaderboard"></div>
      </div>
    `;
    container.appendChild(wrap);

    const statusEl = (key) => wrap.querySelector(`[data-status="${key}"]`);
    const setStatus = (key, msg, cls = '') => {
      const el = statusEl(key);
      if (el) { el.className = 'tt-action-status ' + cls; el.innerHTML = msg; }
    };

    // ── Post to Community ──
    const communityForm = wrap.querySelector('[data-form="community"]');
    const communityNote = wrap.querySelector('[data-note="community"]');
    const communityTitle = wrap.querySelector('[data-title="community"]');
    const communityCount = wrap.querySelector('.tt-pc-count');
    wrap.querySelector('[data-act="community-open"]').addEventListener('click', () => {
      communityForm.classList.toggle('open');
    });
    communityNote.addEventListener('input', () => {
      communityCount.textContent = `${communityNote.value.length} / 360`;
    });
    wrap.querySelector('[data-act="community-submit"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const category = wrap.querySelector('input[name="tt-pc-cat"]:checked')?.value || 'seo';
      const note = communityNote.value.trim();
      const userTitle = (communityTitle.value.trim() || '').slice(0, 60);
      if (!note) { setStatus('community', '❌ Add a short note before publishing.', 'error'); return; }
      btn.disabled = true; btn.textContent = 'Publishing…';
      try {
        await submitPost({
          category, note,
          tool: payload.tool, url: payload.url,
          title: userTitle, // empty string when not provided; feed card will fallback to tool name
          score: payload.score, moduleScores: payload.moduleScores
        });
        setStatus('community',
          `✅ Posted to the feed!
           <div class="tt-action-links">
             <a href="/dashboard/#network">View in Network feed →</a>
             <a href="/community/">Browse community →</a>
           </div>`,
          'success');
        communityNote.value = ''; communityCount.textContent = '0 / 360';
        communityTitle.value = '';
        communityForm.classList.remove('open');
        btn.textContent = 'Publish to Feed';
        refreshAllWidgets();
      } catch (err) {
        setStatus('community', `❌ ${err.message}`, 'error');
        btn.textContent = 'Publish to Feed';
      } finally { btn.disabled = false; }
    });

    // ── Contribute to Development ──
    const contributeForm = wrap.querySelector('[data-form="contribute"]');
    const contributeNote = wrap.querySelector('[data-note="contribute"]');
    const contributeCount = wrap.querySelector('.tt-cont-count');
    wrap.querySelector('[data-act="contribute-open"]').addEventListener('click', () => {
      contributeForm.classList.toggle('open');
    });
    contributeNote.addEventListener('input', () => {
      contributeCount.textContent = `${contributeNote.value.length} / 2000`;
    });
    wrap.querySelector('[data-act="contribute-submit"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const message = contributeNote.value.trim();
      if (message.length < 10) { setStatus('contribute', '❌ Please describe the issue (10+ chars).', 'error'); return; }
      btn.disabled = true; btn.textContent = 'Submitting…';
      try {
        const data = await submitContribution({
          message,
          tool: payload.tool,
          pageUrl: payload.url
        });
        setStatus('contribute',
          `✅ +10 points! Total: ${data.total_points} (${data.contribution_count} contribution${data.contribution_count === 1 ? '' : 's'}).
           <div class="tt-action-links">
             <a href="#tt-contrib-anchor">See contributors ↓</a>
           </div>`,
          'success');
        contributeNote.value = ''; contributeCount.textContent = '0 / 2000';
        contributeForm.classList.remove('open');
        btn.textContent = 'Submit Contribution (+10)';
        refreshAllWidgets();
      } catch (err) {
        setStatus('contribute', `❌ ${err.message}`, 'error');
        btn.textContent = 'Submit Contribution (+10)';
      } finally { btn.disabled = false; }
    });

    // ── Leaderboard ──
    wrap.querySelector('[data-act="lb-submit"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = 'Submitting…';
      try {
        const result = await submitLeaderboard(payload);
        if (result.success) {
          setStatus('leaderboard',
            `✅ ${result.message}
             <div class="tt-action-links">
               <a href="#tt-lb-anchor">See the leaderboard ↑</a>
             </div>`,
            'success');
          btn.textContent = 'Submitted ✓';
          refreshAllWidgets();
        } else {
          setStatus('leaderboard', `⚠️ ${result.error || result.message || 'Submission failed'}`, 'error');
          btn.disabled = false; btn.textContent = 'Try again';
        }
      } catch (err) {
        setStatus('leaderboard', `❌ ${err.message}`, 'error');
        btn.disabled = false; btn.textContent = 'Try again';
      }
    });
  }

  window.TrafficTorchLeaderboard = {
    submit: submitLeaderboard,
    injectButton: injectActions,
    getFingerprint,
    refreshAllWidgets
  };
})();