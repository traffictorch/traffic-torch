// script.js – Traffic Torch Competition Tool (Dec 2025)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysis-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const yourScore = document.getElementById('your-score');
    const competitorScore = document.getElementById('competitor-score');
    const gapsList = document.getElementById('gaps');
    const fixesList = document.getElementById('fixes-list');
    const forecastText = document.getElementById('forecast-text');
    const modeToggle = document.getElementById('mode-toggle');

    // Dark / Light mode toggle
    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        modeToggle.textContent = document.body.classList.contains('dark-mode')
            ? '☀️ Light Mode'
            : '🌙 Dark Mode';
    });

    // Form submit → mock instant analysis
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        setTimeout(() => {
            loading.classList.add('hidden');
            results.classList.remove('hidden');

            // Mock results
            yourScore.textContent = '87/100';
            competitorScore.textContent = '94/100';

            gapsList.innerHTML = `
                <li class="result-card"><strong>Page Speed Gap</strong><br>
                    <strong>What:</strong> Your site loads 2.1s slower<br>
                    <strong>Why:</strong> Hurts Core Web Vitals & rankings<br>
                    <strong>How to fix:</strong> Compress images + enable lazy loading + upgrade hosting
                </li>
                <li class="result-card"><strong>Backlinks Gap</strong><br>
                    <strong>What:</strong> Competitor has 3.4× more referring domains<br>
                    <strong>Why:</strong> Directly boosts authority<br>
                    <strong>How to fix:</strong> Run broken link outreach + guest posts
                </li>
            `;

            fixesList.innerHTML = `
                <li class="result-card">AI Fix → Add this to &lt;head&gt;:<br><code>&lt;link rel="preload" href="hero.jpg" as="image"&gt;</code></li>
                <li class="result-card">AI Fix → Replace all &lt;img&gt; with:<br><code>&lt;img src="..." loading="lazy" alt="..."&gt;</code></li>
            `;

            forecastText.textContent = 'With these fixes applied → +18 rank positions in 60–90 days (projected).';
        }, 1800);
    });
});