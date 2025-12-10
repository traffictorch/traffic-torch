// js/apis/gtmetrix.js
const GT_KEY = "2cd8581f09cf3ed0ce2ffffca0b09c21";
const GT_BASE = "https://gtmetrix.com/api/0.1";

export async function runGTmetrixTest(url) {
  const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(
    `${GT_BASE}/test`
  )}`;
  
  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(GT_KEY + ":")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  // Poll for results (quick test finishes in ~10s)
  return await pollGTmetrix(data.test_id);
}

async function pollGTmetrix(testId, attempts = 15) {
  for (let i = 0; i < attempts; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const res = await fetch(`https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(
      `${GT_BASE}/test/${testId}`
    )}`, {
      headers: { "Authorization": `Basic ${btoa(GT_KEY + ":")}` }
    });
    const json = await res.json();
    if (json.state === "completed") return json.results;
    if (json.state === "error") throw new Error("GTmetrix failed");
  }
  throw new Error("GTmetrix timeout – using PageSpeed only");
}