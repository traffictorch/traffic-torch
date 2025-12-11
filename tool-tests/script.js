document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const input = document.getElementById('url-input');
    const results = document.getElementById('results');
    const loader = document.getElementById('loader');
    const toggleBtn = document.getElementById('toggle-mode');

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    });
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');

    function cleanUrl(u) { return u.trim() && !/^https?:\/\//i.test(u) ? 'https://' + u.trim() : u.trim(); }

    function updateScore(id, score) {
        const circle = document.querySelector('#' + id + ' .score-circle');
        if (!circle) return;
        score = Math.round(score);
        const dash = (score / 100) * 339;
        circle.querySelector('.progress').style.strokeDasharray = `${dash} 339`;
        const num = circle.querySelector('.number');
        num.textContent = score;
        num.style.opacity = '1';
        circle.dataset.score = score;
    }

    function populateIssues(id, issues) {
        const ul = document.getElementById(id);
        ul.innerHTML = '';
        issues.forEach(i => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${i.issue}</strong><br><span style="color:#00c853">Fix →</span> ${i.fix}
                <button style="margin-left:10px;padding:5px 10px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem"
                        onclick="navigator.clipboard.writeText('${i.fix.replace(/'/g, "\\'")}')">Copy</button>`;
            ul.appendChild(li);
        });
    }

    document.querySelectorAll('.expand').forEach(b => b.onclick = () => {
        const d = b.nextElementSibling;
        d.classList.toggle('hidden');
        b.textContent = d.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        let url = cleanUrl(input.value);
        if (!url) return;
        loader.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            const res = await fetch(`https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw '';
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const seo = analyzeSEO(doc);
            const mobile = analyzeMobile(doc);
            const perf = analyzePerf(html, doc);
            const access = analyzeAccess(doc);

            updateScore('seo-score', seo.score);
            updateScore('mobile-score', mobile.score);
            updateScore('perf-score', perf.score);
            updateScore('access-score', access.score);

            populateIssues('seo-issues', seo.issues);
            populateIssues('mobile-issues', mobile.issues);
            populateIssues('perf-issues', perf.issues);
            populateIssues('access-issues', access.issues);

            loader.classList.add('hidden');
            results.classList.remove('hidden');
        } catch { loader.classList.add('hidden'); alert('Failed – try another URL'); }
    });

    function analyzeSEO(d) { let s=100,i=[]; const t=d.querySelector('title'); if(!t||t.textContent.length<10||t.textContent.length>60){s-=20;i.push({issue:'Bad title',fix:'50–60 char keyword-rich title'});} if(!d.querySelector('meta[name="description"]')){s-=15;i.push({issue:'Missing meta description',fix:'Add 150–160 char description'});} return {score:s,issues:i}; }
    function analyzeMobile(d) { let s=100,i=[]; if(!d.querySelector('meta[name="viewport"]')?.content.includes('width=device-width')){s-=30;i.push({issue:'Bad viewport',fix:'Add proper viewport meta'});} if(!d.querySelector('link[rel="manifest"]')){s-=20;i.push({issue:'No manifest',fix:'Add manifest.json'});} return {score:s,issues:i}; }
    function analyzePerf(h,d) { let s=100,i=[]; if(h.length/1024>120){s-=25;i.push({issue:'HTML too big',fix:'Minify HTML'});} return {score:s,issues:i}; }
    function analyzeAccess(d) { let s=100,i=[]; const a=Array.from(d.querySelectorAll('img')).filter(x=>!x.alt).length; if(a>0){s-=Math.min(30,a*6);i.push({issue:`${a} missing alts`,fix:'Add alt to every image'});} return {score:s,issues:i}; }
});