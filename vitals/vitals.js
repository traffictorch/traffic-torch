const API_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const toggle = document.getElementById('theme-toggle');

  toggle.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    try {
      const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runpagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${API_KEY}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const lhr = data.lighthouseResult;
      const crux = data.loadingExperience?.metrics || {};
      const score = Math.round(lhr.categories.performance.score * 100);
      const lcp = crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile || lhr.audits['largest-contentful-paint'].numericValue || 3000;
      const inp = crux.INTERACTION_TO_NEXT_PAINT_MS?.percentile || lhr.audits['interaction-to-next-paint']?.numericValue || 200;
      const cls = crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100 || lhr.audits['cumulative-layout-shift'].numericValue || 0.1;
      const vitality = Math.min(100, Math.round(score * 0.6 + (2500 / lcp * 20) + (200 / inp * 10) + (0.1 / cls * 10)));
      document.getElementById('page-title').textContent = `Mobile Report for ${url}`;
      document.getElementById('overall-score').textContent = vitality;
      document.getElementById('score-description').textContent = vitality >= 90 ? 'Excellent' : 'Needs Improvement';
      document.getElementById('lcp-value').textContent = (lcp / 1000).toFixed(2) + 's';
      document.getElementById('lcp-status').textContent = lcp <= 2500 ? 'Good' : 'Poor';
      document.getElementById('lcp-status').className = lcp <= 2500 ? 'status good' : 'status bad';
      document.getElementById('inp-value').textContent = inp + 'ms';
      document.getElementById('inp-status').textContent = inp <= 200 ? 'Good' : 'Poor';
      document.getElementById('inp-status').className = inp <= 200 ? 'status good' : 'status bad';
      document.getElementById('cls-value').textContent = cls.toFixed(3);
      document.getElementById('cls-status').textContent = cls <= 0.1 ? 'Good' : 'Poor';
      document.getElementById('cls-status').className = cls <= 0.1 ? 'status good' : 'status bad';
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } catch (err) {
      alert('Error: ' + err.message);
      loading.classList.add('hidden');
    }
  });
});