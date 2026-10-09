// ============================================================
// Traffic Torch — Messages (vanilla JS, works on every page)
// Menu markup lives in desktop-menu.html / mobile-menu.html.
// This file wires the click handlers, updates the badge,
// and self-injects the drawer UI.
// ============================================================
(function () {
  'use strict';
  if (window.__ttMessagesLoaded) return;
  window.__ttMessagesLoaded = true;

  const API = 'https://traffic-torch-auth.traffictorch.workers.dev';
  const EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🙏'];
  const MAX_LEN = 2000;
  const MAX_FILE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = [
    'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
    'application/pdf','text/plain','text/markdown','text/csv',
    'text/html','text/css','text/javascript','application/javascript',
    'application/json','application/xml','text/xml',
    'application/zip','application/x-zip-compressed',
  ];
  const ACCEPT_ATTR = [
    'image/*','application/pdf','.txt','.md','.csv',
    '.html','.htm','.css','.js','.mjs','.json','.xml','.svg','.zip'
  ].join(',');

  const getToken = () => localStorage.getItem('authToken');
  const decodeJwt = t => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); } catch { return null; } };
  const isAuthed = () => {
    const t = getToken();
    if (!t) return false;
    const p = decodeJwt(t);
    return p && p.exp && p.exp * 1000 > Date.now();
  };

  const esc = s => String(s ?? '').replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
  const isDark = () => document.documentElement.classList.contains('dark');
  const T = (dark, light) => isDark() ? dark : light;
  const relTime = ts => {
    if (!ts) return '';
    const d = Date.now() - ts, m = Math.floor(d / 60000);
    if (m < 1) return 'now';
    if (m < 60) return m + 'm';
    const h = Math.floor(m / 60); if (h < 24) return h + 'h';
    const dd = Math.floor(h / 24); if (dd < 7) return dd + 'd';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const avatarFor = u => {
    if (!u) return '/images/avatars/owner.svg';
    if (u.avatar_url) return u.avatar_url;
    return '/images/avatars/' + (u.avatar_preset || 'owner') + '.svg';
  };
  const truncate = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; };

  let me = null;
  let unreadCount = 0;
  let threads = [];
  let activeThread = null;
  let pollTimer = null;
  let newMsgTimer = null;
  let ws = null;
  let wsReconnectTimer = null;
  let wsBackoff = 1000;
  let drawerBuilt = false;

  async function api(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    const t = getToken();
    if (t) headers.Authorization = 'Bearer ' + t;
    if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const res = await fetch(API + path, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status));
    return data;
  }

  async function refreshUnread() {
    if (!isAuthed()) { unreadCount = 0; paintBadges(); return; }
    try { const d = await api('/api/messages/unread-count'); unreadCount = d.count || 0; }
    catch {}
    paintBadges();
  }

  // ---------- badge ----------
  function paintBadges() {
    ['tt-beams-count', 'tt-beams-count-mobile'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (unreadCount > 0) {
        el.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
        el.classList.remove('hidden');
      } else {
        el.textContent = '';
        el.classList.add('hidden');
      }
    });
  }

  // ---------- wire the static sidebar links ----------
  function wireStaticBeamsLinks() {
    const wire = (linkId) => {
      const btn = document.getElementById(linkId);
      if (!btn || btn.dataset.ttWired === '1') return;
      btn.dataset.ttWired = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mm = document.getElementById('mobileMenu');
        if (mm && !mm.classList.contains('hidden')) {
          mm.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        }
        openInbox();
      });
    };
    wire('tt-beams-inbox-link');
    wire('tt-beams-inbox-link-mobile');
    paintBadges();
  }

  function waitForBeamsLinks(cb) {
    const start = Date.now();
    const iv = setInterval(() => {
      if (document.getElementById('tt-beams-inbox-link') || document.getElementById('tt-beams-inbox-link-mobile')) {
        clearInterval(iv); cb();
      } else if (Date.now() - start > 8000) {
        clearInterval(iv); cb();
      }
    }, 100);
  }

  // ---------- drawer ----------
  function buildDrawer() {
    if (drawerBuilt) return;
    drawerBuilt = true;
    const root = document.createElement('div');
    root.id = 'tt-msg-root';
    root.innerHTML = `
      <div id="tt-msg-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:99998;"></div>
      <aside id="tt-msg-panel" role="dialog" aria-label="Messages" style="display:none;position:fixed;top:0;right:0;bottom:0;width:100%;max-width:420px;z-index:99999;flex-direction:column;box-shadow:-10px 0 40px rgba(0,0,0,0.3);transform:translateX(100%);transition:transform 0.22s ease-out, background 0.2s;"></aside>
    `;
    document.body.appendChild(root);
    document.getElementById('tt-msg-overlay').addEventListener('click', closeInbox);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('tt-msg-panel').style.display !== 'none') closeInbox();
    });
  }

  function openInbox() {
    if (!isAuthed()) { window.location.href = '/login/'; return; }
    buildDrawer();
    activeThread = null;
    renderPanelContent();
    const root = document.getElementById('tt-msg-root');
    const ov = document.getElementById('tt-msg-overlay');
    const panel = document.getElementById('tt-msg-panel');
    root.style.display = 'block';
    ov.style.display = 'block';
    panel.style.display = 'flex';
    requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });
    document.body.classList.add('overflow-hidden');
    loadThreads();
  }

  function closeInbox() {
    const panel = document.getElementById('tt-msg-panel');
    const ov = document.getElementById('tt-msg-overlay');
    const root = document.getElementById('tt-msg-root');
    if (!panel) return;
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => { panel.style.display = 'none'; ov.style.display = 'none'; root.style.display = 'none'; }, 220);
    document.body.classList.remove('overflow-hidden');
  }

  function renderPanelContent() {
    const panel = document.getElementById('tt-msg-panel');
    panel.style.background = T('#111827', '#ffffff');
    panel.style.color = T('#f3f4f6', '#111827');
    if (activeThread) {
      panel.innerHTML = renderThreadView(activeThread);
      wireThreadView(panel);
    } else {
      panel.innerHTML = renderThreadList();
      wireThreadList(panel);
    }
  }

  function headerHTML(title, showBack, muted) {
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid ${T('#374151','#e5e7eb')};">
        ${showBack ? `<button data-tt-back style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit;padding:0 4px;">←</button>` : ''}
        <h2 style="margin:0;font-size:16px;font-weight:800;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(title)}</h2>
        ${muted !== undefined ? `<button data-tt-mute title="${muted ? 'Unmute' : 'Mute'}" style="background:none;border:1px solid ${T('#4b5563','#d1d5db')};border-radius:8px;padding:4px 8px;font-size:14px;cursor:pointer;color:inherit;">${muted ? '🔇' : '🔔'}</button>` : ''}
        <button data-tt-close style="background:none;border:none;font-size:24px;cursor:pointer;color:inherit;line-height:1;padding:0 4px;">×</button>
      </div>`;
  }

  function renderThreadList() {
    let body = '';
    if (!threads.length) {
      body = `<div style="padding:48px 24px;text-align:center;color:${T('#9ca3af','#6b7280')};">
        <p style="font-size:36px;margin:0 0 12px;">📬</p>
        <p style="margin:0;font-weight:600;">No messages yet</p>
        <p style="margin:8px 0 0;font-size:13px;">Start a conversation from someone's profile.</p>
      </div>`;
    } else {
      body = threads.map(t => {
        const unread = t.unread_count > 0;
        return `<button data-tt-thread="${t.peer.id}" style="display:flex;gap:12px;align-items:center;width:100%;padding:12px 16px;text-align:left;background:${unread ? T('rgba(249,115,22,0.10)','rgba(249,115,22,0.06)') : 'transparent'};border:none;border-bottom:1px solid ${T('#1f2937','#f3f4f6')};cursor:pointer;color:inherit;font-family:inherit;">
          <img src="${avatarFor(t.peer)}" width="44" height="44" style="width:44px;height:44px;border-radius:50%;flex-shrink:0;object-fit:cover;" alt="">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;">
              <span style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.peer.display_name || t.peer.username)}</span>
              <span style="font-size:11px;color:${T('#9ca3af','#6b7280')};flex-shrink:0;">${relTime(t.last_message && t.last_message.created_at)}</span>
            </div>
            <div style="font-size:13px;color:${T('#9ca3af','#6b7280')};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(truncate(t.last_message && t.last_message.body, 60))}</div>
          </div>
          ${unread ? `<span style="min-width:20px;height:20px;padding:0 6px;font-size:11px;font-weight:800;border-radius:9999px;background:#f97316;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${t.unread_count}</span>` : ''}
        </button>`;
      }).join('');
    }
    return headerHTML('Beams 🔦', false) + `<div style="flex:1;overflow-y:auto;">${body}</div>`;
  }

  function renderThreadView(th) {
    const peer = th.peer || {};
    const msgs = th.messages || [];
    let listHTML = '';
    if (th.hasMore) {
      listHTML += `<button data-tt-load-older style="display:block;width:100%;padding:10px;background:none;border:none;color:#f97316;cursor:pointer;font-family:inherit;font-size:13px;">Load older messages</button>`;
    }
    if (!msgs.length) {
      listHTML += `<p style="text-align:center;color:${T('#9ca3af','#6b7280')};padding:32px 16px;font-size:14px;">No messages yet. Say hi 👋</p>`;
    }
    const myId = me && me.id;
    msgs.forEach(m => {
      const mine = m.from_user_id === myId;
      const bubbleBg = mine ? '#f97316' : T('#1f2937','#f3f4f6');
      const bubbleFg = mine ? '#ffffff' : T('#f3f4f6','#111827');
      const attachments = (m.attachments || []).map(a =>
        `<a data-tt-att="${a.id}" data-tt-filename="${esc(a.filename)}" href="#" style="display:block;font-size:12px;text-decoration:underline;color:inherit;margin-top:4px;cursor:pointer;">📎 ${esc(a.filename)}</a>`
      ).join('');
      const reactions = (m.reactions || []).length
        ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">` + m.reactions.map(r =>
            `<button data-tt-react="${m.id}" data-tt-emoji="${esc(r.emoji)}" style="padding:2px 8px;font-size:11px;border-radius:9999px;border:1px solid ${r.mine ? 'rgba(255,255,255,0.7)' : 'transparent'};background:rgba(0,0,0,0.15);color:inherit;cursor:pointer;font-family:inherit;">${esc(r.emoji)} ${r.count}</button>`
          ).join('') + `</div>` : '';
      const replyIndicator = m.reply_to_id
        ? `<div style="font-size:10px;opacity:0.7;margin-bottom:4px;border-left:2px solid currentColor;padding-left:6px;">↩ reply</div>`
        : '';
      listHTML += `<div style="display:flex;justify-content:${mine ? 'flex-end' : 'flex-start'};">
        <div style="max-width:80%;background:${bubbleBg};color:${bubbleFg};padding:8px 12px;border-radius:16px;${mine ? 'border-bottom-right-radius:4px;' : 'border-bottom-left-radius:4px;'}">
          ${replyIndicator}
          <div style="font-size:14px;white-space:pre-wrap;word-break:break-word;">${esc(m.body)}</div>
          ${attachments}
          ${reactions}
          <div style="position:relative;margin-top:4px;">
            <button data-tt-picker="${m.id}" style="background:none;border:none;color:inherit;opacity:0.6;cursor:pointer;font-size:12px;padding:2px 4px;font-family:inherit;">+😀</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:10px;opacity:0.7;">
            <span>${relTime(m.created_at)}</span>
            ${mine && m.is_read ? '<span>✓</span>' : ''}
            ${mine ? `<button data-tt-del="${m.id}" style="margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;font-size:11px;opacity:0.7;">🗑</button>` : ''}
            <button data-tt-reply="${m.id}" style="background:none;border:none;color:inherit;cursor:pointer;font-size:11px;opacity:0.7;">↩</button>
          </div>
        </div>
      </div>`;
    });

    let replyQuote = '';
    if (th.reply_to_id) {
      const parent = (th.messages || []).find(x => x.id === th.reply_to_id);
      const preview = parent ? (parent.body || '').slice(0, 80) : '(message)';
      replyQuote = `<div style="font-size:11px;color:${T('#9ca3af','#6b7280')};margin-bottom:6px;padding:6px 8px;background:${T('#1f2937','#f3f4f6')};border-left:3px solid #f97316;border-radius:4px;display:flex;justify-content:space-between;gap:8px;">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><strong>Replying:</strong> ${esc(preview)}</span>
        <button data-tt-cancel-reply style="background:none;border:none;color:#f97316;cursor:pointer;font-family:inherit;font-size:11px;flex-shrink:0;">Cancel</button>
      </div>`;
    }

    const composeBar = `
      <div style="border-top:1px solid ${T('#374151','#e5e7eb')};padding:12px;">
        ${replyQuote}
        ${th.attachments && th.attachments.length ? th.attachments.map(a => `<div style="font-size:12px;margin-bottom:6px;">📎 ${esc(a.filename)} <button data-tt-remove-att="${esc(a.key)}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-family:inherit;">×</button></div>`).join('') : ''}
        <div style="display:flex;gap:8px;align-items:flex-end;">
          <label style="cursor:pointer;padding:8px;border-radius:8px;background:${T('#1f2937','#f3f4f6')};color:inherit;font-size:16px;">
            📎<input data-tt-file type="file" style="display:none;" accept="${ACCEPT_ATTR}">
          </label>
          <textarea data-tt-input maxlength="${MAX_LEN}" rows="1" placeholder="Message…" style="flex:1;padding:8px;border:1px solid ${T('#4b5563','#d1d5db')};border-radius:8px;background:${T('#0f172a','#ffffff')};color:inherit;font-family:inherit;font-size:14px;resize:none;outline:none;"></textarea>
          <button data-tt-send style="padding:8px 16px;border:none;border-radius:8px;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;">Send</button>
        </div>
        <p data-tt-error style="color:#ef4444;font-size:12px;margin:6px 0 0;display:none;"></p>
      </div>`;

    return headerHTML(peer.display_name || peer.username || 'Thread', true, th.muted) +
      `<div data-tt-thread-body style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;">${listHTML}</div>` +
      composeBar;
  }

  function showEmojiPicker(anchor, messageId) {
    const existing = document.getElementById('tt-emoji-picker');
    if (existing) existing.remove();
    const picker = document.createElement('div');
    picker.id = 'tt-emoji-picker';
    const dark = isDark();
    picker.style.cssText = `position:fixed;background:${dark ? '#1f2937' : '#ffffff'};border:1px solid ${dark ? '#374151' : '#e5e7eb'};border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.25);padding:6px;display:flex;gap:4px;z-index:2147483647;`;
    EMOJI.forEach(em => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = em;
      btn.style.cssText = `background:none;border:none;font-size:22px;cursor:pointer;padding:4px 6px;border-radius:6px;font-family:inherit;`;
      btn.addEventListener('mouseenter', () => { btn.style.background = dark ? '#374151' : '#f3f4f6'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
      btn.addEventListener('click', async () => {
        picker.remove();
        await toggleReaction(messageId, em);
      });
      picker.appendChild(btn);
    });
    const r = anchor.getBoundingClientRect();
    picker.style.top = Math.max(8, r.top - 52) + 'px';
    picker.style.left = Math.min(r.left, window.innerWidth - 260) + 'px';
    document.documentElement.appendChild(picker);
    setTimeout(() => {
      const close = (ev) => {
        if (!picker.contains(ev.target)) { picker.remove(); document.removeEventListener('click', close); }
      };
      document.addEventListener('click', close);
    }, 10);
  }

  function wireThreadList(panel) {
    panel.querySelector('[data-tt-close]').addEventListener('click', closeInbox);
    panel.querySelectorAll('[data-tt-thread]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-tt-thread'));
        const t = threads.find(x => x.peer.id === id);
        if (t) openThread(t.peer);
      });
    });
  }

  function wireThreadView(panel) {
    panel.querySelector('[data-tt-close]').addEventListener('click', closeInbox);
    const back = panel.querySelector('[data-tt-back]');
    if (back) back.addEventListener('click', () => { activeThread = null; renderPanelContent(); loadThreads(); });
    const mute = panel.querySelector('[data-tt-mute]');
    if (mute) mute.addEventListener('click', toggleMute);
    const older = panel.querySelector('[data-tt-load-older]');
    if (older) older.addEventListener('click', loadOlder);
    panel.querySelectorAll('[data-tt-del]').forEach(b => b.addEventListener('click', () => deleteMsg(parseInt(b.getAttribute('data-tt-del')))));
    panel.querySelectorAll('[data-tt-reply]').forEach(b => b.addEventListener('click', () => {
      activeThread.reply_to_id = parseInt(b.getAttribute('data-tt-reply'));
      renderPanelContent();
    }));
    panel.querySelectorAll('[data-tt-react]').forEach(b => b.addEventListener('click', () => {
      toggleReaction(parseInt(b.getAttribute('data-tt-react')), b.getAttribute('data-tt-emoji'));
    }));
    panel.querySelectorAll('[data-tt-picker]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const msgId = parseInt(b.getAttribute('data-tt-picker'));
        showEmojiPicker(b, msgId);
      });
    });
    panel.querySelectorAll('[data-tt-att]').forEach(a => {
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        await downloadAttachment(parseInt(a.getAttribute('data-tt-att')), a.getAttribute('data-tt-filename'));
      });
    });
    const cancelReply = panel.querySelector('[data-tt-cancel-reply]');
    if (cancelReply) cancelReply.addEventListener('click', () => { activeThread.reply_to_id = null; renderPanelContent(); });
    panel.querySelectorAll('[data-tt-remove-att]').forEach(b => b.addEventListener('click', () => {
      activeThread.attachments = (activeThread.attachments || []).filter(a => a.key !== b.getAttribute('data-tt-remove-att'));
      renderPanelContent();
    }));
    const file = panel.querySelector('[data-tt-file]');
    if (file) file.addEventListener('change', onFilePicked);
    const send = panel.querySelector('[data-tt-send]');
    const input = panel.querySelector('[data-tt-input]');
    if (send) send.addEventListener('click', sendCurrent);
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCurrent(); }
      });
      input.focus();
    }
    const body = panel.querySelector('[data-tt-thread-body]');
    if (body) requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }

  async function loadThreads() {
    try {
      const d = await api('/api/messages/inbox?limit=50');
      threads = d.threads || [];
    } catch (e) { threads = []; }
    if (!activeThread) renderPanelContent();
  }

  async function openThread(peer) {
    activeThread = { peer, messages: [], hasMore: false, cursor: null, muted: false, reply_to_id: null, attachments: [] };
    renderPanelContent();
    try {
      const d = await api(`/api/messages/thread/${encodeURIComponent(peer.username)}?limit=50`);
      activeThread.messages = d.messages || [];
      activeThread.hasMore = !!d.has_more;
      activeThread.cursor = d.cursor || null;
      activeThread.muted = !!d.muted;
      await api('/api/messages/read', { method: 'POST', body: JSON.stringify({ from_user_id: peer.id }) });
      const t = threads.find(x => x.peer.id === peer.id);
      if (t) t.unread_count = 0;
      refreshUnread();
    } catch (e) {
      alert('Could not load thread: ' + e.message);
    }
    renderPanelContent();
  }

  async function loadOlder() {
    if (!activeThread || !activeThread.hasMore) return;
    try {
      const d = await api(`/api/messages/thread/${encodeURIComponent(activeThread.peer.username)}?limit=50&before=${activeThread.cursor}`);
      activeThread.messages = [...(d.messages || []), ...activeThread.messages];
      activeThread.hasMore = !!d.has_more;
      activeThread.cursor = d.cursor || null;
      renderPanelContent();
    } catch (e) { alert(e.message); }
  }

  async function sendCurrent() {
    const panel = document.getElementById('tt-msg-panel');
    const input = panel.querySelector('[data-tt-input]');
    const err = panel.querySelector('[data-tt-error]');
    const body = (input && input.value || '').trim();
    if (!body) return;
    err.style.display = 'none';
    try {
      const d = await api('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          to_user_id: activeThread.peer.id,
          body,
          reply_to_id: activeThread.reply_to_id || null,
          attachment_keys: (activeThread.attachments || []).map(a => a.key)
        })
      });
      activeThread.messages.push(d.message);
      activeThread.reply_to_id = null;
      activeThread.attachments = [];
      renderPanelContent();
    } catch (e) {
      err.textContent = e.message;
      err.style.display = 'block';
    }
  }

  async function downloadAttachment(id, filename) {
    try {
      const t = getToken();
      const res = await fetch(`${API}/api/messages/attachments/${id}`, {
        headers: { Authorization: 'Bearer ' + t }
      });
      if (!res.ok) {
        let msg = 'HTTP ' + res.status;
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'file';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    } catch (e) {
      alert('Could not download: ' + e.message);
    }
  }

  async function deleteMsg(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await api('/api/messages/' + id, { method: 'DELETE' });
      activeThread.messages = activeThread.messages.filter(m => m.id !== id);
      renderPanelContent();
    } catch (e) { alert(e.message); }
  }

  async function toggleReaction(id, emoji) {
    const m = activeThread && activeThread.messages.find(x => x.id === id);
    if (!m) return;
    const mine = (m.reactions || []).find(r => r.emoji === emoji && r.mine);
    try {
      await api('/api/messages/' + id + '/react', {
        method: mine ? 'DELETE' : 'POST',
        body: JSON.stringify({ emoji })
      });
      m.reactions = m.reactions || [];
      const ex = m.reactions.find(r => r.emoji === emoji);
      if (mine) {
        if (ex) { ex.count = Math.max(0, ex.count - 1); ex.mine = false; if (!ex.count) m.reactions = m.reactions.filter(r => r.emoji !== emoji); }
      } else if (ex) { ex.count++; ex.mine = true; }
      else { m.reactions.push({ emoji, count: 1, mine: true }); }
      renderPanelContent();
    } catch (e) { alert(e.message); }
  }

  async function onFilePicked(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE) { alert('File too large (max 5 MB)'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { alert('Unsupported file type'); return; }
    if ((activeThread.attachments || []).length >= 3) { alert('Max 3 attachments'); return; }
    const fd = new FormData(); fd.append('file', file);
    try {
      const d = await api('/api/messages/upload', { method: 'POST', body: fd });
      activeThread.attachments = [...(activeThread.attachments || []), d];
      renderPanelContent();
    } catch (e) { alert('Upload failed: ' + e.message); }
  }

  async function toggleMute() {
    if (!activeThread) return;
    const willMute = !activeThread.muted;
    try {
      await api('/api/messages/mute/' + activeThread.peer.id, { method: willMute ? 'POST' : 'DELETE' });
      activeThread.muted = willMute;
      renderPanelContent();
    } catch (e) { alert(e.message); }
  }

  function showToast(peer, msg) {
    const existing = document.getElementById('tt-msg-toast');
    if (existing) existing.remove();
    const dark = isDark();
    const el = document.createElement('div');
    el.id = 'tt-msg-toast';
    el.style.cssText = `position:fixed;bottom:24px;right:24px;width:380px;max-width:calc(100vw - 32px);
      background:${dark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.98)'};
      color:${dark ? '#f3f4f6' : '#111827'};
      border:1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
      border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;
      box-shadow:0 20px 50px rgba(0,0,0,0.35);backdrop-filter:blur(14px);
      z-index:2147483647;font-family:inherit;opacity:0;transform:translateY(12px);
      transition:opacity 0.2s,transform 0.2s;`;
    el.innerHTML = `
      <img src="${avatarFor(peer)}" width="40" height="40" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;object-fit:cover;" alt="">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(peer.display_name || peer.username)}</div>
        <div style="font-size:13px;opacity:0.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${esc((msg.body || '').slice(0, 80))}</div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button data-tt-toast-view style="padding:4px 12px;border-radius:6px;border:none;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;font-weight:700;cursor:pointer;font-size:12px;font-family:inherit;">View</button>
          <button data-tt-toast-close style="padding:4px 8px;border-radius:6px;border:none;background:transparent;color:inherit;opacity:0.6;cursor:pointer;font-size:12px;font-family:inherit;">×</button>
        </div>
      </div>`;
    document.documentElement.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    el.querySelector('[data-tt-toast-view]').addEventListener('click', () => { el.remove(); openThread(peer); });
    el.querySelector('[data-tt-toast-close]').addEventListener('click', () => el.remove());
    setTimeout(() => el.remove(), 8000);
  }

  async function pollForNew() {
    if (!isAuthed()) return;
    const panel = document.getElementById('tt-msg-panel');
    if (panel && panel.style.display === 'flex') return;
    try {
      const d = await api('/api/messages/unread-count');
      const c = d.count || 0;
      if (c > unreadCount) {
        const inbox = await api('/api/messages/inbox?limit=1');
        const t = (inbox.threads || [])[0];
        if (t && t.last_message) showToast(t.peer, t.last_message);
      }
      unreadCount = c;
      paintBadges();
    } catch {}
  }

  // ---------- global entry point for external callers ----------
  window.ttOpenBeams = function (peerId) {
    if (!isAuthed()) { window.location.href = '/login/'; return; }
    openInbox();
    if (peerId) {
      setTimeout(async () => {
        try {
          const t = threads.find(x => x.peer.id === peerId);
          if (t) { openThread(t.peer); return; }
          const all = await api('/api/messages/inbox?limit=100');
          const match = (all.threads || []).find(x => x.peer.id === peerId);
          if (match) openThread(match.peer);
        } catch {}
      }, 300);
    }
  };

  async function connectWS() {
    if (!isAuthed()) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    try {
      const t = await api('/api/messages/ws-ticket', { method: 'POST' });
      if (!t.ticket) throw new Error('no ticket');
      const wsUrl = API.replace(/^https/, 'wss') + '/api/messages/connect?ticket=' + encodeURIComponent(t.ticket);
      ws = new WebSocket(wsUrl);
      ws.addEventListener('open', () => { wsBackoff = 1000; });
      ws.addEventListener('message', (ev) => {
        let data;
        try { data = JSON.parse(ev.data); } catch { return; }
        if (data.type === 'new_message' && data.message && data.peer) {
          handleInboundMessage(data.message, data.peer);
        }
      });
      ws.addEventListener('close', () => { ws = null; scheduleReconnect(); });
      ws.addEventListener('error', () => { try { ws.close(); } catch {} });
    } catch (e) {
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (wsReconnectTimer) return;
    if (!isAuthed()) return;
    wsReconnectTimer = setTimeout(() => {
      wsReconnectTimer = null;
      connectWS();
    }, wsBackoff);
    wsBackoff = Math.min(wsBackoff * 2, 60000);
  }

  function handleInboundMessage(msg, peer) {
    unreadCount = (unreadCount || 0) + 1;
    paintBadges();
    const panel = document.getElementById('tt-msg-panel');
    const drawerOpen = panel && panel.style.display === 'flex';
    if (activeThread && activeThread.peer.id === peer.id) {
      activeThread.messages.push(msg);
      renderPanelContent();
      api('/api/messages/read', {
        method: 'POST',
        body: JSON.stringify({ from_user_id: peer.id })
      }).then(refreshUnread).catch(() => {});
      return;
    }
    if (drawerOpen) { loadThreads(); return; }
    showToast(peer, msg);
  }

  async function init() {
    if (!isAuthed()) return;
    me = decodeJwt(getToken());
    buildDrawer();

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openbeams') === '1') {
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', clean);
        setTimeout(() => window.ttOpenBeams(), 400);
      }
    } catch {}
    await refreshUnread();
    waitForBeamsLinks(wireStaticBeamsLinks);
    document.addEventListener('loginStatusChanged', async () => {
      if (!isAuthed() && ws) {
        try { ws.close(); } catch {}
        ws = null;
        if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
      } else if (isAuthed() && !ws) {
        connectWS();
      }
      await refreshUnread();
      waitForBeamsLinks(wireStaticBeamsLinks);
    });
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshUnread, 60000);
    if (newMsgTimer) clearInterval(newMsgTimer);
    newMsgTimer = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) pollForNew();
    }, 30000);
    connectWS();
  }

  const mo = new MutationObserver(() => {
    if (!isAuthed()) return;
    if (document.getElementById('tt-beams-inbox-link') || document.getElementById('tt-beams-inbox-link-mobile')) {
      wireStaticBeamsLinks();
    }
  });
  setTimeout(() => {
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  }, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();