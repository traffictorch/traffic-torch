// Traffic Torch — Contributions Widget
(function () {
  const ENDPOINT = 'https://traffic-torch-auth.traffictorch.workers.dev';

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const getMedal = (i) => ['🥇', '🥈', '🥉'][i] || '#' + (i + 1);

  const roleLabel = (role) => ({
    owner: 'Website Owner',
    designer: 'Web Designer',
    seo: 'SEO Professional',
    developer: 'Developer',
    other: 'Member'
  }[role] || 'Member');

  const domainLabel = (url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      return host.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('.');
    } catch { return 'Link'; }
  };

  const formatDate = (ts) => {
    try { return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  };

  function renderCard(entry, index) {
    const medal = getMedal(index);
    const username = entry.username || '';
    const displayName = entry.display_name || username || 'Anonymous';
    const profileUrl = '/u/' + username + '/';
    const avatar = `/images/avatars/${entry.avatar_preset || 'owner'}.svg`;

    const websiteLink = (entry.website_url && entry.website_approved)
      ? `<a class="tt-contrib-link" href="${escapeHtml(entry.website_url)}" target="_blank" rel="ugc nofollow noopener">🌐 ${escapeHtml(domainLabel(entry.website_url))}</a>`
      : '';

    return `
      <li class="tt-contrib-card" data-rank="${index + 1}">
        <div class="tt-contrib-top">
          <div class="tt-contrib-rank">${medal}</div>
          <img class="tt-contrib-avatar" src="${avatar}" alt="" loading="lazy">
          <div class="tt-contrib-body">
            <div class="tt-contrib-name">
              <a href="${profileUrl}">${escapeHtml(displayName)}</a>
              <span class="tt-contrib-role">${escapeHtml(roleLabel(entry.role))}</span>
            </div>
            <div class="tt-contrib-username">@${escapeHtml(username)}</div>
          </div>
          <div class="tt-contrib-stats">
            <div class="tt-contrib-points">${entry.total_points}</div>
            <div class="tt-contrib-count">${entry.contribution_count} contribution${entry.contribution_count === 1 ? '' : 's'}</div>
          </div>
        </div>

        <div class="tt-contrib-details">
          ${entry.bio ? `<p style="margin:0 0 0.5rem;font-style:italic;color:#d1d5db;">"${escapeHtml(entry.bio)}"</p>` : ''}
          <div class="tt-contrib-detail-row">
            ${entry.job_title ? `<span><span class="tt-contrib-detail-label">Role:</span> ${escapeHtml(entry.job_title)}</span>` : ''}
            ${entry.company ? `<span><span class="tt-contrib-detail-label">Company:</span> ${escapeHtml(entry.company)}</span>` : ''}
            ${entry.location ? `<span><span class="tt-contrib-detail-label">Location:</span> ${escapeHtml(entry.location)}</span>` : ''}
            ${entry.last_contribution ? `<span><span class="tt-contrib-detail-label">Last:</span> ${formatDate(entry.last_contribution)}</span>` : ''}
          </div>
          <div style="margin-top:0.6rem;display:flex;flex-wrap:wrap;gap:0.4rem;">
            <a class="tt-contrib-link" href="${profileUrl}">View profile →</a>
            ${websiteLink}
          </div>
        </div>

        <div class="tt-contrib-expand-row">
          <button type="button" class="tt-contrib-expand" aria-expanded="false">Details ▾</button>
        </div>
      </li>
    `;
  }

  function render(el, entries) {
    const customTitle = el.dataset.title || 'Top Contributors';

    if (!entries || !entries.length) {
      el.innerHTML = `
        <header class="tt-contrib-head">
          <h3 class="tt-contrib-heading">🏅 ${escapeHtml(customTitle)}</h3>
          <span class="tt-contrib-sub">Top 0</span>
        </header>
        <div class="tt-contrib-empty">
          <div class="tt-contrib-empty-icon">🏁</div>
          <p>No contributions yet — be the first!</p>
          <p style="font-size:0.8rem;margin-top:0.35rem;opacity:0.7;">Submit feedback from any audit to earn 10 points.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <header class="tt-contrib-head">
        <h3 class="tt-contrib-heading">🏅 ${escapeHtml(customTitle)}</h3>
        <span class="tt-contrib-sub">Top ${entries.length} of all time</span>
      </header>
      <ol class="tt-contrib-list">
        ${entries.map((e, i) => renderCard(e, i)).join('')}
      </ol>
    `;

    el.querySelectorAll('.tt-contrib-expand').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.tt-contrib-card');
        const expanded = card.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', String(expanded));
        btn.textContent = expanded ? 'Hide ▴' : 'Details ▾';
      });
    });
  }

  async function load(el) {
    const limit = Math.min(parseInt(el.dataset.limit || '12', 10) || 12, 30);
    el.innerHTML = `
      <div class="tt-contrib-skel"></div>
      <div class="tt-contrib-skel"></div>
      <div class="tt-contrib-skel"></div>`;
    try {
      const r = await fetch(`${ENDPOINT}/api/contributions/leaderboard?limit=${limit}&_=${Date.now()}`);
      const data = await r.json();
      render(el, data.results || []);
    } catch {
      el.innerHTML = `<div class="tt-contrib-empty"><p>Leaderboard unavailable right now.</p></div>`;
    }
  }

  function init() {
    document.querySelectorAll('.tt-contrib').forEach((el) => {
      el.addEventListener('tt-contrib-reload', () => load(el));
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { io.disconnect(); load(el); }
      }, { rootMargin: '200px' });
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();