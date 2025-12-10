const GOOGLE_KEY = 'AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs';

export async function getData(url, proxy) {
    const res = await fetch(proxy + encodeURIComponent(`https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${GOOGLE_KEY}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formFactor: 'PHONE' })
    });

    if (!res.ok) throw new Error('CrUX API error');
    const json = await res.json();

    const m = json.record?.metrics || {};
    const lcp = m.largest_contentful_paint?.percentiles?.p75 ?? 'N/A';
    const inp = m.interaction_to_next_paint?.percentiles?.p75 ?? 'N/A';
    const cls = m.cumulative_layout_shift?.percentiles?.p75 ?? 'N/A';

    const scoreLCP = lcp === 'N/A' ? 0 : (lcp <= 2500 ? 100 : lcp <= 4000 ? 50 : 0);
    const scoreINP = inp === 'N/A' ? 0 : (inp <= 200 ? 100 : inp <= 500 ? 50 : 0);
    const scoreCLS = cls === 'N/A' ? 0 : (cls <= 0.1 ? 100 : 0);

    const overall = Math.round((scoreLCP + scoreINP + scoreCLS) / 3);

    return {
        score: overall,
        scoreLCP, scoreINP, scoreCLS,
        metrics: { LCP: lcp === 'N/A' ? 'No data' : lcp + 'ms', INP: inp === 'N/A' ? 'No data' : inp + 'ms', CLS }
    };
}