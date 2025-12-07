// script.js
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

    // Day/Night mode toggle
    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        modeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Toggle Light Mode' : 'Toggle Dark Mode';
    });

    // Form submission (simulate analysis)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        // Simulate API call delay
        setTimeout(() => {
            loading.classList.add('hidden');
            results.classList.remove('hidden');

            // Mock data
            yourScore.textContent = '85/100';
            competitorScore.textContent = '92/100';

            gapsList.innerHTML = `
                <li class="result-card">
                    <strong>Keyword Density Gap</strong><br>
                    What: Your site has lower keyword density.<br>
                    Why: Affects search rankings.<br>
                    How to fix: Increase targeted keywords in content.
                </li>
                <li class="result-card">
                    <strong>Backlink Count Gap</strong><br>
                    What: Competitor has 20% more backlinks.<br>
                    Why: Boosts domain authority.<br>
                    How to fix: Build quality backlinks via outreach.
                </li>
            `;

            fixesList.innerHTML = `
                <li class="result-card">
                    AI Fix: Update meta tags with this code: &lt;meta name="description" content="Optimized desc"&gt;
                </li>
                <li class="result-card">
                    AI Fix: Add alt texts to images: &lt;img src="img.jpg" alt="Descriptive alt"&gt;
                </li>
            `;

            forecastText.textContent = 'With fixes applied, your rank could improve by 15 positions in 3 months.';
        }, 2000);
    });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed', err));
    }
});