// js/modules/radar-chart.js

let radarChart = null;

Chart.register(ChartDataLabels);

const dimensions = [
  { key: 'technicalSEO', short: 'SEO', full: 'Technical SEO', lesson: 'Meta tags, schema, canonicals – ensures crawlers see your site correctly.' },
  { key: 'content', short: 'Quality', full: 'Content Quality', lesson: 'Relevance, length, structure – drives trust and rankings.' },
  { key: 'ux', short: 'Design', full: 'UX Design', lesson: 'Navigation, CTAs, clarity – reduces bounce rate.' },
  { key: 'speed', short: 'Speed', full: 'Page Speed', lesson: 'Core Web Vitals – critical for rankings and UX.' },
  { key: 'mobile', short: 'Mobile', full: 'Mobile & PWA', lesson: 'Responsive design, touch targets – mobile-first indexing.' },
  { key: 'security', short: 'Security', full: 'Security', lesson: 'HTTPS and secure headers – builds trust.' },
  { key: 'accessibility', short: 'Access', full: 'Accessibility', lesson: 'Alt text, contrast, ARIA – inclusive and SEO-friendly.' },
  { key: 'indexability', short: 'Index', full: 'Indexability', lesson: 'Robots meta, canonical – controls if page can rank.' }
];

function getColor(score) {
  if (score >= 80) return 'rgb(34, 197, 94)';
  if (score >= 50) return 'rgb(234, 179, 8)';
  return 'rgb(239, 68, 68)';
}

export function init() {
  const canvas = document.getElementById('healthRadarChart');
  const detailsEl = document.getElementById('radar-details');
  if (!canvas || !detailsEl) return;

  const getScore = (selector) => parseInt(document.querySelector(selector)?.dataset.score || 0);

  const seoScore       = getScore('#seo-score .score-circle');
  const mobileScore    = getScore('#mobile-score .score-circle');
  const perfScore      = getScore('#perf-score .score-circle');
  const accessScore    = getScore('#access-score .score-circle');

  const securityScore  = location.protocol === 'https:' ? 100 : 0;

  const textLength = document.body.textContent.trim().length;
  const contentScore   = textLength > 1500 ? 90 : textLength > 800 ? 75 : textLength > 400 ? 55 : 30;

  const interactiveEls = document.querySelectorAll('a[href], button, input, textarea, select').length;
  const uxScore        = interactiveEls > 15 && document.querySelector('nav') ? 85 : interactiveEls > 8 ? 65 : 40;

  let indexabilityScore = 100;
  const robots = document.querySelector('meta[name="robots"]');
  if (robots && /noindex/i.test(robots.content)) {
    indexabilityScore = 0;
  } else if (!document.querySelector('link[rel="canonical"]')) {
    indexabilityScore = 75;
  }

  const scores = [
    seoScore || 70,
    contentScore,
    uxScore,
    perfScore || 70,
    mobileScore || 85,
    securityScore,
    accessScore || 80,
    indexabilityScore
  ];

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const mobile = window.innerWidth < 640;

  const data = {
    labels: dimensions.map(d => d.short),
    datasets: [{
      data: scores,
      backgroundColor: 'rgba(249, 115, 22, 0.25)',
      borderColor: 'rgb(249, 115, 22)',
      borderWidth: 4,
      pointBackgroundColor: scores.map(getColor),
      pointBorderColor: '#fff',
      pointRadius: mobile ? 8 : 10,
      pointHoverRadius: mobile ? 12 : 14,
      fill: true
    }]
  };

  const config = {
    type: 'radar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: mobile ? 0.9 : 1,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (context) => dimensions[context[0].dataIndex].full,
            label: (context) => {
              const dim = dimensions[context.dataIndex];
              return [`Score: ${context.raw}/100`, dim.lesson];
            }
          },
          padding: 12
        },
        datalabels: {
          color: document.documentElement.classList.contains('dark') ? '#eee' : '#333',
          font: { size: mobile ? 12 : 14, weight: 'bold' },
          formatter: (value, context) => dimensions[context.dataIndex].short,
          anchor: 'end',
          align: 'end',
          offset: 10
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false }, // Hide numbers to make bigger
          grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          pointLabels: { display: false }, // Hide external labels – now internal
          angleLines: { color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
        }
      },
      onClick: (e, elements) => {
        if (elements.length) {
          const i = elements[0].index;
          showDetails(dimensions[i], scores[i]);
        } else {
          showDetails(null, overallScore);
        }
      }
    },
    plugins: [ChartDataLabels]
  };

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, config);

  // Theme observer
  const observer = new MutationObserver(() => {
    const dark = document.documentElement.classList.contains('dark');
    radarChart.options.plugins.datalabels.color = dark ? '#eee' : '#333';
    const grid = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    radarChart.options.scales.r.grid.color = grid;
    radarChart.options.scales.r.angleLines.color = grid;
    radarChart.update();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  showDetails(null, overallScore);
}

function showDetails(dim, score) {
  const el = document.getElementById('radar-details');
  if (dim) {
    const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
    el.innerHTML = `
      <p class="text-2xl font-bold ${color}">${dim.full}: ${score}/100</p>
      <p class="mt-4 text-lg opacity-90">${dim.lesson}</p>
    `;
  } else {
    el.innerHTML = `
      <p class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
        Overall 360° Score: ${score}/100
      </p>
      <p class="mt-4">Tap a point for details</p>
    `;
  }
}