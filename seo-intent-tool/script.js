// Mode toggle with localStorage persistence
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toggleBtn = document.getElementById('mode-toggle');
    const storedTheme = localStorage.getItem('theme') || 'light';
    html.classList.remove('light', 'dark');
    html.classList.add(storedTheme);

    toggleBtn.addEventListener('click', () => {
        const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
        html.classList.remove('light', 'dark');
        html.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Form submission
    const form = document.getElementById('audit-form');
    const results = document.getElementById('results');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url-input').value;
        if (!url) return;

        try {
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Fetch failed');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // Analysis functions
            const text = doc.body.textContent.trim();
            const words = text.split(/\s+/).filter(w => w).length;
            const sentences = (text.match(/[\w|\)][.?!](\s|$)/g) || []).length || 1;
            const syllables = text.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0);
            const readability = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

            function countSyllables(word) {
                word = word.toLowerCase().replace(/[^a-z]/g, '');
                if (word.length <= 3) return 1;
                word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
                return (word.match(/[aeiouy]{1,2}/g) || []).length || 1;
            }

            const hasAuthor = !!doc.querySelector('[class*="author"], [id*="author"], meta[name="author"]');
            const schemaTypes = [];
            doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
                try {
                    const json = JSON.parse(script.textContent);
                    if (json['@type']) schemaTypes.push(json['@type']);
                    if (Array.isArray(json)) json.forEach(item => item['@type'] && schemaTypes.push(item['@type']));
                } catch {}
            });

            const titleLower = doc.title.toLowerCase();
            let intent = 'Informational';
            let confidence = 50;
            if (titleLower.includes('buy') || titleLower.includes('best') || titleLower.includes('review')) {
                intent = 'Commercial'; confidence = 80;
            } else if (titleLower.includes('how to') || titleLower.includes('what is') || titleLower.includes('guide')) {
                intent = 'Informational'; confidence = 85;
            } else if (titleLower.includes('near me') || titleLower.includes('location')) {
                intent = 'Local'; confidence = 70;
            } else if (titleLower.includes('download') || titleLower.includes('sign up')) {
                intent = 'Transactional'; confidence = 75;
            }

            const firstPersonCount = (text.match(/\b(I|we|my|our)\b/gi) || []).length;
            const eeat = {
                experience: firstPersonCount > 10 ? 80 : 40,
                expertise: hasAuthor ? 85 : 35,
                authoritativeness: schemaTypes.length > 0 ? 90 : 50,
                trustworthiness: url.startsWith('https://') ? 95 : 55
            };
            const eeatAvg = (eeat.experience + eeat.expertise + eeat.authoritativeness + eeat.trustworthiness) / 4;

            const depthScore = words > 1500 ? 90 : words > 800 ? 70 : 40;
            const readabilityScore = readability > 60 ? 90 : readability > 40 ? 70 : 40;

            const overallScore = Math.round((depthScore + readabilityScore + eeatAvg + (schemaTypes.length * 20) + confidence) / 5);

            // Radar chart data
            const radarData = {
                ContentDepth: depthScore,
                Readability: readabilityScore,
                Experience: eeat.experience,
                Expertise: eeat.expertise,
                Authoritativeness: eeat.authoritativeness,
                Trustworthiness: eeat.trustworthiness
            };
            const radarSvg = generateRadarChart(radarData);

            // Competitive gap
            const gaps = [
                { metric: 'Word Count', current: words, ideal: 1500, gap: words < 1500 ? 'Low' : 'Good' },
                { metric: 'Readability', current: Math.round(readability), ideal: '60-70', gap: readability < 60 ? 'Hard' : 'Good' },
                { metric: 'Schema Types', current: schemaTypes.length, ideal: '>=2', gap: schemaTypes.length < 2 ? 'Missing' : 'Good' },
                { metric: 'Author Bio', current: hasAuthor ? 'Yes' : 'No', ideal: 'Yes', gap: hasAuthor ? 'Good' : 'Add' }
            ];

            // Fixes
            const fixes = [];
            if (words < 1500) fixes.push({ what: 'Increase content length', how: 'Add more sections with valuable info', why: 'Deeper content ranks better for intent' });
            if (readability < 60) fixes.push({ what: 'Improve readability', how: 'Use shorter sentences, simpler words', why: 'Better UX leads to lower bounce rates' });
            if (!hasAuthor) fixes.push({ what: 'Add author bio', how: 'Include a section with author credentials', why: 'Boosts E-E-A-T for trust' });
            if (schemaTypes.length < 2) fixes.push({ what: 'Add schema markup', how: 'Implement JSON-LD for Article/Person', why: 'Helps search engines understand content' });
            fixes.sort((a, b) => (a.what.includes('content') ? -1 : 1)); // Prioritise content

            const forecast = `Current potential rank: Mid-page. If fixed, could reach Top 3 (estimated +${100 - overallScore}% improvement).`;

            // Display results
            document.getElementById('overall-score').textContent = overallScore + '/100';
            document.getElementById('radar-chart').innerHTML = radarSvg;
            document.getElementById('intent-type').innerHTML = `<p><strong>Type:</strong> ${intent} <span class="text-sm">(Confidence: ${confidence}%)</span></p>`;
            const eeatDiv = document.getElementById('eeat-breakdown');
            eeatDiv.innerHTML = '';
            Object.entries(eeat).forEach(([key, val]) => {
                eeatDiv.innerHTML += `<p><strong>${key}:</strong> ${val}/100</p>`;
            });
            document.getElementById('content-depth').innerHTML = `<p><strong>Word Count:</strong> ${words}</p><p><strong>Depth Score:</strong> ${depthScore}/100</p><p><strong>Readability (Flesch):</strong> ${Math.round(readability)}</p>`;
            const schemaDiv = document.getElementById('schema-types');
            schemaDiv.innerHTML = schemaTypes.length ? `<select class="w-full p-2 border dark:border-gray-600 dark:bg-gray-800">${schemaTypes.map(type => `<option>${type}</option>`).join('')}</select>` : '<p>No schema detected.</p>';

            const gapBody = document.querySelector('#gap-table tbody');
            gapBody.innerHTML = '';
            gaps.forEach(g => {
                gapBody.innerHTML += `<tr><td class="p-2 border">${g.metric}</td><td class="p-2 border">${g.current}</td><td class="p-2 border">${g.ideal}</td><td class="p-2 border">${g.gap}</td></tr>`;
            });

            const fixesList = document.getElementById('fixes-list');
            fixesList.innerHTML = '';
            fixes.forEach(f => {
                fixesList.innerHTML += `<li><strong>What:</strong> ${f.what}<br><strong>How:</strong> ${f.how}<br><strong>Why:</strong> ${f.why}</li>`;
            });

            document.getElementById('rank-forecast').textContent = forecast;

            results.classList.remove('hidden');
            results.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            alert('Error analyzing URL: ' + error.message);
        }
    });
});

// Generate SVG radar chart
function generateRadarChart(data) {
    const size = 200;
    const center = size / 2;
    const numAxes = Object.keys(data).length;
    const angleSlice = (Math.PI * 2) / numAxes;
    let points = '';
    let axes = '';
    let labels = '';
    Object.entries(data).forEach(([key, value], i) => {
        const radius = (value / 100) * (center - 20);
        const x = center + radius * Math.cos(i * angleSlice - Math.PI / 2);
        const y = center + radius * Math.sin(i * angleSlice - Math.PI / 2);
        points += `${x},${y} `;
        const axX = center + (center - 10) * Math.cos(i * angleSlice - Math.PI / 2);
        const axY = center + (center - 10) * Math.sin(i * angleSlice - Math.PI / 2);
        axes += `<line x1="${center}" y1="${center}" x2="${axX}" y2="${axY}" stroke="gray" stroke-width="1"/>`;
        const labX = center + (center + 10) * Math.cos(i * angleSlice - Math.PI / 2);
        const labY = center + (center + 10) * Math.sin(i * angleSlice - Math.PI / 2);
        labels += `<text x="${labX}" y="${labY}" font-size="10" text-anchor="middle" dy=".3em">${key}</text>`;
    });
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${points}" fill="rgba(0, 128, 255, 0.3)" stroke="blue" stroke-width="2"/>
        ${axes}
        ${labels}
    </svg>`;
}