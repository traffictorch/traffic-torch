<script src="https://cdn.tailwindcss.com"></script>
<script>
  // 1. Theme Toggle - Fixed & robust (Tailwind 'class' strategy latest best practice)
  const themeToggle = document.getElementById('themeToggle');

  if (themeToggle) {
    const html = document.documentElement;

    // One-time cleanup: remove any outdated 'light' class if exists
    html.classList.remove('light');

    // Determine initial theme
    let isDark = localStorage.theme === 'dark' ||
                 (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Set correct initial icon: 🌙 when light (invite to dark), ☀️ when dark (invite to light)
    themeToggle.textContent = isDark ? '☀️' : '🌙';

    // Toggle on click
    themeToggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      isDark = html.classList.contains('dark');

      localStorage.theme = isDark ? 'dark' : 'light';
      themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // 2. PWA Install Prompt (unchanged)
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.createElement('button');
    btn.textContent = 'Install App';
    btn.className = 'fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 rounded-full shadow-2xl text-white font-bold';
    btn.onclick = () => {
      deferredPrompt.prompt();
      btn.remove();
    };
    document.body.appendChild(btn);
  });

  // 3. Mobile Menu Toggle (unchanged + polished)
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');

    if (!button || !menu) return;

    button.addEventListener('click', () => {
      menu.classList.toggle('hidden');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !expanded);
      button.textContent = menu.classList.contains('hidden') ? '☰' : '✕';
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        button.textContent = '☰';
      });
    });
  });

  // 4. Desktop Sidebar Collapse (unchanged)
  const sidebar = document.getElementById('desktopSidebar');
  const collapseBtn = document.getElementById('sidebarCollapse');

  if (sidebar && collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('w-64');
      sidebar.classList.toggle('w-20');

      document.querySelectorAll('.sidebar-text').forEach(text => {
        text.classList.toggle('hidden');
      });

      if (sidebar.classList.contains('w-20')) {
        collapseBtn.textContent = '▶';
        collapseBtn.setAttribute('aria-label', 'Expand sidebar');
      } else {
        collapseBtn.textContent = '◀';
        collapseBtn.setAttribute('aria-label', 'Collapse sidebar');
      }
    });
  }
</script>