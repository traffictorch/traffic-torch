// GTmetrix API module (requires free API key)
const GT_API_KEY = ''; // Obtain from https://gtmetrix.com/api/ and paste here

export async function getData(url, proxy) {
    if (!GT_API_KEY) throw new Error('GTmetrix API key required');

    // Start test
    let apiUrl = 'https://gtmetrix.com/api/2.0/tests';
    let response = await fetch(proxy + encodeURIComponent(apiUrl), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(GT_API_KEY + ':')
        },
        body: JSON.stringify({ url, report: 'lighthouse' })
    });
    if (!response.ok) throw new Error('GTmetrix test start failed');
    const { test_id } = await response.json();

    // Poll for completion
    let status;
    do {
        await new Promise(resolve => setTimeout(resolve, 3000));
        apiUrl = `https://gtmetrix.com/api/2.0/tests/${test_id}`;
        response = await fetch(proxy + encodeURIComponent(apiUrl));
        status = await response.json();
    } while (status.state !== 'completed' && status.state !== 'error');
    if (status.state === 'error') throw new Error(status.error);

    // Get report
    const report_id = status.report_id; // Assuming from redirect or data
    apiUrl = `https://gtmetrix.com/api/2.0/reports/${report_id}`;
    response = await fetch(proxy + encodeURIComponent(apiUrl));
    const report = await response.json();
    const score = report.attributes.performance_score * 100; // 0-1 to 0-100

    // Get waterfall (HAR)
    apiUrl = `https://gtmetrix.com/api/2.0/reports/${report_id}/resources/net.har`;
    response = await fetch(proxy + encodeURIComponent(apiUrl));
    const har = await response.json();
    const waterfall = har.log.entries.map(entry => ({
        name: entry.request.url,
        duration: entry.time
    }));

    return { score, waterfall };
}