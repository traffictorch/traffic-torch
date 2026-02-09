// Pro rate limiting & auth logic for this tool (no common.js)
const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';

// Update badge - handle no data gracefully (text-gray-800 dark:text-gray-200)
function updateRunsBadge(remaining) {
  const desktop = document.getElementById('runs-left');
  const mobile = document.getElementById('runs-left-mobile');
  let text = '';
  if (remaining !== undefined && remaining !== null) {
    text = `Runs left today: ${remaining}`;
  } else {
    text = ''; // empty until first successful check
  }
  if (desktop) {
    desktop.textContent = text;
    desktop.classList.toggle('hidden', text === '');
  }
  if (mobile) {
    mobile.textContent = text;
  }
}

// Show login modal (mobile-friendly, text-gray-800 dark:text-gray-200)
function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full text-gray-800 dark:text-gray-200 p-6">
      <h2 class="text-xl font-bold mb-4 text-center">Login or Register</h2>
      <input id="email" type="email" placeholder="Email" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <input id="password" type="password" placeholder="Password" class="w-full p-3 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <div class="flex gap-4">
        <button onclick="handleAuth('login')" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Login</button>
        <button onclick="handleAuth('register')" class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">Register</button>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full text-sm text-gray-800 dark:text-gray-200">Close</button>
    </div>`;
  document.body.appendChild(modal);
}

// Handle auth (login/register)
async function handleAuth(mode) {
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  if (!email || !password) return alert('Enter email and password');
  try {
    const res = await fetch(`${API_BASE}/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('torch_token', data.token);
      alert(mode === 'login' ? 'Logged in!' : 'Registered!');
      document.querySelector('.fixed')?.remove();
    } else {
      alert(data.error || 'Error');
    }
  } catch (err) {
    alert('Connection error');
  }
}

// Show upgrade modal (mobile-friendly, text-gray-800 dark:text-gray-200)
function showUpgradeModal(message = '', price = '$48/year') {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full text-gray-800 dark:text-gray-200 p-6">
      <h2 class="text-xl font-bold mb-4 text-center">Upgrade to Pro</h2>
      <p class="mb-4 text-center">${message || 'Unlock 25 runs/day + advanced features'}</p>
      <p class="text-lg font-semibold text-center mb-6">${price}</p>
      <button onclick="upgradeToPro()" class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">Upgrade Now</button>
      <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full text-sm text-gray-800 dark:text-gray-200">Close</button>
    </div>`;
  document.body.appendChild(modal);
}

// Trigger Stripe upgrade
async function upgradeToPro() {
  const token = localStorage.getItem('torch_token');
  if (!token) return alert('Login first');
  try {
    const res = await fetch(`${API_BASE}/api/upgrade`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || 'Upgrade failed');
  } catch (err) {
    alert('Error');
  }
}

// Rate limit check wrapper (call this instead of direct analysis run)
async function checkRateLimitAndRun(runFunction) {
  const token = localStorage.getItem('torch_token');
  if (!token) {
    showLoginModal();
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/check-rate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Rate check failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      if (data.error.toLowerCase().includes('login') || data.error.toLowerCase().includes('token')) {
        localStorage.removeItem('torch_token');
        showLoginModal();
      }
      return;
    }
    if (data.upgrade) {
      showUpgradeModal(data.message || 'Upgrade for more runs', data.pro_price || '$48/year');
      return;
    }
    if (data.allowed) {
      await runFunction(); // run your original performSeoUxAnalysis
      updateRunsBadge(data.remaining);
      if (data.message) alert(data.message);
    }
  } catch (err) {
    console.error('Rate limit check failed:', err);
    alert('Could not check run limit — please try again or login.');
  }
}

import { renderPriorityAndGains } from './priority-gains-v1.0.js';
import { renderPluginSolutions } from './plugin-solutions-v1.0.js';
import { analyzeSEO } from './modules/analyze-seo-v1.0.js';
import { analyzeMobile } from './modules/analyze-mobile-v1.0.js';
import { analyzePerf } from './modules/analyze-perf-v1.0.js';
import { analyzeAccess } from './modules/analyze-access-v1.0.js';
import { analyzeContentQuality } from './modules/analyze-content-v1.0.js';
import { analyzeUXDesign } from './modules/analyze-ux-v1.0.js';
import { analyzeSecurity } from './modules/analyze-security-v1.0.js';
import { analyzeIndexability } from './modules/analyze-indexability-v1.0.js';

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
    const radius = id === 'overall-score' ? 108 : 54;
    const circumference = 2 * Math.PI * radius;
    const dash = (score / 100) * circumference;
    const progress = circle.querySelector('.progress');
    progress.style.strokeDasharray = `${dash} ${circumference}`;
    const num = circle.querySelector('.number');
    num.textContent = score;
    num.style.opacity = '1';
    progress.classList.remove('stroke-red-400', 'stroke-orange-400', 'stroke-green-400');
    num.classList.remove('text-red-400', 'text-orange-400', 'text-green-400');
    if (card) card.classList.remove('red', 'orange', 'green');
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
  
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const urlInput = document.getElementById('url-input');
  if (!urlInput.value.trim()) {
    alert('Enter a URL first');
    return;
  }

  await checkRateLimitAndRun(async () => {
    // All your original analysis code here (the try-catch-finally block)
    const form = document.getElementById('url-form');
    const input = document.getElementById('url-input');
    const results = document.getElementById('results');
    const overallContainer = document.getElementById('overall-container');
    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');
    const priorityFixes = document.getElementById('priority-fixes');
    progressContainer.classList.remove('hidden');
    progressText.textContent = 'Fetching page...';
    const originalInput = input.value.trim();
    const url = cleanUrl(originalInput);
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
      progressText.textContent = 'Generating report...';
      await new Promise(r => setTimeout(r, 1400));
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      updateScore('overall-score', overallScore);
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
      setTimeout(() => {
        if (document.getElementById('priority-cards-container')) {
          renderPriorityAndGains(prioritisedFixes, yourScore, overallScore);
        } else {
          console.warn('Priority container not found - HTML may not be loaded yet');
        }
      }, 500);
      const titleElement = doc.querySelector('title');
      let pageTitle = titleElement ? titleElement.textContent.trim() : 'Example Domain';
      if (pageTitle.length > 65) {
        pageTitle = pageTitle.substring(0, 62) + '...';
      }
      document.getElementById('page-title-display').textContent = pageTitle;
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
        const learnMore = document.createElement('p');
        learnMore.className = 'mt-10 text-center';
        learnMore.innerHTML =
          '<a href="#' + deepDiveIdMap[mod.id] + '" ' +
          'class="inline-block text-blue-600 dark:text-blue-400 font-bold text-xl hover:underline">' +
          'Learn more about ' + mod.name + '?' +
          '</a>';
        expand.appendChild(learnMore);
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
      const pluginSection = document.getElementById('plugin-solutions-section');
      if (!pluginSection) return;
      pluginSection.innerHTML = '';
      pluginSection.classList.remove('hidden');
      const failedMetrics = [];
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
            let issueName = text.replace(/^❌\s*/, '').trim();
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
      const offset = 240;
      const targetY = resultsWrapper.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: targetY,
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
      let fullUrl = document.getElementById('url-input').value.trim();
      let displayUrl = 'traffictorch.net'; // fallback
      if (fullUrl) {
        let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
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
});


  // ================== ANALYSIS FUNCTIONS (now import export to individual js files) ==================

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