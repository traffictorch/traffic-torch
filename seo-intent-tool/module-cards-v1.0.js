// seo-intent-tool/module-cards-v1.0.js
//
// Pure renderer for the score-card grid.
// Receives raw audit data + a getGrade() helper, returns an HTML string.
// No side-effects, no listeners — the delegated click handler lives in script-v1.4.js.

import { fixFor } from './module-explanations-v1.0.js';
import { deriveSelectorsForFailure } from './code-snippet-v1.0.js';

const HELP_GUIDE_BASE = 'https://traffictorch.net/blog/posts/seo-intent-help-guide';

const MODULE_META = {
  experience:        { slug: 'experience',        label: 'Experience' },
  expertise:         { slug: 'expertise',         label: 'Expertise' },
  authoritativeness: { slug: 'authoritativeness', label: 'Authoritativeness' },
  trustworthiness:   { slug: 'trustworthiness',   label: 'Trustworthiness' },
  depth:             { slug: 'depth',             label: 'Content Depth' },
  readability:       { slug: 'readability',       label: 'Readability' },
  schema:            { slug: 'schema',            label: 'Schema Markup' }
};

// Signal labels for the inline metric list. Keys must match the metrics object
// returned by each analyzer module.
const EEAT_SIGNALS = {
  experience: [
    { key: 'firstPerson',   label: 'First-person language' },
    { key: 'anecdotes',     label: 'Personal anecdotes' },
    { key: 'timelines',     label: 'Timeline mentions' },
    { key: 'personalMedia', label: 'Original media' }
  ],
  expertise: [
    { key: 'byline',      label: 'Author byline' },
    { key: 'bio',         label: 'Author bio' },
    { key: 'credentials', label: 'Credentials' },
    { key: 'citations',   label: 'Citations' }
  ],
  authoritativeness: [
    { key: 'awards',     label: 'Awards & mentions' },
    { key: 'aboutLinks', label: 'About/Team links' }
  ],
  trustworthiness: [
    { key: 'https',      label: 'HTTPS' },
    { key: 'contact',    label: 'Contact info' },
    { key: 'policies',   label: 'Privacy & Terms' },
    { key: 'updateDate', label: 'Update date' }
  ]
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function buildEeatSignals(modKey, metrics, getGrade) {
  const defs = EEAT_SIGNALS[modKey] || [];
  return defs.map(d => {
    const value = (metrics && metrics[d.key] != null) ? metrics[d.key] : 0;
    return { label: d.label, value, grade: getGrade(value) };
  });
}

function buildSingleSignal(label, gradeInput, gradeType, getGrade) {
  const grade = getGrade(gradeInput, gradeType);
  return [{ label, value: gradeInput, grade }];
}

// Fails first, then warnings, then passes.
function sortSignals(signals) {
  const fail = signals.filter(s => s.grade.text === 'Needs Work');
  const warn = signals.filter(s => s.grade.text === 'Good');
  const pass = signals.filter(s => s.grade.text === 'Excellent');
  return [...fail, ...warn, ...pass];
}

function renderSignalLine(s) {
  return `<p class="${s.grade.color} font-medium leading-snug">${s.grade.emoji} ${escapeHtml(s.label)}</p>`;
}

function renderFixesPanel(failedItems, modMeta) {
  const footer = renderPanelFooter(modMeta, failedItems);

  if (!failedItems.length) {
    return `<div class="fixes-panel hidden mt-4 text-left text-sm">
      <p class="text-green-600 dark:text-green-400 font-medium mb-2">✅ All signals strong — no fixes required.</p>
      ${footer}
    </div>`;
  }

  const blocks = failedItems.map((title, i) => {
    const sep  = i === 0 ? '' : 'border-t border-gray-200 dark:border-gray-700 pt-4 mt-4';
    const rule = deriveSelectorsForFailure(title);
    return `<div class="${sep}">
      <p class="font-bold text-red-600 dark:text-red-400 mb-2 leading-snug">${escapeHtml(title)}</p>
      <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(fixFor(title))}</p>
      ${rule ? `
        <button type="button"
                class="show-code-btn mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                data-failure="${escapeHtml(title)}">
          🔍 Show the code
        </button>
      ` : ''}
    </div>`;
  }).join('');

  return `<div class="fixes-panel hidden mt-4 text-left text-sm">
    ${blocks}
    ${footer}
  </div>`;
}

function renderPanelFooter(modMeta, failedItems) {
  const guideUrl  = `${HELP_GUIDE_BASE}/#${modMeta.slug}`;
  const failedList = failedItems.join('; ');
  const question  = `How do I improve my ${modMeta.label} score?` +
                    (failedList ? ` Failed checks: ${failedList}` : '');

  return `<div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
    <a href="#ask-ai-section"
       class="ask-ai-link block font-semibold text-purple-600 dark:text-purple-400 hover:underline"
       data-ai-question="${escapeHtml(question)}">
      🤖 Ask AI about this module →
    </a>
    <a href="${guideUrl}"
       target="_blank" rel="noopener"
       class="block font-semibold text-orange-600 dark:text-orange-400 hover:underline">
      📖 Read the full ${escapeHtml(modMeta.label)} guide →
    </a>
  </div>`;
}

function renderCard(mod, getGrade) {
  const meta        = MODULE_META[mod.modKey];
  const grade       = getGrade(mod.gradeInput, mod.gradeType);
  const border      = grade.text === 'Excellent' ? 'border-green-500'
                    : grade.text === 'Good'      ? 'border-orange-400'
                    :                              'border-red-500';
  const color       = grade.text === 'Excellent' ? '#22c55e'
                    : grade.text === 'Good'      ? '#f97316'
                    :                              '#ef4444';
  const sorted      = sortSignals(mod.signals);
  const failedItems = mod.failedItems || [];

  const btnLabel = failedItems.length
    ? `Show Fixes (${failedItems.length})`
    : 'All Clear';

  return `<div class="score-card flex flex-col text-center p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${border}">
    <div class="relative mx-auto w-32 h-32">
      <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
        <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
        <circle cx="64" cy="64" r="56"
                stroke="${color}"
                stroke-width="12" fill="none"
                stroke-dasharray="${(mod.score / 100) * 352} 352"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${color};">
        ${mod.score}
      </div>
    </div>

    <p class="${grade.color} text-xl font-bold mt-4">${grade.emoji} ${grade.text}</p>
    <p class="mt-3 text-lg font-medium text-gray-800 dark:text-gray-200">${escapeHtml(meta.label)}</p>

    ${mod.detail ? `<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${escapeHtml(mod.detail)}</p>` : ''}

    <div class="mt-3 space-y-1 text-sm text-left max-w-xs mx-auto">
      ${sorted.map(renderSignalLine).join('')}
    </div>

    <div class="mt-auto pt-5">
      <button type="button"
              class="fixes-toggle w-full mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold transition-colors"
              data-failed-count="${failedItems.length}">
        ${btnLabel}
      </button>
    </div>

    ${renderFixesPanel(failedItems, meta)}
  </div>`;
}

// ─── Public API ─────────────────────────────────────────────────────────────
export function renderModuleCards(data, getGrade) {
  // E-E-A-T row (4 cards) -----------------------------------------------
  const eeat = [
    { modKey: 'experience',        score: data.experience.score,        metrics: data.experience.metrics,        failed: data.experience.failed },
    { modKey: 'expertise',         score: data.expertise.score,         metrics: data.expertise.metrics,         failed: data.expertise.failed },
    { modKey: 'authoritativeness', score: data.authoritativeness.score, metrics: data.authoritativeness.metrics, failed: data.authoritativeness.failed },
    { modKey: 'trustworthiness',   score: data.trustworthiness.score,   metrics: data.trustworthiness.metrics,   failed: data.trustworthiness.failed }
  ].map(m => ({
    modKey:      m.modKey,
    score:       m.score,
    gradeInput:  m.score,
    gradeType:   undefined,
    signals:     buildEeatSignals(m.modKey, m.metrics, getGrade),
    failedItems: m.failed || []
  }));

  // Depth / Readability / Schema row (3 cards) --------------------------
  const words          = data.depth.words;
  const readabilityRaw = data.readability.raw;
  const schemaCount    = data.schema.types.length;

  const depthFailed = words >= 1500
    ? []
    : [`Content is under 1,500 words (currently ${words.toLocaleString()})`];

  const readabilityFailed = (readabilityRaw >= 60 && readabilityRaw <= 70)
    ? []
    : [`Flesch Reading Ease is ${readabilityRaw} (target 60–70)`];

  const schemaFailed = schemaCount >= 2
    ? []
    : [`${schemaCount === 0 ? 'No' : 'Only 1'} schema type detected (target 2+)`];

  const singles = [
    {
      modKey: 'depth',
      score:       data.depth.normalized,
      gradeInput:  words,
      gradeType:   'depth',
      detail:      `${words.toLocaleString()} words`,
      signals:     buildSingleSignal('Word count', words, 'depth', getGrade),
      failedItems: depthFailed
    },
    {
      modKey: 'readability',
      score:       data.readability.normalized,
      gradeInput:  readabilityRaw,
      gradeType:   'readability',
      detail:      `Flesch ${readabilityRaw}`,
      signals:     buildSingleSignal('Flesch Reading Ease', readabilityRaw, 'readability', getGrade),
      failedItems: readabilityFailed
    },
    {
      modKey: 'schema',
      score:       data.schema.normalized,
      gradeInput:  schemaCount,
      gradeType:   'schema',
      detail:      schemaCount === 0
                     ? 'None detected'
                     : `${schemaCount} type${schemaCount > 1 ? 's' : ''}: ${data.schema.types.join(', ')}`,
      signals:     buildSingleSignal('Schema types', schemaCount, 'schema', getGrade),
      failedItems: schemaFailed
    }
  ];

  return `
    <!-- E-E-A-T Breakdown -->
    <div class="grid md:grid-cols-4 gap-6 my-16">
      ${eeat.map(m => renderCard(m, getGrade)).join('')}
    </div>

    <!-- Content Depth + Readability + Schema Detected -->
    <div class="grid md:grid-cols-3 gap-8 my-16">
      ${singles.map(m => renderCard(m, getGrade)).join('')}
    </div>
  `;
}