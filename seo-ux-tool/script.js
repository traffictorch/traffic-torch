import { renderPriorityAndGains } from './priority-gains.js';
import { renderPluginSolutions } from './plugin-solutions.js';

const moduleInfo = {
  seo: {
    what: 'On-Page SEO evaluates the core elements search engines read directly to understand your page topic and relevance.',
    how: 'Write a unique title (50–60 characters) with your main keyword near the start. Add a compelling meta description (120–158 characters). Use proper heading hierarchy and include structured data where applicable.',
    whyUx: 'Clear titles and descriptions set accurate user expectations in search results.',
    whySeo: 'These are the strongest direct ranking factors Google uses.'
  },
  mobile: {
    what: 'Mobile & PWA checks if your site is fully mobile-friendly and ready to be installed as a progressive web app.',
    how: 'Add the viewport meta tag, create and link a manifest.json file, provide multiple icon sizes, and register a service worker.',
    whyUx: 'Ensures flawless experience on phones and allows users to add your site to their home screen.',
    whySeo: 'Google uses mobile-first indexing – non-mobile-friendly sites are penalized.'
  },
  perf: {
    what: 'Performance analyzes page weight, requests, fonts, and render-blocking resources.',
    how: 'Compress images to WebP format and use lazy-loading. Minify HTML, CSS, and JS. Limit custom fonts and defer non-critical scripts.',
    whyUx: 'Fast loading keeps users engaged and reduces bounce rates.',
    whySeo: 'Core Web Vitals are direct ranking factors.'
  },
  access: {
    what: 'Accessibility ensures your site is usable by everyone, including people with disabilities.',
    how: 'Add meaningful alt text to all images. Use proper heading order and landmarks. Label form fields and declare the page language.',
    whyUx: 'Makes content available to screen readers and keyboard users.',
    whySeo: 'Google treats accessibility as a quality signal.'
  },
  content: {
    what: 'Content Quality assesses depth, readability, structure, and scannability.',
    how: 'Write comprehensive content with short sentences and paragraphs. Use frequent H2/H3 headings and bullet lists. Include tables where helpful.',
    whyUx: 'Helps users quickly find and understand information.',
    whySeo: 'In-depth, structured content ranks higher.'
  },
  ux: {
    what: 'UX Design reviews clarity of actions and navigation flow.',
    how: 'Highlight 1–3 primary CTAs with contrasting buttons. Reduce excessive links. Add breadcrumbs on deep pages.',
    whyUx: 'Reduces confusion and helps users complete goals faster.',
    whySeo: 'Better engagement signals improve rankings.'
  },
  security: {
    what: 'Security confirms HTTPS and no mixed content.',
    how: 'Install a valid SSL certificate. Update all resources to HTTPS. Regularly scan for insecure links.',
    whyUx: 'Prevents browser warnings that scare users away.',
    whySeo: 'Google marks HTTP sites as Not Secure and downgrades them.'
  },
  indexability: {
    what: 'Indexability ensures the page can appear in search results.',
    how: 'Remove noindex tags unless intentional. Add a canonical link to the preferred URL.',
    whyUx: 'No direct user impact.',
    whySeo: 'Without indexability the page is invisible in search.'
  }
};

// Map short module IDs to deep-dive card IDs used in metric-explanations.js
const deepDiveIdMap = {
  seo: 'on-page-seo',
  mobile: 'mobile-pwa',
  perf: 'performance',
  access: 'accessibility',
  content: 'content-quality',
  ux: 'ux-design',
  security: 'security',
  indexability: 'indexability'
};


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.number').forEach(n => n.style.opacity = '0');
  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const overallContainer = document.getElementById('overall-container');
  const progressContainer = document.getElementById('progress-container');
  const progressText = document.getElementById('progress-text');
  const priorityFixes = document.getElementById('priority-fixes');
  const copyBadgeBtn = document.getElementById('copy-badge');

  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

function updateScore(id, score) {
  const circle = document.querySelector('#' + id + ' .score-circle');
  const card = circle?.closest('.score-card');
  if (!circle) return;

  score = Math.round(score);
  const radius = id === 'overall-score' ? 108 : 54;  // updated for larger overall
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  const progress = circle.querySelector('.progress');
  progress.style.strokeDasharray = `${dash} ${circumference}`;

  const num = circle.querySelector('.number');
  num.textContent = score;
  num.style.opacity = '1';

  // Remove old classes
  progress.classList.remove('stroke-red-400', 'stroke-orange-400', 'stroke-green-400');
  num.classList.remove('text-red-400', 'text-orange-400', 'text-green-400');
  if (card) card.classList.remove('red', 'orange', 'green');

  // Apply new 3-tier grading
  let colorClass;
  if (score < 60) {
    colorClass = 'red';
    progress.classList.add('stroke-red-400');
    num.classList.add('text-red-400');
  } else if (score < 80) {
    colorClass = 'orange';
    progress.classList.add('stroke-orange-400');
    num.classList.add('text-orange-400');
  } else {
    colorClass = 'green';
    progress.classList.add('stroke-green-400');
    num.classList.add('text-green-400');
  }

  if (card) card.classList.add(colorClass);
}

  function populateIssues(id, issues) {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
    issues.forEach(i => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="p-5 bg-white/10 backdrop-blur rounded-2xl mb-4 border border-white/20">
          <strong class="text-xl text-gray-800 dark:text-gray-200 block mb-3">${i.issue}</strong>
          <p class="text-gray-800 dark:text-gray-200 leading-relaxed">
            <span class="font-bold text-green-400">How to fix:</span><br>
            ${i.fix}
          </p>
        </div>
      `;
      ul.appendChild(li);
    });
  }

  if (copyBadgeBtn) {
    copyBadgeBtn.addEventListener('click', () => {
      const badgeHtml = `
<!-- Traffic Torch Optimized Badge -->
<a href="https://traffictorch.net/" target="_blank" style="display: inline-block; position: relative; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; font-size: 13px; color: #969696; text-decoration: none;">
  Traffic Torch Optimized 🛡️
  <span style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px; padding: 8px 16px; background: #1f2937; color: white; font-size: 14px; border-radius: 8px; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; white-space: nowrap; z-index: 10;">
    UX, SEO & AI Optimization
  </span>
</a>
<style>
  a:hover { color: #fb923c !important; }
  a:hover > span { opacity: 1 !important; }
</style>
      `.trim();
      navigator.clipboard.writeText(badgeHtml).then(() => {
        alert('Badge code copied! Paste anywhere on your site — fully inline, works everywhere.');
      }).catch(() => {
        prompt('Copy this badge code:', badgeHtml);
      });
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

progressContainer.classList.remove('hidden');
progressText.textContent = 'Fetching page...';

const originalInput = input.value.trim();  // Add this line
const url = cleanUrl(originalInput);       // Add this line - defines 'url' properly

if (!url) {
  alert('Please enter a valid URL');
  progressContainer.classList.add('hidden');
  return;
}

const proxyUrl = 'https://rendered-proxy.traffictorch.workers.dev/?url=' + encodeURIComponent(url);
try {
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Network response was not ok');
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const resultsWrapper = document.getElementById('results-wrapper');
  const modules = [
    { id: 'seo', name: 'On-Page SEO', fn: analyzeSEO },
    { id: 'mobile', name: 'Mobile & PWA', fn: analyzeMobile },
    { id: 'perf', name: 'Performance', fn: analyzePerf },
    { id: 'access', name: 'Accessibility', fn: analyzeAccess },
    { id: 'content', name: 'Content Quality', fn: analyzeContentQuality },
    { id: 'ux', name: 'UX Design', fn: analyzeUXDesign },
    { id: 'security', name: 'Security', fn: analyzeSecurity },
    { id: 'indexability', name: 'Indexability', fn: analyzeIndexability }
  ];
  const scores = [];
  const allIssues = [];
  for (const mod of modules) {
    progressText.textContent = `Analyzing ${mod.name}...`;
    const analysisUrl = mod.id === 'security' ? originalInput : url;
    const result = mod.fn(html, doc, analysisUrl);
    // Populate More Details content
    const info = moduleInfo[mod.id];
    if (info) {
      const infoDiv = document.querySelector(`#${mod.id}-score .module-info`);
      if (infoDiv) {
        const howTested = document.createElement('p');
        howTested.className = 'mb-8 text-center';
        howTested.innerHTML =
          '<a href="#' + deepDiveIdMap[mod.id] + '" ' +
          'class="inline-block text-blue-600 dark:text-blue-400 font-bold text-xl hover:underline">' +
          'How ' + mod.name + ' is tested?' +
          '</a>';
        infoDiv.prepend(howTested);
        infoDiv.querySelector('.what').innerHTML = `<strong class="text-cyan-400">What is it?</strong><br>${info.what}`;
        infoDiv.querySelector('.how').innerHTML = `<strong class="text-blue-400">How to improve overall:</strong><br>${info.how}`;
        infoDiv.querySelector('.why').innerHTML = `<strong class="text-purple-400">Why it matters:</strong><br>
          <strong>UX:</strong> ${info.whyUx}<br>
          <strong>SEO:</strong> ${info.whySeo}`;
      }
    }
    scores.push(result.score);
    updateScore(`${mod.id}-score`, result.score);
    // Add grade + emoji for each module card
    const moduleScore = result.score;
    const gradeElement = document.querySelector(`.module-grade[data-module="${mod.id}"]`);
    if (gradeElement) {
      let gradeText = '';
      let gradeEmoji = '';
      let colorClass = '';
      if (moduleScore < 60) {
        gradeText = 'Needs Work';
        gradeEmoji = '❌';
        colorClass = 'text-red-500';
      } else if (moduleScore < 80) {
        gradeText = 'Needs Improvement';
        gradeEmoji = '⚠️';
        colorClass = 'text-orange-500';
      } else {
        gradeText = 'Excellent';
        gradeEmoji = '🟢';
        colorClass = 'text-green-500';
      }
      gradeElement.querySelector('.grade-text').textContent = gradeText;
      gradeElement.querySelector('.grade-emoji').textContent = gradeEmoji;
      gradeElement.classList.add(colorClass);
      gradeElement.classList.remove('opacity-0');
      gradeElement.classList.add('opacity-100');
    }
    populateIssues(`${mod.id}-issues`, result.issues);
    result.issues.forEach(iss => {
      allIssues.push({ ...iss, module: mod.name, impact: 100 - result.score });
    });
    await new Promise(r => setTimeout(r, 600));
  }
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  updateScore('overall-score', overallScore);

  // Create prioritisedFixes (per-metric, no module explanations)
  allIssues.sort((a, b) => b.impact - a.impact);
  const top3 = allIssues.slice(0, 3);
  const prioritisedFixes = top3.map(issue => ({
    title: issue.issue,
    how: issue.fix,
    what: `Failing metric: ${issue.issue.toLowerCase().split('(')[0].trim()}`,
    why: 'Improving this metric strengthens on-page signals, crawlability, or user experience.',
    emoji: '⚠️',
    impact: issue.impact || (100 - overallScore)
  }));

  const yourScore = Math.round(overallScore * 0.92);
// Delay render until DOM + HTML container is guaranteed ready
setTimeout(() => {
  if (document.getElementById('priority-cards-container')) {
    renderPriorityAndGains(prioritisedFixes, yourScore, overallScore);
  } else {
    console.warn('Priority container not found - HTML may not be loaded yet');
  }
}, 500); // 500ms delay - safe for GitHub Pages load
      updateScore('overall-score', overallScore);
      
     console.log('Render attempt for priority/gains - prioritisedFixes length:', prioritisedFixes.length);
console.log('Your score:', yourScore, 'Overall score:', overallScore); 
  
      // Display truncated page title
const titleElement = doc.querySelector('title');
let pageTitle = titleElement ? titleElement.textContent.trim() : 'Example Domain';
if (pageTitle.length > 65) {
  pageTitle = pageTitle.substring(0, 62) + '...';
}
document.getElementById('page-title-display').textContent = pageTitle;

// Calculate and display grade + emoji
let gradeText = '';
let gradeEmoji = '';
if (overallScore < 60) {
  gradeText = 'Needs Work';
  gradeEmoji = '❌';
  document.getElementById('overall-grade').className = 'text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3 text-red-500';
} else if (overallScore < 80) {
  gradeText = 'Needs Improvement';
  gradeEmoji = '⚠️';
  document.getElementById('overall-grade').className = 'text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3 text-orange-500';
} else {
  gradeText = 'Excellent';
  gradeEmoji = '🟢';
  document.getElementById('overall-grade').className = 'text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3 text-green-500';
}
document.querySelector('#overall-grade .grade-text').textContent = gradeText;
document.querySelector('#overall-grade .grade-emoji').textContent = gradeEmoji;

      modules.forEach(mod => {
        const card = document.getElementById(`${mod.id}-score`);
        if (!card) return;
        const expandBtn = card.querySelector('.expand');
        if (!expandBtn) return;
        const analysisUrl = mod.id === 'security' ? originalInput : url;
        const { issues: modIssues } = mod.fn(html, doc, analysisUrl);

        let checks = [];
        if (mod.id === 'seo') {
          checks = [
            { text: 'Title optimized (30–65 chars, keyword early)', passed: !modIssues.some(i => i.issue.toLowerCase().includes('title')) },
            { text: 'Meta description present & optimal', passed: !modIssues.some(i => i.issue.toLowerCase().includes('meta description')) },
            { text: 'Main heading includes keyword', passed: !modIssues.some(i => i.issue.toLowerCase().includes('main heading') || i.issue.toLowerCase().includes('keyword')) },
            { text: 'Structured data (schema) detected', passed: !modIssues.some(i => i.issue.toLowerCase().includes('schema') || i.issue.toLowerCase().includes('structured data')) },
            { text: 'All images have meaningful alt text', passed: !modIssues.some(i => i.issue.toLowerCase().includes('alt text')) }
          ];
        } else if (mod.id === 'mobile') {
          checks = [
            { text: 'Viewport meta tag correct', passed: !modIssues.some(i => i.issue.includes('Viewport')) },
            { text: 'Web app manifest linked', passed: !modIssues.some(i => i.issue.includes('manifest')) },
            { text: 'Homescreen icons (192px+) provided', passed: !modIssues.some(i => i.issue.includes('homescreen') || i.issue.includes('icon')) },
            { text: 'Service worker', passed: !modIssues.some(i => i.issue.includes('service worker')) }
          ];
        } else if (mod.id === 'perf') {
          checks = [
            { text: 'Page weight reasonable (<300KB HTML)', passed: !modIssues.some(i => i.issue.includes('Page weight')) },
            { text: 'Number of HTTP requests', passed: !modIssues.some(i => i.issue.includes('HTTP requests')) },
            { text: 'Render-blocking resources', passed: !modIssues.some(i => i.issue.includes('render-blocking')) },
            { text: 'Web fonts optimized', passed: !modIssues.some(i => i.issue.includes('web font') || i.issue.includes('font')) }
          ];
        } else if (mod.id === 'access') {
          checks = [
            { text: 'All images have alt text', passed: !modIssues.some(i => i.issue.includes('alt text')) },
            { text: 'Lang attribute on <html>', passed: !modIssues.some(i => i.issue.includes('lang attribute')) },
            { text: 'Main landmark present', passed: !modIssues.some(i => i.issue.includes('main landmark')) },
            { text: 'Proper heading hierarchy', passed: !modIssues.some(i => i.issue.includes('Heading order')) },
            { text: 'Form fields properly labeled', passed: !modIssues.some(i => i.issue.includes('form fields') || i.issue.includes('labels')) }
          ];
        } else if (mod.id === 'content') {
          checks = [
            { text: 'Sufficient unique content depth', passed: !modIssues.some(i => i.issue.includes('Thin content')) },
            { text: 'Readability (short sentences)', passed: !modIssues.some(i => i.issue.includes('Readability')) },
            { text: 'Strong heading structure', passed: !modIssues.some(i => i.issue.includes('heading structure')) },
            { text: 'Uses lists for better scannability', passed: !modIssues.some(i => i.issue.includes('lists')) }
          ];
        } else if (mod.id === 'ux') {
          checks = [
            { text: 'Clear primary calls-to-action', passed: !modIssues.some(i => i.issue.includes('calls-to-action')) },
            { text: 'Breadcrumb navigation (on deep pages)', passed: !modIssues.some(i => i.issue.includes('breadcrumb')) }
          ];
        } else if (mod.id === 'security') {
          checks = [
            { text: 'Served over HTTPS', passed: !modIssues.some(i => i.issue.includes('HTTPS')) },
            { text: 'No mixed content', passed: !modIssues.some(i => i.issue.includes('mixed content')) }
          ];
        } else if (mod.id === 'indexability') {
          checks = [
            { text: 'No noindex tag', passed: !modIssues.some(i => i.issue.includes('noindex')) },
            { text: 'Canonical tag present', passed: !modIssues.some(i => i.issue.includes('canonical')) }
          ];
        }

        let checklist = card.querySelector('.checklist');
        if (!checklist) {
          checklist = document.createElement('div');
          checklist.className = 'checklist mt-4 px-2 space-y-1 text-left text-gray-200 text-sm';
          expandBtn.parentNode.insertBefore(checklist, expandBtn);
        }
        checklist.innerHTML = checks.map(c => `
          <p class="${c.passed ? 'text-green-400' : 'text-red-400'} font-medium">
            ${c.passed ? '✅' : '❌'} ${c.text}
          </p>
        `).join('');

        let expand = card.querySelector('.expand-content');
        if (!expand) {
          expand = document.createElement('div');
          expand.className = 'expand-content hidden mt-6 px-2 space-y-8 pb-6';
          card.appendChild(expand);
        }
        expand.innerHTML = '';

        modIssues.forEach(iss => {
          const block = document.createElement('div');
          block.className = 'p-2 bg-white/5 backdrop-blur rounded-xl border border-white/10';
          block.innerHTML = `
            <strong class="text-xl block mb-4 text-orange-500">${iss.issue}</strong>
            <p class="text-gray-800 dark:text-gray-200 leading-relaxed">
              <span class="font-bold text-green-400">How to fix:</span><br>
              ${iss.fix}
            </p>
          `;
          expand.appendChild(block);
        });
        
        // Learn more about [Module]? – BELOW the expanded fixes section
const learnMore = document.createElement('p');
learnMore.className = 'mt-10 text-center';
learnMore.innerHTML = 
  '<a href="#' + deepDiveIdMap[mod.id] + '" ' +
  'class="inline-block text-blue-600 dark:text-blue-400 font-bold text-xl hover:underline">' +
  'Learn more about ' + mod.name + '?' +
  '</a>';
expand.appendChild(learnMore);
        
        // More Details toggle for all modules
document.querySelectorAll('.more-details').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.score-card');
    const infoDiv = card.querySelector('.module-info');
    const isHidden = infoDiv.classList.contains('hidden');

    infoDiv.classList.toggle('hidden');
    btn.textContent = isHidden ? 'Hide Details' : 'More Details';

    // Fade in/out
    if (isHidden) {
      infoDiv.style.opacity = '0';
      infoDiv.classList.remove('hidden');
      requestAnimationFrame(() => {
        infoDiv.style.opacity = '1';
      });
    }
  });
});

        expandBtn.className = 'expand mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition';
        expandBtn.textContent = 'Show Fixes';
        expandBtn.onclick = () => {
          expand.classList.toggle('hidden');
          expandBtn.textContent = expand.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
        };
      });
          
      allIssues.sort((a, b) => b.impact - a.impact);
 
      resultsWrapper.classList.remove('hidden');
      document.getElementById('radar-title').classList.remove('hidden');
      document.getElementById('copy-badge').classList.remove('hidden');
      resultsWrapper.style.opacity = '0';
      resultsWrapper.style.transform = 'translateY(40px)';
      resultsWrapper.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
      requestAnimationFrame(() => {
        resultsWrapper.style.opacity = '1';
        resultsWrapper.style.transform = 'translateY(0)';
      });
      
// === Plugin Solutions - detect only the 16 supported metrics from checklist (❌) ===
const pluginSection = document.getElementById('plugin-solutions-section');
if (!pluginSection) return;

pluginSection.innerHTML = '';
pluginSection.classList.remove('hidden');

const failedMetrics = [];

// List of the exact 16 supported metric names from pluginData
const supportedMetricNames = [
  "Title optimized (30–65 chars, keyword early)",
  "Meta description present & optimal",
  "Structured data (schema) detected",
  "Canonical tag present",
  "All images have meaningful alt text",
  "Web app manifest linked",
  "Homescreen icons (192px+) provided",
  "Service worker",
  "Page weight reasonable (<300KB HTML)",
  "Number of HTTP requests",
  "Render-blocking resources",
  "Web fonts optimized",
  "Form fields properly labeled",
  "Clear primary calls-to-action",
  "Breadcrumb navigation (on deep pages)",
  "Served over HTTPS / No mixed content"
];

modules.forEach(mod => {
  const card = document.getElementById(`${mod.id}-score`);
  if (!card) return;

  const checklistItems = card.querySelectorAll('.checklist p');
  
  checklistItems.forEach(item => {
    const text = item.textContent.trim();
    if (text.startsWith('❌')) {
      // Clean the name to match pluginData keys
      let issueName = text.replace(/^❌\s*/, '').trim();
      
      // Quick normalization for common checklist variations
      if (issueName.includes('Title optimized')) issueName = supportedMetricNames[0];
      if (issueName.includes('Meta description')) issueName = supportedMetricNames[1];
      if (issueName.includes('Structured data')) issueName = supportedMetricNames[2];
      if (issueName.includes('Canonical tag')) issueName = supportedMetricNames[3];
      if (issueName.includes('alt text')) issueName = supportedMetricNames[4];
      if (issueName.includes('manifest')) issueName = supportedMetricNames[5];
      if (issueName.includes('homescreen') || issueName.includes('icon')) issueName = supportedMetricNames[6];
      if (issueName.includes('service worker')) issueName = supportedMetricNames[7];
      if (issueName.includes('Page weight')) issueName = supportedMetricNames[8];
      if (issueName.includes('HTTP requests')) issueName = supportedMetricNames[9];
      if (issueName.includes('Render-blocking')) issueName = supportedMetricNames[10];
      if (issueName.includes('Web fonts')) issueName = supportedMetricNames[11];
      if (issueName.includes('Form fields')) issueName = supportedMetricNames[12];
      if (issueName.includes('calls-to-action')) issueName = supportedMetricNames[13];
      if (issueName.includes('Breadcrumb')) issueName = supportedMetricNames[14];
      if (issueName.includes('HTTPS') || issueName.includes('mixed content')) issueName = supportedMetricNames[15];

      // Only add if it's one of the 16 supported ones
      if (supportedMetricNames.includes(issueName)) {
        failedMetrics.push({
          name: issueName,
          grade: { emoji: '🔴', color: 'text-red-400' }
        });
      }
    }
  });
});

// More Details toggle for all modules
document.querySelectorAll('.more-details').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.score-card');
    const infoDiv = card.querySelector('.module-info');
    const isHidden = infoDiv.classList.contains('hidden');

    infoDiv.classList.toggle('hidden');
    btn.textContent = isHidden ? 'Hide Details' : 'More Details';

    // Fade in/out
    if (isHidden) {
      infoDiv.style.opacity = '0';
      infoDiv.classList.remove('hidden');
      requestAnimationFrame(() => {
        infoDiv.style.opacity = '1';
      });
    }
  });
});

if (failedMetrics.length > 0) {
  renderPluginSolutions(failedMetrics);
} else {
  pluginSection.innerHTML = `
    <div class="mt-20 text-center">
      <p class="text-xl text-gray-400">No issues found among the 16 supported areas that need plugin fixes.</p>
    </div>
  `;
}
       
      // Improved scroll with offset so radar title isn't hidden under header
const offset = 110; // ← perfect sweet spot from your screenshots (try 90–130)

const elementPosition = resultsWrapper.getBoundingClientRect().top + window.pageYOffset;
const offsetPosition = elementPosition - offset;

window.scrollTo({
  top: offsetPosition,
  behavior: 'smooth'
});

      try {
        if (window.innerWidth >= 768) {
          const radarCtx = document.getElementById('health-radar').getContext('2d');
          const isDark = document.documentElement.classList.contains('dark');
          const gridColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(0, 0, 0, 0.2)';
          const labelColor = '#9ca3af';
          const lineColor = '#9ca3af';
          const fillColor = isDark ? 'rgba(156, 163, 175, 0.25)' : 'rgba(156, 163, 175, 0.1)';
          const radarLabels = modules.map(m => m.name);
          const chart = new Chart(radarCtx, {
            type: 'radar',
            data: {
              labels: radarLabels,
              datasets: [{
                label: 'Health Score',
                data: scores,
                backgroundColor: fillColor,
                borderColor: lineColor,
                borderWidth: 4,
                pointRadius: 9,
                pointHoverRadius: 14,
                pointBackgroundColor: (ctx) => {
                  const v = ctx.parsed?.r ?? 0;
                  if (v < 60) return '#f87171';
                  if (v < 80) return '#fb923c';
                  return '#34d399';
                },
                pointHoverBackgroundColor: (ctx) => {
                  const v = ctx.parsed?.r ?? 0;
                  if (v < 60) return '#ef4444';
                  if (v < 80) return '#f97316';
                  return '#10b981';
                }
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                intersect: true,
                mode: 'point'
              },
              scales: {
                r: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                    color: labelColor,
                    backdropColor: 'transparent',
                    callback: (value) => value
                  },
                  grid: { color: 'rgb(156, 163, 175)' },
                  angleLines: { color: 'rgb(156, 163, 175)' },
                  pointLabels: {
                    color: labelColor,
                    font: { size: 14, weight: 'bold' }
                  }
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (ctx) => ctx[0].label,
                    label: (ctx) => {
                      const value = Math.round(ctx.parsed.r);
                      let grade = '';
                      if (value < 20) grade = 'Very Poor';
                      else if (value < 40) grade = 'Poor';
                      else if (value < 60) grade = 'Fair (major issues)';
                      else if (value < 80) grade = 'Good (room for improvement)';
                      else grade = 'Excellent';
                      const lines = [
                        `Score: ${value}/100`,
                        `Grade: ${grade}`,
                        ''
                      ];
                      if (value < 100) {
                        lines.push('How to Improve:');
                        lines.push('Click "Show Fixes" in the module below for detailed recommendations');
                      } else {
                        lines.push('Strong performance – keep it up!');
                      }
                      return lines;
                    }
                  }
                }
              }
            }
          });
        }
      } catch (chartErr) {
        console.warn('Radar chart failed (non-critical)', chartErr);
      }

try {
  const previewIframe = document.getElementById('preview-iframe');
  const phoneFrame = document.getElementById('phone-frame');
  const viewToggle = document.getElementById('view-toggle');
  const deviceToggle = document.getElementById('device-toggle');
  const highlightOverlays = document.getElementById('highlight-overlays');

  previewIframe.src = url;

  let isMobile = true;
  let isIphone = true;

  viewToggle.addEventListener('click', () => {
    isMobile = !isMobile;
    phoneFrame.style.width = isMobile ? '375px' : 'min(100%, 1280px)';
    phoneFrame.style.height = isMobile ? '812px' : 'min(90vh, 900px)';
    phoneFrame.style.margin = isMobile ? '0 auto' : '0';
    phoneFrame.style.transform = isMobile ? 'scale(1)' : 'scale(1)';
    viewToggle.textContent = isMobile ? 'Switch to Desktop' : 'Switch to Mobile';
  });

  deviceToggle.addEventListener('click', () => {
    isIphone = !isIphone;
    phoneFrame.classList.toggle('iphone-frame', isIphone);
    phoneFrame.classList.toggle('android-frame', !isIphone);
    deviceToggle.textContent = isIphone ? 'Android Frame' : 'iPhone Frame';
  });
} catch (previewErr) {
  console.warn('Mobile preview failed (non-critical)', previewErr);
}
    } catch (err) {
      alert('Failed to analyze — try another site or check the URL');
      console.error(err);
    } finally {
      progressContainer.classList.add('hidden');

  
      // Clean URL for PDF cover: domain on first line, path on second
      let fullUrl = document.getElementById('url-input').value.trim();
      let displayUrl = 'traffictorch.net'; // fallback

      if (fullUrl) {
        // Remove protocol and www
        let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');

        // Split into domain and path
        const firstSlash = cleaned.indexOf('/');
        if (firstSlash !== -1) {
          const domain = cleaned.slice(0, firstSlash);
          const path = cleaned.slice(firstSlash);
          displayUrl = domain + '\n' + path;
        } else {
          displayUrl = cleaned;
        }
      }

      document.body.setAttribute('data-url', displayUrl);   
      
    }
  });

  // ================== ANALYSIS FUNCTIONS ==================

   function analyzeSEO(html, doc) {
    let score = 100;
    const issues = [];
    const title = doc.querySelector('title')?.textContent.trim() || '';
    const desc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
    const mainHeadingElement = doc.querySelector('h1') || doc.querySelector('h2') || doc.querySelector('h3');
    const mainHeadingText = mainHeadingElement?.textContent.trim() || '';

    let primaryKeywordRaw = '';
    if (title) {
      const sections = title.split(/[\|\–\-\—]/);
      primaryKeywordRaw = sections[0].trim();
    }

    // Much fuzzier keyword extraction and matching
    const cleanedKeyword = primaryKeywordRaw
      .toLowerCase()
      .replace(/\b(the|a|an|and|or|best|top|official|tool|analyzer|analysis|vs|comparison|torch|traffic)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();

    const keywordParts = cleanedKeyword.split(/\s+/).filter(part => part.length >= 3);

    function fuzzyMatch(headingLower) {
      if (keywordParts.length === 0) return true;

      let matches = 0;
      keywordParts.forEach(part => {
        if (headingLower.includes(part)) {
          matches++;
        } else if (headingLower.includes(part.substring(0, part.length - 1)) ||
                   headingLower.includes(part.substring(1))) {
          matches += 0.7;
        } else if (headingLower.split(' ').some(word =>
                   word.length >= 4 && (word.includes(part) || part.includes(word)))) {
          matches += 0.5;
        }
      });

      const ratio = matches / keywordParts.length;
      return ratio >= 0.4 || matches >= 2;
    }

    if (primaryKeywordRaw && mainHeadingText) {
      const headingLower = mainHeadingText.toLowerCase();
      if (!fuzzyMatch(headingLower)) {
        score -= 10;
        issues.push({
          issue: `Main heading could better align with page focus (“${primaryKeywordRaw}”)`,
          fix: 'Include key terms from your title naturally in the H1/H2. This helps search engines and users immediately understand the page topic. Exact match isn’t needed — close variants work well.'
        });
      }
    }

    const imgs = doc.querySelectorAll('img');
    const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
    const robots = doc.querySelector('meta[name="robots"]');

    if (!title) {
      score -= 25;
      issues.push({
        issue: 'Missing <title> tag',
        fix: 'Page titles are crucial for telling search engines and users what the page is about. Include your primary keyword naturally near the beginning and keep the title between 50-60 characters to avoid truncation in search results. This improves click-through rates and helps with ranking for relevant queries.'
      });
    } else {
      if (title.length < 30) {
        score -= 18;
        issues.push({
          issue: `Title too short (${title.length} characters)`,
          fix: 'Short titles may not provide enough context for search engines or users. Aim for 50-60 characters by including the primary keyword and a compelling description. Well-crafted titles can significantly boost click-through rates from search results.'
        });
      }
      if (title.length > 65) {
        score -= 18;
        issues.push({
          issue: `Title too long (${title.length} characters)`,
          fix: 'Long titles get truncated in search results, reducing their effectiveness. Keep titles under 60 characters while including the main keyword early on. This ensures the full title displays properly and encourages more clicks.'
        });
      }
    }

    if (!desc) {
      score -= 20;
      issues.push({
        issue: 'Missing meta description',
        fix: 'Meta descriptions summarize page content and appear in search results to entice clicks. Write a unique 150-160 character description including the target keyword naturally. Compelling meta descriptions can improve click-through rates even if they don\'t directly affect rankings.'
      });
    } else {
      if (desc.length < 100) {
        score -= 12;
        issues.push({
          issue: `Meta description too short (${desc.length} characters)`,
          fix: 'Short meta descriptions may not fully convey the page\'s value to searchers. Expand to 150-160 characters with a natural inclusion of the primary keyword and a call to action. This helps increase clicks from search engine results pages.'
        });
      }
      if (desc.length > 160) {
        score -= 12;
        issues.push({
          issue: `Meta description too long (${desc.length} characters)`,
          fix: 'Overly long meta descriptions get cut off in search results. Trim to 150-160 characters while keeping the most important information and keywords at the start. This ensures the full description is visible and effective at driving traffic.'
        });
      }
    }

    if (!mainHeadingElement) {
      score -= 8;
      issues.push({
        issue: 'No main heading',
        fix: 'The H1 heading is the main title of your page and helps search engines understand the primary topic. Use one clear H1 that includes the target keyword naturally. This improves on-page SEO and user experience by setting clear expectations.'
      });
    }

    if (doc.querySelector('meta[name="keywords"]')) {
      score -= 8;
      issues.push({
        issue: 'Meta keywords tag found',
        fix: 'The meta keywords tag has been ignored by major search engines for years and serves no purpose. Remove it entirely to keep your code clean and modern. Focusing on quality content and other on-page elements is far more effective today.'
      });
    }

    if (!doc.querySelector('meta[property="og:title"], meta[name="twitter:card"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing Open Graph / Twitter cards',
        fix: 'Social sharing relies on metadata to create attractive previews with titles, descriptions, and images. Add Open Graph tags for Facebook and Twitter Card tags for X/Twitter to control how links appear. This encourages more shares and drives additional traffic.'
      });
    }

    if (robots && /noindex/i.test(robots.content)) {
      score -= 30;
      issues.push({
        issue: 'Page blocked from Google (noindex)',
        fix: 'The noindex directive prevents the page from appearing in search results, which is only useful for staging or private pages. Remove it or set to index,follow for public pages you want visible. Always double-check before deploying changes.'
      });
    }

    if (!doc.querySelector('script[type="application/ld+json"], [itemscope]')) {
      score -= 10;
      issues.push({
        issue: 'No structured data (schema)',
        fix: 'Without schema markup, search engines miss opportunities to show rich results like stars or FAQs. Add JSON-LD schema for relevant types (e.g., Article, Product) in the page head. This enhances visibility in search results and can increase click-through rates.'
      });
    }

    if (noAlt.length) {
      score -= Math.min(20, noAlt.length * 5);
      issues.push({
        issue: `${noAlt.length} images missing alt text`,
        fix: 'Alt text describes images for users who can’t see them and helps with image search rankings. Provide concise, relevant descriptions for every image, or use empty alt for purely decorative ones. This also improves accessibility and ensures screen readers convey meaningful information.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }
  
  function analyzeMobile(html, doc) {
    let score = 100;
    const issues = [];
    const viewport = doc.querySelector('meta[name="viewport"]')?.content || '';
    const has192 = doc.querySelector('link[sizes*="192"], link[rel="apple-touch-icon"]');
    // Reliable HTML-based detection: look for service worker registration code in scripts
    const scripts = doc.querySelectorAll('script');
    const hasServiceWorker = Array.from(scripts).some(script => {
      const content = script.textContent || script.src || '';
      return /serviceWorker/.test(content) && /register/.test(content);
    });

    if (!viewport.includes('width=device-width')) {
      score -= 35;
      issues.push({
        issue: 'Viewport missing or incorrect',
        fix: 'The viewport meta tag controls how the page scales on different device sizes. Ensure it includes width=device-width and initial-scale=1 to enable responsive design. This is essential for mobile users to view content without manual zooming.'
      });
    }
    if (!doc.querySelector('link[rel="manifest"]')) {
      score -= 25;
      issues.push({
        issue: 'Missing web app manifest',
        fix: 'A web app manifest provides metadata for installing the site as a PWA on user devices. Create a manifest.json file with name, icons, and colors, then link it in the head. This enables add-to-home-screen prompts and a native-like experience.'
      });
    }
    if (!has192) {
      score -= 15;
      issues.push({
        issue: 'Missing large homescreen icon',
        fix: 'Homescreen icons appear when users save the site to their device. Provide high-resolution PNG/WebP icons in sizes like 192x192 and 512x512. This ensures crisp, professional branding on user home screens.'
      });
    }
if (!hasServiceWorker) {
  issues.push({
    issue: 'No service worker detected',
    fix: 'Service workers power offline support, background sync, push notifications, and faster repeat visits. Register one (e.g. via <code>navigator.serviceWorker.register(\'/sw.js\')</code>) to cache assets and improve perceived performance. Not needed for every site — tool detection can miss dynamic or minified registrations.'
  });
}
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzePerf(html, doc) {
    let score = 100;
    const issues = [];
    const sizeKB = Math.round(html.length / 1024);
    const requests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src], iframe[src]').length + 1;
    const fonts = doc.querySelectorAll('link[href*="font"], link[href*="googleapis"]').length;
    const blocking = doc.querySelectorAll('link[rel="stylesheet"]:not([media]), script:not([async]):not([defer])').length;

    if (sizeKB > 150) {
      score -= sizeKB > 300 ? 30 : 15;
      issues.push({
        issue: `Page weight: ${sizeKB} KB ${sizeKB > 300 ? '(Very heavy)' : '(Heavy)'}`,
        fix: 'Large page sizes slow down loading, especially on mobile networks. Compress images to modern formats like WebP or AVIF, implement lazy loading for offscreen content, and minify HTML, CSS, and JavaScript. Keeping the initial payload small creates a faster, more enjoyable experience for all users.'
      });
    }

    if (requests > 30) {
      score -= requests > 50 ? 25 : 15;
      issues.push({
        issue: `${requests} HTTP requests`,
        fix: 'Multiple HTTP requests add latency, particularly on high-latency connections. Combine CSS and JS files, use image sprites or modern formats, and lazy-load non-critical resources. Fewer requests mean faster page rendering overall.'
      });
    }

if (fonts > 4) {
  issues.push({
    issue: `${fonts} external web font requests detected`,
    fix: 'Multiple external font requests can delay text visibility (FOUT/FOIT). Best practices: Limit to 1–2 font families, use system fonts, use <code>font-display: swap</code> on all @font-face rules, and preload critical font files. This greatly improves perceived performance. Note: Tool only detects external links — misses @font-face in CSS files and self-hosted fonts.'
  });
}

    if (blocking > 4) {
      score -= 15;
      issues.push({
        issue: `${blocking} render-blocking resources`,
        fix: 'External scripts and styles can delay page rendering if they load synchronously. Add the async attribute to scripts that don’t need to execute immediately, or defer for those that should wait until the HTML is parsed, and inline critical CSS needed for above-the-fold content. This allows the page to display content faster, improving perceived load speed and Core Web Vitals.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeAccess(html, doc) {
    let score = 100;
    const issues = [];
    const missingAlts = Array.from(doc.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '');
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
    let prev = 0, skipped = false;
    headings.forEach(h => {
      const lvl = +h.tagName[1];
      if (lvl > prev + 1) skipped = true;
      prev = lvl;
    });
    const unlabeled = Array.from(doc.querySelectorAll('input, textarea, select'))
      .filter(el => el.id && !doc.querySelector(`label[for="${el.id}"]`));

    if (missingAlts.length) {
      score -= Math.min(35, missingAlts.length * 8);
      issues.push({
        issue: `${missingAlts.length} images missing alt text`,
        fix: 'Alt text is essential for describing images to users with visual impairments and for search engines. Write concise, accurate descriptions that convey the image purpose or content, or use empty alt for purely decorative images. This boosts accessibility and enables image search optimization.'
      });
    }

    if (!doc.documentElement.lang) {
      score -= 12;
      issues.push({
        issue: 'Missing lang attribute on <html>',
        fix: 'The lang attribute specifies the page language for browsers and assistive tools. Add it to the html tag with the appropriate code like en for English. This ensures correct pronunciation and regional targeting.'
      });
    }

    if (!doc.querySelector('main, [role="main"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing main landmark',
        fix: 'Landmarks help users navigate page structure, especially with screen readers. Wrap the primary content in a main tag or add role=main to an existing container. This allows quick jumping to the core content area.'
      });
    }

    if (skipped && headings.length > 2) {
      score -= 12;
      issues.push({
        issue: 'Heading order skipped (e.g. H1 → H3)',
        fix: 'Proper heading hierarchy creates a logical structure for both users and search engines. Use headings sequentially without skipping levels to maintain clear organization. This improves navigation for screen readers and helps search engines understand content relationships.'
      });
    }

    if (unlabeled.length) {
      score -= 15;
      issues.push({
        issue: `${unlabeled.length} form fields without labels`,
        fix: 'Form labels provide context for all users, especially those using screen readers. Connect labels to inputs using the for and id attributes or wrap inputs in label tags. This makes forms accessible and easier to use on all devices.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeContentQuality(html, doc) {
    let score = 100;
    const issues = [];
    const bodyText = doc.body ? doc.body.textContent.replace(/\s+/g, ' ').trim() : '';
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const lists = doc.querySelectorAll('ul, ol').length;

    if (wordCount < 300) {
      const severity = wordCount < 100 ? 40 : 30;
      score -= severity;
      issues.push({
        issue: `Thin content detected (${wordCount} words)`,
        fix: 'Users and search engines expect comprehensive, valuable content that fully addresses the topic. Expand with detailed explanations, examples, benefits, FAQs, or supporting sections while keeping it relevant and engaging. Aim for depth that satisfies user intent without unnecessary filler.'
      });
    } else if (wordCount > 3000) {
      score -= 10;
      issues.push({
        issue: `Very long content (${wordCount} words)`,
        fix: 'Long content can overwhelm readers if not well-organized. Break it into clear sections with descriptive headings, use bullet points and short paragraphs, and consider adding a table of contents. This improves scannability and keeps users engaged throughout.'
      });
    }

    if (wordCount >= 50) {
      const sentences = Math.max(1, bodyText.split(/[.!?]+/).filter(s => s.trim()).length);
      let syllableCount = 0;
      words.forEach(word => {
        let clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length === 0) return;
        if (clean.length <= 3) {
          syllableCount += 1;
          return;
        }
        let matches = clean.match(/[aeiouy]+/g);
        syllableCount += matches ? matches.length : 1;
        if (clean.endsWith('es') || clean.endsWith('ed')) {
          syllableCount = Math.max(1, syllableCount - 1);
        }
      });
      const avgSentenceLength = wordCount / sentences;
      const avgSyllables = syllableCount / wordCount;
      const fleschScore = Math.round(206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables);
      if (fleschScore < 60) {
        score -= 20;
        issues.push({
          issue: `Readability needs improvement (Flesch score: ${fleschScore})`,
          fix: 'Complex sentences and long words can make content hard to read, especially on mobile. Use shorter sentences, common words, active voice, and break text into small paragraphs. Clear, easy-to-read content keeps visitors longer and improves overall engagement.'
        });
      }
    }

    if (headings.length < 3 && wordCount > 400) {
      score -= 15;
      issues.push({
        issue: 'Insufficient heading structure',
        fix: 'Headings break up content and help users scan for relevant sections quickly. Add descriptive H2 and H3 headings every 300-400 words to create logical sections. This makes content more digestible and can improve featured snippet opportunities.'
      });
    }

    if (lists === 0 && wordCount > 500) {
      score -= 10;
      issues.push({
        issue: 'No bullet or numbered lists used',
        fix: 'Lists make information easier to scan and remember, especially on small screens. Convert features, benefits, steps, or options into bulleted or numbered lists where appropriate. This dramatically improves readability and user comprehension.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }

function analyzeUXDesign(html, doc) {
    let score = 100;
    const issues = [];
    const interactive = doc.querySelectorAll('a, button, input[type="submit"], [role="button"]');
    const hasBreadcrumb = doc.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
    if (interactive.length > 80) {
      score -= 25;
      issues.push({
        issue: 'Too many calls-to-action / links',
        fix: 'Overwhelming users with too many options can lead to decision paralysis and higher bounce rates. Focus on 1-3 primary actions with clear, prominent buttons and move secondary links to menus or footers. This guides users toward your main goals more effectively.'
      });
    }
if (!hasBreadcrumb && doc.body.textContent.length > 2000) {
  score -= 10;
  issues.push({
    issue: 'Missing breadcrumb navigation',
    fix: 'On longer or deeper pages, breadcrumbs show users their location within the site structure. Add a simple breadcrumb trail linking back to higher-level pages. This reduces disorientation and makes navigation more intuitive. Not required on homepage.'
  });
}
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeSecurity(html, doc, url) {
    let score = 100;
    const issues = [];
    const lowerUrl = url.toLowerCase();
    const mixedContent = doc.querySelector('img[src^="http://"], script[src^="http://"], link[href^="http://"]');

    if (lowerUrl.startsWith('http://')) {
      score -= 50;
      issues.push({
        issue: 'Not served over HTTPS',
        fix: 'Modern browsers flag HTTP sites as not secure, causing users to leave immediately. Switch to HTTPS by obtaining a valid SSL/TLS certificate from providers like Let’s Encrypt. This is now a standard expectation and a ranking factor.'
      });
    }

    if (mixedContent) {
      score -= 20;
      issues.push({
        issue: 'Mixed content (insecure resources on HTTPS page)',
        fix: 'Mixed content can trigger browser warnings and block resources. Update all links, images, scripts, and styles to use HTTPS or relative URLs. This ensures a fully secure connection and maintains user trust.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeIndexability(html, doc) {
    let score = 100;
    const issues = [];
    const robotsMeta = doc.querySelector('meta[name="robots"]');

    if (robotsMeta && /noindex/i.test(robotsMeta.content)) {
      score -= 60;
      issues.push({
        issue: 'noindex meta tag present',
        fix: 'A noindex tag tells search engines not to include the page in results, making it invisible to organic traffic. Remove the noindex directive unless the page is intentionally private or under development. Always verify this setting on production pages.'
      });
    }

    if (!doc.querySelector('link[rel="canonical"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing canonical tag',
        fix: 'Without a canonical tag, search engines may treat similar URLs as duplicates and split ranking power. Add a canonical link pointing to the preferred version of the page. This helps consolidate signals and prevent dilution of authority.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }
});

// Global smooth internal navigation + auto-expand for deep-dive cards
function handleDeepDiveHash() {
  if (!window.location.hash) return;

  const targetId = window.location.hash.substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    // Auto-open the <details> element inside the deep-dive card
    const detailsElement = targetElement.querySelector('details');
    if (detailsElement) {
      detailsElement.open = true;
    }

    // Smooth scroll with better centering
    setTimeout(() => {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 100); // small delay helps after details open
  }
}

// Trigger on page load
document.addEventListener('DOMContentLoaded', () => {
  handleDeepDiveHash();
});

// Trigger on hash change (back/forward button, manual hash)
window.addEventListener('hashchange', handleDeepDiveHash);

// Intercept clicks on ALL internal # links (prevents default jump)
document.addEventListener('click', function(event) {
  const clickedLink = event.target.closest('a[href^="#"]');

  if (clickedLink && clickedLink.getAttribute('href') !== '#') {
    event.preventDefault(); // stop normal jump

    const targetHash = clickedLink.getAttribute('href');
    history.replaceState(null, null, targetHash); // update URL

    // Trigger our custom handler
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}, { passive: false }); // passive:false needed for preventDefault to work in some browsers