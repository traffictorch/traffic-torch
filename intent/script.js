document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('day-mode');
        body.classList.toggle('night-mode');
        themeToggle.textContent = body.classList.contains('night-mode') ? '☀️' : '🌙';
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url-input').value;
        if (!url) return;

        form.classList.add('hidden');
        loading.classList.remove('hidden');

        // Simulate API call (replace with fetch to your backend/AI endpoint)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay

        // Mock Audit Data (In production: Parse real content via API)
        const mockData = {
            score: 85,
            modules: [
                { name: 'Intent Alignment', score: 90, desc: 'Strong informational match (92% query coverage).' },
                { name: 'E-E-A-T', score: 80, desc: 'High expertise; add author bios for trust boost.' }
            ],
            gaps: [
                { metric: 'Intent Depth', yours: 75, competitor: 95, gap: '-20' },
                { metric: 'Backlinks', yours: 50, competitor: 80, gap: '-30' }
            ],
            fixes: [
                'High: Add FAQ section matching top queries.',
                'Med: Include expert quotes with links.',
                'Low: Optimize H2 tags for transactional signals.'
            ],
            forecast: '+15 positions in 30 days with 80% fix implementation.'
        };

        renderResults(mockData);
        loading.classList.add('hidden');
        results.classList.remove('hidden');
    });

    function renderResults(data) {
        document.getElementById('score').textContent = data.score;
        const modulesList = document.getElementById('modules-list');
        modulesList.innerHTML = data.modules.map(m => `<li><strong>${m.name}:</strong> ${m.score}/100 - ${m.desc}</li>`).join('');

        const tbody = document.querySelector('#gaps-table tbody');
        tbody.innerHTML = data.gaps.map(g => `<tr><td>${g.metric}</td><td>${g.yours}</td><td>${g.competitor}</td><td>${g.gap}</td></tr>`).join('');

        const fixesList = document.getElementById('fixes-list');
        fixesList.innerHTML = data.fixes.map(f => `<li>${f}</li>`).join('');

        document.getElementById('forecast-text').textContent = data.forecast;
    }
});