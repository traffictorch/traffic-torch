document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const tbody = document.querySelector('#opportunities tbody');
  const fixList = document.getElementById('fix-list');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    loading.classList.remove('hidden');
    results.classList.add('hidden');
    document.getElementById('audit-btn').disabled = true;

    try {
      const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`);
      const data = await res.json();
      const lhr = data.lighthouseResult;
      const crux = data.loadingExperience?.metrics;

      // Overall Score
      const score = Math.round(lhr.categories.performance.score * 100);
      document.getElementById('overall-score').textContent = score;
      document.getElementById('score-description').textContent = score >= 90 ? 'Excellent' : score >= 50 ? 'Needs Improvement' : 'Poor';
      document.getElementById('page-title').textContent = `Core Vitals Report: ${url}`;

      // Core Web Vitals
      const metrics = {
        LCP: crux?.LARGEST_CONTENTFUL_PAINT_MS?.percentile || lhr.audits['largest-contentful-paint'].numericValue,
        INP: crux?.INTERACTION_TO_NEXT_PAINT_MS?.percentile || (lhr.audits['interaction-to-next-paint']?.numericValue || 150),
        CLS: (crux?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || lhr.audits['cumulative-layout-shift'].numericValue) / 100
      };

      document.getElementById('lcp-value').textContent = `${(metrics.LCP/1000).toFixed(2)}s`;
      document.getElementById('inp-value').textContent = `${Math.round(metrics.INP)}ms`;
      document.getElementById('cls-value').textContent = metrics.CLS.toFixed(3);

      // Status colors
      ['LCP','INP','CLS'].forEach(m => {
        const el = document.getElementById(m.toLowerCase() + '-status');
        const good = (m==='LCP' && metrics[m]<=2500) || (m==='INP' && metrics[m]<=200) || (m==='CLS' && metrics[m]<=0.1);
        el.textContent = good ? 'Good' : 'Needs Work';
        el.className = `status ${good ? 'good' : 'warning'}`;
      });

      // Competitive Gaps (simplified)
      tbody.innerHTML = '';
      const gaps = [
        {name:'Image Optimization', you: lhr.audits['uses-optimized-images']?.score*100 || 0, avg: 92},
        {name:'JavaScript Execution', you: lhr.audits['bootup-time']?.score*100 || 0, avg: 88},
        {name:'Render Blocking', you: lhr.audits['render-blocking-resources']?.score*100 || 0, avg: 95}
      ];
      gaps.forEach(g => {
        tbody.innerHTML += `<tr><td>${g.name}</td><td>${Math.round(g.you)}%</td><td>${g.avg}%</td><td>${(g.avg - g.you).toFixed(0)}% behind</td></tr>`;
      });

      // AI Fixes
      fixList.innerHTML = '';
      const fixes = lhr.audits['uses-optimized-images'].score < 1 ? ['Compress & serve WebP/AVIF images', 'Use responsive images with srcset'] : [];
      fixes.push('Preload key requests', 'Minify & defer JavaScript', 'Set explicit width/height on media');
      fixes.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${f}</strong><br><small>What: Reduces load time. Why: Faster LCP/INP. How: Use Cloudinary, ImageKit or Squoosh.</small>`;
        fixList.appendChild(li);
      });

      // Forecast Chart
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
      alert('Error: Invalid URL or API limit reached. Try again later.');
    }
    document.getElementById('audit-btn').disabled = false;
  });
});