// /seo-ux-tool/js/modules/radar-chart.js

let radarChart = null;

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

function getOrCreateTooltip() {
  let tooltipEl = document.getElementById('chartjs-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.classList.add('hidden');
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function externalTooltipHandler(context) {
  const {chart, tooltip} = context;
  const tooltipEl = getOrCreateTooltip();

  if (tooltip.opacity === 0) {
    tooltipEl.classList.add('hidden');
    return;
  }

  if (tooltip.body) {
    const index = tooltip.dataPoints[0].dataIndex;
    const dim = dimensions[index];
    const score = tooltip.dataPoints[0].raw;

    tooltipEl.innerHTML = `
      <div class="p-3">
        <div class="font-bold text-lg">${dim.full}: <span style="color:${getColor(score)}">${score}/100</span></div>
        <div class="text-sm mt-2 opacity-90">${dim.lesson}</div>
      </div>
    `;
  }

  const canvasRect = chart.canvas.getBoundingClientRect();
  let left = canvasRect.left + tooltip.caretX - tooltipEl.offsetWidth / 2;
  let top = canvasRect.top + tooltip.caretY - tooltipEl.offsetHeight - 10;

  const padding = 10;
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipEl.offsetWidth - padding));
  top = Math.max(padding, Math.min(top, window.innerHeight - tooltipEl.offsetHeight - padding));

  if (top < padding) top = canvasRect.top + tooltip.caretY + 20;

  tooltipEl.classList.remove('hidden');
  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
}

export function init() {
  const canvas = document.getElementById('healthRadarChart');
  const detailsEl = document.getElementById('radar-details');
  if (!canvas || !detailsEl) return;

  let radarChart = null;

  const getScore = (selector) => {
    const el = document.querySelector(selector);
    return el && el.dataset.score ? parseInt(el.dataset.score, 10) : 0;
  };

  // Real tool scores (updated by analysis.js)
  const seoScore       = getScore('#seo-score .score-circle');
  const mobileScore    = getScore('#mobile-score .score-circle');
  const perfScore      = getScore('#perf-score .score-circle');
  const accessScore    = getScore('#access-score .score-circle');

  // Real client-side checks
  const securityScore  = location.protocol === 'https:' ? 100 : 0;

  // Improved content estimate
  const words = document.body.textContent.trim().split(/\s+/).length;
  const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
  const contentScore = words > 800 ? 90 : words > 400 ? 70 : words > 200 ? 50 : 30;
  if (headings < 3) contentScore -= 10;

  // Improved UX estimate
  const hasNav = !!document.querySelector('nav');
  const interactive = document.querySelectorAll('a[href], button, input, textarea, select').length;
  const hasViewport = !!document.querySelector('meta[name="viewport"]');
  let uxScore = hasNav ? 60 : 30;
  uxScore += interactive > 20 ? 30 : interactive > 10 ? 20 : 10;
  uxScore += hasViewport ? 10 : 0;

  // Improved Indexability
  let indexabilityScore = 100;
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) {
    const content = robots.content.toLowerCase();
    if (content.includes('noindex')) indexabilityScore = 0;
    if (content.includes('nofollow')) indexabilityScore -= 20;
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) indexabilityScore -= 25;
  const canonicals = document.querySelectorAll('link[rel="canonical"]');
  if (canonicals.length > 1) indexabilityScore -= 15; // Multiple canonicals bad

  const scores = [
    seoScore,
    contentScore,
    uxScore,
    perfScore,
    mobileScore,
    securityScore,
    accessScore,
    indexabilityScore
  ];

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const mobile = window.innerWidth < 640;

  const data = {
    labels: ['', '', '', '', '', '', '', ''],
    datasets: [{
      data: scores,
      backgroundColor: 'rgba(249, 115, 22, 0.3)',
      borderColor: 'rgb(249, 115, 22)',
      borderWidth: 4,
      pointBackgroundColor: scores.map(getColor),
      pointBorderColor: '#fff',
      pointRadius: mobile ? 9 : 11,
      pointHoverRadius: mobile ? 15 : 17,
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
          enabled: false,
          external: externalTooltipHandler
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false },
          grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          pointLabels: { display: false },
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
    }
  };

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, config);

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