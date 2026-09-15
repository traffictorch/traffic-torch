// /seo-ux-tool/script-v1.3.js

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
import { detectCMS } from '/cms-detect.js';
import { canRunTool } from '/main-v1.1.js';

// ── Edit 1: import the code-snippet modal helpers ──
import {
  initCodeSnippetModal,
  showCodeForFailure,
  deriveSelectorsForFailure,
  escapeHtml
} from './code-snippet-v1.0.js';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

// Auto-fill HTML from ?input= query parameter
function autoFillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const inputData = params.get('input');
  if (inputData) {
    const textarea = document.getElementById('code-input');
    if (textarea) {
      textarea.value = decodeURIComponent(inputData);
      const analyzeBtn = document.getElementById('analyze-code-btn');
      if (analyzeBtn) {
        setTimeout(() => {
          analyzeBtn.click();
        }, 800);
      }
    }
  }
}

window.addEventListener('load', autoFillFromUrl);

// Map short module IDs to deep-dive card IDs
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

let currentAnalysisMode = null;
let currentAnalysisHtml = '';
let healthRadarChart = null;
let resultsWrapper = null;

document.addEventListener('DOMContentLoaded', () => {
  // ── Edit 2a: init the code-snippet modal once ──
  initCodeSnippetModal();

  document.querySelectorAll('.number').forEach(n => n.style.opacity = '0');

  const form = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const codeInput = document.getElementById('code-input');
  const analyzeCodeBtn = document.getElementById('analyze-code-btn');

  const progressContainer = document.getElementById('progress-container');
  const progressText = document.getElementById('progress-text');
  const copyBadgeBtn = document.getElementById('copy-badge');

  resultsWrapper = document.getElementById('results-wrapper');

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

  // URL Form Submit Handler
  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (codeInput) codeInput.value = '';

    if (progressContainer) {
      progressContainer.classList.remove('hidden');
      progressContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const canProceed = await canRunTool('limit-audit-id');
    if (!canProceed) return;

    progressText.textContent = 'Fetching page...';

    const originalInput = urlInput.value.trim();
    const url = cleanUrl(originalInput);

    if (!url) {
      alert('Please enter a valid URL');
      if (progressContainer) progressContainer.classList.add('hidden');
      return;
    }

    currentAnalysisMode = 'url';

    const proxyUrl = 'https://full-render-v2.traffictorch.workers.dev/?url=' + encodeURIComponent(url);

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Network response was not ok');
      const html = await res.text();
      currentAnalysisHtml = html;

      const doc = new DOMParser().parseFromString(html, 'text/html');
      await runFullAnalysis(html, doc, url, originalInput);
    } catch (err) {
      console.error('Analysis error:', err);
      if (progressContainer) progressContainer.classList.add('hidden');
      if (resultsWrapper) {
        resultsWrapper.classList.remove('hidden');
        resultsWrapper.innerHTML = `
          <div class="text-center py-16 px-6">
            <p class="text-3xl font-bold text-red-600 dark:text-red-400 mb-6">Analysis Failed</p>
            <p class="text-xl text-gray-700 dark:text-gray-300 mb-6">
              ${err.message || 'Could not fetch or parse the page'}
            </p>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Please try a different URL or use Code Analysis.
            </p>
          </div>
        `;
      }
    }
  });

  // Code Analysis Button Handler
  if (analyzeCodeBtn && codeInput) {
    analyzeCodeBtn.addEventListener('click', async () => {
      if (urlInput) urlInput.value = '';

      if (progressContainer) {
        progressContainer.classList.remove('hidden');
        progressContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const canProceed = await canRunTool('limit-audit-id');
      if (!canProceed) return;

      const htmlCode = codeInput.value.trim();
      if (!htmlCode || htmlCode.length < 50) {
        alert('Please paste a valid full HTML code of the page');
        if (progressContainer) progressContainer.classList.add('hidden');
        return;
      }

      progressText.textContent = 'Analyzing pasted HTML code...';

      currentAnalysisMode = 'code';
      currentAnalysisHtml = htmlCode;

      try {
        const doc = new DOMParser().parseFromString(htmlCode, 'text/html');
        const url = 'https://example.com/pasted-code';
        await runFullAnalysis(htmlCode, doc, url, '');
      } catch (err) {
        console.error('Code analysis error:', err);
        if (progressContainer) progressContainer.classList.add('hidden');
        if (resultsWrapper) {
          resultsWrapper.classList.remove('hidden');
          resultsWrapper.innerHTML = `
            <div class="text-center py-16 px-6">
              <p class="text-3xl font-bold text-red-600 dark:text-red-400 mb-6">Analysis Failed</p>
              <p class="text-xl text-gray-700 dark:text-gray-300 mb-6">
                ${err.message || 'Invalid HTML code'}
              </p>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                Please check your HTML and try again.
              </p>
            </div>
          `;
        }
      }
    });
  }

  // Shared analysis function
  async function runFullAnalysis(html, doc, url, originalInput) {
    // ── Edit 2b: cache the audited HTML so the Show-the-code handler can reach it ──
    const resultsEl = document.getElementById('results');
    if (resultsEl) resultsEl.dataset.renderedHtml = html || '';

    const cmsInfo = detectCMS({ doc, url: url || '' });
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
      const analysisUrl = mod.id === 'security' && originalInput ? originalInput : url;
      const result = mod.fn(html, doc, analysisUrl);
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

    // Final report generation
    progressText.textContent = 'Generating report...';
    await new Promise(r => setTimeout(r, 1400));

    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    updateScore('overall-score', overallScore);

    allIssues.sort((a, b) => b.impact - a.impact);
    const top3 = allIssues.slice(0, 3);

    const prioritisedFixes = top3.map(issue => ({
      title: issue.issue,
      module: issue.module || 'SEO & UX',
      how: issue.fix,
      what: `Failing metric: ${issue.issue.toLowerCase().split('(')[0].trim()}`,
      why: 'Improving this metric strengthens on-page signals, crawlability, or user experience.',
      emoji: '⚠️',
      impact: issue.impact || (100 - overallScore)
    }));

    const yourScore = Math.round(overallScore * 0.92);
    setTimeout(() => {
      const priorityContainer = document.getElementById('priority-cards-container');
      if (priorityContainer) {
        renderPriorityAndGains(prioritisedFixes, yourScore, overallScore);
      }
    }, 500);

    // Display truncated analyzed page title
    const titleElement = doc.querySelector('title');
    let pageTitle = titleElement ? titleElement.textContent.trim() : 'Analyzed Page';
    pageTitle = pageTitle.replace(/ \| Traffic Torch SEO UX Audit Tool|Traffic Torch/gi, '').trim();
    if (pageTitle.length > 65) {
      pageTitle = pageTitle.substring(0, 62) + '...';
    }
    const titleDisplay = document.getElementById('page-title-display');
    if (titleDisplay) {
      titleDisplay.textContent = pageTitle;
    }

    // Overall grade
    let gradeText = '';
    let gradeEmoji = '';
    const overallGradeEl = document.getElementById('overall-grade');
    if (overallScore < 60) {
      gradeText = 'Needs Work';
      gradeEmoji = '❌';
      overallGradeEl.className = 'text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3 text-red-500';
    } else if (overallScore < 80) {
      gradeText = 'Needs Improvement';
      gradeEmoji = '⚠️';
      overallGradeEl.className = 'text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3 text-orange-500';
    } else {
      gradeText = 'Excellent';
      gradeEmoji = '🟢';
      overallGradeEl.className = 'text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3 text-green-500';
    }
    if (overallGradeEl) {
      overallGradeEl.querySelector('.grade-text').textContent = gradeText;
      overallGradeEl.querySelector('.grade-emoji').textContent = gradeEmoji;
    }

    // Build detailed module cards with checklist + expand fixes
    modules.forEach(mod => {
      const card = document.getElementById(`${mod.id}-score`);
      if (!card) return;
      const expandBtn = card.querySelector('.expand');
      if (!expandBtn) return;
      const analysisUrl = mod.id === 'security' && originalInput ? originalInput : url;
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
        expand.className = 'expand-content hidden mt-6 px-2 py-4 space-y-6 pb-6 rounded-2xl bg-gray-100/70 dark:bg-gray-900/40 break-words min-w-0';
        card.appendChild(expand);
      }
      expand.innerHTML = '';

      // ── Edit 3: render each failure with an optional "Show the code" button ──
      modIssues.forEach(iss => {
        const block = document.createElement('div');
        block.className = 'p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 break-words min-w-0';

        const rule = deriveSelectorsForFailure(iss.issue);

        block.innerHTML = `
          <strong class="text-xl block mb-4 text-orange-500">${escapeHtml(iss.issue)}</strong>
          <p class="text-gray-800 dark:text-gray-200 leading-relaxed">
            <span class="font-bold text-green-400">How to fix:</span><br>
            ${escapeHtml(iss.fix)}
          </p>
          ${rule ? `
            <button type="button"
                    class="show-code-btn mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    data-failure="${escapeHtml(iss.issue)}">
              🔍 Show the code
            </button>
          ` : ''}
        `;
        expand.appendChild(block);
      });

      // ── Footer links inside each module's "Show Fixes" panel ──
      const footerLinks = document.createElement('div');
      footerLinks.className = 'mt-10 pt-6 border-t border-white/10 dark:border-white/10 space-y-4 text-center';

      const failedText = modIssues.map(i => i.issue).join('; ').replace(/'/g, '&#39;');
      footerLinks.innerHTML = `
        <a href="#ask-ai-section"
           class="ask-ai-module-link inline-block text-purple-600 dark:text-purple-400 font-bold text-lg hover:underline"
           data-module="${mod.name}"
           data-failed="${failedText}">
          🤖 Ask AI about ${mod.name} →
        </a>
        <br>
        <a href="https://traffictorch.net/blog/posts/seo-ux-audit-help-guide/#${deepDiveIdMap[mod.id]}"
           target="_blank"
           rel="noopener noreferrer"
           class="inline-block text-orange-600 dark:text-orange-400 font-bold text-lg hover:underline">
          📖 Read the full ${mod.name} guide →
        </a>
      `;
      expand.appendChild(footerLinks);

      expandBtn.className = 'expand mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition';
      expandBtn.textContent = 'Show Fixes';
      expandBtn.onclick = () => {
        expand.classList.toggle('hidden');
        expandBtn.textContent = expand.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
      };
    });

    if (resultsWrapper) {
      resultsWrapper.classList.remove('hidden');
      const radarTitle = document.getElementById('radar-title');
      if (radarTitle) radarTitle.classList.remove('hidden');
      const copyBadge = document.getElementById('copy-badge');
      if (copyBadge) copyBadge.classList.remove('hidden');

      resultsWrapper.style.opacity = '0';
      resultsWrapper.style.transform = 'translateY(40px)';
      resultsWrapper.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
      requestAnimationFrame(() => {
        resultsWrapper.style.opacity = '1';
        resultsWrapper.style.transform = 'translateY(0)';
      });
    }

    // Plugin solutions section
    const pluginSection = document.getElementById('plugin-solutions-section');
    if (pluginSection) {
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
      if (failedMetrics.length > 0) {
        renderPluginSolutions(failedMetrics);
      } else {
        pluginSection.innerHTML = `
          <div class="mt-20 text-center">
            <p class="text-xl text-gray-400">No issues found among the 16 supported areas that need plugin fixes.</p>
          </div>
        `;
      }
    }

    // Scroll to results
    const offset = 240;
    if (resultsWrapper) {
      const targetY = resultsWrapper.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }

    // ─── Radar Chart ─────────────────────────────────────────────────────
    try {
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, waiting...');
        await new Promise((resolve) => {
          const checkChart = () => {
            if (typeof Chart !== 'undefined') {
              resolve();
            } else {
              setTimeout(checkChart, 200);
            }
          };
          checkChart();
          setTimeout(resolve, 5000);
        });
      }

      if (window.innerWidth >= 768 && document.getElementById('health-radar') && typeof Chart !== 'undefined') {
        const radarCanvas = document.getElementById('health-radar');

        if (healthRadarChart) {
          healthRadarChart.destroy();
          healthRadarChart = null;
        }

        const radarCtx = radarCanvas.getContext('2d');
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(0, 0, 0, 0.2)';
        const labelColor = '#9ca3af';
        const lineColor = '#9ca3af';
        const fillColor = isDark ? 'rgba(156, 163, 175, 0.25)' : 'rgba(156, 163, 175, 0.1)';

        const radarLabels = modules.map(m => m.name);
        const radarScores = modules.map(mod => {
          const scoreEl = document.querySelector(`#${mod.id}-score .number`);
          return scoreEl ? parseInt(scoreEl.textContent.trim(), 10) || 0 : 0;
        });

        healthRadarChart = new Chart(radarCtx, {
          type: 'radar',
          data: {
            labels: radarLabels,
            datasets: [{
              label: 'Health Score',
              data: radarScores,
              backgroundColor: fillColor,
              borderColor: lineColor,
              borderWidth: 4,
              pointRadius: 9,
              pointHoverRadius: 14,
              pointBackgroundColor: (ctx) => {
                const v = ctx.parsed?.r ?? ctx.raw ?? 0;
                if (v < 60) return '#f87171';
                if (v < 80) return '#fb923c';
                return '#34d399';
              },
              pointHoverBackgroundColor: (ctx) => {
                const v = ctx.parsed?.r ?? ctx.raw ?? 0;
                if (v < 60) return '#ef4444';
                if (v < 80) return '#f97316';
                return '#10b981';
              }
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: true, mode: 'point' },
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
                grid: { color: gridColor },
                angleLines: { color: gridColor },
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
                    const value = Math.round(ctx.parsed.r || ctx.raw || 0);
                    let grade = value >= 80 ? 'Excellent' :
                                value >= 60 ? 'Good (room for improvement)' :
                                value >= 40 ? 'Fair (major issues)' : 'Poor';
                    const lines = [`Score: ${value}/100`, `Grade: ${grade}`];
                    if (value < 100) {
                      lines.push('', 'How to Improve:', 'Click "Show Fixes" below for detailed recommendations');
                    } else {
                      lines.push('', 'Strong performance – keep it up!');
                    }
                    return lines;
                  }
                }
              }
            }
          }
        });
        console.log('✅ Radar chart rendered');
      } else {
        console.warn('Radar chart not rendered (window too small or Chart.js not loaded)');
      }
    } catch (chartErr) {
      console.error('Radar chart error:', chartErr);
    }

    // Mobile preview
    try {
      const previewIframe = document.getElementById('preview-iframe');
      const phoneFrame = document.getElementById('phone-frame');
      const viewToggle = document.getElementById('view-toggle');
      const deviceToggle = document.getElementById('device-toggle');
      if (previewIframe && phoneFrame) {
        previewIframe.src = url;
        let isMobile = true;
        let isIphone = true;
        if (viewToggle) {
          viewToggle.addEventListener('click', () => {
            isMobile = !isMobile;
            phoneFrame.style.width = isMobile ? '375px' : 'min(100%, 1280px)';
            phoneFrame.style.height = isMobile ? '812px' : 'min(90vh, 900px)';
            phoneFrame.style.margin = isMobile ? '0 auto' : '0';
            viewToggle.textContent = isMobile ? 'Switch to Desktop' : 'Switch to Mobile';
          });
        }
        if (deviceToggle) {
          deviceToggle.addEventListener('click', () => {
            isIphone = !isIphone;
            phoneFrame.classList.toggle('iphone-frame', isIphone);
            phoneFrame.classList.toggle('android-frame', !isIphone);
            deviceToggle.textContent = isIphone ? 'Android Frame' : 'iPhone Frame';
          });
        }
      }
    } catch (previewErr) {}

    // ─── Set data-url ──────────────────────────────────────────────
    const analyzedUrl = originalInput || url || 'Code Analysis';
    document.body.setAttribute('data-url', analyzedUrl);

    // ─── Prepare and initialise share dashboard ──────────────────
    const moduleScores = modules.map(mod => ({
      name: mod.name,
      score: scores[modules.indexOf(mod)]
    }));

    const passedMetrics = [];
    const failedMetrics = [];
    modules.forEach(mod => {
      const card = document.getElementById(`${mod.id}-score`);
      if (!card) return;
      const checklistItems = card.querySelectorAll('.checklist p');
      checklistItems.forEach(item => {
        const text = item.textContent.trim();
        if (text.startsWith('✅')) {
          passedMetrics.push(text.replace(/^✅\s*/, '').trim());
        } else if (text.startsWith('❌')) {
          failedMetrics.push(text.replace(/^❌\s*/, '').trim());
        }
      });
      const modScore = scores[modules.indexOf(mod)];
      if (modScore >= 60) {
        passedMetrics.push(mod.name);
      } else {
        failedMetrics.push(mod.name);
      }
    });

    const shareData = {
      toolName: 'SEO & UX Tool',
      url: analyzedUrl,
      pageTitle: pageTitle || 'Analyzed Page',
      overallScore: overallScore,
      moduleScores: moduleScores,
      passedMetrics: passedMetrics,
      failedMetrics: failedMetrics,
      aiFixes: prioritisedFixes.map(f => f.title + ': ' + f.how),
      rawData: { modules, scores, overallScore, prioritisedFixes },
      shareLink: `${window.location.origin}/seo-ux-tool/?url=${encodeURIComponent(analyzedUrl)}`
    };

    // ─── Ensure share container exists ──────────────────────────
    let shareContainer = document.getElementById('share-dashboard-container');
    if (!shareContainer) {
      shareContainer = document.createElement('div');
      shareContainer.id = 'share-dashboard-container';
      shareContainer.className = 'mt-16';
      if (resultsWrapper) {
        resultsWrapper.appendChild(shareContainer);
      } else {
        document.body.appendChild(shareContainer);
      }
    }

    // ─── Dynamic import fallback for share module ──────────────
    let shareFn = null;
    try {
      if (typeof initShareModule !== 'undefined') {
        shareFn = initShareModule;
        console.log('✅ Using static initShareModule');
      } else {
        const module = await import('/share-module.js');
        shareFn = module.initShareModule;
        console.log('✅ Dynamically loaded share-module.js');
      }
    } catch (e) {
      console.error('❌ Failed to load share module:', e);
    }

    if (typeof shareFn === 'function') {
      try {
        shareFn(shareContainer, shareData);
        console.log('✅ Share dashboard rendered');
      } catch (err) {
        console.error('❌ Render failed:', err);
        shareContainer.innerHTML = `
          <div class="text-center text-red-500 p-4 border border-red-300 rounded-xl">
            <p>Share dashboard could not be rendered.</p>
            <p class="text-sm">Error: ${err.message}</p>
          </div>
        `;
      }
    } else {
      console.error('❌ initShareModule not available – dashboard not rendered.');
      shareContainer.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 p-4 border border-gray-300 dark:border-gray-600 rounded-xl">
          <p>Share dashboard could not be loaded.</p>
          <p class="text-sm">Please check the console for errors.</p>
        </div>
      `;
    }

    // ─── Hide spinner after all results are loaded ──────────────
    if (progressContainer) {
      progressContainer.classList.add('hidden');
    }

    // ─── CMS Fixes Section (built dynamically) ──────────────────
    const askAiSection = document.getElementById('ask-ai-section');
    let cmsSection = document.getElementById('cms-fixes-section');

    if (!cmsSection && askAiSection && askAiSection.parentNode) {
      cmsSection = document.createElement('div');
      cmsSection.id = 'cms-fixes-section';
      cmsSection.className = 'mt-20 max-w-4xl mx-auto px-4';
      cmsSection.innerHTML = `
        <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
        <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
          Get step-by-step SEO &amp; UX fix instructions tailored to your CMS.
        </p>

        <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <span class="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
          <span id="cms-detected-badge" class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-gray-700">
            <span id="cms-badge-dot" class="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 mr-2"></span>
            <span id="cms-badge-name">Custom / Unknown</span>
          </span>
          <button id="cms-override-toggle" class="text-sm text-purple-600 dark:text-purple-400 underline hover:no-underline bg-transparent border-none cursor-pointer">
            Change
          </button>
        </div>

        <div id="cms-override-panel" class="hidden max-w-md mx-auto mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CMS</label>
          <select id="cms-override-select" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="Custom / Unknown">Custom / Unknown</option>
            <option value="WordPress">WordPress</option>
            <option value="Shopify">Shopify</option>
            <option value="Wix">Wix</option>
            <option value="Squarespace">Squarespace</option>
            <option value="Webflow">Webflow</option>
            <option value="Drupal">Drupal</option>
            <option value="Joomla">Joomla</option>
            <option value="Ghost">Ghost</option>
            <option value="HubSpot CMS">HubSpot CMS</option>
            <option value="Magento">Magento</option>
            <option value="BigCommerce">BigCommerce</option>
            <option value="PrestaShop">PrestaShop</option>
          </select>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version (optional)</label>
          <input id="cms-override-version" type="text" placeholder="e.g. 6.4.2" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>

        <div class="text-center">
          <button id="cms-fixes-btn" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">
            Generate CMS Fixes
          </button>
          <p id="cms-fixes-no-fixes" class="hidden mt-4 text-lg text-green-600 dark:text-green-400 font-medium">
            No fixes needed — your page is well-optimized. 🎉
          </p>
        </div>

        <div id="cms-fixes-answer-container" class="mt-6 hidden">
          <div id="cms-fixes-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
        </div>
      `;
      askAiSection.parentNode.insertBefore(cmsSection, askAiSection);
    }

    if (cmsSection) {
      const cmsFixesBtn        = document.getElementById('cms-fixes-btn');
      const cmsBadgeDot        = document.getElementById('cms-badge-dot');
      const cmsBadgeName       = document.getElementById('cms-badge-name');
      const cmsOverrideToggle  = document.getElementById('cms-override-toggle');
      const cmsOverridePanel   = document.getElementById('cms-override-panel');
      const cmsOverrideSelect  = document.getElementById('cms-override-select');
      const cmsOverrideVersion = document.getElementById('cms-override-version');
      const cmsNoFixes         = document.getElementById('cms-fixes-no-fixes');
      const cmsAnswerContainer = document.getElementById('cms-fixes-answer-container');
      const cmsAnswerContent   = document.getElementById('cms-fixes-answer-content');

      if (cmsBadgeName) {
        let label = cmsInfo.name || 'Custom / Unknown';
        if (cmsInfo.version) label += ' ' + cmsInfo.version;
        cmsBadgeName.textContent = label;
      }
      if (cmsBadgeDot) {
        let dotClass = 'bg-gray-400';
        if (cmsInfo.confidence === 'high')        dotClass = 'bg-green-500';
        else if (cmsInfo.confidence === 'medium') dotClass = 'bg-yellow-500';
        else if (cmsInfo.confidence === 'low')    dotClass = 'bg-orange-500';
        cmsBadgeDot.className = 'inline-block w-2.5 h-2.5 rounded-full mr-2 ' + dotClass;
      }

      if (cmsOverrideSelect) {
        const known = Array.from(cmsOverrideSelect.options).map(o => o.value);
        cmsOverrideSelect.value = known.includes(cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
      }
      if (cmsOverrideVersion && cmsInfo.version) {
        cmsOverrideVersion.value = cmsInfo.version;
      }

      // Fresh listener each run via clone
      if (cmsOverrideToggle) {
        const newToggle = cmsOverrideToggle.cloneNode(true);
        cmsOverrideToggle.parentNode.replaceChild(newToggle, cmsOverrideToggle);
        newToggle.addEventListener('click', () => {
          cmsOverridePanel?.classList.toggle('hidden');
        });
      }

      if (prioritisedFixes.length === 0) {
        if (cmsFixesBtn) {
          cmsFixesBtn.disabled = true;
          cmsFixesBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        cmsNoFixes?.classList.remove('hidden');
      }

      if (cmsFixesBtn) {
        const newCmsBtn = cmsFixesBtn.cloneNode(true);
        cmsFixesBtn.parentNode.replaceChild(newCmsBtn, cmsFixesBtn);

        newCmsBtn.addEventListener('click', async () => {
          if (prioritisedFixes.length === 0) return;

          const canProceed = await canRunTool('limit-audit-id');
          if (!canProceed) return;

          const selectedCms     = cmsOverrideSelect?.value?.trim() || cmsInfo.name || 'Custom / Unknown';
          const selectedVersion = cmsOverrideVersion?.value?.trim() || cmsInfo.version || null;

          newCmsBtn.disabled = true;
          const originalLabel = newCmsBtn.textContent;
          newCmsBtn.textContent = 'Generating...';
          cmsAnswerContainer?.classList.remove('hidden');
          if (cmsAnswerContent) cmsAnswerContent.textContent = '⏳ Building CMS-specific SEO & UX instructions...';

          try {
            const payload = {
              cms: selectedCms,
              cmsVersion: selectedVersion,
              cmsConfidence: cmsInfo.confidence,
              cmsSignals: cmsInfo.signals,
              url: url || null,
              pageTitle: doc?.title || null,
              overallScore: overallScore,
              scores: {
                onPageSEO: scores[0],
                mobilePWA: scores[1],
                performance: scores[2],
                accessibility: scores[3],
                contentQuality: scores[4],
                uxDesign: scores[5],
                security: scores[6],
                indexability: scores[7]
              },
              priorityFixes: prioritisedFixes.slice(0, 3).map(f => ({
                module: f.module || 'SEO & UX',
                name: f.title,
                howToFix: f.how
              })),
              mode: currentAnalysisMode === 'code' ? 'pasted-code' : 'live-url'
            };

            const response = await fetch('https://seo-ux-cms-fixes.traffictorch.workers.dev/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Server error (${response.status})`);

            const data = await response.json();

            if (data.success && cmsAnswerContent) {
              cmsAnswerContent.textContent = '';

              const header = document.createElement('div');
              header.style.fontWeight = 'bold';
              header.style.marginBottom = '0.75rem';
              header.textContent = '🛠️ CMS Fixes for ' +
                (data.cms || selectedCms) +
                (data.cmsVersion ? ' ' + data.cmsVersion : '');

              const body = document.createElement('div');
              body.textContent = data.answer || '';

              cmsAnswerContent.appendChild(header);
              cmsAnswerContent.appendChild(body);
            } else if (cmsAnswerContent) {
              cmsAnswerContent.textContent = '❌ Error: ' + (data.error || 'Unknown error');
            }

          } catch (err) {
            if (cmsAnswerContent) {
              cmsAnswerContent.textContent = '❌ Failed to generate CMS fixes. Please try again. (' + err.message + ')';
            }
          } finally {
            newCmsBtn.disabled = false;
            newCmsBtn.textContent = originalLabel;
          }
        });
      }
    }

  } // end of runFullAnalysis function

  // Auto-analyze from shared deep link
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  if (sharedUrl && urlInput && form) {
    let cleanUrl = decodeURIComponent(sharedUrl.trim());
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    urlInput.value = cleanUrl;
    if (progressContainer) {
      progressContainer.classList.remove('hidden');
      progressText.textContent = 'Loading shared report...';
    }
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

// Global smooth internal navigation + auto-expand for deep-dive cards
function handleDeepDiveHash() {
  if (!window.location.hash) return;
  const targetId = window.location.hash.substring(1);
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    const detailsElement = targetElement.querySelector('details');
    if (detailsElement) detailsElement.open = true;
    setTimeout(() => {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  handleDeepDiveHash();
});

window.addEventListener('hashchange', handleDeepDiveHash);

document.addEventListener('click', function(event) {
  if (event.target.closest('.ask-ai-module-link')) return;

  // ── Edit 2c: "Show the code" branch ──
  const showCodeBtn = event.target.closest('.show-code-btn');
  if (showCodeBtn) {
    event.preventDefault();
    const failureText = showCodeBtn.dataset.failure || '';
    const resultsEl = document.getElementById('results');
    const html = resultsEl?.dataset.renderedHtml || '';
    showCodeForFailure(failureText, html, { title: 'Affected code' });
    return;
  }

  const clickedLink = event.target.closest('a[href^="#"]');
  if (clickedLink && clickedLink.getAttribute('href') !== '#') {
    event.preventDefault();
    const targetHash = clickedLink.getAttribute('href');
    history.replaceState(null, null, targetHash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}, { passive: false });

// ── Per-module "Ask AI" prefill + scroll ──
document.addEventListener('click', (e) => {
  const askLink = e.target.closest('.ask-ai-module-link');
  if (!askLink) return;

  e.preventDefault();
  e.stopPropagation();

  const moduleName = askLink.dataset.module || 'this module';
  const failedList = (askLink.dataset.failed || '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  const question =
    `How do I improve my ${moduleName} score?\n` +
    (failedList.length ? `Failed checks:\n- ${failedList.join('\n- ')}` : '');

  const textarea = document.getElementById('ai-question-input');
  if (textarea) textarea.value = question;

  const askSection = document.getElementById('ask-ai-section');
  if (askSection) {
    askSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => textarea?.focus(), 700);
  }
}, { passive: false });

// ─── Ask AI Listener ──────────────────────────────────────────────
const askBtn = document.getElementById('ask-ai-btn');
const askInput = document.getElementById('ai-question-input');
const answerContainer = document.getElementById('ai-answer-container');
const answerContent = document.getElementById('ai-answer-content');

if (askBtn) {
  askBtn.addEventListener('click', async () => {
    const canProceed = await canRunTool('limit-audit-id');
    if (!canProceed) return;

    const question = askInput?.value?.trim();
    if (!question) {
      alert('Please enter a question.');
      return;
    }

    askBtn.disabled = true;
    askBtn.textContent = 'Thinking...';
    answerContainer.classList.remove('hidden');
    answerContent.innerHTML = '⏳ Consulting Traffic Torch AI...';

    try {
      // Gather current audit data from the DOM
      const overallScoreEl = document.querySelector('#overall-score .number');
      const overallScore = overallScoreEl ? parseInt(overallScoreEl.textContent) : 0;

      const moduleNames = ['On-Page SEO', 'Mobile & PWA', 'Performance', 'Accessibility', 'Content Quality', 'UX Design', 'Security', 'Indexability'];
      const moduleIds = ['seo', 'mobile', 'perf', 'access', 'content', 'ux', 'security', 'indexability'];
      const modules = [];

      moduleIds.forEach((id, index) => {
        const scoreEl = document.querySelector(`#${id}-score .number`);
        const score = scoreEl ? parseInt(scoreEl.textContent) : 0;
        modules.push({ name: moduleNames[index], score: score });
      });

      // Gather failed checklist items
      const failedItems = [];
      document.querySelectorAll('.checklist p').forEach(item => {
        const text = item.textContent.trim();
        if (text.startsWith('❌')) {
          failedItems.push(text.replace(/^❌\s*/, '').trim());
        }
      });

      // Gather priority fixes from the priority cards
      const priorityFixes = [];
      document.querySelectorAll('#priority-cards-container .p-2 .text-2xl.font-bold').forEach(el => {
        const title = el.textContent.trim();
        const fixEl = el.closest('.p-8')?.querySelector('.text-gray-800.dark\\:text-gray-200');
        if (fixEl) {
          priorityFixes.push(title + ': ' + fixEl.textContent.trim());
        }
      });

      const auditPayload = {
        question: question,
        auditData: {
          overallScore: overallScore,
          modules: modules,
          failedItems: failedItems.slice(0, 10),
          priorityFixes: priorityFixes.slice(0, 5),
        },
      };

      const response = await fetch('https://ask-ai-seo-ux.traffictorch.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditPayload),
      });

      if (!response.ok) throw new Error(`Server error (${response.status})`);

      const data = await response.json();

      if (data.success) {
        answerContent.innerHTML = `🧠 <strong>Traffic Torch AI</strong><br><br>${data.answer}`;
      } else {
        answerContent.innerHTML = `❌ Error: ${data.error || 'Unknown error'}`;
      }
    } catch (err) {
      answerContent.innerHTML = `❌ Failed to get AI response. Please try again later. (${err.message})`;
    } finally {
      askBtn.disabled = false;
      askBtn.textContent = 'Ask Traffic Torch AI';
    }
  });
}