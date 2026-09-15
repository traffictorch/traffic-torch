// code-snippet-v1.0.js
//
// "Show the code" evidence module for the Traffic Torch AI Audit Tool.
//
// The AI Audit Tool's failures are TEXT statistics (entropy, burstiness,
// repetition, sentence length, vocabulary) — not DOM issues — so the evidence
// this module surfaces is derived from the *text* of the audited page, not
// from querySelectorAll on the parsed HTML.
//
// The modal uses a native <dialog> element opened with showModal(), so it is
// immune to any CSS containment (contain: paint) applied by host page layouts.

const SNIPPET_MAX = 800;

// ─────────────────────────────────────────────────────────────────────────────
// Failure-pattern → evidence rules
// ─────────────────────────────────────────────────────────────────────────────
const RULES = [
  {
    test: /trigram entropy/i,
    kind: 'commonNgrams', n: 3, limit: 15,
    note: 'Low trigram entropy means the same three-word sequences keep appearing. ' +
          'Below are the most frequent 3-word sequences in the extracted page text — ' +
          'high counts are the smoking gun.'
  },
  {
    test: /bigram entropy/i,
    kind: 'commonNgrams', n: 2, limit: 20,
    note: 'Low bigram entropy means the same two-word pairs keep appearing. ' +
          'Below are the most frequent 2-word sequences in the extracted page text.'
  },
  {
    test: /sentence length variation/i,
    kind: 'sentenceLengths', limit: 12,
    note: 'Low variation means your sentences are all similar in length. ' +
          'Below is a sample of sentences from shortest to longest — if they cluster ' +
          'around one number, that is the AI tell.'
  },
  {
    test: /word length burstiness/i,
    kind: 'wordLengths',
    note: 'Low burstiness means your words are all similar in length. ' +
          'Below is the distribution of word lengths in your text.'
  },
  {
    test: /bigram repetition/i,
    kind: 'repeatedNgram', n: 2, limit: 8,
    note: 'The same two-word phrase is repeating too often. ' +
          'Below are the top repeated bigrams in your text.'
  },
  {
    test: /trigram repetition/i,
    kind: 'repeatedNgram', n: 3, limit: 8,
    note: 'The same three-word phrase is repeating too often. ' +
          'Below are the top repeated trigrams in your text.'
  },
  {
    test: /average length/i,
    kind: 'sentenceLengths', limit: 12,
    note: 'Average sentence length is outside the ideal 15–23 word range. ' +
          'Below is a sample of sentences from shortest to longest.'
  },
  {
    test: /sentence complexity/i,
    kind: 'commaCounts', limit: 10,
    note: 'Low complexity means sentences lack subordinate clauses. ' +
          'Below are your lowest-comma sentences — these are the ones flattening the score.'
  },
  {
    test: /diversity/i,
    kind: 'wordFrequency', limit: 20,
    note: 'Low vocabulary diversity means the same words keep appearing. ' +
          'Below are the most repeated words (3+ characters) in your text.'
  },
  {
    test: /rare word frequency/i,
    kind: 'wordFrequency', limit: 20,
    note: 'Low rare-word frequency means few unique words appear only once. ' +
          'Below are your most-repeated words — high counts crowd out rare vocabulary.'
  }
];

export function deriveSelectorsForFailure(text) {
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.test.test(text)) return rule;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML → text extraction (cached per distinct HTML string)
// ─────────────────────────────────────────────────────────────────────────────
let _cachedDoc = null;
let _cachedHtmlRef = null;
let _cachedText = null;

function getDoc(html) {
  if (!html) return null;
  if (_cachedDoc && _cachedHtmlRef === html) return _cachedDoc;
  try {
    _cachedDoc = new DOMParser().parseFromString(html, 'text/html');
    _cachedHtmlRef = html;
    _cachedText = null;
    return _cachedDoc;
  } catch {
    _cachedDoc = null;
    _cachedHtmlRef = null;
    _cachedText = null;
    return null;
  }
}

function getText(html) {
  if (!html) return '';
  if (_cachedText !== null && _cachedHtmlRef === html) return _cachedText;
  const doc = getDoc(html);
  if (!doc || !doc.body) return '';
  const body = doc.body.cloneNode(true);
  body.querySelectorAll('script, style, noscript, template').forEach(el => el.remove());
  _cachedText = (body.textContent || '').replace(/\s+/g, ' ').trim();
  return _cachedText;
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-statistics helpers
// ─────────────────────────────────────────────────────────────────────────────
function tokenizeWords(text) {
  return (text || '').split(/\s+/).filter(w => w.length > 0);
}

function tokenizeSentences(text) {
  return (text || '').match(/[^.!?]+[.!?]+/g) || [];
}

function countNgrams(words, n) {
  const counts = new Map();
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(' ').toLowerCase();
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }
  return counts;
}

function topNgrams(words, n, limit) {
  const counts = countNgrams(words, n);
  return Array.from(counts.entries())
    .map(([gram, count]) => ({ gram, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function sampleEvenly(arr, limit) {
  if (arr.length <= limit) return arr.slice();
  const out = [];
  for (let i = 0; i < limit; i++) {
    const idx = Math.round(i * (arr.length - 1) / (limit - 1));
    out.push(arr[idx]);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence builders — each returns [{ selector, html }, ...]
// ─────────────────────────────────────────────────────────────────────────────
function evidenceCommonNgrams(text, rule) {
  const words = tokenizeWords(text.toLowerCase());
  if (words.length < rule.n) return [];
  const top = topNgrams(words, rule.n, rule.limit || 10);
  if (!top.length) return [];
  return top.map(t => ({
    selector: `appears ${t.count}×`,
    html: t.gram
  }));
}

function evidenceRepeatedNgram(text, rule) {
  const words = tokenizeWords(text.toLowerCase());
  if (words.length < rule.n) return [];
  const top = topNgrams(words, rule.n, rule.limit || 8).filter(t => t.count > 1);
  if (!top.length) {
    return [{
      selector: 'no repeats found',
      html: `No ${rule.n}-word sequence appears more than once in the extracted text.`
    }];
  }
  return top.map(t => ({
    selector: `appears ${t.count}×`,
    html: t.gram
  }));
}

function evidenceSentenceLengths(text, rule) {
  const sentences = tokenizeSentences(text);
  if (!sentences.length) return [];
  const withLengths = sentences.map(s => ({
    text: s.trim(),
    length: s.split(/\s+/).filter(w => w.length).length
  }));
  withLengths.sort((a, b) => a.length - b.length);
  const picked = sampleEvenly(withLengths, rule.limit || 12);
  return picked.map(s => ({
    selector: `${s.length} words`,
    html: s.text
  }));
}

function evidenceWordLengths(text) {
  const words = tokenizeWords(text);
  if (!words.length) return [];
  const histogram = {};
  words.forEach(w => {
    const len = w.length;
    histogram[len] = (histogram[len] || 0) + 1;
  });
  const entries = Object.entries(histogram)
    .map(([len, count]) => ({ len: Number(len), count }))
    .sort((a, b) => a.len - b.len);
  const maxCount = Math.max(...entries.map(e => e.count));
  const lines = entries.map(e => {
    const bar = '█'.repeat(Math.max(1, Math.round((e.count / maxCount) * 40)));
    return `${String(e.len).padStart(2, ' ')} chars │ ${bar} ${e.count}`;
  });
  return [{
    selector: `word-length distribution (${words.length} words)`,
    html: lines.join('\n')
  }];
}

function evidenceCommaCounts(text, rule) {
  const sentences = tokenizeSentences(text);
  if (!sentences.length) return [];
  const withCommas = sentences.map(s => ({
    text: s.trim(),
    commas: (s.match(/,/g) || []).length
  }));
  withCommas.sort((a, b) => a.commas - b.commas);
  const picked = withCommas.slice(0, rule.limit || 10);
  return picked.map(s => ({
    selector: `${s.commas} comma${s.commas === 1 ? '' : 's'}`,
    html: s.text
  }));
}

function evidenceWordFrequency(text, rule) {
  const words = tokenizeWords(text.toLowerCase()).filter(w => w.length > 2);
  if (!words.length) return [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const sorted = Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  const repeated = sorted.filter(w => w.count > 1);
  const picked = repeated.slice(0, rule.limit || 20);
  if (!picked.length) {
    return [{
      selector: 'all words unique',
      html: 'No word of 3+ characters appears more than once. Vocabulary is already highly diverse.'
    }];
  }
  return picked.map(w => ({
    selector: `${w.count}×`,
    html: w.word
  }));
}

function extractEvidence(text, rule) {
  if (!text || !rule?.kind) return [];
  switch (rule.kind) {
    case 'commonNgrams':    return evidenceCommonNgrams(text, rule);
    case 'repeatedNgram':   return evidenceRepeatedNgram(text, rule);
    case 'sentenceLengths': return evidenceSentenceLengths(text, rule);
    case 'wordLengths':     return evidenceWordLengths(text, rule);
    case 'commaCounts':     return evidenceCommaCounts(text, rule);
    case 'wordFrequency':   return evidenceWordFrequency(text, rule);
    default:                return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal (native <dialog> — always centers on screen, immune to contain: paint)
// ─────────────────────────────────────────────────────────────────────────────
const MODAL_ID = 'code-snippet-modal';

export function initCodeSnippetModal() {
  if (document.getElementById(MODAL_ID)) return;
  injectStyles();

  const dialog = document.createElement('dialog');
  dialog.id = MODAL_ID;
  dialog.className = 'cs-dialog';
  dialog.innerHTML = `
    <button type="button" class="cs-dialog__close" data-close aria-label="Close">×</button>
    <h3 class="cs-dialog__title">Affected code</h3>
    <div class="cs-dialog__body"></div>
  `;
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
  });
  document.body.appendChild(dialog);
}

function injectStyles() {
  if (document.getElementById('cs-dialog-styles')) return;
  const style = document.createElement('style');
  style.id = 'cs-dialog-styles';
  style.textContent = `
    .cs-dialog {
      margin: auto;
      padding: 22px;
      border: none;
      border-radius: 12px;
      background: #fff;
      color: #111827;
      max-width: 760px;
      width: 92vw;
      max-height: 82vh;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.4);
    }
    .cs-dialog::backdrop {
      background: rgba(15,23,42,.7);
    }
    .dark .cs-dialog {
      background: #0f172a;
      color: #e5e7eb;
    }
    .cs-dialog__title {
      margin: 0 0 14px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .01em;
      text-transform: uppercase;
      color: #ea580c;
    }
    .cs-dialog__close {
      position: absolute;
      top: 10px; right: 12px;
      width: 30px; height: 30px;
      border: none; background: transparent;
      font-size: 22px; line-height: 1;
      cursor: pointer; color: #6b7280;
      border-radius: 6px;
    }
    .cs-dialog__close:hover { background: #f3f4f6; color: #111827; }
    .dark .cs-dialog__close:hover { background: #1e293b; color: #f9fafb; }
    .cs-dialog__body {
      overflow-y: auto;
      max-height: calc(82vh - 70px);
    }
    .cs-note {
      margin: 0 0 16px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fef3c7;
      color: #78350f;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .dark .cs-note {
      background: #422006;
      color: #fde68a;
    }
    .cs-item { margin-bottom: 12px; }
    .cs-item__selector {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
      word-break: break-all;
    }
    .dark .cs-item__selector { color: #94a3b8; }
    .cs-item__pre {
      margin: 0;
      padding: 12px 14px;
      border-radius: 8px;
      background: #1e293b;
      color: #e2e8f0;
      font-family: ui-monospace, Menlo, monospace;
      font-size: 12.5px;
      line-height: 1.55;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 260px;
      overflow-y: auto;
    }
    .cs-empty {
      font-style: italic;
      color: #6b7280;
      padding: 14px 0;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

function renderSnippets(snippets, note) {
  const noteHtml = note ? `<p class="cs-note">${escapeHtml(note)}</p>` : '';
  if (!snippets.length) {
    return noteHtml + `<p class="cs-empty">No matching evidence found in the extracted text.</p>`;
  }
  return noteHtml + snippets.map(s => `
    <div class="cs-item">
      <div class="cs-item__selector">${escapeHtml(s.selector)}</div>
      <pre class="cs-item__pre"><code>${escapeHtml(s.html)}</code></pre>
    </div>
  `).join('');
}

export function openCodeSnippetModal({ title = 'Affected code', snippets = [], note = '' } = {}) {
  const dialog = document.getElementById(MODAL_ID);
  if (!dialog) return;
  dialog.querySelector('.cs-dialog__title').textContent = title;
  dialog.querySelector('.cs-dialog__body').innerHTML = renderSnippets(snippets, note);
  if (typeof dialog.showModal === 'function') {
    if (dialog.open) dialog.close();
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
  document.body.style.overflow = 'hidden';
}

export function closeCodeSnippetModal() {
  const dialog = document.getElementById(MODAL_ID);
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  document.body.style.overflow = '';
}

export function showCodeForFailure(failureText, html, { title } = {}) {
  const rule = deriveSelectorsForFailure(failureText);
  let snippets = [];
  if (rule?.kind) {
    const text = getText(html);
    snippets = extractEvidence(text, rule);
  }
  openCodeSnippetModal({
    title: title || failureText || 'Affected code',
    snippets,
    note: rule?.note || ''
  });
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}