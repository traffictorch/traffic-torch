// js/modules/google-trends.js – DEBUG + FIXED RELOAD (Dec 2025)
const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

function initGoogleTrends() {
  const form = document.getElementById('trends-form');
  const output = document.getElementById('trends-output');
  if (!form || !output) return console.error('Form/output not found');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // ← FORCES NO RELOAD
    e.stopPropagation(); // Extra safety
    console.log('Submit fired – no reload'); // DEBUG: Check console (F12)

    output.innerHTML = '<p style="text-align:center;padding:2rem;font-size:1.2rem;color:#3b82f6">Loading trends… (6–12s)</p>';

    const kw = document.getElementById('keywords-input').value.split(',').map(k=>k.trim()).filter(k=>k).slice(0,5);
    const timeframe = document.getElementById('timeframe')?.value || 'today 5-y';
    const geo = document.getElementById('geo')?.value || '';

    if (kw.length === 0) { output.innerHTML = '<p>Please enter keywords</p>'; return; }

    try {
      const data = await fetchGoogleTrends(kw, timeframe, geo);
      renderTrends(data, kw);
    } catch (err) {
      console.error('Fetch error:', err); // DEBUG
      output.innerHTML = `<p style="color:#ef4444;text-align:center">Error: ${err.message}</p><p>Check console (F12) for details. Proxy issue? Test: ${PROXY}?url=https://trends.google.com</p>`;
    }
  });
}

async function fetchGoogleTrends(kw, tf, geo) {
  // 1. Token fetch with retry
  let tokenResp;
  for (let retry = 0; retry < 3; retry++) {
    tokenResp = await fetch(`${PROXY}?url=${encodeURIComponent('https://trends.google.com/trends/explore?q=example&geo=')}`);
    console.log(`Token fetch status: ${tokenResp.status}`); // DEBUG
    if (tokenResp.ok || retry === 2) break;
    await new Promise(r => setTimeout(r, 5000)); // 5s retry
  }
  if (!tokenResp.ok) throw new Error(`Proxy failed (${tokenResp.status}) – update Worker headers`);
  const tokenHtml = await tokenResp.text();
  console.log('Token HTML length:', tokenHtml.length); // DEBUG: >10k = full page
  const token = tokenHtml.match(/"TOKEN":"([^"]+)"/)?.[1];
  if (!token) throw new Error('No TOKEN in HTML – "nothing retrieved" means proxy broke');

  // 2. Widgets
  const req = { comparisonItem: kw.map(k=>({keyword:k,geo,time:tf})), category:0, property:'' };
  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
  const widgetResp = await fetch(`${PROXY}?url=${encodeURIComponent(exploreUrl)}`);
  if (!widgetResp.ok) throw new Error(`Widgets failed (${widgetResp.status})`);
  const widgets = JSON.parse((await widgetResp.text()).substring(5)).widgets;

  // 3. Data fetches
  const res = {iot:[],regions:[],related:{rising:[]}};
  for (const wg of widgets) {
    const u = `https://trends.google.com${wg.requestUrl}?${new URLSearchParams(wg.request)}&token=${wg.token}&tz=-480`;
    const r = await fetch(`${PROXY}?url=${encodeURIComponent(u)}`);
    if (!r.ok) continue;
    const j = JSON.parse((await r.text()).substring(5));
    if (wg.id==='TIMESERIES') res.iot = j.default.timelineData;
    if (wg.id==='GEO_MAP') res.regions = j.default.geoMapData;
    if (wg.id==='RELATED_QUERIES' && j.default?.rankedList?.[1]) res.related.rising = j.default.rankedList[1].rankedKeyword;
  }
  return res;
}

function renderTrends(data, kw) {
  const o = document.getElementById('trends-output');
  let html = `<canvas id="trendsChart" style="height:420px;margin:2rem 0;border-radius:12px"></canvas>`;
  if (data.regions.length) {
    html += `<h3 style="margin:1.5rem 0 0.5rem">Top Regions</h3><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)"><thead style="background:#3b82f6;color:white"><tr><th style="padding:1rem;text-align:left">Region</th><th style="padding:1rem;text-align:left">Score</th></tr></thead><tbody>${data.regions.slice(0,10).map(r=>`<tr><td style="padding:1rem;border-bottom:1px solid #eee">${r.geoName}</td><td style="padding:1rem;border-bottom:1px solid #eee">${r.value[0]}</td></tr>`).join('')}</tbody></table>`;
  }
  if (data.related.rising.length) {
    html += `<h3 style="margin:1.5rem 0 0.5rem">Rising Searches</h3><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)"><thead style="background:#10b981;color:white"><tr><th style="padding:1rem;text-align:left">Query</th><th style="padding:1rem;text-align:left">Growth</th></tr></thead><tbody>${data.related.rising.slice(0,10).map(q=>`<tr><td style="padding:1rem;border-bottom:1px solid #eee">${q.query}</td><td style="padding:1rem"><span style="background:#10b981;color:white;padding:0.3rem 0.8rem;border-radius:20px;font-weight:600">${q.value>=5000?'Breakout!':q.value+'%'}</span></td></tr>`).join('')}</tbody></table>`;
  }
  o.innerHTML = html;

  new Chart(document.getElementById('trendsChart'), {
    type:'line',
    data:{labels:data.iot.map(d=>new Date(d.time*1000).toLocaleDateString('en',{month:'short',year:'numeric'})),
      datasets:kw.map((k,i)=>({label:k,data:data.iot.map(d=>d.value[i]??0),borderColor:['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'][i],tension:.4,fill:false}))},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}
  });
}

// Auto-init
initGoogleTrends();