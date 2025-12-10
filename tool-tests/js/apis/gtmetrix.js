// js/apis/gtmetrix.js
const GTMETRIX_API = 'https://gtmetrix.com/api/v4';

export async function runGTmetrixTest(url, strategy = 'desktop') {
  const body = JSON.stringify({
    url: url,
    test_settings: { device: strategy === 'mobile' ? 'mobile' : 'desktop' }
  });
  const response = await fetch(`${GTMETRIX_API}/tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body
  });
  if (!response.ok) throw new Error(`GTmetrix failed: ${response.status}`);
  const data = await response.json();
  // Simple poll for result (cap at 10s for quick UX)
  return await pollForResult(data.data.id);
}

async function pollForResult(testId, maxAttempts = 2) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`https://gtmetrix.com/api/v4/tests/${testId}?full=1`);
    const data = await res.json();
    if (data.data.state === 'completed') {
      return {
        fully_loaded_time: data.data.full_load_time,
        report_url: `https://gtmetrix.com/report/${testId}`
      };
    }
  }
  throw new Error('GTmetrix timeout - site too slow?');
}