// 1. Theme Toggle - Modern Tailwind dark mode standard
  const themeToggle = document.getElementById('themeToggle');

  if (themeToggle) {
    const html = document.documentElement;

    // Load saved theme or default to system preference
    if (localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark');
      themeToggle.textContent = '☀️';
    } else {
      html.classList.remove('dark');
      themeToggle.textContent = '🌙';
    }

    // Toggle on click
    themeToggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      const isDark = html.classList.contains('dark');
      localStorage.theme = isDark ? 'dark' : 'light';
      themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // 2. PWA Install Prompt (unchanged – excellent implementation)
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.createElement('button');
    btn.textContent = 'Install App';
    btn.className = 'fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 rounded-full shadow-2xl text-white font-bold';
    btn.onclick = () => {
      deferredPrompt.prompt();
      // Optional: hide button after prompt
      btn.remove();
    };
    document.body.appendChild(btn);
  });

  // 3. Mobile Menu Toggle (preserved + minor polish)
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

    // Auto-close mobile menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        button.textContent = '☰';
      });
    });
  });

  // 4. Desktop Sidebar Collapse (only runs if elements exist)
  const sidebar = document.getElementById('desktopSidebar');
  const collapseBtn = document.getElementById('sidebarCollapse');

  if (sidebar && collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('w-64');
      sidebar.classList.toggle('w-20');

      // Hide/show text labels
      document.querySelectorAll('.sidebar-text').forEach(text => {
        text.classList.toggle('hidden');
      });

      // Update collapse button icon and aria
      if (sidebar.classList.contains('w-20')) {
        collapseBtn.textContent = '▶';
        collapseBtn.setAttribute('aria-label', 'Expand sidebar');
      } else {
        collapseBtn.textContent = '◀';
        collapseBtn.setAttribute('aria-label', 'Collapse sidebar');
      }
    });
  }
