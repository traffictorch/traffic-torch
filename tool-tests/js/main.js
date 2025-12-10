const proxy = 'https://cors-proxy.traffictorch.workers.dev/?__url=';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysis-form');
    const toggleBtn = document.getElementById('toggle-mode');
    const body = document.body;

    // Day/Night mode
    if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark');
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        localStorage.setItem('darkMode', body.classList.contains('dark'));
        toggleBtn.textContent = body.classList.contains('dark') ? 'Day Mode' : 'Night Mode';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url-input').value.trim();
        if (!url) return;

        // Reset
        document.getElementById('gtmetrix-result').innerHTML = '<p class="loading">Running GTmetrix test...</p>';
        document.getElementById('crux-result').innerHTML = '<p class="loading">Fetching real-user CrUX data...</p>';

        try {
            // 1. GTmetrix (primary reliable score + waterfall)
            const gtmetrix = await import('./apis/gtmetrix.js');
            const gtData = await gtmetrix.getData(url, proxy);
            displayGTmetrix(gtData);

            // 2. CrUX real-user metrics (unlimited, no key limits)
            const crux = await import('./apis/crux.js');
            const cruxData = await crux.getData(url, proxy);
            displayCrUX(cruxData);

        } catch (err) {
            console.error(err);
            document.querySelectorAll('.result-box').forEach(box => {
                box.innerHTML = `<p class="error">Error: ${err.message}</p>`;
            });
        }
    });
});

function displayGTmetrix(data) {
    const el = document.getElementById('gtmetrix-result');
    let html = `
        <p><strong>GTmetrix Performance Score:</strong> <big>${data.score}/100</big></p>
        <p>GTmetrix is the most reliable free lab test in 2025 — fully unlimited with your key.</p>
        <h3>Waterfall Timeline (top resources)</h3>
        <table>
            <thead><tr><th>Resource</th><th>Load Time</th></tr></thead>
            <tbody>`;
    data.waterfall.slice(0, 15).forEach(item => {
        html += `<tr><td>${item.name.split('/').pop()}</td><td>${Math.round(item.duration)}ms</td></tr>`;
    });
    html += `</tbody></table>`;
    el.innerHTML = html;
}

function displayCrUX(data) {
    const el = document.getElementById('crux-result');
    const metrics = data.metrics;
    let html = `
        <p><strong>Real-User Core Web Vitals Score:</strong> <big>${data.score}/100</big></p>
        <ul>
            <li>LCP: ${metrics.LCP} → ${data.scoreLCP !== undefined ? (data.scoreLCP === 100 ? 'Good' : data.scoreLCP === 50 ? 'Needs Improvement' : 'Poor') : 'N/A'}</li>
            <li>INP: ${metrics.INP} → ${data.scoreINP !== undefined ? (data.scoreINP === 100 ? 'Good' : data.scoreINP === 50 ? 'Needs Improvement' : 'Poor') : 'N/A'}</li>
            <li>CLS: ${metrics.CLS} → ${data.scoreCLS !== undefined ? (data.scoreCLS === 100 ? 'Good' : 'Poor') : 'N/A'}</li>
        </ul>
        <p>CrUX data comes from real Chrome users — unlimited & no rate limits.</p>`;
    el.innerHTML = html;
}