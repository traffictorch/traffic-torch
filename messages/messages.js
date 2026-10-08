// ============================================================
// Traffic Torch — messaging front-end module
// Defines window.messagesApp() to spread into Alpine x-data
// Loaded as a plain <script> BEFORE Alpine loads
// ============================================================

const MSG_API = 'https://traffic-torch-auth.traffictorch.workers.dev';
const MSG_EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🙏'];

window.messagesApp = function messagesApp() {
  return {
    // ----- state -----
    messagesDrawerOpen: false,
    messagesUnread: 0,
    messages: {
      threads: [],
      loading: false,
      error: null,
      cursor: null,
      hasMore: false
    },
    activeThread: null,
    compose: {
      open: false,
      to: null,
      body: '',
      reply_to_id: null,
      attachments: [],
      sending: false,
      error: null,
      uploading: false
    },
    messageSettings: {
      policy: 'all',
      blocked: 0,
      saving: false,
      loaded: false
    },
    _msgUnreadTimer: null,
    MSG_EMOJI,

    // ----- lifecycle -----
    initMessages() {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      this.refreshMessagesUnread();
      if (this._msgUnreadTimer) clearInterval(this._msgUnreadTimer);
      this._msgUnreadTimer = setInterval(() => this.refreshMessagesUnread(), 60000);

      document.addEventListener('tt-open-compose', (e) => this.openCompose(e.detail));
      document.addEventListener('tt-open-inbox', () => this.openInbox());
      document.addEventListener('loginStatusChanged', () => this.refreshMessagesUnread());
    },

    // ----- badge -----
    async refreshMessagesUnread() {
      const token = localStorage.getItem('authToken');
      if (!token) { this.messagesUnread = 0; return; }
      try {
        const res = await fetch(`${MSG_API}/api/messages/unread-count`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) return;
        const data = await res.json();
        this.messagesUnread = data.count || 0;
      } catch {}
    },

    // ----- drawer -----
    async openInbox() {
      this.messagesDrawerOpen = true;
      this.activeThread = null;
      await this.loadThreads(true);
      // Lock body scroll on mobile
      document.body.classList.add('overflow-hidden');
    },

    closeInbox() {
      this.messagesDrawerOpen = false;
      this.activeThread = null;
      document.body.classList.remove('overflow-hidden');
    },

    async loadThreads(reset = true) {
      if (reset) { this.messages.threads = []; this.messages.cursor = null; }
      this.messages.loading = true;
      this.messages.error = null;
      try {
        const token = localStorage.getItem('authToken');
        let url = `${MSG_API}/api/messages/inbox?limit=50`;
        if (this.messages.cursor) url += `&cursor=${encodeURIComponent(this.messages.cursor)}`;
        const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load inbox');
        this.messages.threads = reset
          ? (data.threads || [])
          : [...this.messages.threads, ...(data.threads || [])];
        this.messages.hasMore = !!data.has_more;
        this.messages.cursor = data.cursor || null;
      } catch (e) { this.messages.error = e.message; }
      finally { this.messages.loading = false; }
    },

    // ----- thread -----
    async openThread(peer) {
      this.activeThread = {
        peer, messages: [], loading: true,
        cursor: null, hasMore: false, muted: false, error: null
      };
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(
          `${MSG_API}/api/messages/thread/${encodeURIComponent(peer.username)}?limit=50`,
          { headers: { Authorization: 'Bearer ' + token } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load thread');
        this.activeThread.messages = data.messages || [];
        this.activeThread.hasMore = !!data.has_more;
        this.activeThread.cursor = data.cursor || null;
        this.activeThread.muted = !!data.muted;
        await this.markThreadRead(peer.id);
        this.$nextTick(() => this.scrollThreadToBottom());
      } catch (e) { this.activeThread.error = e.message; }
      finally { this.activeThread.loading = false; }
    },

    async loadOlderMessages() {
      if (!this.activeThread || !this.activeThread.hasMore || this.activeThread.loading) return;
      this.activeThread.loading = true;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(
          `${MSG_API}/api/messages/thread/${encodeURIComponent(this.activeThread.peer.username)}?limit=50&before=${this.activeThread.cursor}`,
          { headers: { Authorization: 'Bearer ' + token } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        this.activeThread.messages = [...(data.messages || []), ...this.activeThread.messages];
        this.activeThread.hasMore = !!data.has_more;
        this.activeThread.cursor = data.cursor || null;
      } catch {}
      finally { this.activeThread.loading = false; }
    },

    scrollThreadToBottom() {
      const el = document.getElementById('tt-messages-thread-body');
      if (el) el.scrollTop = el.scrollHeight;
    },

    async markThreadRead(fromUserId) {
      try {
        const token = localStorage.getItem('authToken');
        await fetch(`${MSG_API}/api/messages/read`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_user_id: fromUserId })
        });
        const t = this.messages.threads.find(x => x.peer.id === fromUserId);
        if (t) t.unread_count = 0;
        this.refreshMessagesUnread();
      } catch {}
    },

    // ----- compose -----
    openCompose(peer) {
      if (!peer || !peer.id) return;
      this.compose.open = true;
      this.compose.to = peer;
      this.compose.body = '';
      this.compose.reply_to_id = null;
      this.compose.attachments = [];
      this.compose.error = null;
    },

    closeCompose() {
      this.compose.open = false;
      this.compose.to = null;
      this.compose.reply_to_id = null;
      this.compose.attachments = [];
    },

    async sendMessage() {
      const c = this.compose;
      if (!c.to || !c.body.trim()) return;
      if (c.body.length > 2000) { c.error = 'Message must be under 2000 characters'; return; }
      c.sending = true; c.error = null;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${MSG_API}/api/messages/send`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_user_id: c.to.id,
            body: c.body.trim(),
            reply_to_id: c.reply_to_id || null,
            attachment_keys: c.attachments.map(a => a.key)
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Send failed');

        if (this.activeThread && this.activeThread.peer.id === c.to.id) {
          this.activeThread.messages.push(data.message);
          this.$nextTick(() => this.scrollThreadToBottom());
          c.body = ''; c.attachments = []; c.reply_to_id = null;
        } else {
          this.closeCompose();
        }
      } catch (e) { c.error = e.message; }
      finally { c.sending = false; }
    },

    async uploadAttachment(evt) {
      const file = evt.target.files?.[0];
      if (!file) return;
      if (this.compose.attachments.length >= 3) {
        this.compose.error = 'Max 3 attachments per message';
        evt.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.compose.error = 'File too large (5MB max)';
        evt.target.value = '';
        return;
      }
      this.compose.uploading = true;
      this.compose.error = null;
      try {
        const token = localStorage.getItem('authToken');
        const form = new FormData(); form.append('file', file);
        const res = await fetch(`${MSG_API}/api/messages/upload`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: form
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        this.compose.attachments.push(data);
      } catch (e) { this.compose.error = e.message; }
      finally { this.compose.uploading = false; evt.target.value = ''; }
    },

    removeAttachment(key) {
      this.compose.attachments = this.compose.attachments.filter(a => a.key !== key);
    },

    replyTo(msg) {
      this.compose.reply_to_id = msg.id;
      this.compose.body = '';
      // If reply from within thread, ensure compose bar is visible (it's inline)
    },

    cancelReply() { this.compose.reply_to_id = null; },

    // ----- reactions -----
    async toggleReaction(msg, emoji) {
      const mine = (msg.reactions || []).find(r => r.emoji === emoji && r.mine);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${MSG_API}/api/messages/${msg.id}/react`, {
          method: mine ? 'DELETE' : 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji })
        });
        if (!res.ok) return;
        // Update activeThread message
        if (this.activeThread) {
          const m = this.activeThread.messages.find(x => x.id === msg.id);
          if (m) {
            m.reactions = m.reactions || [];
            const ex = m.reactions.find(r => r.emoji === emoji);
            if (mine) {
              if (ex) {
                ex.count = Math.max(0, ex.count - 1);
                ex.mine = false;
                if (ex.count === 0) m.reactions = m.reactions.filter(r => r.emoji !== emoji);
              }
            } else if (ex) {
              ex.count += 1;
              ex.mine = true;
            } else {
              m.reactions.push({ emoji, count: 1, mine: true });
            }
          }
        }
      } catch {}
    },

    // ----- delete -----
    async deleteMessage(msg) {
      if (!confirm('Delete this message?')) return;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${MSG_API}/api/messages/${msg.id}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) return;
        if (this.activeThread) {
          this.activeThread.messages = this.activeThread.messages.filter(m => m.id !== msg.id);
        }
        const t = this.messages.threads.find(x => x.peer.id === this.activeThread?.peer?.id);
        if (t) await this.loadThreads(true);
      } catch {}
    },

    // ----- mute -----
    async toggleMute() {
      if (!this.activeThread) return;
      const peer = this.activeThread.peer;
      const willMute = !this.activeThread.muted;
      try {
        const token = localStorage.getItem('authToken');
        await fetch(`${MSG_API}/api/messages/mute/${peer.id}`, {
          method: willMute ? 'POST' : 'DELETE',
          headers: { Authorization: 'Bearer ' + token }
        });
        this.activeThread.muted = willMute;
        const t = this.messages.threads.find(x => x.peer.id === peer.id);
        if (t) t.muted = willMute;
      } catch {}
    },

    // ----- settings -----
    async loadMessageSettings() {
      if (this.messageSettings.loaded) return;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${MSG_API}/api/profile/me`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) return;
        const data = await res.json();
        const p = data.profile || {};
        this.messageSettings.policy = p.message_policy || 'all';
        this.messageSettings.blocked = p.messages_blocked || 0;
        this.messageSettings.loaded = true;
      } catch {}
    },

    async saveMessageSettings() {
      this.messageSettings.saving = true;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${MSG_API}/api/messages/settings`, {
          method: 'PATCH',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_policy: this.messageSettings.policy,
            messages_blocked: this.messageSettings.blocked
          })
        });
        if (!res.ok) throw new Error('Save failed');
      } catch (e) {
        alert('Could not save message settings: ' + e.message);
      } finally {
        this.messageSettings.saving = false;
      }
    },

    // ----- helpers -----
    msgInitials(user) {
      if (!user) return '?';
      const n = user.display_name || user.username || '?';
      return n.slice(0, 2).toUpperCase();
    },

    msgAvatar(user) {
      const preset = user?.avatar_preset || 'owner';
      return `/images/avatars/${preset}.svg`;
    },

    msgRelativeTime(ts) {
      if (!ts) return '';
      const diff = Date.now() - ts;
      const min = Math.floor(diff / 60000);
      if (min < 1) return 'just now';
      if (min < 60) return min + 'm';
      const hr = Math.floor(min / 60);
      if (hr < 24) return hr + 'h';
      const d = Math.floor(hr / 24);
      if (d < 7) return d + 'd';
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    },

    msgPreview(msg) {
      if (!msg) return '';
      const body = msg.body || '';
      return body.length > 60 ? body.slice(0, 60) + '…' : body;
    },

    msgIsMine(msg) {
      // User ID comes from Alpine parent (dashboardApp.user.id)
      return msg.from_user_id === (this.user?.id || null);
    }
  };
};

window.openMessageCompose = function (user) {
  if (!user || !user.id) return;
  document.dispatchEvent(new CustomEvent('tt-open-compose', { detail: user }));
};

window.openMessagesInbox = function () {
  document.dispatchEvent(new CustomEvent('tt-open-inbox'));
};
