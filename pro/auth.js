// /pro/auth.js
const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';

// Helper functions
function getToken() {
  return localStorage.getItem('authToken');
}

function setToken(token) {
  if (token) localStorage.setItem('authToken', token);
  else localStorage.removeItem('authToken');
}

// Fetch user info
async function fetchAccountInfo(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/account-info`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Invalid token');
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// Authentication methods
async function sendMagicLink(email) {
  const res = await fetch(`${API_BASE}/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.ok ? await res.json() : { error: await res.text() };
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function register(email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function sendResetLink(email) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.ok ? await res.json() : { error: await res.text() };
}

async function resetPassword(token, password) {
  const res = await fetch(`${API_BASE}/auth/reset-password/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Alpine store
document.addEventListener('alpine:init', () => {
  Alpine.store('auth', {
    token: getToken(),
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,

    async init() {
      if (this.token) {
        const userData = await fetchAccountInfo(this.token);
        if (userData) {
          this.user = userData;
          this.isAuthenticated = true;
        } else {
          this.token = null;
          setToken(null);
        }
      }
    },

    async magicLink(email) {
      this.loading = true;
      this.error = null;
      try {
        const result = await sendMagicLink(email);
        if (result.error) throw new Error(result.error);
        return result;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const data = await login(email, password);
        this.token = data.token;
        setToken(data.token);
        this.user = await fetchAccountInfo(data.token);
        this.isAuthenticated = true;
        return data;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async register(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const data = await register(email, password);
        this.token = data.token;
        setToken(data.token);
        this.user = await fetchAccountInfo(data.token);
        this.isAuthenticated = true;
        return data;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(token, password) {
      this.loading = true;
      this.error = null;
      try {
        const data = await resetPassword(token, password);
        return data;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async sendResetLink(email) {
      this.loading = true;
      this.error = null;
      try {
        const result = await sendResetLink(email);
        if (result.error) throw new Error(result.error);
        return result;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      setToken(null);
      window.location.href = '/pro';
    },

    deleteAccount() {
      if (confirm('Permanently delete your account? This cannot be undone.')) {
        alert('Account deletion requested – contact support for full removal.');
      }
    }
  });
});