const API_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const deviceBtn = document.getElementById('device-toggle');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const metricsGrid = document.getElementById('metrics-grid');

  let currentStrategy = 'mobile';
  let mobileData = null;
  let desktopData = null;

  deviceBtn.addEventListener('click', () => {
    currentStrategy = currentStrategy === 'mobile' ? 'desktop' : 'mobile';
    deviceBtn.textContent = currentStrategy === 'mobile' ? 'Desktop' : 'Mobile';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    loading.classList.remove('hidden');
    results.classList.add('hidden');
    document.getElementById('current-device').textContent = 
      currentStrategy === 'mobile' ? 'Mobile' : 'Desktop';

    try {
      const res = await fetch(`/api/pagespeed?url=${encodeURIComponent(url)}&strategy=${currentStrategy}`);
      if (!res.ok) throw new Error('Audit failed');
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      if (currentStrategy === 'mobile') mobileData = data;
      else desktopData = data;

      renderResults(currentStrategy);
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } catch (err) {
      alert('Error: ' + err.message);
      loading.classList.add('hidden');
    }
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderResults(tab.dataset.device);
    });
  });

  function renderResults(strategy) {
    const data = strategy === 'mobile' ? mobileData : desktopData;
    if (!data) return;

    const lhr = data.lighthouseResult;
    const audits = lhr.audits;

    document.getElementById('page-title').textContent = `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Report for ${lhr.finalDisplayedUrl || lhr.requestedUrl}`;
    document.getElementById('active-device').textContent = strategy.charAt(0).toUpperCase() + strategy.slice(1);

    const perfScore = Math.round(lhr.categories.performance.score * 100);
    const lcp = audits['largest-contentful-paint'].numericValue;
    const inp = audits['interaction-to-next-paint']?.numericValue || 200;
    const cls = audits['cumulative-layout-shift'].numericValue;
    const fcp = audits['first-contentful-paint'].numericValue;
    const ttfb = audits['server-response-time']?.numericValue || 0;

    const vitality = Math.min(100, Math.round(
      perfScore * 0.7 +
      (2500 / lcp * 15) +
      (200 / inp * 10) +
      (0.1 / cls * 5)
    ));

    document.getElementById('overall-score').textContent = vitality;
    document.getElementById('score-desc').textContent = vitality >= 90 ? 'Excellent' : vitality >= 70 ? 'Good' : 'Needs Improvement';

    // Add more metrics here later
    const metrics = [
      { name: 'LCP', value: (lcp/1000).toFixed(2)+'s', good: lcp <= 2500, what: 'Time to largest content', why: 'Affects perceived load speed', how: 'Optimize images, preload key resources' },
      { name: 'INP', value: inp+'ms', good: inp <= 200, what: 'Interaction responsiveness', why: 'Poor INP frustrates users', how: 'Reduce JavaScript execution time' },
      { name: 'CLS', value: cls.toFixed(3), good: cls <= 0.1, what: 'Layout stability', why: 'Prevents accidental clicks', how: 'Set dimensions on images/ads' },
      { name: 'FCP', value: (fcp/1000).toFixed(2)+'s', good: fcp <= 1800, what: 'First paint time', why: 'First impression of speed', how: 'Reduce render-blocking resources' },
      { name: 'TTFB', value: ttfb.toFixed(0)+'ms', good: ttfb <= 600, what: 'Server response time', why: 'Base of all loading', how: 'Use CDN, better hosting' },
    ];

    metricsGrid.innerHTML = metrics.map(m => `
      <div class="metric-card">
        <h3>${m.name}</h3>
        <div class="value">${m.value}</div>
        <div class="status ${m.good ? 'good' : 'bad'}">${m.good ? 'Good' : 'Poor'}</div>
        <details><summary>What / Why / How?</summary>
          <p><strong>What:</strong> ${m.what}<br>
             <strong>Why it matters:</strong> ${m.why}<br>
             <strong>How to fix:</strong> ${m.how}</p>
        </details>
      </div>
    `).join('');
  }
});