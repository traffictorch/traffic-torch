// /audit-history.js
// Shared audit-history saver – used by the dashboard and every tool page.
// Mirrors the dashboard's own saveAudit so entries land in the same place.

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const GUEST_KEY = 'audit_guest';
const GUEST_MAX = 5;
const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

function getGuestEntries() {
  try {
    const stored = localStorage.getItem(GUEST_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (parsed.savedAt && (Date.now() - parsed.savedAt) > GUEST_TTL_MS) {
      localStorage.removeItem(GUEST_KEY);
      return [];
    }
    return parsed.entries || [];
  } catch {
    return [];
  }
}

function setGuestEntries(entries) {
  if (entries.length > GUEST_MAX) entries = entries.slice(0, GUEST_MAX);
  localStorage.setItem(GUEST_KEY, JSON.stringify({ savedAt: Date.now(), entries }));
  return entries;
}

/**
 * Save an audit entry so it appears in the dashboard's Recent Audits list.
 * @param {{ url: string, tool: string, score?: number|null }} audit
 */
export async function saveAudit({ url, tool, score = null }) {
  if (!url || !tool) return { success: false, error: 'url and tool are required' };

  const token = localStorage.getItem('authToken');

  // Logged-in users → server (dashboard reads via /api/audit-history GET)
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/api/audit-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, tool_name: tool, score })
      });
      if (res.ok) return { success: true, source: 'api' };
      // If server rejects, fall through to guest storage so we never lose the entry
    } catch {
      // network error → fall through
    }
  }

  // Guest fallback (also used if the API call failed)
  const entry = {
    _localId: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    url,
    tool,
    score,
    timestamp: Date.now()
  };
  const entries = getGuestEntries();
  entries.unshift(entry);
  setGuestEntries(entries);
  return { success: true, source: 'local' };
}

/** Optional: useful if a tool wants to display recent history locally. */
export function getAuditHistory() {
  return getGuestEntries();
}