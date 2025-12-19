// js/modules/radar-chart.js

let radarChart = null;

const dimensions = [
  { key: 'technicalSEO', label: 'Technical SEO', lesson: 'Meta tags, schema, canonicals, robots.txt – ensures crawlers see your site correctly.' },
  { key: 'content', label: 'Content Quality', lesson: 'Relevance, uniqueness, E-E-A-T signals – drives rankings and user trust.' },
  { key: 'ux', label: 'UX Design', lesson: 'Navigation, clarity, CTAs – reduces bounce and improves dwell time.' },
  { key: 'speed', label: 'Page Speed', lesson: 'Core Web Vitals (LCP, FID, CLS) – critical for rankings and conversions.' },
  { key: 'mobile', label: 'Mobile & PWA', lesson: 'Responsive design, touch targets, installability – mobile-first indexing priority.' },
  { key: 'security', label: 'Security', lesson: 'HTTPS, secure headers – builds trust and avoids penalties.' },
  { key: 'accessibility', label: 'Accessibility', lesson: 'WCAG compliance (alt text, contrast, ARIA) – inclusive and SEO bonus.' },
  { key: 'backlinks', label: 'Backlinks', lesson: 'Quality inbound links – major ranking factor.' }
];

function getColor(score) {
  if (score >= 80) return 'rgb(34, 197, 94)'; // green-500
  if (score >= 50) return 'rgb(234, 179, 8)';  // yellow-500
  return 'rgb(239, 68, 68)';                  // red-500
}

export function init(analysisData = {}) {
  console.log('Radar chart init called', analysisData);

  const canvas = document.getElementById('healthRadarChart');
  const detailsEl = document.getElementById('radar-details');
  if (!canvas || !detailsEl) {
    console.error('Radar chart canvas or details element not found!');
    return;
  }

  // Mock data for testing – varied scores
  const scores = dimensions.map(() => Math.floor(Math.random() * 61) + 30); // 30-90 range
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const data = {
    labels: dimensions.map(d => d.label),
    datasets: [{
      label: 'Site Health',
      data: scores,
      backgroundColor: 'rgba(249, 115, 22, 0.15)',
      borderColor: 'rgb(249, 115, 22)',
      borderWidth: 3,
      pointBackgroundColor: scores.map(getColor),
      pointBorderColor: '#fff',
      pointRadius: 6,
      pointHoverRadius: 10
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
      maintainAspectRatio: false,
      animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1800 },
      plugins: { legend: { display: false } },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, color: textColor },
          grid: { color: gridColor },
          pointLabels: { color: textColor, font: { size: 15, weight: 'bold' } },
          angleLines: { color: gridColor }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          showDetailCard(dimensions[index], scores[index], overallScore);
        } else {
          showOverall(overallScore);
        }
      }
    }
  };

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, config);
  console.log('Radar chart rendered successfully');

  showOverall(overallScore);

  // Theme change observer
  const observer = new MutationObserver(() => {
    if (!radarChart) return;
    const newDark = document.documentElement.classList.contains('dark');
    const newGrid = newDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const newText = newDark ? '#eee' : '#333';
    radarChart.options.scales.r.ticks.color = newText;
    radarChart.options.scales.r.pointLabels.color = newText;
    radarChart.options.scales.r.grid.color = newGrid;
    radarChart.options.scales.r.angleLines.color = newGrid;
    radarChart.update('none');
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Resize handler for perfect mobile scaling
  window.addEventListener('resize', () => radarChart?.resize());
}

function showOverall(score) {
  const detailsEl = document.getElementById('radar-details');
  detailsEl.innerHTML = `
    <p class="text-4xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
      Overall 360° Score: ${score}/100
    </p>
    <p class="mt-4 text-lg opacity-80">Tap any point for educational details & fixes</p>
  `;
}

function showDetailCard(dim, score, overall) {
  const detailsEl = document.getElementById('radar-details');
  const colorClass = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  detailsEl.innerHTML = `
    <p class="text-3xl font-bold ${colorClass}">${dim.label}: ${score}/100</p>
    <p class="mt-6 text-lg leading-relaxed">${dim.lesson}</p>
    <p class="mt-6 opacity-80">Top fix: Dive into the dedicated module for AI suggestions.</p>
    <button class="mt-6 px-6 py-3 bg-orange-500 rounded-full hover:bg-orange-600 font-bold" onclick="showOverall(${overall})">Back to Overview</button>
  `;
}