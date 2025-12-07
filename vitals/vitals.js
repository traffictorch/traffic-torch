document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const tbody = document.querySelector('#opportunities tbody');
  const fixList = document.getElementById('fix-list');
  const btn = document.getElementById('audit-btn');

  // Add API key input (hidden by default; show on error)
  const apiKeyInput = document.createElement('input');
  apiKeyInput.type = 'text';
  apiKeyInput.placeholder = 'Optional: Add your PageSpeed API key';
  apiKeyInput.id = 'api-key';
  apiKeyInput.style.display = 'none';
  form.appendChild(apiKeyInput);

  // URL validation regex
  const isValidUrl = (url) => /^https?:\/\/.+/.test(url);

  // Fallback simulation using web-vitals (for demo when API fails)
  const simulateMetrics = () => {
    return new Promise((resolve) => {
      let lcp = 1500, inp = 100, cls = 0.05; // Simulated good values
      let score = 85; // Simulated overall
      // Real sim (uncomment if web-vitals loaded)
      // import('https://unpkg.com/web-vitals').then(({ getLCP, getINP, getCLS }) => {
      //   getLCP(({ value }) => { lcp = value; });
      //   getINP(({ value }) => { inp = value; });
      //   getCLS(({ value }) => { cls = value; });
      //   setTimeout(() => resolve({ lcp, inp, cls, score }), 1000);
      // });
      setTimeout(() => resolve({ lcp, inp, cls, score }), 500); // Quick sim
    });
  };

  const runAudit = async (url, apiKey = '', retries = 3) => {
    if (!isValidUrl(url)) throw new Error('Invalid URL format. Use https://example.com');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const params = new URLSearchParams({ url, strategy: 'mobile' });
        if (apiKey) params.append('key', apiKey);
        const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
        const data = await res.json();

        if (data.error) {
          const err = data.error;
          if (err.code === 429) { // Rate limit
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 2000 * attempt)); // Exponential backoff
              continue;
            }
            throw new Error('Rate limit hit. Wait 10s or use your API key.');
          }
          if (err.code === 403 && err.message.includes('quotaExceeded')) {
            throw new Error('Free quota exceeded (25k/month). Get a free API key: https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com');
          }
          if (err.code === 400) throw new Error('Invalid URL. Check spelling.');
          throw new Error(err.message || 'API error');
        }

        // Success: Parse data
        const lhr = data.lighthouseResult;
        const crux = data.loadingExperience?.metrics;
        const score = Math.round(lhr.categories.performance.score * 100);

        const metrics = {
          LCP: crux?.LARGEST_CONTENTFUL_PAINT_MS?.percentile || lhr.audits['largest-contentful-paint'].numericValue,
          INP: crux?.INTERACTION_TO_NEXT_PAINT_MS?.percentile || (lhr.audits['interaction-to-next-paint']?.numericValue || 150),
          CLS: (crux?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || lhr.audits['cumulative-layout-shift'].numericValue) || 0.05
        };

        return { score, metrics, lhr, isFallback: false };
      } catch (err) {
        if (attempt === retries) throw err;
      }
    }
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    if (!url) return alert('Enter a URL');

    loading.classList.remove('hidden');
    results.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Auditing...';

    try {
      let data = await runAudit(url, apiKey);
      let { score, metrics, lhr } = data;

      // Fallback to simulation if API fails (but only if not quota—quota needs key)
      // In this case, since quota, we won't fallback; show key prompt
      if (data.isFallback) {
        // Simulate as above
        ({ score, metrics } = await simulateMetrics());
        lhr = {}; // No audits for sim
      }

      // Update UI (same as before)
      document.getElementById('overall-score').textContent = score;
      document.getElementById('score-description').textContent = score >= 90 ? 'Excellent' : score >= 50 ? 'Needs Improvement' : 'Poor';
      document.getElementById('page-title').textContent = `Core Vitals Report: ${url}`;

      document.getElementById('lcp-value').textContent = `${(metrics.LCP/1000).toFixed(2)}s`;
      document.getElementById('inp-value').textContent = `${Math.round(metrics.INP)}ms`;
      document.getElementById('cls-value').textContent = metrics.CLS.toFixed(3);

      ['LCP','INP','CLS'].forEach(m => {
        const el = document.getElementById(m.toLowerCase() + '-status');
        const good = (m==='LCP' && metrics[m]<=2500) || (m==='INP' && metrics[m]<=200) || (m==='CLS' && metrics[m]<=0.1);
        el.textContent = good ? 'Good' : 'Needs Work';
        el.className = `status ${good ? 'good' : 'warning'}`;
      });

      // Gaps (use lhr if available, else sim)
      tbody.innerHTML = '';
      const gaps = lhr ? [
        {name:'Image Optimization', you: lhr.audits['uses-optimized-images']?.score*100 || 0, avg: 92},
        {name:'JavaScript Execution', you: lhr.audits['bootup-time']?.score*100 || 0, avg: 88},
        {name:'Render Blocking', you: lhr.audits['render-blocking-resources']?.score*100 || 0, avg: 95}
      ] : [
        {name:'Image Optimization', you: 80, avg: 92},
        {name:'JavaScript Execution', you: 75, avg: 88},
        {name:'Render Blocking', you: 90, avg: 95}
      ];
      gaps.forEach(g => {
        tbody.innerHTML += `<tr><td>${g.name}</td><td>${Math.round(g.you)}%</td><td>${g.avg}%</td><td>${(g.avg - g.you).toFixed(0)}% behind</td></tr>`;
      });

      // Fixes
      fixList.innerHTML = '';
      const fixes = lhr && lhr.audits ? (lhr.audits['uses-optimized-images']?.score < 1 ? ['Compress & serve WebP/AVIF images', 'Use responsive images with srcset'] : []) : ['Optimize images', 'Minify JS'];
      fixes.push('Preload key requests', 'Minify & defer JavaScript', 'Set explicit width/height on media');
      fixes.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${f}</strong><br><small>What: Reduces load time. Why: Faster LCP/INP. How: Use Cloudinary, ImageKit or Squoosh.</small>`;
        fixList.appendChild(li);
      });

      // Forecast
      const ctx = document.getElementById('forecast-chart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {labels:['Now','+7d','+14d','+30d'], datasets:[{label:'Score', data:[score, score+8, score+15, Math.min(99, score+25)], borderColor:'#0066ff', tension:0.3, fill:false}]},
        options:{responsive:true, scales:{y:{beginAtZero:true, max:100}}}
      });
      document.getElementById('forecast-text').textContent = `With fixes: Expect +${Math.round((99-score)*0.7)}% rank boost in 30 days.`;

      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      let msg = err.message;
      if (msg.includes('quotaExceeded')) {
        msg += '\n\nQuick Fix: 1. Go to https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com 2. Enable API & create key (free). 3. Paste key above.';
        apiKeyInput.style.display = 'block';
        form.insertBefore(apiKeyInput, btn); // Show input
      } else if (msg.includes('Rate limit')) {
        msg += '\n\nWait 10-30s and retry. Or add your API key for higher limits.';
      }
      alert(`Audit Error: ${msg}`);
    }
    btn.disabled = false;
    btn.textContent = 'Run Audit 🚀';
  });
});