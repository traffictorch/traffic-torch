// tool-tests/js/apis/gtmetrix.js  ← FINAL WORKING VERSION (Dec 2025)
const GT_API_KEY = '2cd8581f09cf3ed0ce2ffffca0b09c21';

export async function getData(url) {
    const auth = 'Basic ' + btoa(GT_API_KEY + ':');

    // 1. Start test – direct
    const start = await fetch('https://gtmetrix.com/api/2.0/tests', {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({ data: { type: 'test', attributes: { url } } })
    });

    if (!start.ok) throw new Error('GTmetrix failed to start');

    const { data } = await start.json();
    const testId = data.id;

    // 2. Poll until ready – direct
    let reportUrl;
    do {
        await new Promise(r => setTimeout(r, 5000));
        const poll = await fetch(`https://gtmetrix.com/api/2.0/tests/${testId}`, {
            headers: { 'Authorization': auth }
        });
        const json = await poll.json();
        reportUrl = json.data?.attributes?.report_url;
    } while (!reportUrl);

    // 3. Get report + HAR – direct
    const report = await (await fetch(reportUrl, { headers: { 'Authorization': auth } })).json();
    const har = await (await fetch(reportUrl + '/resources/har', { headers: { 'Authorization': auth } })).json();

    const score = Math.round(report.data.attributes.lighthouse_performance_score * 100);
    const waterfall = har.log.entries
        .filter(e => e.request.url.includes(new URL(url).hostname))
        .slice(0, 20)
        .map(e => ({ name: e.request.url.split('/').pop().slice(0, 50), duration: Math.round(e.time) }));

    return { score, waterfall };
}