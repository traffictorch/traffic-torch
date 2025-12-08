document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysis-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const modulesContainer = document.getElementById('modules');
    const bottomLoader = document.getElementById('bottom-loader');
    const loaderText = document.getElementById('loader-text');

    // Dark mode toggle
    document.getElementById('mode-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Helper to show bottom loader
    const showLoader = (text) => {
        loaderText.textContent = text;
        bottomLoader.classList.remove('hidden');
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        modulesContainer.innerHTML = '';
        results.classList.add('hidden');
        loading.classList.remove('hidden');

        const yourUrl = document.getElementById('your-url').value.trim();
        const compUrl = document.getElementById('competitor-url').value.trim();
        const phrase = document.getElementById('phrase').value.trim();

        // Basic validation
        if (!yourUrl.startsWith('http') || !compUrl.startsWith('http') || !phrase) {
            alert('Please fill all fields correctly');
            loading.classList.add('hidden');
            return;
        }

        // TODO: Phase 2+ – modules will be added here
        setTimeout(() => {
            loading.classList.add('hidden');
            results.classList.remove('hidden');
            document.getElementById('overall-score').classList.remove('hidden');
            // Temporary placeholder
            modulesContainer.innerHTML = `<div style="text-align:center;padding:4rem;color:#64748b;">Modules coming in next phase – stay tuned!</div>`;
        }, 1500);
    });
});