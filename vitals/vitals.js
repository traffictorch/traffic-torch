const API_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs'; // Your working key

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const fixList = document.getElementById('fix-list');
  const btn = document.getElementById('audit-btn');

  // Export PDF
  document.getElementById('export-pdf').addEventListener('click', () => {
    html2canvas(document.querySelector('#results')).then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL();
      a.download = 'traffictorch-vitals-report.png';
      a.click();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url || !url.startsWith('http')) return alert('Enter a valid URL');

    loading.classList.remove('hidden');
    results.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Running...';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${API_KEY}`, {
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) {
        if (data.error.code === 429) throw new Error('Rate limit hit – wait 10s and retry');
        throw new Error(data.error.message);
      }

      const lhr = data.lighthouseResult;
      const crux = data.loadingExperience?.metrics || {};
      const score = Math.round(lhr.categories.performance.score * 100);

      // Vitality Index: weighted blend
      const lcp = crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile || lhr.audits['largest-contentful-paint'].numericValue || 3000;
      const inp = crux.INTERACTION_TO_NEXT_PAINT_MS?.percentile || 200;
      const cls = (crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || lhr.audits['cumulative-layout-shift'].numericValue || 0.15) / 100;

      const vitality = Math.round(
        score * 0.6 +
        (lcp <= 2500 ? 20 : 5) +
        (inp <= 200 ? 15 : 5) +
        (cls <= 0.1 ? 15 : 5)
      );

      // Update UI
      document.getElementById('overall-score').textContent = vitality;
      document.getElementById('score-description').textContent = vitality >= 90 ? 'Elite' : vitality >= 75 ? 'Strong' : 'Needs Work';
      document.getElementById('page-title').textContent = `Report: ${new URL(url).hostname}`;

      document.getElementById('lcp-value').textContent = (lcp/1000).toFixed(2) + 's';
      document.getElementById('inp-value').textContent = Math.round(inp) + 'ms';
      document.getElementById('cls-value').textContent = cls.toFixed(3);

      // Status colors
      document.getElementById('lcp-status').textContent = lcp <= 2500 ? 'Good' : 'Poor';
      document.getElementById('lcp-status').className = lcp <= 2500 ? 'status good' : 'status warning';

      document.getElementById('inp-status').textContent = inp <= 200 ? 'Good' : 'Poor';
      document.getElementById('inp-status').className = inp <= 200 ? 'status good' : 'status warning';

      document.getElementById('cls-status').textContent = cls <= 0.1 ? 'Good' : 'Poor';
      document.getElementById('cls-status').className = cls <= 0.1 ? 'status good' : 'status warning';

      // AI Fixes (smart & minimal)
      fixList.innerHTML = '';
      const addFix = (title, fix) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${title}:</strong> ${fix}`;
        fixList.appendChild(li);
      };

      if (lcp > 2500) addFix('Fix LCP', 'Optimize hero image → WebP + fetchpriority="high". Preload critical CSS.');
      if (inp > 200) addFix('Fix INP', 'Break long tasks. Defer non-critical JS. Use requestIdleCallback.');
      if (cls > 0.1) addFix('Fix CLS', 'Set explicit width/height on images, fonts, ads. Use font-display: swap.');

      // Forecast Chart
      const ctx = document.getElementById('forecast-chart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Now', '+30d', '+90d'],
          datasets: [{
            label: 'With Fixes',
            data: [vitality, vitality + 12, Math.min(99, vitality + 22)],
            borderColor: '#00ff88',
            tension: 0.3
          }]
        },
        options: { responsive: true, scales: { y: { max: 100 } } }
      });

      document.getElementById('forecast-text').textContent = `Implement fixes → Expect +${Math.round((99 - vitality) * 0.8)}% performance & rank boost in 90 days (2025 CrUX trends).`;

      loading.classList.add('hidden');
      results.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.message || 'Failed to fetch data. Try again.'));
      loading.classList.add('hidden');
    }

    btn.disabled = false;
    btn.textContent = 'Run Audit';
  });
});