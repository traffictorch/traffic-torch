// Main script: Handles form, lazy loads modules sequentially, day/night toggle
const proxy = 'https://cors-proxy.traffictorch.workers.dev/?__url=';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysis-form');
    const toggleBtn = document.getElementById('toggle-mode');
    const body = document.body;

    // Day/Night toggle with localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        body.classList.add('dark');
    }
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        localStorage.setItem('darkMode', body.classList.contains('dark'));
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url-input').value;
        if (!url) return;

        // Reset results
        document.getElementById('gtmetrix-result').innerHTML = 'Loading...';
        document.getElementById('webpagetest-result').innerHTML = 'Loading...';
        document.getElementById('crux-result').innerHTML = 'Loading...';

        // Lazy load and run sequentially
        try {
            const gtmetrix = await import('./apis/gtmetrix.js');
            const gtData = await gtmetrix.getData(url, proxy);
            displayResult('gtmetrix-result', gtData, 'GTmetrix provides a comprehensive performance score (0-100). Higher scores indicate better optimization. Waterfall shows resource loading timeline. Improve by optimizing images, minifying code, etc.');

            const webpagetest = await import('./apis/webpagetest.js');
            const wptData = await webpagetest.getData(url, proxy);
            displayResult('webpagetest-result', wptData, 'WebPageTest runs browser tests for score (0-100 via Lighthouse). Filmstrip visualizes page load over time. Use this as backup; focus on reducing load times for better UX.');

            const crux = await import('./apis/crux.js');
            const cruxData = await crux.getData(url, proxy);
            displayResult('crux-result', cruxData, 'CrUX uses real-user data for Core Web Vitals. Scores derived from p75 metrics: Good (100), Needs Improvement (50), Poor (0). Average for overall. Educate: LCP measures loading, INP interactivity, CLS stability.');
        } catch (error) {
            console.error(error);
            document.querySelectorAll('.loading').forEach(el => el.innerHTML = 'Error: ' + error.message);
        }
    });
});

function displayResult(id, data, education) {
    const el = document.getElementById(id);
    let html = `<p><strong>Score:</strong> ${data.score} / 100</p><p>${education}</p>`;
    if (data.waterfall) {
        html += '<h3>Waterfall</h3><table><thead><tr><th>Resource</th><th>Time (ms)</th></tr></thead><tbody>';
        data.waterfall.forEach(item => {
            html += `<tr><td>${item.name}</td><td>${item.duration}</td></tr>`;
        });
        html += '</tbody></table>';
    }
    if (data.filmstrip) {
        html += '<h3>Filmstrip</h3><div style="display: flex; overflow-x: auto;">';
        data.filmstrip.forEach(src => {
            html += `<img src="${src}" alt="Filmstrip frame" style="width: 100px; margin-right: 5px;">`;
        });
        html += '</div>';
    }
    if (data.metrics) {
        html += '<h3>Metrics</h3><ul>';
        for (const [key, value] of Object.entries(data.metrics)) {
            html += `<li>${key}: ${value}</li>`;
        }
        html += '</ul>';
    }
    el.innerHTML = html;
    el.classList.remove('loading');
}