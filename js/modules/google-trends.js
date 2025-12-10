const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

function initGoogleTrends() {
  const form = document.getElementById('trends-form');
  if (!form) return console.error('No form found');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('Trends submit – no reload'); // DEBUG

    const output = document.getElementById('trends-output');
    output.innerHTML = '<p style="text-align:center;padding:2rem;color:#3b82f6">Loading…</p>';

    const kw = document.getElementById('keywords-input').value.split(',').map(k=>k.trim()).filter(Boolean).slice(0,5);
    const tf = document.getElementById('timeframe').value || 'today 5-y';
    const geo = document.getElementById('geo').value || '';

    try {
      const data = await fetchGoogleTrends(kw, tf, geo);
      renderTrends(data, kw);
    } catch (err) {
      console.error('Error:', err);
      output.innerHTML = `<p style="color:#ef4444">Error: ${err.message}</p><p>Proxy test: <a href="${PROXY}?url=https://trends.google.com/trends/explore?q=test&geo=" target="_blank">Check here</a></p>`;
    }
  });
}

async function fetchGoogleTrends(kw, tf, geo) {
  const tokenUrl = 'https://trends.google.com/trends/explore?q=example&geo=';
  const tokenResp = await fetch(`${PROXY}?url=${encodeURIComponent(tokenUrl)}`);
  console.log('Token status:', tokenResp.status); // DEBUG
  const tokenHtml = await tokenResp.text();
  console.log('Token HTML len:', tokenHtml.length); // >10k = good
  const token = tokenHtml.match(/"TOKEN":"([^"]+)"/)?.[1];
  if (!token) throw new Error('No TOKEN – unsupported browser error in proxy. Update headers.');

  const req = {comparisonItem:kw.map(k=>({keyword:k,geo,time:tf})),category:0,property:''};
  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
  const widgetResp = await fetch(`${PROXY}?url=${encodeURIComponent(exploreUrl)}`);
  const widgets = JSON.parse((await widgetResp.text()).substring(5)).widgets;

  const res = {iot:[],regions:[],related:{rising:[]}};
  for (const w of widgets) {
    const u = `https://trends.google.com${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
    const r = await fetch(`${PROXY}?url=${encodeURIComponent(u)}`);
    if (!r.ok) continue;
    const j = JSON.parse((await r.text()).substring(5));
    if (w.id==='TIMESERIES') res.iot = j.default.timelineData;
    if (w.id==='GEO_MAP') res.regions = j.default.geoMapData;
    if (w.id==='RELATED_QUERIES') res.related.rising = j.default.rankedList?.[1]?.rankedKeyword || [];
  }
  return res;
}

function renderTrends(data, kw) {
  const o = document.getElementById('trends-output');
  o.innerHTML = `<canvas id="trendsChart" style="height:400px;margin:2rem 0;border-radius:12px"></canvas>
    ${data.regions.length ? `<h3>Top Regions</h3><table style="width:100%;border-collapse:collapse;border-radius:8px"><thead style="background:#3b82f6;color:white"><tr><th style="padding:1rem">Region</th><th style="padding:1rem">Score</th></tr></thead><tbody>${data.regions.slice(0,10).map(r=>`<tr><td style="padding:1rem;border-bottom:1px solid #eee">${r.geoName}</td><td style="padding:1rem;border-bottom:1px solid #eee">${r.value[0]}</td></tr>`).join('')}</tbody></table>` : ''}
    ${data.related.rising.length ? `<h3>Rising Searches</h3><table style="width:100%;border-collapse:collapse;border-radius:8px"><thead style="background:#10b981;color:white"><tr><th style="padding:1rem">Query</th><th style="padding:1rem">Growth</th></tr></thead><tbody>${data.related.rising.slice(0,10).map(q=>`<tr><td style="padding:1rem;border-bottom:1px solid #eee">${q.query}</td><td style="padding:1rem"><span style="background:#10b981;color:white;padding:0.3rem 0.8rem;border-radius:20px">${q.value>=5000?'Breakout!':q.value+'%'}</span></td></tr>`).join('')}</tbody></table>` : ''}`;

  new Chart(document.getElementById('trendsChart'), {
    type:'line',
    data:{labels:data.iot.map(d=>new Date(d.time*1000).toLocaleDateString('en',{month:'short',year:'numeric'})),
      datasets:kw.map((k,i)=>({label:k,data:data.iot.map(d=>d.value[i]??0),borderColor:['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'][i],tension:.4,fill:false}))},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}
  });
}

initGoogleTrends(); // Auto-init