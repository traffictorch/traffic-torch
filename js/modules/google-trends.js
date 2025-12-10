// js/modules/google-trends.js – FINAL WORKING VERSION (Dec 2025)
const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

window.runGoogleTrends = async function() {
  const output = document.getElementById('trends-output');
  output.innerHTML = '<p style="text-align:center;padding:3rem;color:#3b82f6;font-size:1.3rem">Loading trends… (6–12s)</p>';

  const keywords = document.getElementById('keywords-input').value.split(',').map(k => k.trim()).filter(Boolean).slice(0,5);
  const timeframe = document.getElementById('timeframe')?.value || 'today 5-y';
  const geo = document.getElementById('geo')?.value || '';

  if (keywords.length === 0) return output.innerHTML = '<p>Please type something</p>';

  try {
    // Token
    const tokenResp = await fetch(`${PROXY}?url=${encodeURIComponent('https://trends.google.com/trends/explore?q=example&geo=')}`);
    const tokenHtml = await tokenResp.text();
    const token = tokenHtml.match(/"TOKEN":"([^"]+)"/)?.[1];
    if (!token) throw new Error('Proxy broken – no TOKEN (check Worker headers)');

    // Widgets
    const req = {comparisonItem: keywords.map(k=>({keyword:k,geo,time:timeframe})),category:0,property:''};
    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
    const widgetResp = await fetch(`${PROXY}?url=${encodeURIComponent(exploreUrl)}`);
    const widgets = JSON.parse((await widgetResp.text()).slice(5)).widgets;

    const data = {iot:[],regions:[],related:{rising:[]}};
    for (const w of widgets) {
      const u = `https://trends.google.com${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
      const r = await fetch(`${PROXY}?url=${encodeURIComponent(u)}`);
      if (!r.ok) continue;
      const j = JSON.parse((await r.text()).slice(5));
      if (w.id === 'TIMESERIES') data.iot = j.default.timelineData;
      if (w.id === 'GEO_MAP') data.regions = j.default.geoMapData;
      if (w.id === 'RELATED_QUERIES') data.related.rising = j.default.rankedList?.[1]?.rankedKeyword || [];
    }

    // Render
    output.innerHTML = `<canvas id="trendsChart" style="height:420px;margin:2rem 0"></canvas>`;
    new Chart(document.getElementById('trendsChart'), {
      type:'line',
      data:{labels:data.iot.map(d=>new Date(d.time*1000).toLocaleDateString('en',{month:'short',year:'numeric'})),
        datasets:keywords.map((k,i)=>({label:k,data:data.iot.map(d=>d.value[i]??0),borderColor:['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'][i],tension:.4}))},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}
    });

    if (data.regions.length) output.innerHTML += `<h3>Top Regions</h3><table style="width:100%;border-collapse:collapse"><thead style="background:#3b82f6;color:white"><tr><th style="padding:1rem">Region</th><th style="padding:1rem">Score</th></tr></thead><tbody>${data.regions.slice(0,10).map(r=>`<tr><td style="padding:1rem;border-bottom:1px solid #eee">${r.geoName}</td><td style="padding:1rem;border-bottom:1px solid #eee">${r.value[0]}</td></tr>`).join('')}</tbody></table>`;

    if (data.related.rising.length) output.innerHTML += `<h3>Rising Searches</h3><table style="width:100%;border-collapse:collapse"><thead style="background:#10b981;color:white"><tr><th style="padding:1rem">Query</th><th style="padding:1rem">Growth</th></tr></thead><tbody>${data.related.rising.slice(0,10).map(q=>`<tr><td style="padding:1rem;border-bottom:1px solid #eee">${q.query}</td><td style="padding:1rem"><span style="background:#10b981;color:white;padding:0.3rem 0.8rem;border-radius:20px">${q.value>=5000?'Breakout!':q.value+'%'}</span></td></tr>`).join('')}</tbody></table>`;

  } catch (e) {
    output.innerHTML = `<p style="color:red">Error: ${e.message}</p><p>Wait 1 hour or use VPN</p>`;
  }
};