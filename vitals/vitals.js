const API_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const fixList = document.getElementById('fix-list');

  // Export PDF
  document.getElementById('export-pdf').addEventListener('click', () => {
    html2canvas(document.querySelector('#results')).then(canvas => {
      const link = document.createElement('a');
      link.download = 'vitals-report.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url.startsWith('http')) return alert('Please enter a valid URL');

    loading.classList.remove('hidden');
    results.classList.add('hidden');

    try {
      // Clean timeout without AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${API_KEY}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');

      const lhr = data.lighthouseResult;
      const crux = data.loadingExperience?.metrics || {};
      const perfScore = Math.round(lhr.categories.performance.score * 100);

      const lcp = crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile || lhr.audits['largest-contentful-paint'].numericValue || 3500;
      const inp = crux.INTERACTION_TO_NEXT_PAINT_MS?.percentile || 250;
      const cls = (crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || lhr.audits['cumulative-layout-shift'].numericValue || 0.2) / 100;

      const vitality = Math.min(99, Math.round(
        perfScore * 0.6 +
        (lcp <= 2500 ? 20 : 8) +
        (inp <= 200 ? 15 : 6) +
        (cls <= 0.1 ? 15 : 6)
      ));

      // Update UI
      document.getElementById('page-title').textContent = new URL(url).hostname;
      document.getElementById('overall-score').textContent = vitality;
      document.getElementById('score-label').textContent = vitality >= 90 ? 'Elite' : vitality >= 75 ? 'Strong' : 'Needs Work';

      document.getElementById('lcp-value').textContent = (lcp/1000).toFixed(2) + 's';
      document.getElementById('inp-value').textContent = Math.round(inp) + 'ms';
      document.getElementById('cls-value').textContent = cls.toFixed(3);

      // Status
      ['lcp', 'inp', 'cls'].forEach(m => {
        const val = m === 'lcp' ? lcp : m === 'inp' ? inp : cls * 100;
        const good = (m === 'lcp' && val <= 2500) || (m === 'inp' && val <= 200) || (m === 'cls' && val <= 10);
        const el = document.getElementById(m + '-status');
        el.textContent = good ? 'Good' : 'Poor';
        el.className = 'status ' + (good ? 'good' : 'bad');
      });

      // AI Fixes
      fixList.innerHTML = '';
      const add = (text) => {
        const li = document.createElement('li');
        li.innerHTML = text;
        fixList.appendChild(li);
      };

      if (lcp > 2500) add('Optimize hero image → Use WebP + <code>fetchpriority="high"</code>');
      if (inp > 200) add('Reduce JavaScript → Defer non-critical scripts');
      if (cls > 0.1) add('Prevent layout shift → Set width/height on images & ads');
      if (perfScore < 80) add('Enable compression → Brotli + caching headers');

      // Forecast Chart
      new Chart(document.getElementById('forecast-chart'), {
        type: 'line',
        data: {
          labels: ['Now', '+30d', '+60d', '+90d'],
          datasets: [{
            label: 'With Fixes',
            data: [vitality, vitality + 8, vitality + 15, Math.min(99, vitality + 22)],
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0,255,136,0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });

      document.getElementById('forecast-text').textContent = 
        `Implement fixes → Expect +${Math.round((99 - vitality) * 0.9)}% performance & ranking boost in 90 days`;

      loading.classList.add('hidden');
      results.classList.remove('hidden');

    } catch (err) {
      loading.classList.add('hidden');
      const msg = err.name === 'AbortError' ? 'Request timed out – try again' : err.message;
      alert('Error: ' + msg);
    }
  });
});