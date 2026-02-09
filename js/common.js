// js/common.js – Shared Pro logic (exported for tool scripts)
export const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';

export function updateRunsBadge(remaining) {
  const desktop = document.getElementById('runs-left');
  const mobile = document.getElementById('runs-left-mobile');
  const text = remaining === undefined ? '' : `Runs left today: ${remaining}`;
  if (desktop) {
    desktop.textContent = text;
    if (remaining !== undefined) desktop.classList.remove('hidden');
  }
  if (mobile) mobile.textContent = text;
}

export function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full text-gray-500 dark:text-gray-300 p-6">
      <h2 class="text-xl font-bold mb-4 text-center">Login or Register</h2>
      <input id="email" type="email" placeholder="Email" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
      <input id="password" type="password" placeholder="Password" class="w-full p-3 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
      <div class="flex gap-4">
        <button onclick="handleAuth('login')" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Login</button>
        <button onclick="handleAuth('register')" class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">Register</button>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full text-sm text-gray-500 dark:text-gray-300">Close</button>
    </div>`;
  document.body.appendChild(modal);
}

export async function handleAuth(mode) {
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  if (!email || !password) return alert('Enter email and password');

  try {
    const res = await fetch(`${API_BASE}/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('torch_token', data.token);
      alert(mode === 'login' ? 'Logged in!' : 'Registered!');
      document.querySelector('.fixed')?.remove();
    } else {
      alert(data.error || 'Error');
    }
  } catch (err) {
    alert('Connection error');
  }
}

export function showUpgradeModal(message = '', price = '$48/year') {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full text-gray-500 dark:text-gray-300 p-6">
      <h2 class="text-xl font-bold mb-4 text-center">Upgrade to Pro</h2>
      <p class="mb-4 text-center">${message || 'Unlock 25 runs/day + advanced features'}</p>
      <p class="text-lg font-semibold text-center mb-6">${price}</p>
      <button onclick="upgradeToPro()" class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">Upgrade Now</button>
      <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full text-sm text-gray-500 dark:text-gray-300">Close</button>
    </div>`;
  document.body.appendChild(modal);
}

export async function upgradeToPro() {
  const token = localStorage.getItem('torch_token');
  if (!token) return alert('Login first');

  try {
    const res = await fetch(`${API_BASE}/api/upgrade`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || 'Upgrade failed');
  } catch (err) {
    alert('Error');
  }
}