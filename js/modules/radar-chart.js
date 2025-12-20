// js/modules/radar-chart.js

let radarChart = null;

const dimensions = [
  { key: 'technicalSEO', label: 'Technical\nSEO', lesson: 'Meta tags, schema, canonicals – ensures crawlers see your site. Fix: Add JSON-LD schema.' },
  { key: 'content', label: 'Content\nQuality', lesson: 'Relevance, E-E-A-T – drives trust. Fix: Use AI for content gaps.' },
  { key: 'ux', label: 'UX\nDesign', lesson: 'Navigation, CTAs – reduces bounce. Fix: Simplify layout.' },
  { key: 'speed', label: 'Page\nSpeed', lesson: 'Core Web Vitals – boosts rankings. Fix: Optimize images.' },
  { key: 'mobile', label: 'Mobile\n& PWA', lesson: 'Responsive design – mobile-first priority. Fix: Test media queries.' },
  { key: 'security', label: 'Security', lesson: 'HTTPS, headers – builds trust. Fix: Enable HTTPS.' },
  { key: 'accessibility', label: 'Accessi-\nbility', lesson: 'WCAG (alt text, contrast) – inclusive SEO. Fix: Add ARIA labels.' },
  { key: 'indexability', label: 'Index-\nability', lesson: 'Robots meta, canonical tags – controls crawlability. Fix: Remove noindex if page should rank.' }
];

function getColor(score) {
  if (score >= 80) return 'rgb(34, 197, 94)';     // green
  if (score >= 50) return 'rgb(234, 179, 8)';      // yellow
  return 'rgb(239, 68, 68)';                      // red
}

export function init(analysisData = {}) {
  const canvas = document.getElementById('healthRadarChart');
  if (!canvas) return;

  // Pull scores from homepage tool cards
  const seoScore       = parseInt(document.querySelector('#seo-score .score-circle')?.dataset.score || 0);
  const mobileScore    = parseInt(document.querySelector('#mobile-score .score-circle')?.dataset.score || 0);
  const perfScore      = parseInt(document.querySelector('#perf-score .score-circle')?.dataset.score || 0);
  const accessScore    = parseInt(document.querySelector('#access-score .score-circle')?.dataset.score || 0);

  // Client-side estimates
  const securityScore  = location.protocol === 'https:' ? 100 : 0;
  const contentScore   = document.body.textContent.trim().length > 1000 ? 85 : (document.body.textContent.trim().length > 500 ? 65 : 40);
  const uxScore        = document.querySelectorAll('h1, h2, h3, button, a[href]').length > 10 ? 75 : 45;

  // Indexability check (fully client-side)
  let indexabilityScore = 100;
  const robotsMeta = document.querySelector('meta[name="robots"]');
  if (robotsMeta && /noindex/i.test(robotsMeta.content)) {
    indexabilityScore = 0;
  } else if (!document.querySelector('link[rel="canonical"]')) {
    indexabilityScore = 80; // missing canonical
  }

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
      pointHoverRadius: 8,
      fill: true
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
              return `Score: ${score}/100\n${lesson}`;
            }
          },
          bodyFont: { size: 13 },
          padding: 12
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, color: textColor, font: { size: 12 } },
          grid: { color: gridColor },
          pointLabels: {
            color: textColor,
            font: { size: 12, weight: 'bold' },
            padding: 20,
            callback: label => label // uses \n for wrapping
          },
          angleLines: { color: gridColor }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          showDetailCard(dimensions[index], scores[index]);
        } else {
          showDetailCard(null, overallScore);
        }
      }
    }
  };

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, config);

  // Theme change handling
  const observer = new MutationObserver(() => {
    const newDark = document.documentElement.classList.contains('dark');
    const newGrid = newDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const newText = newDark ? '#eee' : '#333';
    radarChart.options.scales.r.grid.color = newGrid;
    radarChart.options.scales.r.ticks.color = newText;
    radarChart.options.scales.r.pointLabels.color = newText;
    radarChart.options.scales.r.angleLines.color = newGrid;
    radarChart.update();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  showDetailCard(null, overallScore);
}

function showDetailCard(dim, score) {
  const details = document.getElementById('radar-details');
  if (dim) {
    const colorClass = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
    details.innerHTML = `
      <p class="text-2xl font-bold ${colorClass}">${dim.label.replace('\n', ' ')}: ${score}/100</p>
      <p class="mt-4 text-lg">${dim.lesson}</p>
    `;
  } else {
    details.innerHTML = `
      <p class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
        Overall 360° Score: ${score}/100
      </p>
      <p class="mt-4">Tap a point for details & fixes</p>
    `;
  }
}