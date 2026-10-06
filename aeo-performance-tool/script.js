// AEO Performance Tool – client controller
import { renderModuleCards } from './module-cards.js?v=1.0';
import { renderPluginSolutions } from './plugin-solutions.js?v=1.0';
import { moduleExplanations, fixFor } from './module-explanations.js?v=1.0';
import { canRunTool } from '/main.js?v=1.1';
import { initShareModule } from '/share-module.js';
import { detectCMS } from '/cms-detect.js';
import {
  initCodeSnippetModal,
  showCodeForFailure,
  deriveSelectorsForFailure,
  extractSnippets
} from './code-snippet.js?v=1.0';

const AEO_AUDIT_API = 'https://aeo-audit.traffictorch.workers.dev/';
const AEO_CMS_API   = 'https://aeo-cms-fixes.traffictorch.workers.dev/';
const AEO_AI_API    = 'https://aeo-ai.traffictorch.workers.dev/';
const API_BASE      = 'https://traffic-torch-auth.traffictorch.workers.dev';

// ── Render fenced code blocks (```lang ... ```) from AI text ──
function renderCodeBlocks(text) {
  if (text === null || text === undefined) return '';
  let escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(
    /```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g,
    (_m, lang, code) => {
      const language = (lang || 'plaintext').toLowerCase();
      return `<pre class="code-block"><code class="language-${language}">${code.replace(/\s+$/, '')}</code></pre>`;
    }
  );

  escaped = escaped.replace(
    /(<pre[\s\S]*?<\/pre>)|(\r?\n)/g,
    (_m, pre, nl) => (pre ? pre : '<br>')
  );

  return escaped;
}

// ─── Head snapshot builder (shared with all other Traffic Torch tools) ───
function buildHeadSnapshot(doc) {
  if (!doc || !doc.head) return '';
  const head = doc.head;
  const lines = [];

  const sheets = [...head.querySelectorAll('link[rel="stylesheet"]')].slice(0, 15);
  if (sheets.length) {
    lines.push('Stylesheets in <head>:');
    for (const l of sheets) {
      const href = l.getAttribute('href') || '';
      const media = l.getAttribute('media');
      lines.push(`- ${href}${media ? ` (media=${media})` : ''}`);
    }
  }

  const headScripts = [...head.querySelectorAll('script[src]')].slice(0, 15);
  if (headScripts.length) {
    lines.push('Scripts in <head>:');
    for (const s of headScripts) {
      const src = s.getAttribute('src') || '';
      const attrs = ['async','defer','type','crossorigin','fetchpriority']
        .filter(a => s.hasAttribute(a))
        .map(a => `${a}="${s.getAttribute(a) || ''}"`)
        .join(' ');
      lines.push(`- ${src}${attrs ? ' ' + attrs : ''}`);
    }
  }

  const inlineStyles = [...head.querySelectorAll('style')].slice(0, 15);
  if (inlineStyles.length) {
    lines.push(`Inline <style> blocks in <head>: ${inlineStyles.length}`);
    for (const s of inlineStyles) {
      const id = s.id ? `#${s.id}` : '(no id)';
      const bytes = (s.textContent || '').length;
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      lines.push(`- ${id} — ${bytes} bytes — "${preview}…"`);
    }
  }

  const inlineScripts = [...head.querySelectorAll('script:not([src])')].slice(0, 15);
  if (inlineScripts.length) {
    lines.push(`Inline <script> blocks in <head>: ${inlineScripts.length}`);
    for (const s of inlineScripts) {
      const id = s.id ? `#${s.id}` : '(no id)';
      const bytes = (s.textContent || '').length;
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      lines.push(`- ${id} — ${bytes} bytes — "${preview}…"`);
    }
  }

  const metaTags = [...head.querySelectorAll('meta[name], meta[property]')].slice(0, 20);
  if (metaTags.length) {
    lines.push('Meta tags in <head>:');
    for (const m of metaTags) {
      const key = m.getAttribute('name') || m.getAttribute('property') || '';
      const val = (m.getAttribute('content') || '').slice(0, 120);
      lines.push(`- ${key}="${val}"`);
    }
  }

  const jsonLd = [...head.querySelectorAll('script[type="application/ld+json"]')].slice(0, 5);
  if (jsonLd.length) {
    lines.push(`JSON-LD schema blocks in <head>: ${jsonLd.length}`);
    for (const s of jsonLd) {
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
      lines.push(`- "${preview}…"`);
    }
  }

  return lines.join('\n');
}

// ── Save audit to history (auth user → API, guest → localStorage) ──
async function saveAuditHistory(url, toolName) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
  const auditUrl = url || 'Pasted HTML code';

  if (token) {
    try {
      await fetch(`${API_BASE}/api/audit-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: auditUrl,
          tool_name: toolName,
          score: null
        })
      });
      return;
    } catch (e) {
      // fall through to guest storage
    }
  }

  const stored = localStorage.getItem('audit_guest');
  let entries = [];
  if (stored) {
    try { entries = JSON.parse(stored).entries || []; } catch {}
  }
  entries.unshift({
    _localId: Date.now() + '_' + Math.random(),
    url: auditUrl,
    tool: toolName,
    score: null,
    timestamp: Date.now()
  });
  entries = entries.slice(0, 5);
  localStorage.setItem('audit_guest', JSON.stringify({ savedAt: Date.now(), entries }));
}

document.addEventListener('DOMContentLoaded', () => {
  const results     = document.getElementById('results');
  const urlInput    = document.getElementById('url-input');
  const codeInput   = document.getElementById('code-input');
  const analyzeUrl  = document.getElementById('analyze-url-btn');
  const analyzeCode = document.getElementById('analyze-code-btn');

  const params = new URLSearchParams(window.location.search);
  const urlParam   = params.get('url');
  const inputParam = params.get('input');
  if (urlParam)   urlInput.value = decodeURIComponent(urlParam);
  if (inputParam) codeInput.value = decodeURIComponent(inputParam);

  if (urlParam) {
    setTimeout(() => analyzeUrl.click(), 500);
  } else if (inputParam) {
    setTimeout(() => analyzeCode.click(), 500);
  }

  const cleanUrl = (u) => {
    const t = (u || '').trim();
    if (!t) return '';
    return /^https?:\/\//i.test(t) ? t : 'https://' + t;
  };

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.fixes-toggle');
    if (toggle) {
      const card = toggle.closest('.score-card');
      const panel = card?.querySelector('.fixes-panel');
      if (panel) {
        panel.classList.toggle('hidden');
        const isOpen = !panel.classList.contains('hidden');
        const failedCount = parseInt(toggle.dataset.failedCount || '0', 10);
        if (isOpen && failedCount > 0) {
          toggle.textContent = `Hide Fixes (${failedCount})`;
        } else if (isOpen) {
          toggle.textContent = 'Hide Details';
        } else {
          toggle.textContent = failedCount > 0 ? `Show Fixes (${failedCount})` : 'Details';
        }
      }
      return;
    }

    const showCodeBtn = e.target.closest('.show-code-btn');
    if (showCodeBtn) {
      e.preventDefault();
      const failureText = showCodeBtn.dataset.failure || '';
      const html = results.dataset.renderedHtml || '';
      showCodeForFailure(failureText, html, { title: 'Affected code' });
      return;
    }

    const askLink = e.target.closest('.ask-ai-link');
    if (askLink) {
      e.preventDefault();
      const question = askLink.dataset.aiQuestion || '';
      const section = document.getElementById('ask-ai-section');
      const textarea = document.getElementById('ai-question-input');
      if (textarea) textarea.value = question;
      if (section) {
        const offset = 100;
        const targetY = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
      setTimeout(() => textarea?.focus(), 700);
    }
  });

  renderModuleCards('module-cards-container');
  initCodeSnippetModal();

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

      const auditSaveUrl = payload?.html ? 'Pasted HTML code' : (payload?.url || data?.url || '');
      await saveAuditHistory(auditSaveUrl, 'AEO Performance');

      renderReport(data, payload);
    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${escapeHtml(err.message)}</p>`;
    }
  }

  function renderReport(data, payload) {
    const {
      url, pageTitle, overall, grade, modules, priorityFixes,
      rawHtml, renderedHtml, browserMetrics, meta,
      weightedAverage, capApplied: dataCapApplied, capReason: dataCapReason
    } = data;

    let cmsInfo = { name: 'Custom / Unknown', version: null, confidence: 'unknown', signals: [] };
    let pageContext = {};
    let headSnapshot = '';
    let auditDoc = null;

    try {
      const doc = new DOMParser().parseFromString(renderedHtml || rawHtml || '', 'text/html');
      auditDoc = doc;
      const detected = detectCMS({ doc, html: rawHtml || renderedHtml || '', url: url || '' });
      if (detected && detected.name) cmsInfo = detected;

      const excerptDoc = doc.cloneNode(true);
      excerptDoc.querySelectorAll('nav, header, footer, aside, script, style, .sidebar, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());
      const contentRoot = excerptDoc.querySelector('main, article, [role="main"]') || excerptDoc.body;
      const paragraphs = Array.from(contentRoot?.querySelectorAll('p') || [])
        .map(p => p.textContent.replace(/\s+/g, ' ').trim())
        .filter(t => t.length > 60);
      const pageExcerpt = (paragraphs[0] || contentRoot?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300);

      pageContext = {
        metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        h1: doc.querySelector('h1')?.textContent?.trim() || '',
        pageExcerpt,
        langAttribute: doc.documentElement?.getAttribute('lang') || '',
        viewportContent: doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
        linkCount: doc.querySelectorAll('a[href]').length,
        imageCount: doc.querySelectorAll('img').length,
        headingCount: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        ctaCount: doc.querySelectorAll('button, [role="button"], a.cta, .cta, input[type="submit"]').length,
        wordCount: (contentRoot?.textContent || '').trim().split(/\s+/).filter(Boolean).length
      };

      headSnapshot = buildHeadSnapshot(doc);
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

    // FIX: warning-level modules (>=80) so priority section never renders empty.
    const warningMetrics = modules.filter(m =>
      m.score >= 80 && (
        m.score < 90 ||
        (m.signals || []).some(s => !s.pass && !s.informational)
      )
    );

    // FIX: merge priority fixes AND warning fixes so warnings are never hidden
    // behind a single low-scoring module.
    const workerWarningFixes = Array.isArray(data.warningFixes) ? data.warningFixes : [];
    const localWarningFixes = warningMetrics.map(m => {
      const warns = (m.signals || [])
        .filter(s => !s.pass && !s.informational)
        .map(s => s.label);
      return {
        name: warns[0] || `Polish ${m.name}`,
        module: m.name,
        score: m.score,
        impact: m.score >= 85 ? 'Low impact' : 'Medium impact',
        desc: warns.length
          ? `Warnings: ${warns.join('; ')}`
          : 'Score is below excellent. Review module details for minor improvements.'
      };
    });
    const warningFixesFinal = workerWarningFixes.length > 0
      ? workerWarningFixes
      : localWarningFixes;

    // Combine, cap at 5. Priority fixes come first; warnings fill remaining slots.
    const displayFixes = [...priorityFixes, ...warningFixesFinal].slice(0, 5);

    const fixesHeading = priorityFixes.length > 0
      ? 'Top Priority Fixes'
      : (displayFixes.length > 0 ? 'Priority Improvements' : 'Top Priority Fixes');

    // FIX: cap awareness — worker signals when a low module capped the score.
    const capApplied = dataCapApplied === true;
    const capReason  = dataCapReason || null;

    document.body.setAttribute('data-url', url || 'Custom HTML Analysis');
    document.body.setAttribute('data-cms-name', cmsInfo?.name || 'Custom / Unknown');
    document.body.setAttribute('data-cms-version', cmsInfo?.version || '');
    document.body.setAttribute('data-cms-confidence', cmsInfo?.confidence || 'unknown');

    results.dataset.renderedHtml = renderedHtml || rawHtml || payload?.html || '';
    results.dataset.headSnapshot = headSnapshot;

    results.innerHTML = `
      <div class="flex justify-center my-8 sm:my-12 px-2 sm:px-2">
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
          ${capApplied && capReason ? `
            <p class="text-xs text-orange-600 dark:text-orange-400 text-center mt-3 leading-snug">
              ⚠️ Score capped by <strong>${escapeHtml(capReason.module)}</strong> at ${capReason.score}.
              Weighted average was ${capReason.weightedAverage}. Fix that module to unlock the full score.
            </p>
          ` : ''}
        </div>
      </div>

      <div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">AEO Performance Radar</h3>
          <div class="hidden md:block w-full"><canvas id="aeo-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas></div>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">Radar chart available on desktop/tablet</p>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-8 my-16 max-w-6xl mx-auto px-4">
        ${modules.map(m => {
          const failed = m.failed || [];
          const warnings = (m.signals || []).filter(s => !s.pass).map(s => s.label);
          const passes = (m.signals || []).filter(s => s.pass);
          const allIssues = [...failed, ...warnings];
          const slug = moduleExplanations[m.name]?.slug || '';
          const aiQuestion = `How do I improve my ${m.name} score?` +
            (failed.length ? ` Failed checks: ${failed.join('; ')}.` : '');
          return `
            <div class="score-card flex flex-col text-center p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${gradeBorder(m.score)}">
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

              <div class="mt-3 space-y-1 text-sm text-left max-w-xs mx-auto w-full">
                ${failed.map(f => `<p class="text-red-600 dark:text-red-400 font-medium">❌ ${escapeHtml(f)}</p>`).join('')}
                ${warnings.map(w => `<p class="text-orange-500 font-medium">⚠️ ${escapeHtml(w)}</p>`).join('')}
                ${passes.map(s => `<p class="text-green-600 font-medium">✅ ${escapeHtml(s.label)}</p>`).join('')}
              </div>

              <div class="mt-auto pt-5">
                <button class="fixes-toggle w-full mt-2 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm"
                        data-failed-count="${allIssues.length}">
                  ${allIssues.length ? `Show Fixes (${allIssues.length})` : 'Details'}
                </button>
              </div>

              <div class="fixes-panel hidden mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-lg space-y-4 w-full">
                ${allIssues.length ? allIssues.map((item, i) => {
                  const rule = deriveSelectorsForFailure(item);
                  return `
                    <div class="${i > 0 ? 'pt-3 border-t border-gray-200 dark:border-gray-700' : ''}">
                      <p class="font-bold text-red-600 dark:text-red-400 mb-2 leading-snug">❌ ${escapeHtml(item)}</p>
                      <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(fixFor(item))}</p>
                      ${rule ? `
                        <button type="button"
                                class="show-code-btn mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                data-failure="${escapeHtml(item)}">
                          🔍 Show the code
                        </button>
                      ` : ''}
                    </div>
                  `;
                }).join('') : '<p class="text-green-600 font-medium">All checks passed.</p>'}

                <div class="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                  <a href="#ask-ai-section"
                     class="ask-ai-link text-purple-600 dark:text-purple-400 hover:underline text-xs font-semibold"
                     data-ai-question="${escapeHtml(aiQuestion)}">
                    🤖 Ask AI about this module →
                  </a>
                  <a href="/blog/posts/aeo-performance-help-guide/#${slug}"
                     class="text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-semibold">
                    📖 Read the full ${escapeHtml(m.name)} guide →
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${renderBrowserMetricsPanel(browserMetrics)}

      <div class="mt-20 space-y-8 max-w-4xl mx-auto px-4">
        <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">${fixesHeading}</h2>
        ${displayFixes.length === 0 ? `
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl p-10 shadow-2xl border-l-8 border-green-500">
            <h3 class="text-3xl font-black text-green-600 dark:text-green-400 mb-4 text-center">🎉 No Major Fixes Needed!</h3>
            <p class="text-xl text-center text-gray-800 dark:text-gray-200">Your page passes all AEO performance checks.</p>
          </div>
        ` : displayFixes.map((fix, i) => `
          <div class="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-xl border border-gray-200 dark:border-gray-700">
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

      <div id="plugin-solutions-section" class="mt-20"></div>

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

      <div id="ask-ai-section" class="mt-20 max-w-4xl mx-auto px-4">
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

    if (failedMetrics.length) {
      const detectedCms = cmsInfo?.name && cmsInfo.name !== 'Custom / Unknown' ? cmsInfo.name : '';
      renderPluginSolutions(failedMetrics, 'plugin-solutions-section', detectedCms);
    }

    const cmsBtn = document.getElementById('cms-fixes-btn');
    const cmsWrap = document.getElementById('cms-fixes-answer-container');
    const cmsOut = document.getElementById('cms-fixes-answer-content');
    cmsBtn?.addEventListener('click', async () => {
      if (!(await canRunTool('aeo-performance-tool'))) return;
      cmsBtn.disabled = true;
      const label = cmsBtn.textContent;
      cmsBtn.textContent = 'Generating…';
      cmsWrap.classList.remove('hidden');
      cmsOut.textContent = '⏳ Traffic Torching…';
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
            priorityFixes: displayFixes.map(f => ({ name: f.name, module: f.module, howToFix: f.desc })),
            mode: payload?.html ? 'pasted-code' : 'live-url'
          })
        });
        const d = await r.json();
        if (d.success) {
          let html = renderCodeBlocks(d.answer || '');
          if (Array.isArray(d.warnings) && d.warnings.length) {
            html = `<div style="margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#fef3c7;color:#92400e;font-size:0.85rem;">${d.warnings.join(' ')}</div>` + html;
          }
          cmsOut.innerHTML = html;
        } else {
          cmsOut.innerHTML = '❌ ' + renderCodeBlocks(d.error || 'Unknown error');
        }
      } catch (err) {
        cmsOut.innerHTML = '❌ ' + renderCodeBlocks(err.message);
      } finally {
        cmsBtn.disabled = false;
        cmsBtn.textContent = label;
      }
    });

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
      aiOut.textContent = '⏳ Traffic Torching…';

      // Build per-fix HTML snippets from the cached rendered HTML
      const affectedSnippets = {};
      const rawHtmlForSnips = results.dataset.renderedHtml || '';
      if (rawHtmlForSnips && displayFixes.length) {
        const snippetSources = displayFixes.map(f => f.name);
        modules.forEach(m => {
          (m.failed || []).forEach(f => {
            if (!snippetSources.includes(f)) snippetSources.push(f);
          });
        });
        for (const item of snippetSources.slice(0, 5)) {
          try {
            const rule = deriveSelectorsForFailure(item);
            if (rule?.selectors?.length) {
              const snips = extractSnippets(rawHtmlForSnips, rule.selectors, { limit: 2, maxLen: 400 });
              if (snips.length) affectedSnippets[item] = snips.map(s => s.html);
            }
          } catch {}
        }
      }

      try {
        const r = await fetch(AEO_AI_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            auditData: {
              url: url || 'Custom HTML',
              pageTitle,
              headSnapshot: headSnapshot,
              robotsTxt: data.robotsTxt || '',     // FIX: give the AI the actual file
              ...pageContext,
              overallScore: overall,
              grade,
              capApplied,
              capReason,
              cms: {
                name: cmsInfo?.name || 'Custom / Unknown',
                version: cmsInfo?.version || null,
                confidence: cmsInfo?.confidence || 'unknown'
              },
              modules: modules.map(m => ({
                name: m.name,
                score: m.score,
                failed: m.failed || [],
                signals: (m.signals || []).map(s => ({
                  label: s.label,
                  pass: s.pass,
                  informational: s.informational || false
                }))
              })),
              failedItems: failedMetrics.map(f => f.name),
              priorityFixes: displayFixes.map(f => ({
                name: f.name,
                module: f.module,
                score: f.score,
                impact: f.impact,
                desc: f.desc || ''
              })),
              snippets: affectedSnippets,
              browserMetrics: browserMetrics ? {
                cls: browserMetrics.cls,
                lcp: browserMetrics.lcp,
                fcp: browserMetrics.fcp,
                ttfb: browserMetrics.ttfb,
                tbt: browserMetrics.tbt,
                longTasks: browserMetrics.longTasks,
                mutations: browserMetrics.mutations,
                mutationNodes: browserMetrics.mutationNodes,
                totalResources: browserMetrics.totalResources,
                totalTransferSize: browserMetrics.totalTransferSize,
                consoleErrorsCount: browserMetrics.consoleErrors?.length || 0,
                pageErrorsCount: browserMetrics.pageErrors?.length || 0,
                failedRequestsCount: (browserMetrics.failedRequests || []).length,
                renderBlockingRequestsCount: (browserMetrics.renderBlockingRequests || []).length,
                renderBlockingList: (browserMetrics.renderBlockingRequests || []).slice(0, 10).map((r) => ({
                  url: String(r.name || r.url || '').slice(0, 200),
                  type: String(r.type || 'other')
                })),
                failedRequestsList: (browserMetrics.failedRequests || []).slice(0, 10).map((r) => {
                  if (typeof r === 'string') return { url: r.slice(0, 200), failure: '' };
                  return {
                    url: String(r.url || r.name || '').slice(0, 200),
                    failure: String(r.failure || r.errorText || r.status || '').slice(0, 120)
                  };
                }),
                consoleErrorsList: (browserMetrics.consoleErrors || []).slice(0, 5).map((e) => String(e).slice(0, 200))
              } : null
            }
          })
        });
        const d = await r.json();
        if (d.success) {
          let html = renderCodeBlocks(d.answer || '');
          if (Array.isArray(d.warnings) && d.warnings.length) {
            html = `<div style="margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#fef3c7;color:#92400e;font-size:0.85rem;">${d.warnings.join(' ')}</div>` + html;
          }
          aiOut.innerHTML = html;
        } else {
          aiOut.innerHTML = '❌ ' + renderCodeBlocks(d.error || 'Unknown error');
        }
      } catch (err) {
        aiOut.innerHTML = '❌ ' + renderCodeBlocks(err.message);
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = label;
      }
    });

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
        aiFixes: displayFixes.map(f => f.name),
        shareLink: `${window.location.origin}/aeo-performance-tool/?url=${encodeURIComponent(url || '')}`
      });
    }

    // 🏆 Leaderboard submit button — final step, results are in DOM
    if (!payload?.html && url && window.TrafficTorchLeaderboard) {
      const lbHost =
        document.getElementById('share-dashboard-container') ||
        document.getElementById('share-module') ||
        document.getElementById('results') ||
        document.querySelector('main');
      if (lbHost) {
        window.TrafficTorchLeaderboard.injectButton(lbHost, {
          tool: 'aeo-performance-tool',
          url,
          title: (pageTitle || '').trim().slice(0, 200) || 'Untitled page',
          score: overall,
          moduleScores: modules.map(m => ({ name: m.name, score: Math.round(m.score) }))
        });
      }
    }
  }

  /* ─── Live Browser Metrics panel (Puppeteer) ─── */
  function renderBrowserMetricsPanel(bm) {
    if (!bm || !bm.capturedAt) return '';

    // FIX: normalize fields so .toFixed() never throws on undefined.
    const cls            = bm.cls ?? 0;
    const lcp            = bm.lcp ?? 0;
    const fcp            = bm.fcp ?? 0;
    const ttfb           = bm.ttfb ?? 0;
    const longTasks      = bm.longTasks ?? 0;
    const mutations      = bm.mutations ?? 0;
    const mutationNodes  = bm.mutationNodes ?? 0;
    const totalResources = bm.totalResources ?? 0;

    const failedRequests = (bm.failedRequests || []).map(r =>
      typeof r === 'string' ? { url: r, failure: '' } : r
    );
    const renderBlockingRequests = bm.renderBlockingRequests || [];
    const consoleErrors = bm.consoleErrors || [];
    const pageErrors    = bm.pageErrors || [];

    const clsColor  = cls < 0.10 ? 'text-green-600' : cls < 0.25 ? 'text-orange-400' : 'text-red-600';
    const lcpColor  = lcp > 0 && lcp < 2500 ? 'text-green-600' : lcp < 4000 ? 'text-orange-400' : 'text-red-600';
    const fcpColor  = fcp > 0 && fcp < 1800 ? 'text-green-600' : fcp < 3000 ? 'text-orange-400' : 'text-red-600';
    const ttfbColor = ttfb > 0 && ttfb < 800 ? 'text-green-600' : ttfb < 1800 ? 'text-orange-400' : 'text-red-600';

    const fmt = (n) => n == null ? '—' : Math.round(n).toLocaleString();

    return `
      <details class="max-w-5xl mx-auto my-16 px-4">
        <summary class="px-6 py-5 text-2xl text-center font-black bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl cursor-pointer flex justify-center items-center gap-4 shadow-xl hover:shadow-2xl transition-all duration-300">
          <span>🔬 Live Browser Metrics</span>
          <span class="text-sm font-normal opacity-80">Puppeteer + Browser Run</span>
        </summary>
        <div class="mt-8 p-6 md:p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl space-y-8">

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">CLS</p>
              <p class="text-3xl font-black ${clsColor}">${cls.toFixed(3)}</p>
              <p class="text-xs mt-1 text-gray-500">${cls < 0.10 ? 'Good' : cls < 0.25 ? 'Improve' : 'Poor'}</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">LCP</p>
              <p class="text-3xl font-black ${lcpColor}">${fmt(lcp)}</p>
              <p class="text-xs mt-1 text-gray-500">ms</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">FCP</p>
              <p class="text-3xl font-black ${fcpColor}">${fmt(fcp)}</p>
              <p class="text-xs mt-1 text-gray-500">ms</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">TTFB</p>
              <p class="text-3xl font-black ${ttfbColor}">${fmt(ttfb)}</p>
              <p class="text-xs mt-1 text-gray-500">ms</p>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">DOM Mutations</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(mutations)}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">Nodes Changed</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(mutationNodes)}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">Long Tasks</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(longTasks)}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-wider text-gray-500">Resources</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">${fmt(totalResources)}</p>
            </div>
          </div>

          ${(consoleErrors.length + pageErrors.length) > 0 ? `
            <div>
              <h4 class="font-bold text-red-600 mb-3">
                ⚠️ ${consoleErrors.length + pageErrors.length} Error(s) During Render
              </h4>
              <ul class="space-y-1 text-xs font-mono bg-red-50 dark:bg-red-900/20 p-4 rounded-xl max-h-60 overflow-y-auto">
                ${consoleErrors.slice(0, 10).map(e => `<li class="text-red-700 dark:text-red-300">🔴 ${escapeHtml(e)}</li>`).join('')}
                ${pageErrors.slice(0, 10).map(e => `<li class="text-red-700 dark:text-red-300">💥 ${escapeHtml(e)}</li>`).join('')}
              </ul>
            </div>
          ` : `
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
              <p class="text-green-700 dark:text-green-300 font-medium">✅ No console or page errors during render</p>
            </div>
          `}

          ${failedRequests.length ? `
            <div>
              <h4 class="font-bold text-orange-600 mb-3">⚠️ ${failedRequests.length} Failed Request(s)</h4>
              <ul class="space-y-1 text-xs font-mono bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl max-h-60 overflow-y-auto">
                ${failedRequests.slice(0, 10).map(r => `<li class="text-orange-700 dark:text-orange-300">${escapeHtml(r.failure)} — ${escapeHtml(r.url)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${renderBlockingRequests.length ? `
            <div>
              <h4 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🚧 ${renderBlockingRequests.length} Render-Blocking Resource(s)</h4>
              <ul class="space-y-1 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-4 rounded-xl max-h-60 overflow-y-auto">
                ${renderBlockingRequests.slice(0, 10).map(r => `<li class="text-gray-700 dark:text-gray-300">[${escapeHtml(r.type || 'other')}] ${escapeHtml(r.name)}</li>`).join('')}
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