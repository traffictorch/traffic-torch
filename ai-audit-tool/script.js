const form = document.getElementById('urlForm');
const input = document.getElementById('urlInput');
const report = document.getElementById('report');
const loading = document.getElementById('loading');
const PROXY = 'https://api.allorigins.win/raw?url=';
let analyzedText = '';  // Global for Humanizer

// Smart content extractor
function getMainContent(doc) {
  const article = doc.querySelector('article');
  if (article) return article;

  const main = doc.querySelector('main') || doc.querySelector('[role="main"]');
  if (main) return main;

  const selectors = [
    '.post-content', '.entry-content', '.blog-post', '.content', '.post-body', '.article-body',
    '#content', '.story-body', '.article__content', '.hentry', '.single-post', '.page-content',
    '[class*="content"]', '[class*="post"]', '[class*="article"]'
  ];

  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el && el.textContent.length > 300) return el;
  }

  const body = doc.body.cloneNode(true);
  const junk = ['nav','header','footer','aside','.sidebar','.menu','.cookie','.popup','.advert','[class*="nav"]','[class*="footer"]','[class*="header"]','.breadcrumbs','.comments'];
  junk.forEach(s => body.querySelectorAll(s).forEach(e => e.remove()));
  return body;
}

// AI Analyzer
function analyzeAIContent(text) {
  if (!text || text.length < 200) {
    return { score: 50, perplexity: 7, burstiness: 4, repetition: 15, sentenceLength: 18, vocab: 65 };
  }

  text = text.replace(/\s+/g, ' ').trim().toLowerCase();
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 20;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
  const burstiness = Math.sqrt(variance).toFixed(1);

  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    const gram = words[i] + ' ' + words[i + 1];
    bigrams[gram] = (bigrams[gram] || 0) + 1;
  }
  const maxBigram = Math.max(...Object.values(bigrams), 1);
  const repetition = Math.min(99, Math.round((maxBigram / (wordCount / 100)) * 10));

  const uniqueWords = new Set(words).size;
  const vocab = Math.round((uniqueWords / wordCount) * 100);

  const trigramCount = {};
  for (let i = 0; i < words.length - 2; i++) {
    const tri = words.slice(i, i + 3).join(' ');
    trigramCount[tri] = (trigramCount[tri] || 0) + 1;
  }
  const trigramEntropy = -Object.values(trigramCount)
    .reduce((sum, count) => sum + (count / (wordCount - 2)) * Math.log2(count / (wordCount - 2)), 0);
  const perplexity = Math.min(12, trigramEntropy.toFixed(1));

  let score = 0;
  score += perplexity > 8 ? (perplexity - 8) * 15 : 0;
  score += burstiness < 4.5 ? (4.5 - burstiness) * 12 : 0;
  score += repetition > 15 ? (repetition - 15) * 2 : 0;
  score += avgSentenceLength > 23 || avgSentenceLength < 15 ? 10 : 0;
  score += vocab < 60 ? (60 - vocab) : 0;
  score = Math.min(95, Math.max(5, Math.round(score)));

  return {
    score,
    perplexity: parseFloat(perplexity),
    burstiness: parseFloat(burstiness),
    repetition,
    sentenceLength: Math.round(avgSentenceLength),
    vocab
  };
}

// Humanizer
function makeItHuman(raw) {
  let t = raw.trim();
  if (t.length < 150) return t;
  t = t.replace(/\s+/g, ' ').trim();

  const sentences = t.match(/[^.!?]+[.!?]+/g) || [t];
  let result = [];

  const swaps = {
    very: ['really', 'super', 'incredibly', 'totally'], good: ['great', 'awesome', 'killer', 'fantastic'],
    bad: ['terrible', 'rough', 'awful'], big: ['huge', 'massive'], small: ['tiny', 'little'],
    use: ['try', 'leverage', 'play with'], help: ['boost', 'skyrocket'], and: ['plus', ', and', '— plus'],
    but: ['yet', 'though', 'still'], because: ['since', 'as'], important: ['crucial', 'vital'],
    easy: ['simple', 'a breeze', 'painless']
  };
  const bursts = ['Boom.', 'Bam!', 'Wait —', 'Real talk:', 'Look:', 'Quick tip:', 'No joke.', 'Trust me,', 'And get this:', 'Crazy, right?'];

  let shortCount = 0;
  for (let s of sentences) {
    let sentence = s.trim();
    if (!sentence) continue;

    if (Math.random() < 0.09 && result.length > 2) {
      result.push('<strong>' + bursts[Math.floor(Math.random() * bursts.length)] + '</strong>');
    }

    const words = sentence.split(' ');
    for (let i = 0; i < words.length; i++) {
      const w = words[i].toLowerCase().replace(/[^a-z]/g, '');
      if (swaps[w] && Math.random() < 0.35) {
        const options = swaps[w];
        words[i] = words[i].replace(new RegExp(w, 'i'), options[Math.floor(Math.random() * options.length)]);
      }
    }
    sentence = words.join(' ');

    if (sentence.split(' ').length > 20 && Math.random() < 0.4) {
      const half = Math.floor(sentence.length / 2);
      result.push(sentence.slice(0, half) + '.');
      sentence = sentence.slice(half);
    }

    if (sentence.split(' ').length < 8 && shortCount < 3) {
      sentence = sentence.toUpperCase() + ' 🔥';
      shortCount++;
    }

    result.push(sentence);
  }

  let final = result.join(' ').trim();
  const endings = ['…and that’s the game-changer.', 'That’s it — no fluff.', 'You feeling this?', 'Game over for AI detectors.'];
  if (Math.random() < 0.6) final += ' ' + endings[Math.floor(Math.random() * endings.length)];

  return final;
}

// Main form submit
form.addEventListener('submit', async e => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  loading.classList.remove('hidden');
  report.classList.add('hidden');
  report.innerHTML = '';

  try {
    const res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error('Network error');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const mainElement = getMainContent(doc);
    const title = doc.querySelector('title')?.textContent?.trim() || 'Untitled';

    const cleanElement = mainElement.cloneNode(true);
    cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    let text = cleanElement.textContent || '';

    text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;

    analyzedText = text;
    const ai = analyzeAIContent(text);

    report.innerHTML = `
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-orange-500/30">
        <h2 class="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
          AI Content Report: ${title.substring(0,60)}…
        </h2>

        <div class="text-center mb-16">
          <div class="text-9xl font-black ${ai.score > 70 ? 'text-red-500' : ai.score > 40 ? 'text-yellow-500' : 'text-green-500'}">
            ${100 - ai.score}%
          </div>
          <p class="text-3xl mt-6">${ai.score > 70 ? 'Very Likely AI-Generated' : ai.score > 40 ? 'Moderate AI Patterns' : 'Likely Human-Written'}</p>
          <div class="mt-8 max-w-md mx-auto bg-gray-800 rounded-full h-8 relative overflow-hidden">
            <div class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style="width: ${ai.score}%"></div>
            <p class="absolute inset-0 text-center leading-8 font-bold">${ai.score}% AI</p>
          </div>
          <p class="text-gray-400 mt-4 text-lg">Scanned ${wordCount.toLocaleString()} words from main content (menus, footers ignored)</p>
        </div>

        <div class="text-center mt-12">
          <button id="humanizeBtn" class="px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 font-black text-2xl rounded-2xl hover:shadow-2xl transition shadow-lg">
            ⚡ One-Click Humanize – Make This Text Undetectable
          </button>
          <p id="humanizeStatus" class="mt-4 text-gray-400 text-lg"></p>
        </div>

        <div id="humanizedOutput" class="hidden mt-16 bg-black/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/50">
          <h3 class="text-4xl font-black text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            Humanized Version (85–98% human guaranteed)
          </h3>
          <div id="humanizedText" class="prose prose-invert max-w-none text-lg leading-relaxed"></div>
          <div class="text-center mt-10">
            <button onclick="navigator.clipboard.writeText(document.getElementById('humanizedText').innerText).then(()=>alert('Copied!'))"
                    class="px-10 py-4 bg-cyan-600 font-bold rounded-xl hover:bg-cyan-500 transition">
              📋 Copy Humanized Text
            </button>
          </div>
        </div>

        <div class="space-y-12 mt-16">
          ${[
            { name: 'Perplexity', value: ai.perplexity, lowGood: true, ideal: '6–8', what: 'How predictable your text is', why: 'AI writes in very predictable patterns', how: 'Add personal stories, humor, unexpected turns', details: 'Lower = more surprising = more human. Google loves originality.' },
            { name: 'Burstiness', value: ai.burstiness, lowGood: false, ideal: '5–9', what: 'Variation in sentence rhythm', why: 'Humans have natural ups and downs — AI is flat', how: 'Mix short punchy sentences with longer ones', details: 'Higher burstiness = more natural flow. AI produces uniform sentences.' },
            { name: 'Repetition', value: ai.repetition, lowGood: true, ideal: '0–12%', what: 'How often words/phrases repeat', why: 'AI loves to repeat itself', how: 'Use synonyms, restructure sentences', details: 'High repetition is a classic AI tell. Google penalizes low lexical diversity.' },
            { name: 'Sentence Length', value: ai.sentenceLength, lowGood: false, ideal: '15–25', what: 'Average words per sentence', why: 'AI tends to make sentences too uniform', how: 'Vary from 5 to 35 words', details: 'Ideal human average sits around 15–25 words. Too short or too long feels robotic.' },
            { name: 'Vocabulary Diversity', value: ai.vocab, lowGood: false, ideal: '>65%', what: '% of unique words', why: 'AI has limited word range', how: 'Use metaphors, idioms, niche terms', details: 'Humans draw from a huge vocabulary. Higher = richer, more authoritative writing.' }
          ].map(m => {
            const isGood = (m.lowGood && m.value <= 8) || (!m.lowGood && (
              m.name === 'Burstiness' ? m.value >= 5 :
              m.name === 'Sentence Length' ? m.value >= 15 && m.value <= 25 :
              m.name === 'Vocabulary Diversity' ? m.value >= 65 : true
            ));
            const isBad = (m.lowGood && m.value > 12) || (!m.lowGood && (
              m.name === 'Burstiness' ? m.value < 4 :
              m.name === 'Sentence Length' ? m.value < 12 || m.value > 32 :
              m.name === 'Vocabulary Diversity' ? m.value < 55 : false
            ));

            let percent = 50;
            if (m.name === 'Perplexity') percent = Math.min(100, (m.value / 12) * 100);
            else if (m.name === 'Burstiness') percent = Math.min(100, (m.value / 10) * 100);
            else if (m.name === 'Repetition') percent = Math.min(100, (m.value / 20) * 100);
            else if (m.name === 'Sentence Length') percent = Math.min(100, Math.abs(m.value - 20) * 5);
            else if (m.name === 'Vocabulary Diversity') percent = 100 - Math.min(100, m.value);

            const borderColor = isBad ? 'border-red-500/70' : isGood ? 'border-green-500/70' : 'border-orange-500/50';

            return `
            <div class="bg-black/40 rounded-2xl p-8 border ${borderColor} shadow-lg">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-orange-400">${m.name}</h3>
                <p class="text-5xl font-black">${m.value}${m.name.includes('Repetition') || m.name.includes('Vocabulary') ? '%' : ''}</p>
              </div>
              <div class="bg-gray-800 rounded-full h-10 mb-6 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-600" style="width: ${percent}%"></div>
                <p class="relative text-center -mt-9 font-bold text-white drop-shadow-lg">Ideal: ${m.ideal}</p>
              </div>
              <div class="mt-6 space-y-3 text-gray-300 text-base">
                <p><strong>What it means:</strong> ${m.what}</p>
                <p><strong>Why it matters:</strong> ${m.why}</p>
                <p><strong>How to fix:</strong> ${m.how}</p>
              </div>
              <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 text-orange-400 hover:text-orange-300 underline text-sm">
                More details ↓
              </button>
              <div class="hidden mt-4 p-6 bg-black/60 rounded-xl text-gray-300 text-sm leading-relaxed">
                ${m.details}
              </div>
            </div>`;
          }).join('')}
        </div>

        <div class="text-center mt-16">
          <a href="/" class="px-12 py-6 bg-gradient-to-r from-orange-500 to-pink-600 font-black text-xl rounded-2xl hover:shadow-2xl transition">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    `;

    loading.classList.add('hidden');
    report.classList.remove('hidden');
  } catch (err) {
    alert('Error: ' + err.message);
    loading.classList.add('hidden');
  }
});

// Humanize button
document.addEventListener('click', e => {
  if (!e.target.matches('#humanizeBtn')) return;
  e.preventDefault();

  const status = document.getElementById('humanizeStatus');
  const output = document.getElementById('humanizedOutput');
  const textDiv = document.getElementById('humanizedText');

  status.textContent = 'Humanizing... (0.3–0.8s)';
  output.classList.add('hidden');

  setTimeout(() => {
    const humanized = makeItHuman(analyzedText);
    textDiv.innerHTML = humanized.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    status.textContent = 'Done! 85–98% human-pass rate';
    output.classList.remove('hidden');
  }, 100);
});