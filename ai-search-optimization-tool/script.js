// ai-search-optimization-tool/script.js
// Tiny, bulletproof, works with your current HTML header/footer out of the box

document.addEventListener('DOMContentLoaded', () => {
  // ==== DARK MODE TOGGLE (already in your HTML) ====
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      themeBtn.innerHTML = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    });
    // respect saved preference
    if (localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      themeBtn.innerHTML = '☀️';
    }
  }

  // ==== MOBILE MENU (already in your HTML) ====
  const menuBtn = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    // close when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
  }

  // ==== FORM — NO RELOAD, LOADING BAR, FULL TOOL (later) ====
  const form = document.getElementById('urlForm');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');

  form?.addEventListener('submit', e => {
    e.preventDefault(); // ← this stops the page reload forever

    report.classList.add('hidden');
    report.innerHTML = '';
    loading.classList.remove('hidden');

    // placeholder result so you can see it works instantly
    setTimeout(() => {
      report.innerHTML = `
        <div class="text-center py-20">
          <h2 class="text-6xl font-black bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
            Tool is working perfectly!
          </h2>
          <p class="mt-8 text-xl text-gray-400">Dark mode toggle works • Mobile menu works • No page reload</p>
          <p class="mt-4 text-gray-500">Full AIO analyzer coming in next commit</p>
        </div>
      `;
      loading.classList.add('hidden');
      report.classList.remove('hidden');
      report.scrollIntoView({behavior: 'smooth'});
    }, 2500);
  });
});