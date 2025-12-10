// Direct CrUX API module (uses provided Google key)
const GOOGLE_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

export async function getData(url, proxy) {
    const apiUrl = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${GOOGLE_KEY}`;
    const response = await fetch(proxy + encodeURIComponent(apiUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url,
            metrics: ['largest_contentful_paint', 'interaction_to_next_paint', 'cumulative_layout_shift']
        })
    });
    if (!response.ok) throw new Error('CrUX API failed');
    const data = await response.json();

    const metrics = data.record.metrics;
    const lcp_p75 = metrics.largest_contentful_paint.percentiles.p75;
    const inp_p75 = metrics.interaction_to_next_paint.percentiles.p75;
    const cls_p75 = parseFloat(metrics.cumulative_layout_shift.percentiles.p75);

    function getMetricScore(p75, good, needs) {
        if (p75 <= good) return 100;
        if (p75 <= needs) return 50;
        return 0;
    }

    const lcp_score = getMetricScore(lcp_p75, 2500, 4000);
    const inp_score = getMetricScore(inp_p75, 200, 500);
    const cls_score = getMetricScore(cls_p75, 0.1, 0.25);

    const score = Math.round((lcp_score + inp_score + cls_score) / 3);

    return {
        score,
        metrics: { LCP: lcp_p75 + 'ms', INP: inp_p75 + 'ms', CLS: cls_p75 }
    };
}