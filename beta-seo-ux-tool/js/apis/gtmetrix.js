const GT_API_KEY = '2cd8581f09cf3ed0ce2ffffca0b09c21';

export async function getData(url, proxy) {
    const auth = 'Basic ' + btoa(GT_API_KEY + ':');

    // 1. Start test via proxy
    const startUrl = proxy + encodeURIComponent('https://gtmetrix.com/api/2.0/tests');
    const start = await fetch(startUrl, {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({ data: { type: 'test', attributes: { url } } })
    });

    if (!start.ok) throw new Error(`GTmetrix start failed: ${await start.text()}`);

    const { data } = await start.json();
    const testId = data.id;

    // 2. Poll via proxy
    let reportUrl;
    do {
        await new Promise(r => setTimeout(r, 5000));
        const pollUrl = proxy + encodeURIComponent(`https://gtmetrix.com/api/2.0/tests/${testId}`);
        const poll = await fetch(pollUrl, {
            headers: { 'Authorization': auth }
        });
        const json = await poll.json();
        reportUrl = json.data?.attributes?.report_url;
    } while (!reportUrl);

    // 3. Get report + HAR via proxy
    const reportUrlProxy = proxy + encodeURIComponent(reportUrl);
    const report = await (await fetch(reportUrlProxy, { headers: { 'Authorization': auth } })).json();

    const harUrlProxy = proxy + encodeURIComponent(reportUrl + '/resources/har');
    const har = await (await fetch(harUrlProxy, { headers: { 'Authorization': auth } })).json();

    const score = Math.round(report.data.attributes.lighthouse_performance_score * 100);
    const waterfall = har.log.entries
        .filter(e => e.request.url.includes(new URL(url).hostname))
        .slice(0, 20)
        .map(e => ({ name: e.request.url.split('/').pop().slice(0, 50), duration: Math.round(e.time) }));

    return { score, waterfall };
}