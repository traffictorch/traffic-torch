// js/modules/radar-chart.js

let radarChart = null;

const dimensions = [
  { key: 'technicalSEO', label: 'Technical SEO', lesson: 'Meta tags, schema, canonicals, robots.txt – ensures crawlers see your site correctly. Fix: Add structured data for rich snippets.' },
  { key: 'content', label: 'Content Quality', lesson: 'Relevance, uniqueness, E-E-A-T signals – drives rankings and user trust. Fix: Use AI audit for improvements.' },
  { key: 'ux', label: 'UX Design', lesson: 'Navigation, clarity, CTAs – reduces bounce and improves dwell time. Fix: Optimize layout for user flow.' },
  { key: 'speed', label: 'Page Speed', lesson: 'Core Web Vitals (LCP, FID, CLS) – critical for rankings and conversions. Fix: Compress images and minify JS.' },
  { key: 'mobile', label: 'Mobile & PWA', lesson: 'Responsive design, touch targets, installability – mobile-first indexing priority. Fix: Use media queries.' },
  { key: 'security', label: 'Security', lesson: 'HTTPS, secure headers – builds trust and avoids penalties. Fix: Enable HTTPS if not present.' },
  { key: 'accessibility', label: 'Accessibility', lesson: 'WCAG compliance (alt text, contrast, ARIA) – inclusive and SEO bonus. Fix: Add alt text to images.' },
  { key: 'backlinks', label: 'Backlinks', lesson: 'Quality inbound links – major ranking factor. Fix: Use external tools like Ahrefs for analysis (not available client-side).' }
];

function getColor(score) {
  if (score >= 80) return 'rgb(34, 197, 94)';
  if (score >= 50) return 'rgb(234, 179, 8)';
  return 'rgb(239, 68, 68)';
}

export function init(analysisData) {
  const canvas = document.getElementById('healthRadarChart');
  if (!canvas) return;

  // Tie in real data from homepage tool (DOM pull – in production, update after analysis)
  const seoScore = parseInt(document.querySelector('#seo-score .score-circle').dataset.score || 0);
  const mobileScore = parseInt(document.querySelector('#mobile-score .score-circle').dataset.score || 0);
  const perfScore = parseInt(document.querySelector('#perf-score .score-circle').dataset.score || 0);
  const accessScore = parseInt(document.querySelector('#access-score .score-circle').dataset.score || 0);
  const securityScore = location.protocol === 'https:' ? 100 : 0; // Client-side check
  const contentScore = document.body.textContent.trim().length > 500 ? 80 : 40; // Basic heuristic
  const uxScore = document.querySelectorAll('h1, h2, button, a').length > 5 ? 70 : 30; // Basic heuristic
  const backlinksScore = 0; // Placeholder – educational note in tooltip

  const scores = [
    seoScore,
    contentScore,
    uxScore,
    perfScore,
    mobileScore,
    securityScore,
    accessScore,
    backlinksScore
  ];

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) || 0;

  const data = {
    labels: dimensions.map(d => d.label),
    datasets: [{
      label: 'Site Health',
      data: scores,
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      borderColor: 'rgb(249, 115, 22)',
      borderWidth: 2,
      pointBackgroundColor: scores.map(getColor),
      pointBorderColor: '#fff',
      pointRadius: 5,
      pointHoverRadius: 8
    }]
  };

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#eee' : '#333';

  const config = {
    type: 'radar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              const score = context.raw;
              const lesson = dimensions[index].lesson;
              const note = score === 0 ? 'No data – Run deep-dive module for full scan.' : '';
              return `Score: ${score}/100\n${lesson}\n${note}`;
            }
          },
          bodyFont: { size: 14 },
          padding: 12
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, color: textColor, font: { size: 12 } },
          grid: { color: gridColor },
          pointLabels: { color: textColor, font: { size: 12, weight: 'bold' }, padding: 10 },
          angleLines: { color: gridColor },
          maxRotation: 90,
          minRotation: 0,
          autoSkipPadding: 20 // Prevents cropping by auto-skipping/rotating
        }
      },
      interaction: { mode: 'index', intersect: false },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          showDetailCard(dimensions[index], scores[index]);
        }
      }
    }
  };

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, config);

  // Theme observer
  const observer = new MutationObserver(() => {
    const newDark = document.documentElement.classList.contains('dark');
    radarChart.options.scales.r.grid.color = newDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    radarChart.options.scales.r.ticks.color = newDark ? '#eee' : '#333';
    radarChart.options.scales.r.pointLabels.color = newDark ? '#eee' : '#333';
    radarChart.options.scales.r.angleLines.color = newDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    radarChart.update();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  showDetailCard(null, overallScore); // Initial overall view
}

function showDetailCard(dim, score) {
  const details = document.getElementById('radar-details');
  if (dim) {
    const colorClass = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
    details.innerHTML = `<p class="text-2xl font-bold ${colorClass}">${dim.label}: ${score}/100</p><p class="mt-4">${dim.lesson}</p>`;
  } else {
    details.innerHTML = `<p class="text-2xl font-bold">Overall: ${score}/100</p><p class="mt-4">Click points for details</p>`;
  }
}