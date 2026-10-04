// Traffic Torch — High Scores Widget (drop-in, no deps)
(function () {
  const ENDPOINT = 'https://traffic-torch-high-scores.traffictorch.workers.dev';
  const COLLAPSED_COUNT = 3;

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const getMedal = (i) => ['🥇', '🥈', '🥉'][i] || '#' + (i + 1);

  function renderModules(moduleScores) {
    if (!moduleScores) return '';
    let parsed;
    try { parsed = typeof moduleScores === 'string' ? JSON.parse(moduleScores) : moduleScores; }
    catch { return ''; }
    if (!Array.isArray(parsed)) return '';
    return parsed.map((m) => {
      const s = Math.max(0, Math.min(100, Math.round(m.score || 0)));
      const cls = s >= 80 ? 'good' : s >= 60 ? 'ok' : 'bad';
      return `<div class="tt-lb-mod">
        <span class="tt-lb-mod-name">${escapeHtml(m.name || 'Module')}</span>
        <span class="tt-lb-mod-bar"><span class="tt-lb-mod-fill ${cls}" style="width:${s}%"></span></span>
        <span class="tt-lb-mod-val">${s}</span>
      </div>`;
    }).join('');
  }

  function renderCard(entry, index) {
    const medal = getMedal(index);
    const score = entry.overall_score;
    const scoreClass = score >= 90 ? 'gold' : score >= 80 ? 'silver' : score >= 70 ? 'bronze' : 'plain';
    const title = entry.title || entry.domain || 'Untitled page';
    const dateStr = new Date(entry.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return `<li class="tt-lb-card" data-rank="${index + 1}">
      <div class="tt-lb-card-top">
        <div class="tt-lb-rank-block"><span class="tt-lb-medal">${medal}</span></div>
        <div class="tt-lb-score-block">
          <div class="tt-lb-score tt-lb-score-${scoreClass}">${score}</div>
          <div class="tt-lb-score-label">/100</div>
        </div>
        <div class="tt-lb-info">
          <a class="tt-lb-title" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(title)}</a>
          <div class="tt-lb-domain">${escapeHtml(entry.domain)} <span class="tt-lb-date">· ${dateStr}</span></div>
        </div>
      </div>
      <div class="tt-lb-card-actions">
        <button type="button" class="tt-lb-btn tt-lb-details-btn" aria-expanded="false">More details ▾</button>
        <a class="tt-lb-btn tt-lb-btn-primary" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">Visit →</a>
        <button type="button" class="tt-lb-btn tt-lb-beat-btn">Beat this score</button>
        <button type="button" class="tt-lb-btn tt-lb-share-btn" data-rank="${index + 1}" data-score="${score}" data-domain="${escapeHtml(entry.domain)}">Share rank</button>
      </div>
      <div class="tt-lb-card-details" hidden>
        <div class="tt-lb-modules">${renderModules(entry.module_scores) || '<em>No module breakdown stored.</em>'}</div>
        <div class="tt-lb-meta">
          <span>Audited: ${dateStr}</span>
          <a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener" class="tt-lb-meta-link">${escapeHtml(entry.url)}</a>
        </div>
      </div>
    </li>`;
  }

  function render(el, entries) {
    if (!entries || !entries.length) {
      el.innerHTML = `<div class="tt-lb-empty">
        <div class="tt-lb-empty-icon">🏁</div>
        <p class="tt-lb-empty-title">No scores yet — be the first!</p>
        <p class="tt-lb-empty-sub">Run an audit above and submit your score to claim spot #1.</p>
      </div>`;
      return;
    }

    const tool = el.dataset.tool || '';
    const customTitle = el.dataset.title;
    const headerTitle = customTitle
      || (tool
        ? `Top Scores · ${tool.replace(/-tool$/, '').replace(/-/g, ' ')}`
        : 'Top Scores · All Tools');

    const visibleCards = entries.slice(0, COLLAPSED_COUNT);
    const hiddenCards = entries.slice(COLLAPSED_COUNT);
    const hasMore = hiddenCards.length > 0;

    el.innerHTML = `
      <header class="tt-lb-head">
        <h3 class="tt-lb-heading">🏆 ${escapeHtml(headerTitle)}</h3>
        <span class="tt-lb-sub">Top ${entries.length} of all time</span>
      </header>
      <ol class="tt-lb-list" start="1">
        ${visibleCards.map((e, i) => renderCard(e, i)).join('')}
      </ol>
      ${hasMore ? `
        <ol class="tt-lb-list tt-lb-list-more" hidden start="${COLLAPSED_COUNT + 1}">
          ${hiddenCards.map((e, i) => renderCard(e, COLLAPSED_COUNT + i)).join('')}
        </ol>
        <div class="tt-lb-toggle-wrap">
          <button type="button" class="tt-lb-toggle" aria-expanded="false">
            Show all ${entries.length} scores ↓
          </button>
        </div>` : ''}
    `;

    const toggle = el.querySelector('.tt-lb-toggle');
    const moreList = el.querySelector('.tt-lb-list-more');
    if (toggle && moreList) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        moreList.hidden = expanded;
        toggle.textContent = expanded ? `Show all ${entries.length} scores ↓` : 'Show top 3 ↑';
      });
    }

    el.querySelectorAll('.tt-lb-details-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.tt-lb-card');
        const panel = card && card.querySelector('.tt-lb-card-details');
        if (!panel) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
        btn.textContent = expanded ? 'More details ▾' : 'Hide details ▴';
      });
    });

    el.querySelectorAll('.tt-lb-beat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const urlInput = document.getElementById('page-url') || document.getElementById('url-input');
        if (urlInput) {
          urlInput.value = '';
          urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => urlInput.focus(), 350);
          urlInput.classList.add('tt-lb-pulse');
          setTimeout(() => urlInput.classList.remove('tt-lb-pulse'), 1600);
        } else {
          document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    el.querySelectorAll('.tt-lb-share-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const rank = btn.dataset.rank;
        const score = btn.dataset.score;
        const domain = btn.dataset.domain;
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('rank', rank);
        shareUrl.searchParams.set('score', score);
        shareUrl.searchParams.set('domain', domain);
        const text = `I scored #${rank} on the Traffic Torch leaderboard — ${score}/100 for ${domain} 🏆`;
        try {
          if (navigator.share) {
            await navigator.share({ title: 'Traffic Torch Leaderboard', text, url: shareUrl.toString() });
          } else {
            await navigator.clipboard.writeText(`${text}\n${shareUrl.toString()}`);
            const old = btn.textContent;
            btn.textContent = 'Copied ✓';
            setTimeout(() => { btn.textContent = old; }, 1500);
          }
        } catch {}
      });
    });
  }

  async function load(el) {
    const tool = el.dataset.tool || '';
    const limit = Math.min(parseInt(el.dataset.limit || '12', 10) || 12, 12);

    el.innerHTML = `<div class="tt-lb-skel" aria-busy="true">
      <div class="tt-lb-skel-row"></div>
      <div class="tt-lb-skel-row"></div>
      <div class="tt-lb-skel-row"></div>
    </div>`;

    try {
      const r = await fetch(`${ENDPOINT}/api/high-scores?tool=${encodeURIComponent(tool)}&limit=${limit}&_=${Date.now()}`);
      const data = await r.json();
      render(el, data.results || []);
    } catch {
      el.innerHTML = `<div class="tt-lb-empty"><p>Leaderboard unavailable right now.</p></div>`;
    }
  }

  function init() {
    document.querySelectorAll('.tt-lb').forEach((el) => {
      el.addEventListener('tt-lb-reload', () => load(el));
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { io.disconnect(); load(el); }
      }, { rootMargin: '200px' });
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();