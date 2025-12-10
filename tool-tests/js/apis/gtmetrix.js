// tool-tests/js/apis/gtmetrix.js
const GT_API_KEY = '2cd8581f09cf3ed0ce2ffffca0b09c21';

export async function getData(url) {
    // No proxy at all for GTmetrix — ever
    const auth = 'Basic ' + btoa(GT_API_KEY + ':');

    // 1. Start test
    const startRes = await fetch('https://gtmetrix.com/api/2.0/tests', {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
            data: { type: 'test', attributes: { url } }
        })
    });

    if (!startRes.ok) {
        const err = await startRes.text();
        throw new Error(`GTmetrix start failed: ${startRes.status} ${err}`);
    }

    const { data } = await startRes.json();
    const testId = data.id;

    // 2. Poll until report ready
    let reportUrl;
    do {
        await new Promise(r => setTimeout(r, 5000));

        const pollRes = await fetch(`https://gtmetrix.com/api/2.0/tests/${testId}`, {
            headers: { 'Authorization': auth }
        });

        if (!pollRes.ok) throw new Error('Polling failed');

        const pollJson = await pollRes.json();
        reportUrl = pollJson.data?.attributes?.report_url;

    } while (!reportUrl);

    // 3. Get final report
    const reportRes = await fetch(reportUrl, {
        headers: { 'Authorization': auth }
    });

    const report = await reportRes.json();
    const score = Math.round(report.data.attributes.lighthouse_performance_score * 100);

    // 4. Get HAR waterfall
    const harRes = await fetch(reportUrl + '/resources/har', {
        headers: { 'Authorization': auth }
    });
    const har = await harRes.json();

    const waterfall = har.log.entries
        .filter(e => e.request.url.includes(new URL(url).hostname)) // only your domain
        .slice(0, 20)
        .map(e => ({
            name: e.request.url.split('/').pop().slice(0, 40),
            duration: Math.round(e.time)
        }));

    return { score, waterfall };
}