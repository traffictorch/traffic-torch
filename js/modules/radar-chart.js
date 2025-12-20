// js/modules/radar-chart.js

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
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function externalTooltipHandler(context) {
  const {chart, tooltip} = context;
  const tooltipEl = getOrCreateTooltip();

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  if (tooltip.body) {
    const index = tooltip.dataPoints[0].dataIndex;
    const dim = dimensions[index];
    const score = tooltip.dataPoints[0].raw;

    tooltipEl.innerHTML = `
      <div class="font-bold">${dim.full}: <span style="color:${getColor(score)}">${score}/100</span></div>
      <div class="mt-2 text-sm opacity-90">${dim.lesson}</div>
    `;
  }

  const canvasRect = chart.canvas.getBoundingClientRect();
  const tooltipWidth = tooltipEl.offsetWidth;
  const tooltipHeight = tooltipEl.offsetHeight;

  let left = canvasRect.left + tooltip.caretX - tooltipWidth / 2;
  let top = canvasRect.top + tooltip.caretY - tooltipHeight - 10; // Above point

  // Clamp to viewport
  const padding = 10;
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
  top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

  // Flip to below if above would go off top
  if (top < padding) {
    top = canvasRect.top + tooltip.caretY + 10;
  }

  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
}

export function init() {
  const canvas = document.getElementById('healthRadarChart');
  const detailsEl = document.getElementById('radar-details');
  if (!canvas || !detailsEl) return;

  // ... (score calculation same as before) ...

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

// showDetails function same as before
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