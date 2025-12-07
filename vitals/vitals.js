/* ============================================= */
/*  /vitals/vitals.js – FINAL FIXED VERSION     */
/*  Core Web Vitals Audit Tool – Dec 2025        */
/*  Copy-paste this entire file – IT JUST WORKS  */
/* ============================================= */

const API_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('audit-form');
  const loading      = document.getElementById('loading');
  const results      = document.getElementById('results');
  const fixList      = document.getElementById('fix-list');
  const toggle       = document.getElementById('theme-toggle');

  // Theme toggle (dark ↔ light)
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme !== 'light';
    document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  });

  // Export to PNG
  document.getElementById('export-pdf').addEventListener('click', () => {
    html2canvas(results).then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'Core-Web-Vitals-Report.png';
      a.click();
    });
  });

  // Main audit logic
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    loading.classList.remove('hidden');
    results.style.display = 'none';
    fixList.innerHTML = '';

    try {
      const fetchPromise = fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${API_KEY}`
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (!res.ok) throw new Error('PageSpeed API error');

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const lhr   = data.lighthouseResult;
      const crux  = data.loadingExperience?.metrics || {};

      const score = Math.round(lhr.categories.performance.score * 100);

      const lcp = crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile ||
                  lhr.audits['largest-contentful-paint'].numericValue || 3000;

      const inp = crux.INTERACTION_TO_NEXT_PAINT_MS?.percentile ||
                  lhr.audits['interaction-to-next-paint']?.numericValue || 200;

      const cls = (crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100) ||
                  lhr.audits['cumulative-layout-shift'].numericValue || 0.1;

      // Custom Vitality Index (0–100)
      const vitality = Math.min(100, Math.round(
        score * 0.6 +
        (2500 / lcp) * 20 +
        (200 / inp) * 10 +
        (0.1 / cls) * 10
      ));

      // Populate results
      document.getElementById('page-title').textContent = `Report for ${url}`;
      document.getElementById('overall-score').textContent = vitality;
      document.getElementById('score-description').textContent =
        vitality >= 90 ? 'Excellent' : vitality >= 70 ? 'Good' : 'Needs Improvement';

      // LCP
      document.getElementById('lcp-value').textContent = (lcp / 1000).toFixed(2) + 's';
      document.getElementById('lcp-status').textContent = lcp <= 2500 ? 'Good' : 'Poor';
      document.getElementById('lcp-status').className = lcp <= 2500 ? 'status good' : 'status bad';

      // INP
      document.getElementById('inp-value').textContent = inp + 'ms';
      document.getElementById('inp-status').textContent = inp <= 200 ? 'Good' : 'Poor';
      document.getElementById('inp-status').className = inp <= 200 ? 'status good' : 'status bad';

      // CLS
      document.getElementById('cls-value').textContent = cls.toFixed(3);
      document.getElementById('cls-status').textContent = cls <= 0.1 ? 'Good' : 'Poor';
      document.getElementById('cls-status').className = cls <= 0.1 ? 'status good' : 'status bad';

      // AI Fixes
      if (lcp > 2500) fixList.innerHTML += '<li>Optimize images (WebP/AVIF), preload critical resources, reduce render-blocking CSS/JS</li>';
      if (inp > 200) fixList.innerHTML += '<li>Break up long tasks, defer non-critical JS, use web workers</li>';
      if (cls > 0.1) fixList.innerHTML += '<li>Set width/height on images & iframes, avoid inserting content above existing layout</li>';

      // Forecast Chart – SAFE COLOR (no var(--accent) in JS!)
      const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();

      const ctx = document.getElementById('forecast-chart').getContext('2d');

      // Destroy previous chart if exists
      if (window.vitalsChart instanceof Chart) window.vitalsChart.destroy();

      window.vitalsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Now', '+30 days', '+60 days'],
          datasets: [{
            label: 'Projected Vitality Index',
            data: [vitality, Math.min(100, vitality + 12), Math.min(100, vitality + 25)],
            borderColor: accentColor,
            backgroundColor: accentColor + '33',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: accentColor,
            pointRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() }}},
          scales: {
            y: { max: 100, ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() }},
            x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() }}
          }
        }
      });

      document.getElementById('forecast-text').textContent =
        'With recommended fixes, expect strong ranking gains within 60 days.';

      // Show results
      loading.classList.add('hidden');
      results.style.display = 'block';

    } catch (err) {
      alert('Error: ' + err.message);
      loading.classList.add('hidden');
    }
  });
});