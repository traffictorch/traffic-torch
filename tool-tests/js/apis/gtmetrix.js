// Inside gtmetrix.js — smart bypass only when needed
const GT_API_KEY = '2cd8581f09cf3ed0ce2ffffca0b09c21';

export async function getData(url, proxy) {
    const isGTmetrix = true; // we know this is GTmetrix

    const fetcher = (apiUrl, options = {}) => {
        const finalUrl = isGTmetrix ? apiUrl : proxy + encodeURIComponent(apiUrl);
        return fetch(finalUrl, options);
    };

    // Now use fetcher() everywhere — GTmetrix goes direct, everything else via proxy
    const startRes = await fetcher('https://gtmetrix.com/api/2.0/tests', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(GT_API_KEY + ':'),
            'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
            data: { type: 'test', attributes: { url } }
        })
    });
    

    if (!startRes.ok) throw new Error('GTmetrix failed to start test');
    const { data } = await startRes.json();
    const testId = data.id;

    // Poll until completed
    let result;
    do {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(proxy + encodeURIComponent(`https://gtmetrix.com/api/2.0/tests/${testId}`), {
            headers: { 'Authorization': 'Basic ' + btoa(GT_API_KEY + ':') }
        });
        result = await poll.json();
    } while (!result.data.attributes.report_url);

    const reportUrl = result.data.attributes.report_url;

    // Fetch report
    const reportRes = await fetch(proxy + encodeURIComponent(reportUrl), {
        headers: { 'Authorization': 'Basic ' + btoa(GT_API_KEY + ':') }
    });
    const report = await reportRes.json();

    const score = Math.round(report.data.attributes.lighthouse_performance_score * 100);

    // Waterfall (HAR)
    const harRes = await fetch(proxy + encodeURIComponent(reportUrl + '/resources/har'));
    const har = await harRes.json();
    const waterfall = har.log.entries.map(e => ({
        name: e.request.url,
        duration: e.time
    }));

    return { score, waterfall };
}