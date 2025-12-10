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