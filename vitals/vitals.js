const API_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const fixList = document.getElementById('fix-list');
  const toggle = document.getElementById('theme-toggle');

  toggle.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  });

  // Export
  document.getElementById('export-pdf').addEventListener('click', () => {
    html2canvas(results).then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL();
      a.download = 'vitals-report.png';
      a.click();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    loading.classList.remove('hidden');
    results.style.display = 'none';

    try {
      const fetchPromise = fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${API_KEY}`);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000));
      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const lhr = data.lighthouseResult;
      const crux = data.loadingExperience?.metrics || {};
      const score = Math.round(lhr.categories.performance.score * 100);

      const lcp = crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile || lhr.audits['largest-contentful-paint'].numericValue || 3000;
      const inp = crux.INTERACTION_TO_NEXT_PAINT_MS?.percentile || lhr.audits['interaction-to-next-paint']?.numericValue || 200;
      const cls = crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100 || lhr.audits['cumulative-layout-shift'].numericValue || 0.1;

      const vitality = Math.round(score * 0.6 + (2500 / lcp * 20) + (200 / inp * 10) + (0.1 / cls * 10));

      document.getElementById('page-title').textContent = `Report for ${url}`;
      document.getElementById('overall-score').textContent = vitality;
      document.getElementById('score-description').textContent = vitality > 90 ? 'Excellent' : 'Needs Improvement';

      document.getElementById('lcp-value').textContent = (lcp / 1000).toFixed(2) + 's';
      document.getElementById('lcp-status').textContent = lcp <= 2500 ? 'Good' : 'Poor';
      document.getElementById('lcp-status').className = lcp <= 2500 ? 'status good' : 'status bad';

      document.getElementById('inp-value').textContent = inp + 'ms';
      document.getElementById('inp-status').textContent = inp <= 200 ? 'Good' : 'Poor';
      document.getElementById('inp-status').className = inp <= 200 ? 'status good' : 'status bad';

      document.getElementById('cls-value').textContent = cls.toFixed(3);
      document.getElementById('cls-status').textContent = cls <= 0.1 ? 'Good' : 'Poor';
      document.getElementById('cls-status').className = cls <= 0.1 ? 'status good' : 'status bad';

      fixList.innerHTML = '';
      if (lcp > 2500) fixList.innerHTML += '<li>Optimize LCP: Use WebP images, preload critical resources.</li>';
      if (inp > 200) fixList.innerHTML += '<li>Improve INP: Break long tasks, use web workers.</li>';
      if (cls > 0.1) fixList.innerHTML += '<li>Fix CLS: Set explicit sizes for images and ads.</li>';

      const ctx = document.getElementById('forecast-chart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Now', '30 days', '60 days'],
          datasets: [{ label: 'Score Projection', data: [vitality, vitality + 10, vitality + 20], borderColor: var(--accent) }]
        },
        options: { responsive: true }
      });

      document.getElementById('forecast-text').textContent = 'With fixes, expect rank boost in 60 days.';

      loading.classList.add('hidden');
      results.style.display = 'block';
    } catch (err) {
      alert('Error: ' + err.message);
      loading.classList.add('hidden');
    }
  });
});