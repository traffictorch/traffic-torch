import { initGoogleTrends } from './modules/google-trends.js';

// Inside your existing navigation click handler or init function:
document.querySelectorAll('[data-module="google-trends"]').forEach(link => {
  link.addEventListener('click', () => {
    showModule('google-trends');
    initGoogleTrends();
  });
});

// If user lands with ?module=google-trends
if (window.location.search.includes('google-trends')) {
  showModule('google-trends');
  initGoogleTrends();
}

document.getElementById('modules-nav').addEventListener('click', (e) => {
  if (e.target.dataset.module === 'google-trends') {
    showModule('google-trends'); // Hides others, shows #google-trends
    import('./modules/google-trends.js').then(m => m.initGoogleTrends());
  }
});
function showModule(id) {
  document.querySelectorAll('.module').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}