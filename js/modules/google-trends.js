// js/modules/google-trends.js
const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

export function initGoogleTrends() {
  const form = document.getElementById('trends-form');
  const output = document.getElementById('trends-output');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    output.innerHTML = '<p>Fetching trends… (this takes 4–8 seconds)</p>';

    const kwInput = document.getElementById('keywords-input').value;
    const timeframe = document.getElementById('timeframe').value || 'today 5-y';
    const geo = document.getElementById('geo').value || '';

    const keywords = kwInput.split(',').map(k => k.trim()).filter(k => k).slice(0,5);
    if (keywords.length === 0) return;

    try {
      const data = await fetchGoogleTrends(keywords, timeframe.value || timeframe, geo);
      renderTrends(data, keywords);
    } catch (err) {
      output.innerHTML = `<p style="color:#ef4444">Failed: ${err.message}. Wait 60s and retry (Google rate limit).</p>`;
    }
  });
}

async function fetchGoogleTrends(keywords, timeframe, geo) {
  // Step 1: Get fresh token
  const tokenPage = await fetch(PROXY + 'https://trends.google.com/trends/explore?q=seo&geo=');
  const tokenText = await tokenPage.text();
  const tokenMatch = tokenText.match(/"TOKEN":"([^"]+)"/);
  if (!tokenMatch) throw new Error('Token not found – try again');

  const token = tokenMatch[1];

  // Step 2: Build widgets request (exactly how Pytrends does it)
  const req = {
    comparisonItem: keywords.map(k => ({ keyword: k, time: timeframe, geo })),
    category: 0,
    property: ''
  };

  const widgetRes = await fetch(`${PROXY}https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`);
  const widgetJson = await widgetRes.text();
  const cleanJson = widgetJson.substring(5); // remove )]}'\n
  const widgets = JSON.parse(cleanJson).widgets;

  // Step 3: Fetch actual data for each widget we want
  const results = { iot: [], regions: [], related: [] };

  for (const w of widgets) {
    if (w.title.includes('Interest over time')) {
      const res = await fetch(`${PROXY}${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`);
      const txt = await res.text();
      results.iot = JSON.parse(txt.substring(5)).default.timelineData;
    }
    if (w.title.includes('Interest by region')) {
      const res = await fetch(`${PROXY}${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`);
      const txt = await res.text();
      results.regions = JSON.parse(txt.substring(5)).default.geoMapData;
    }
    if (w.title.includes('Related queries')) {
      const res = await fetch(`${PROXY}${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`);
      const txt = await res.text();
      const parsed = JSON.parse(txt.substring(5)).default;
      results.related = { top: parsed.rankedList[0]?.rankedKeyword || [], rising: parsed.rankedList[1]?.rankedKeyword || [] };
    }
  }
  return results;
}

function renderTrends(data, keywords) {
  const output = document.getElementById('trends-output');
  let html = `<canvas id="iotChart" class="trends-chart"></canvas>`;

  // Regions table
  if (data.regions.length) {
    html += `<h3>Top Regions</h3><table class="trends-table"><thead><tr><th>Region</th><th>Score</th><th>Tip</th></tr></thead><tbody>`;
    data.regions.slice(0,10).forEach(r => {
      html += `<tr><td>${r.geoName}</td><td>${r.value[0]}</td><td>${r.value[0]>80?'Strong market': 'Room to grow'}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  // Rising queries
  if (data.related.rising?.length) {
    html += `<h3>Rising Searches (exploding!)</h3><table class="trends-table"><thead><tr><th>Query</th><th>Growth</th></tr></thead><tbody>`;
    data.related.rising.slice(0,8).forEach(q => {
      const growth = q.value === 5000 ? 'Breakout!' : `${q.value}%`;
      html += `<tr><td>${q.query}</td><td><span class="rising-badge">${growth}</span></td></tr>`;
    });
    html += `</tbody></table>`;
  }

  output.innerHTML = html;

  // Draw chart
  const ctx = document.getElementById('iotChart').getContext('2d');
  const labels = data.iot.map(d => new Date(d.time*1000).toLocaleDateString());
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: keywords.map((kw,i) => ({
        label: kw,
        data: data.iot.map(d => d.value[i] ?? 0),
        borderColor: ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6'][i],
        tension: 0.4,
        fill: false
      }))
    },
    options: { responsive:true, maintainAspectRatio:false }
  });
}