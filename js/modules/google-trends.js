// js/modules/google-trends.js – FINAL WORKING VERSION (Dec 2025)
const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

export function initGoogleTrends() {
  const form = document.getElementById('trends-form');
  const output = document.getElementById('trends-output');
  if (!form || !output) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // ← stops page reload
    output.innerHTML = '<p class="loading">Fetching Google Trends data… (6–12 seconds)</p>';

    const keywords = document.getElementById('keywords-input').value
      .split(',')
      .map(k => k.trim())
      .filter(k => k)
      .slice(0, 5);

    const timeframe = document.getElementById('timeframe')?.value || 'today 5-y';
    const geo = document.getElementById('geo')?.value || '';

    if (keywords.length === 0) {
      output.innerHTML = '<p>Please enter at least one keyword</p>';
      return;
    }

    try {
      const data = await fetchGoogleTrends(keywords, timeframe, geo);
      renderTrends(data, keywords);
    } catch (err) {
      output.innerHTML = `<p style="color:#ef4444">Error: ${err.message}</p>
        <p><strong>Fix:</strong> Wait 1–2 hours or use a different Wi-Fi/VPN (Google 429 rate-limit)</p>`;
    }
  });
}

// ────────────────────────────── FETCH DATA ──────────────────────────────
async function fetchGoogleTrends(keywords, timeframe, geo) {
  // 1. Get TOKEN
  const tokenPage = await fetch(`${PROXY}?url=${encodeURIComponent('https://trends.google.com/trends/explore?q=example&geo=')}`);
  if (!tokenPage.ok) throw new Error('Rate limited – try again later or use VPN');
  const tokenHtml = await tokenPage.text();
  const token = tokenHtml.match(/"TOKEN":"([^"]+)"/)?.[1];
  if (!token) throw new Error('TOKEN not found – check proxy headers');

  // 2. Get widgets
  const req = { comparisonItem: keywords.map(kw => ({ keyword: kw, geo: geo || '', time: timeframe })), category: 0, property: '' };
  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
  const widgetRes = await fetch(`${PROXY}?url=${encodeURIComponent(exploreUrl)}`);
  if (!widgetRes.ok) throw new Error('Widgets failed (429?)');
  const widgets = JSON.parse((await widgetRes.text()).substring(5)).widgets;

  // 3. Fetch actual data
  const results = { iot: [], regions: [], related: { top: [], rising: [] } };

  for (const w of widgets) {
    const url = `https://trends.google.com${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
    const r = await fetch(`${PROXY}?url=${encodeURIComponent(url)}`);
    if (!r.ok) continue;
    const json = JSON.parse((await r.text()).substring(5));

    if (w.id === 'TIMESERIES') results.iot = json.default.timelineData || [];
    if (w.id === 'GEO_MAP') results.regions = json.default.geoMapData || [];
    if (w.id === 'RELATED_QUERIES') {
      const rl = json.default.rankedList || [];
      results.related.top = rl[0]?.rankedKeyword || [];
      results.related.rising = rl[1]?.rankedKeyword || [];
    }
  }
  return results;
}

// ────────────────────────────── RENDER ──────────────────────────────
function renderTrends(data, keywords) {
  const output = document.getElementById('trends-output');
  let html = `<canvas id="trendsChart" class="trends-chart"></canvas>`;

  if (data.regions.length) {
    html += `<h3>Top Regions</h3><table class="trends-table"><thead><tr><th>Region</th><th>Score</th></tr></thead><tbody>`;
    data.regions.slice(0,10).forEach(r => html += `<tr><td>${r.geoName}</td><td>${r.value[0]}</td></tr>`);
    html += `</tbody></table>`;
  }

  if (data.related.rising?.length) {
    html += `<h3>Rising Searches</h3><table class="trends-table"><thead><tr><th>Query</th><th>Growth</th></tr></thead><tbody>`;
    data.related.rising.slice(0,10).forEach(q => {
      const growth = q.value >= 5000 ? 'Breakout!' : `${q.value}%`;
      html += `<tr><td>${q.query}</td><td><span class="rising-badge">${growth}</span></td></tr>`;
    });
    html += `</tbody></table>`;
  }

  output.innerHTML = html;

  // Chart
  new Chart(document.getElementById('trendsChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: data.iot.map(d => new Date(d.time * 1000).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })),
      datasets: keywords.map((kw, i) => ({
        label: kw,
        data: data.iot.map(d => d.value[i] ?? 0),
        borderColor: ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6'][i],
        tension: 0.4,
        fill: false
      }))
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Run automatically since module is always visible
initGoogleTrends();