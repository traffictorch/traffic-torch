// js/modules/google-trends.js – FINAL WORKING (Dec 2025)
const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

window.runGoogleTrends = async function() {
  const output = document.getElementById('trends-output');
  output.innerHTML = '<p style="text-align:center;padding:3rem;color:#3b82f6;font-size:1.3rem">Loading trends… (6–12s)</p>';

  const keywords = document.getElementById('keywords-input').value
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, 5);

  const timeframe = document.getElementById('timeframe')?.value || 'today 5-y';
  const geo = document.getElementById('geo')?.value || '';

  try {
    const tokenResp = await fetch(`${PROXY}?url=${encodeURIComponent('https://trends.google.com/trends/explore?q=example&geo=')}`);
    const tokenHtml = await tokenResp.text();
    const token = tokenHtml.match(/"TOKEN":"([^"]+)"/)?.[1];
    if (!token) throw new Error('Proxy broken – no TOKEN (Google blocked Worker IP)');

    const req = {comparisonItem:keywords.map(k=>({keyword:k,geo,time:timeframe})),category:0,property:''};
    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
    const widgetResp = await fetch(`${PROXY}?url=${encodeURIComponent(exploreUrl)}`);
    const widgets = JSON.parse((await widgetResp.text()).slice(5)).widgets;

    const data = {iot:[],regions:[],related:{rising:[]}};
    for (const w of widgets) {
      const u = `https://trends.google.com${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
      const r = await fetch(`${PROXY}?url=${encodeURIComponent(u)}`);
      if (!r.ok) continue;
      const j = JSON.parse((await r.text()).slice(5));
      if (w.id==='TIMESERIES') data.iot = j.default.timelineData;
      if (w.id==='GEO_MAP') data.regions = j.default.geoMapData;
      if (w.id==='RELATED_QUERIES') data.related.rising = j.default.rankedList?.[1]?.rankedKeyword || [];
    }

    renderChart(data, keywords, output);

  } catch (e) {
    output.innerHTML = `<p style="color:#ef4444;text-align:center">Error: ${e.message}</p><p>Try again in 1 hour or use a different internet (Google blocks Cloudflare IPs)</p>`;
  }
};

function renderChart(data, keywords, output) {
  output.innerHTML = `<canvas id="trendsChart" style="height:420px;margin:2rem 0"></canvas>`;
  new Chart(document.getElementById('trendsChart'), {
    type: 'line',
    data: {
      labels: data.iot.map(d => new Date(d.time*1000).toLocaleDateString('en', {month:'short', year:'numeric'})),
      datasets: keywords.map((k,i) => ({
        label: k,
        data: data.iot.map(d => d.value[i] ?? 0),
        borderColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'][i],
        tension: .4,
        fill: false
      }))
    },
    options: {responsive:true,maintainAspectRatio:false}
  });
}