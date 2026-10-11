const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'dashboard', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const original = html;
let patches = 0;

function apply(name, fn) {
  const before = html;
  html = fn(html);
  if (html === before) {
    console.error(`✗ FAILED: ${name} — anchor not found, skipping`);
    process.exit(1);
  }
  patches++;
  console.log(`✓ ${name}`);
}

// ---------- 1. Add push state to dashboardApp() return ----------
apply('state block', s => s.replace(
  /(\n\s+notifications:\s*\{\n\s+loading:\s*false,\n\s+list:\s*\[\],\n\s+unread:\s*0\n\s+\},\n)/,
  `$1
    push: {
      supported: false,
      permission: 'default',
      subscribed: false,
      loading: false,
      sending: false,
      message: null,
      endpoint: null
    },
`
));

// ---------- 2. Add push methods before "// ===== NETWORK =====" ----------
apply('methods block', s => s.replace(
  /(\n\s+\/\/ ===== NETWORK =====)/,
  `

    // ===== PUSH NOTIFICATIONS =====
    async initPush() {
      try {
        const mod = await import('/push-client.js');
        this._pushMod = mod;
        this.push.supported = mod.isPushSupported();
        if (!this.push.supported) { this.push.permission = 'unsupported'; return; }
        this.push.permission = mod.getPermissionStatus();
        const status = await mod.getSubscriptionStatus();
        this.push.subscribed = !!status.subscribed;
        this.push.endpoint = status.endpoint || null;
      } catch (e) {
        this.push.supported = false;
        console.warn('initPush failed', e);
      }
    },

    async enablePush() {
      this.push.loading = true;
      this.push.message = null;
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Not logged in');
        const mod = this._pushMod || (await import('/push-client.js'));
        const result = await mod.subscribe(token);
        if (result.ok) {
          this.push.subscribed = true;
          this.push.permission = 'granted';
          this.push.message = { type: 'ok', text: 'Push notifications enabled on this device.' };
          await this.initPush();
        } else {
          this.push.permission = result.reason || 'default';
          this.push.message = { type: 'err', text: result.reason === 'denied' ? 'Permission denied in browser.' : 'Could not enable push.' };
        }
      } catch (e) {
        this.push.message = { type: 'err', text: e.message || 'Failed' };
      } finally {
        this.push.loading = false;
      }
    },

    async disablePush() {
      this.push.loading = true;
      this.push.message = null;
      try {
        const token = localStorage.getItem('authToken');
        const mod = this._pushMod || (await import('/push-client.js'));
        await mod.unsubscribe(token);
        this.push.subscribed = false;
        this.push.endpoint = null;
        this.push.message = { type: 'ok', text: 'Push notifications disabled on this device.' };
      } catch (e) {
        this.push.message = { type: 'err', text: e.message || 'Failed' };
      } finally {
        this.push.loading = false;
      }
    },

    async sendTestPush() {
      this.push.sending = true;
      this.push.message = null;
      try {
        const token = localStorage.getItem('authToken');
        const mod = this._pushMod || (await import('/push-client.js'));
        const result = await mod.sendTest(token);
        if (result.delivered > 0) {
          this.push.message = { type: 'ok', text: 'Sent to ' + result.delivered + ' device(s).' };
        } else if (result.skipped === 'no_subscriptions') {
          this.push.message = { type: 'err', text: 'No active subscriptions on your account.' };
        } else if (result.skipped === 'pref_disabled') {
          this.push.message = { type: 'err', text: 'Notifications disabled in your preferences.' };
        } else {
          this.push.message = { type: 'ok', text: 'Sent (delivery not confirmed).' };
        }
      } catch (e) {
        this.push.message = { type: 'err', text: e.message || 'Failed' };
      } finally {
        this.push.sending = false;
      }
    },

    // ===== NETWORK =====`
));

// ---------- 3. Call initPush() after each loadNotifications() in initDashboard ----------
apply('initPush hookups', s => s.replace(
  /this\.loadNotifications\(\);/g,
  'this.loadNotifications();\n        this.initPush();'
));

// ---------- 4. Settings-tab UI, inserted after the notification-prefs card ----------
apply('settings UI block', s => s.replace(
  /(<p x-show="profile\.success" class="text-green-500 text-sm mt-3" x-text="profile\.success"><\/p>\s*<\/div>)/,
  `$1

            <div class="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 class="font-semibold">📲 Push Notifications (this device)</h4>
                <span x-show="push.subscribed"
                      class="inline-flex items-center px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                  ● Enabled
                </span>
                <span x-show="!push.subscribed && push.permission === 'granted'"
                      class="inline-flex items-center px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-full border border-gray-500/30">
                  ● Off
                </span>
                <span x-show="push.permission === 'denied'"
                      class="inline-flex items-center px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
                  ● Blocked
                </span>
              </div>

              <p class="text-xs text-gray-500 mb-3" x-show="push.supported">
                Get instant notifications on this device when someone comments, connects, or messages you.
                Works even when Traffic Torch is closed.
              </p>

              <div x-show="!push.supported" class="text-sm text-yellow-500">
                ⚠️ This browser doesn't support Web Push. On iPhone, install Traffic Torch to your Home Screen first (Share → Add to Home Screen), then reopen it from the icon.
              </div>

              <div x-show="push.supported" class="space-y-3">
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-sm">Enable push on this device</span>
                  <input type="checkbox"
                         :checked="push.subscribed"
                         @change="push.subscribed ? disablePush() : enablePush()"
                         :disabled="push.loading || push.permission === 'denied' || !isAuthenticated"
                         class="w-5 h-5">
                </label>

                <p class="text-xs text-gray-500" x-show="push.permission === 'denied'">
                  Browser has blocked notifications for this site. Reset it in browser settings (Site Settings → Notifications), then reload.
                </p>

                <div class="flex flex-wrap gap-3 pt-2" x-show="push.subscribed">
                  <button @click="sendTestPush()" :disabled="push.sending"
                          class="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                    <span x-show="!push.sending">Send test notification</span>
                    <span x-show="push.sending">Sending…</span>
                  </button>
                  <button @click="initPush()"
                          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Refresh status
                  </button>
                </div>

                <p x-show="push.message" class="text-sm"
                   :class="push.message && push.message.type === 'ok' ? 'text-green-500' : 'text-red-500'"
                   x-text="push.message ? push.message.text : ''"></p>
              </div>
            </div>`
));

if (patches !== 4) {
  console.error(`Expected 4 patches, applied ${patches}`);
  process.exit(1);
}

fs.writeFileSync(file, html);
console.log(`\n✅ Wrote ${file} (${original.length} → ${html.length} bytes)`);
