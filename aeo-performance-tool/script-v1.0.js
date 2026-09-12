// AEO Performance Tool – client controller
import { renderModuleCards } from './module-cards-v1.0.js';
import { renderPluginSolutions } from './plugin-solutions-v1.0.js';
import { moduleExplanations } from './module-explanations-v1.0.js';
import { canRunTool } from '/main-v1.1.js';
import { initShareModule } from '/share-module.js';
import { detectCMS } from '/cms-detect.js';

const AEO_AUDIT_API = 'https://aeo-audit.traffictorch.workers.dev/';
const AEO_CMS_API   = 'https://aeo-cms-fixes.traffictorch.workers.dev/';
const AEO_AI_API    = 'https://aeo-ai.traffictorch.workers.dev/';

document.addEventListener('DOMContentLoaded', () => {
  const results     = document.getElementById('results');
  const urlInput    = document.getElementById('url-input');
  const codeInput   = document.getElementById('code-input');
  const analyzeUrl  = document.getElementById('analyze-url-btn');
  const analyzeCode = document.getElementById('analyze-code-btn');

  // Prefill from ?url= or ?input=
  const params = new URLSearchParams(window.location.search);
  const urlParam   = params.get('url');
  const inputParam = params.get('input');
  if (urlParam)   urlInput.value = decodeURIComponent(urlParam);
  if (inputParam) codeInput.value = decodeURIComponent(inputParam);

  const cleanUrl = (u) => {
    const t = (u || '').trim();
    if (!t) return '';
    return /^https?:\/\//i.test(t) ? t : 'https://' + t;
  };

  // ─── One-time event delegation (no per-render listeners) ───
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.fixes-toggle');
    if (toggle) {
      const card = toggle.closest('.score-card');
      const panel = card?.querySelector('.fixes-panel');
      if (panel) {
        panel.classList.toggle('hidden');
        const isOpen = !panel.classList.contains('hidden');
        const failedCount = panel.querySelectorAll('.failed-item').length;
        if (isOpen && failedCount > 0) {
          toggle.textContent = `Hide Fixes (${failedCount})`;
        } else if (isOpen) {
          toggle.textContent = 'Hide Details';
        } else {
          toggle.textContent = failedCount > 0 ? `Show Fixes (${failedCount})` : 'Details';
        }
      }
    }
  });
  
  // These live in the #module-cards-container section and are always visible.
  renderModuleCards('module-cards-container');

  analyzeUrl.addEventListener('click', async () => {
    if (!(await canRunTool('aeo-performance-tool'))) return;
    const url = cleanUrl(urlInput.value);
    if (!url) return alert('Please enter a valid URL');
    codeInput.value = '';
    runAudit({ url });
  });

  analyzeCode.addEventListener('click', async () => {
    if (!(await canRunTool('aeo-performance-tool'))) return;
    const html = codeInput.value.trim();
    if (!html) return alert('Please paste HTML code to analyze');
    urlInput.value = '';
    runAudit({ html });
  });

  async function runAudit(payload) {
    // ─── Hard reset: clear everything from the previous audit ───
    results.replaceChildren();
    results.classList.remove('hidden');

    const offset = 120;
    const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });

    results.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 mt-8">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-6 text-xl font-medium text-orange-500">Running AEO audit…</p>
      </div>`;

    try {
      const res = await fetch(AEO_AUDIT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Audit worker returned ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Audit failed');

      renderReport(data, payload);
    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${escapeHtml(err.message)}</p>`;
    }
  }

  function renderReport(data, payload) {
    const {
      url, pageTitle, overall, grade, modules, priorityFixes,
      rawHtml, renderedHtml, browserMetrics, meta
    } = data;

    // ─── Fresh CMS detection on every audit ───
    let cmsInfo = { name: 'Custom / Unknown', version: null, confidence: 'unknown', signals: [] };
    try {
      const doc = new DOMParser().parseFromString(renderedHtml || rawHtml || '', 'text/html');
      const detected = detectCMS({ doc, html: rawHtml || renderedHtml || '', url: url || '' });
      if (detected && detected.name) cmsInfo = detected;
    } catch (err) {
      console.warn('CMS detection failed:', err);
    }

    const scores = modules.map(m => m.score);
    const gradeColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? '#f97316' : '#ef4444';
    const gradeBorder = (s) => s >= 80 ? 'border-green-500' : s >= 60 ? 'border-orange-400' : 'border-red-500';
    const gradeText = (s) => s >= 80 ? '✅ Excellent' : s >= 60 ? '⚠️ Good' : '❌ Needs Work';

    const failedMetrics = modules
      .filter(m => m.score < 80)
      .map(m => ({
        name: m.name,
        grade: {
          text: m.score >= 60 ? 'Good' : 'Needs Work',
          color: m.score >= 60 ? 'text-orange-400' : 'text-red-600',
          emoji: m.score >= 60 ? '⚠️' : '❌'
        }
      }));
      
      document.body.setAttribute('data-url', url || 'Custom HTML Analysis');

    // ─── Render the full report ───
    results.innerHTML = `
      <!-- Overall score -->
      <div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${gradeBorder(overall)}">
          <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall AEO Performance Score</p>
          <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
            <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
              <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
              <circle cx="100" cy="100" r="90" stroke="${gradeColor(overall)}" stroke-width="16" fill="none"
                      stroke-dasharray="${(overall / 100) * 565} 565" stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-5xl sm:text-6xl font-black" style="color:${gradeColor(overall)}">${overall}</div>
                <div class="text-lg sm:text-xl opacity-80 -mt-1" style="color:${gradeColor(overall)}">/100</div>
              </div>
            </div>
          </div>
          <p class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center leading-tight">${escapeHtml(pageTitle || 'Analyzed Page')}</p>
          <p class="text-4xl sm:text-5xl font-bold text-center mt-4 ${overall >= 80 ? 'text-green-600' : overall >= 60 ? 'text-orange-400' : 'text-red-600'}">${gradeText(overall)}</p>
          <p class="text-xs text-gray-400 text-center mt-3">Source: ${escapeHtml(meta?.renderSource || 'unknown')} · rendered ${(meta?.renderedHtmlLength || 0).toLocaleString()} chars</p>
        </div>
      </div>

      <!-- Radar -->
      <div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">AEO Performance Radar</h3>
          <div class="hidden md:block w-full"><canvas id="aeo-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas></div>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">Radar chart available on desktop/tablet</p>
        </div>
      </div>

      <!-- Module cards -->
      <div class="grid md:grid-cols-3 gap-8 my-16 max-w-6xl mx-auto px-4">
        ${modules.map(m => {
          const failedCount = (m.failed || []).length;
          return `
            <div class="score-card text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${gradeBorder(m.score)}">
              <div class="relative mx-auto w-24 h-24">
                <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                  <circle cx="48" cy="48" r="40" stroke="${gradeColor(m.score)}" stroke-width="10" fill="none"
                          stroke-dasharray="${(m.score / 100) * 251} 251" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center text-3xl font-black" style="color:${gradeColor(m.score)}">${m.score}</div>
              </div>
              <p class="mt-3 text-lg font-bold ${m.score >= 80 ? 'text-green-600' : m.score >= 60 ? 'text-orange-400' : 'text-red-600'}">${gradeText(m.score)}</p>
              <p class="mt-2 text-lg font-medium text-gray-800 dark:text-gray-200">${escapeHtml(m.name)}</p>
              <div class="mt-3 space-y-1 text-sm text-left max-w-xs mx-auto">
                ${(m.signals || []).slice(0, 5).map(s => `
                  <p class="${s.pass ? 'text-green-600' : 'text-orange-400'} font-medium">${s.pass ? '✅' : '⚠️'} ${escapeHtml(s.label)}</p>
                `).join('')}
              </div>
              <button class="fixes-toggle mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
                ${failedCount ? `Show Fixes (${failedCount})` : 'Details'}
              </button>
              <div class="fixes-panel hidden mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <div>
                  <p class="font-bold text-gray-800 dark:text-gray-200">What it measures:</p>
                  <p class="text-gray-700 dark:text-gray-300">${moduleExplanations[m.name]?.what || ''}</p>
                  <a href="/blog/posts/aeo-performance-help-guide/#${moduleExplanations[m.name]?.slug || ''}-what"
                     class="inline-block mt-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium">
                    Learn more about what →
                  </a>
                </div>
                <div>
                  <p class="font-bold text-gray-800 dark:text-gray-200">How it is tested:</p>
                  <p class="text-gray-700 dark:text-gray-300">${moduleExplanations[m.name]?.how || ''}</p>
                  <a href="/blog/posts/aeo-performance-help-guide/#${moduleExplanations[m.name]?.slug || ''}-how"
                     class="inline-block mt-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium">
                    Learn more about how →
                  </a>
                </div>
                <div>
                  <p class="font-bold text-gray-800 dark:text-gray-200">Why it matters:</p>
                  <p class="text-gray-700 dark:text-gray-300">${moduleExplanations[m.name]?.why || ''}</p>
                  <a href="/blog/posts/aeo-performance-help-guide/#${moduleExplanations[m.name]?.slug || ''}-why"
                     class="inline-block mt-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium">
                    Learn more about why →
                  </a>
                </div>
                ${failedCount ? `
                  <div>
                    <p class="font-bold text-red-600 mb-1">Fix these:</p>
                    <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                      ${m.failed.map(f => `<li class="failed-item">${escapeHtml(f)}</li>`).join('')}
                    </ul>
                  </div>
                ` : '<p class="text-green-600 font-medium">All checks passed.</p>'}
                <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <a href="/blog/posts/aeo-performance-help-guide/#${moduleExplanations[m.name]?.slug || ''}"
                     class="inline-block text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-semibold">
                    Read the full ${escapeHtml(m.name)} guide →
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Live Browser Metrics (Puppeteer) -->
      ${renderBrowserMetricsPanel(browserMetrics)}

      <!-- Priority Fixes -->
      <div class="mt-20 space-y-8 max-w-4xl mx-auto px-4">
        <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">Top Priority Fixes</h2>
        ${priorityFixes.length === 0 ? `
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl p-10 shadow-2xl border-l-8 border-green-500">
            <h3 class="text-3xl font-black text-green-600 dark:text-green-400 mb-4 text-center">🎉 No Major Fixes Needed!</h3>
            <p class="text-xl text-center text-gray-800 dark:text-gray-200">Your page passes all AEO performance checks.</p>
          </div>
        ` : priorityFixes.map((fix, i) => `
          <div class="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-2xl font-black shadow-xl">${i + 1}</div>
              <div class="flex-1">
                <h3 class="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">${escapeHtml(fix.name)}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Module: ${escapeHtml(fix.module)} · Score: ${fix.score}</p>
                <p class="text-base text-gray-700 dark:text-gray-300 mb-3">${escapeHtml(fix.desc || '')}</p>
                <div class="inline-block px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-full text-sm">${escapeHtml(fix.impact)}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Plugin Solutions -->
      <div id="plugin-solutions-section" class="mt-20"></div>

      <!-- CMS Fixes -->
      <div class="mt-20 max-w-4xl mx-auto px-4">
        <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
        <p class="text-center text-gray-600 dark:text-gray-400 mb-6">Get step-by-step AEO fix instructions tailored to your CMS.</p>
        <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <span class="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
          <span class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-gray-700">
            <span class="inline-block w-2.5 h-2.5 rounded-full mr-2 ${cmsInfo.confidence === 'high' ? 'bg-green-500' : cmsInfo.confidence === 'medium' ? 'bg-yellow-500' : cmsInfo.confidence === 'low' ? 'bg-orange-500' : 'bg-gray-400'}"></span>
            ${escapeHtml(cmsInfo.name)}${cmsInfo.version ? ' ' + escapeHtml(cmsInfo.version) : ''}
          </span>
        </div>
        <div class="text-center">
          <button id="cms-fixes-btn" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50">Generate CMS Fixes</button>
        </div>
        <div id="cms-fixes-answer-container" class="mt-6 hidden">
          <div id="cms-fixes-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>

      <!-- Ask AI -->
      <div class="mt-20 max-w-4xl mx-auto px-4">
        <h2 class="text-3xl font-black text-center mb-2">🤖 Ask Traffic Torch AI</h2>
        <p class="text-center text-gray-600 dark:text-gray-400 mb-6">Ask about any failing metric, how to fix it, or what to prioritise.</p>
        <div class="flex flex-col sm:flex-row gap-4">
          <textarea id="ai-question-input" rows="3" placeholder="e.g., How do I fix render fidelity issues?" class="flex-1 p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y min-h-[60px]"></textarea>
          <button id="ask-ai-btn" class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg whitespace-nowrap">Ask AI</button>
        </div>
        <div id="ai-answer-container" class="mt-6 hidden">
          <div id="ai-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>

      <div id="share-dashboard-container" class="mt-16"></div>
    `;

    // ─── Radar chart ───
    setTimeout(() => {
      const canvas = document.getElementById('aeo-radar');
      if (!canvas || typeof Chart === 'undefined') return;
      new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels: modules.map(m => m.name),
          datasets: [{
            label: 'Score',
            data: scores,
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            borderColor: '#fb923c',
            borderWidth: 4,
            pointRadius: 8,
            pointBackgroundColor: scores.map(gradeColor),
            pointBorderColor: '#fff',
            pointBorderWidth: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { r: {
            beginAtZero: true, min: 0, max: 100,
            ticks: { stepSize: 20, color: '#9ca3af' },
            grid: { color: 'rgba(156,163,175,0.3)' },
            angleLines: { color: 'rgba(156,163,175,0.3)' },
            pointLabels: { color: '#9ca3af', font: { size: 13, weight: '600' } }
          }},
          plugins: { legend: { display: false } }
        }
      });
    }, 150);

    // ─── Plugin solutions (with detected CMS pre-selected) ───
    if (failedMetrics.length) {
      const detectedCms = cmsInfo?.name && cmsInfo.name !== 'Custom / Unknown' ? cmsInfo.name : '';
      renderPluginSolutions(failedMetrics, 'plugin-solutions-section', detectedCms);
    }

    // ─── CMS Fixes handler ───
    const cmsBtn = document.getElementById('cms-fixes-btn');
    const cmsWrap = document.getElementById('cms-fixes-answer-container');
    const cmsOut = document.getElementById('cms-fixes-answer-content');
    cmsBtn?.addEventListener('click', async () => {
      if (!(await canRunTool('aeo-performance-tool'))) return;
      cmsBtn.disabled = true;
      const label = cmsBtn.textContent;
      cmsBtn.textContent = 'Generating…';
      cmsWrap.classList.remove('hidden');
      cmsOut.textContent = '⏳ Building CMS-specific AEO instructions…';
      try {
        const r = await fetch(AEO_CMS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cms: cmsInfo.name,
            cmsVersion: cmsInfo.version,
            cmsConfidence: cmsInfo.confidence,
            cmsSignals: cmsInfo.signals,
            url: url || null,
            pageTitle: pageTitle || null,
            overallScore: overall,
            scores: Object.fromEntries(modules.map(m => [m.name, m.score])),
            priorityFixes: priorityFixes.map(f => ({ name: f.name, module: f.module, howToFix: f.desc })),
            mode: payload?.html ? 'pasted-code' : 'live-url'
          })
        });
        const d = await r.json();
        cmsOut.textContent = d.success ? (d.answer || '') : '❌ ' + (d.error || 'Unknown error');
      } catch (err) {
        cmsOut.textContent = '❌ ' + err.message;
      } finally {
        cmsBtn.disabled = false;
        cmsBtn.textContent = label;
      }
    });

    // ─── Ask AI handler ───
    const aiBtn = document.getElementById('ask-ai-btn');
    const aiInput = document.getElementById('ai-question-input');
    const aiWrap = document.getElementById('ai-answer-container');
    const aiOut = document.getElementById('ai-answer-content');
    aiBtn?.addEventListener('click', async () => {
      if (!(await canRunTool('aeo-performance-tool'))) return;
      const q = aiInput.value.trim();
      if (!q) return alert('Enter a question');
      aiBtn.disabled = true;
      const label = aiBtn.textContent;
      aiBtn.textContent = 'Thinking…';
      aiWrap.classList.remove('hidden');
      aiOut.textContent = '⏳ Consulting Traffic Torch AI…';
      try {
        const r = await fetch(AEO_AI_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            auditData: {
              url: url || 'Custom HTML',
              pageTitle,
              overallScore: overall,
                cms: {
                name: cmsInfo?.name || 'Custom / Unknown',
                version: cmsInfo?.version || null,
                confidence: cmsInfo?.confidence || 'unknown'
              },
              modules: modules.map(m => ({ name: m.name, score: m.score, failed: m.failed })),
              priorityFixes: priorityFixes.map(f => f.name),
              browserMetrics: browserMetrics ? {
                cls: browserMetrics.cls,
                lcp: browserMetrics.lcp,
                fcp: browserMetrics.fcp,
                longTasks: browserMetrics.longTasks,
                mutations: browserMetrics.mutations,
                consoleErrors: browserMetrics.consoleErrors?.length || 0
              } : null
            }
          })
        });
        const d = await r.json();
        aiOut.textContent = d.success ? d.answer : '❌ ' + (d.error || 'Unknown error');
      } catch (err) {
        aiOut.textContent = '❌ ' + err.message;
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = label;
      }
    });

    // ─── Share dashboard ───
    const shareEl = document.getElementById('share-dashboard-container');
    if (shareEl && typeof initShareModule === 'function') {
      initShareModule(shareEl, {
        toolName: 'AEO Performance Tool',
        url: url || 'Code Analysis',
        pageTitle,
        overallScore: overall,
        moduleScores: modules.map(m => ({ name: m.name, score: m.score })),
        passedMetrics: modules.filter(m => m.score >= 80).map(m => m.name),
        failedMetrics: failedMetrics.map(f => f.name),
        aiFixes: priorityFixes.map(f => f.name),
        shareLink: `${window.location.origin}/aeo-performance-tool/?url=${encodeURIComponent(url || '')}`
      });
    }
  }

  /* ─── Live Browser Metrics panel (Puppeteer) ─── */
  function renderBrowserMetricsPanel(bm) {
    if (!bm || !bm.capturedAt) return '';

    const clsColor = bm.cls < 0.10 ? 'text-green-600' : bm.cls < 0.25 ? 'text-orange-400' : 'text-red-600';
    const lcpColor = bm.lcp > 0 && bm.lcp < 2500 ? 'text-green-600' : bm.lcp < 4000 ? 'text-orange-400' : 'text-red-600';
    const fcpColor = bm.fcp > 0 && bm.fcp < 1800 ? 'text-green-600' : bm.fcp < 3000 ? 'text-orange-400' : 'text-red-600';
    const ttfbColor = bm.ttfb > 0 && bm.ttfb < 800 ? 'text-green-600' : bm.ttfb < 1800 ? 'text-orange-400' : 'text-red-600';

    const fmt = (n) => n == null ? '—' : Math.round(n).toLocaleString();

    return `
      <details class="max-w-5xl mx-auto my-16 px-4">
        <summary class="px-6 py-5 text-2xl text-center font-black bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl cursor-pointer flex justify-center items-center gap-4 shadow-xl hover:shadow-2xl transition-all duration-300">
          <span>🔬 Live Browser Metrics</span>
          <span class="text-sm font-normal opacity-80">Puppeteer + Browser Run</span>
        </summary>
        <div class="mt-8 p-6 md:p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl space-y-8">

          <!-- Core Web Vitals grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">CLS</p>
              <p class="text-3xl font-black ${clsColor}">${bm.cls.toFixed(3)}</p>
              <p class="text-xs mt-1 text-gray-500">${bm.cls < 0.10 ? 'Good' : bm.cls < 0.25 ? 'Improve' : 'Poor'}</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">LCP</p>
              <p class="text-3xl font-black ${lcpColor}">${fmt(bm.lcp)}</p>
              <p class="text-xs mt-1 text-gray-500">ms</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">FCP</p>
              <p class="text-3xl font-black ${fcpColor}">${fmt(bm.fcp)}</p>
              <p class="text-xs mt-1 text-gray-500">ms</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">TTFB</p>
              <p class="text-3xl font-black ${ttfbColor}">${fmt(bm.ttfb)}</p>
              <p class="text-xs mt-1 text-gray-500">ms</p>
            </div>
          </div>

          <!-- Secondary metrics -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">DOM Mutations</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(bm.mutations)}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">Nodes Changed</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(bm.mutationNodes)}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">Long Tasks</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(bm.longTasks)}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">Resources</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(bm.totalResources)}</p>
            </div>
          </div>

          <!-- Console errors -->
          ${(bm.consoleErrors?.length || 0) + (bm.pageErrors?.length || 0) > 0 ? `
            <div>
              <h4 class="font-bold text-red-600 mb-3">
                ⚠️ ${(bm.consoleErrors?.length || 0) + (bm.pageErrors?.length || 0)} Error(s) During Render
              </h4>
              <ul class="space-y-1 text-xs font-mono bg-red-50 dark:bg-red-900/20 p-4 rounded-xl max-h-60 overflow-y-auto">
                ${(bm.consoleErrors || []).slice(0, 10).map(e => `<li class="text-red-700 dark:text-red-300">🔴 ${escapeHtml(e)}</li>`).join('')}
                ${(bm.pageErrors || []).slice(0, 10).map(e => `<li class="text-red-700 dark:text-red-300">💥 ${escapeHtml(e)}</li>`).join('')}
              </ul>
            </div>
          ` : `
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
              <p class="text-green-700 dark:text-green-300 font-medium">✅ No console or page errors during render</p>
            </div>
          `}

          <!-- Failed requests -->
          ${bm.failedRequests?.length ? `
            <div>
              <h4 class="font-bold text-orange-600 mb-3">⚠️ ${bm.failedRequests.length} Failed Request(s)</h4>
              <ul class="space-y-1 text-xs font-mono bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl max-h-60 overflow-y-auto">
                ${bm.failedRequests.slice(0, 10).map(r => `<li class="text-orange-700 dark:text-orange-300">${escapeHtml(r.failure)} — ${escapeHtml(r.url)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Render-blocking resources -->
          ${bm.renderBlockingRequests?.length ? `
            <div>
              <h4 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🚧 ${bm.renderBlockingRequests.length} Render-Blocking Resource(s)</h4>
              <ul class="space-y-1 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-4 rounded-xl max-h-60 overflow-y-auto">
                ${bm.renderBlockingRequests.slice(0, 10).map(r => `<li class="text-gray-700 dark:text-gray-300">[${escapeHtml(r.type || 'other')}] ${escapeHtml(r.name)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <p class="text-xs text-gray-400 text-center">Captured: ${escapeHtml(bm.capturedAt)}</p>
        </div>
      </details>
    `;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
});