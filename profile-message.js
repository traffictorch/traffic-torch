// Traffic Torch — Send Message button on /torcher/:username/
// Self-installing, no framework. Loaded by profile.html.
(function () {
  const API = 'https://traffic-torch-auth.traffictorch.workers.dev';

  function getToken() { return localStorage.getItem('authToken'); }

  function decodeJwt(t) {
    try { return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
    catch { return null; }
  }

  function currentUsername() {
    const m = window.location.pathname.match(/^\/torcher\/([^\/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function fetchProfile(username) {
    try {
      const r = await fetch(`${API}/api/profile/${encodeURIComponent(username)}`);
      if (!r.ok) return null;
      const d = await r.json();
      return d.profile || null;
    } catch { return null; }
  }

  function toast(text, ok = true) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:${ok ? '#111827' : '#ef4444'};color:#fff;padding:12px 20px;border-radius:12px;
      z-index:999999;font-size:14px;font-family:system-ui,sans-serif;
      box-shadow:0 10px 30px rgba(0,0,0,0.3);`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function buildModal(recipient) {
    const dark = document.documentElement.classList.contains('dark');
    const bg = dark ? '#111827' : '#ffffff';
    const fg = dark ? '#f3f4f6' : '#111827';
    const inputBg = dark ? '#1f2937' : '#ffffff';
    const inputBd = dark ? '#4b5563' : '#d1d5db';

    const modal = document.createElement('div');
    modal.id = 'tt-compose-modal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);
      backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;
      z-index:999998;padding:16px;`;
    modal.innerHTML = `
      <div style="background:${bg};color:${fg};max-width:520px;width:100%;border-radius:16px;
                  padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.35);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:18px;font-weight:700;">
            Message ${(recipient.display_name || recipient.username || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}
          </h3>
          <button type="button" data-tt-close style="background:none;border:none;font-size:26px;
                  cursor:pointer;color:${fg};line-height:1;padding:0 4px;">&times;</button>
        </div>
        <textarea data-tt-body maxlength="2000" rows="6" placeholder="Write a message…"
          style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;
                 border:1px solid ${inputBd};background:${inputBg};color:${fg};
                 font-family:inherit;font-size:14px;resize:vertical;outline:none;"></textarea>
        <p style="font-size:12px;color:#9ca3af;text-align:right;margin:6px 0 16px;">
          <span data-tt-count>0</span> / 2000
        </p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" data-tt-cancel
            style="padding:10px 20px;border-radius:10px;border:1px solid ${inputBd};
                   background:transparent;color:${fg};cursor:pointer;font-weight:600;">Cancel</button>
          <button type="button" data-tt-send
            style="padding:10px 24px;border-radius:10px;border:none;
                   background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;
                   font-weight:700;cursor:pointer;">Send</button>
        </div>
        <p data-tt-error style="color:#ef4444;font-size:13px;margin:12px 0 0;"></p>
      </div>`;
    return modal;
  }

  function wireModal(modal, recipient) {
    const body = modal.querySelector('[data-tt-body]');
    const count = modal.querySelector('[data-tt-count]');
    const send = modal.querySelector('[data-tt-send]');
    const cancel = modal.querySelector('[data-tt-cancel]');
    const close = modal.querySelector('[data-tt-close]');
    const err = modal.querySelector('[data-tt-error]');

    body.addEventListener('input', () => { count.textContent = body.value.length; });
    body.focus();

    const dismiss = () => {
      modal.remove();
      document.removeEventListener('keydown', onEsc);
    };
    const onEsc = e => { if (e.key === 'Escape') dismiss(); };

    cancel.addEventListener('click', dismiss);
    close.addEventListener('click', dismiss);
    modal.addEventListener('click', e => { if (e.target === modal) dismiss(); });
    document.addEventListener('keydown', onEsc);

    send.addEventListener('click', async () => {
      const text = body.value.trim();
      if (!text) { err.textContent = 'Message cannot be empty'; return; }
      send.disabled = true;
      const orig = send.textContent;
      send.textContent = 'Sending…';
      err.textContent = '';
      try {
        const r = await fetch(`${API}/api/messages/send`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_user_id: recipient.id, body: text })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Send failed');
        dismiss();
        toast('Message sent ✓');
      } catch (e) {
        err.textContent = e.message;
        send.disabled = false;
        send.textContent = orig;
      }
    });
  }

  async function install() {
    const username = currentUsername();
    if (!username) return;
    if (document.getElementById('tt-send-message-btn')) return;

    const token = getToken();
    if (!token) return;

    const me = decodeJwt(token);
    if (!me || !me.id) return;

    const recipient = await fetchProfile(username);
    if (!recipient || !recipient.id) return;

    // Don't show on own profile
    if (recipient.username && me.username && recipient.username === me.username) return;
    if (recipient.id === me.id) return;

    // Block check: if recipient blocks messages, still show button but it'll error gracefully
    // Find a good anchor — try the h1 with display name
    const h1 = document.querySelector('main h1') || document.querySelector('h1');
    if (!h1) return;

    const btn = document.createElement('button');
    btn.id = 'tt-send-message-btn';
    btn.type = 'button';
    btn.innerHTML = '✉️ <span>Send Message</span>';
    btn.style.cssText = `
      display:inline-flex;align-items:center;gap:6px;
      margin:12px 0 0;padding:10px 18px;border-radius:12px;border:none;
      background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;
      font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;
      box-shadow:0 4px 14px rgba(249,115,22,0.35);
      transition:transform 0.15s ease,opacity 0.15s ease;`;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-1px)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    btn.addEventListener('click', () => {
      const m = buildModal(recipient);
      wireModal(m, recipient);
      document.body.appendChild(m);
    });

    // Insert after h1 (or its wrapper)
    const target = h1.parentElement || h1;
    target.insertAdjacentElement('afterend', btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
