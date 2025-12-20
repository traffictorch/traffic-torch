// js/modules/radar-chart.js

let radarChart = null;

const dimensions = [
  { key: 'technicalSEO', label: 'Technical\nSEO', lesson: 'Meta tags, schema, canonicals – ensures crawlers see your site correctly.' },
  { key: 'content', label: 'Content\nQuality', lesson: 'Relevance, length, structure – drives trust and rankings.' },
  { key: 'ux', label: 'UX\nDesign', lesson: 'Navigation, CTAs, clarity – reduces bounce rate.' },
  { key: 'speed', label: 'Page\nSpeed', lesson: 'Core Web Vitals – critical for rankings and UX.' },
  { key: 'mobile', label: 'Mobile\n& PWA', lesson: 'Responsive design, touch targets – mobile-first indexing.' },
  { key: 'security', label: 'Security', lesson: 'HTTPS and secure headers – builds trust.' },
  { key: 'accessibility', label: 'Accessibility', lesson: 'Alt text, contrast, ARIA – inclusive and SEO-friendly.' },
  { key: 'indexability', label: 'Index-\nability', lesson: 'Robots meta, canonical – controls if page can rank.' }
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

  // Real data from homepage score cards
  const getScore = (selector) => parseInt(document.querySelector(selector)?.dataset.score || 0);

  const seoScore       = getScore('#seo-score .score-circle');
  const mobileScore    = getScore('#mobile-score .score-circle');
  const perfScore      = getScore('#perf-score .score-circle');
  const accessScore    = getScore('#access-score .score-circle');

  // Improved client-side estimates
  const securityScore  = location.protocol === 'https:' ? 100 : 0;

  const textLength = document.body.textContent.trim().length;
  const contentScore   = textLength > 1500 ? 90 : textLength > 800 ? 75 : textLength > 400 ? 55 : 30;

  const interactiveEls = document.querySelectorAll('a[href], button, input, textarea, select').length;
  const uxScore        = interactiveEls > 15 && document.querySelector('nav') ? 85 : interactiveEls > 8 ? 65 : 40;

  // Indexability
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

  const data = {
    labels: dimensions.map(d => d.label),
    datasets: [{
      data: scores,
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      borderColor: 'rgb(249, 115, 22)',
      borderWidth: 3,
      pointBackgroundColor: scores.map(getColor),
      pointBorderColor: '#fff',
      pointRadius: 6,
      pointHoverRadius: 10,
      fill: true
    }]
  };

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
            title: (context) => dimensions[context[0].dataIndex].label.replace('\n', ' '),
            label: (context) => {
              const score = context.raw;
              const lesson = dimensions[context.dataIndex].lesson;
              return [`Score: ${score}/100`, lesson];
            }
          },
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, backdropColor: 'transparent' },
          pointLabels: {
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
              weight: 'bold'
            },
            padding: 25
          },
          grid: { color: 'rgba(255,255,255,0.1)' },
          angleLines: { color: 'rgba(255,255,255,0.1)' }
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
    }
  };

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, config);

  // Theme support
  const observer = new MutationObserver(() => {
    const dark = document.documentElement.classList.contains('dark');
    const color = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    radarChart.options.scales.r.grid.color = color;
    radarChart.options.scales.r.angleLines.color = color;
    radarChart.update();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  showDetails(null, overallScore);
}

function showDetails(dim, score) {
  const el = document.getElementById('radar-details');
  if (dim) {
    const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
    el.innerHTML = `<p class="text-2xl font-bold ${color}">${dim.label.replace('\n', ' ')}: ${score}/100</p>
                    <p class="mt-4 text-lg opacity-90">${dim.lesson}</p>`;
  } else {
    el.innerHTML = `<p class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                      Overall 360° Score: ${score}/100
                    </p>
                    <p class="mt-4">Tap a point for details</p>`;
  }
}