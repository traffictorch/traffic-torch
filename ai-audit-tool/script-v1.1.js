// ai-audit-tool/script-v1.1.js

import { computePerplexity } from './modules/perplexity.js';
import { computeBurstiness } from './modules/burstiness.js';
import { computeRepetition } from './modules/repetition.js';
import { computeSentenceLength } from './modules/sentenceLength.js';
import { computeVocabulary } from './modules/vocabulary.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/?url=';
  let analyzedText = '';
  let wordCount = 0;

  function getMainContent(doc) {
    const main = doc.querySelector('main, [role="main"], article, .main-content, .site-content, .content-area');
    if (main && main.textContent.trim().length > 600) return main;

    const candidates = doc.querySelectorAll('div, section, article');
    let best = null;
    let bestScore = 0;

    candidates.forEach(el => {
      if (el.closest('header, nav, footer, aside, .menu, .sidebar')) return;
      const paragraphs = el.querySelectorAll('p');
      const textLength = el.textContent.trim().length;
      const pCount = paragraphs.length;
      const score = pCount * 100 + textLength;
      if (score > bestScore && textLength > 600 && textLength < 20000) {
        bestScore = score;
        best = el;
      }
    });

    if (best) return best;

    const body = doc.body.cloneNode(true);
    const removeSelectors = 'header, nav, footer, aside, .menu, .navbar, .sidebar, .cookie-banner, .popup, .social-links, .breadcrumbs';
    body.querySelectorAll(removeSelectors).forEach(e => e.remove());
    return body;
  }

  function analyzeAIContent(text) {
    if (!text || text.length < 200) {
      return { moduleScores: [10,10,10,10,10], totalScore: 50 };
    }

    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    wordCount = words.length;

    const perplexity = computePerplexity(words);
    const burstiness = computeBurstiness(sentences, words);
    const repetition = computeRepetition(words);
    const sentenceLength = computeSentenceLength(sentences);
    const vocabulary = computeVocabulary(words, wordCount);

    const moduleScores = [
      perplexity.moduleScore,
      burstiness.moduleScore,
      repetition.moduleScore,
      sentenceLength.moduleScore,
      vocabulary.moduleScore
    ];

    const totalScore = moduleScores.reduce((a, b) => a + b, 0);

    return {
      moduleScores,
      totalScore,
      details: {
        perplexity: perplexity.details,
        burstiness: burstiness.details,
        repetition: repetition.details,
        sentenceLength: sentenceLength.details,
        vocabulary: vocabulary.details
      }
    };
  }

  function getGradeColor(humanNormalized10) {
    if (humanNormalized10 >= 8.0) return '#10b981'; // green
    if (humanNormalized10 >= 5.0) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  function getOverallEmojiGrade(score) {
    if (score >= 80) return { emoji: '✅', text: 'Likely Human', color: '#10b981' };
    if (score >= 50) return { emoji: '⚠️', text: 'Moderate AI Patterns', color: '#f97316' };
    return { emoji: '❌', text: 'Very Likely AI', color: '#ef4444' };
  }

  function getModuleGrade(score) {
    if (score === 20) return { emoji: '✅', text: 'Excellent', color: '#10b981' };
    if (score === 10) return { emoji: '⚠️', text: 'Good', color: '#f97316' };
    return { emoji: '❌', text: 'Needs Work', color: '#ef4444' };
  }

  function getSubEmoji(score) {
    return score === 10 ? '✅' : '❌';
  }

  function getSubColor(score) {
    return score === 10 ? '#10b981' : '#ef4444';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    const urlToFetch = normalizedUrl;
    if (!url) return;

    results.innerHTML = `
      <div class="py-0 text-center">
        <div class="inline-block w-16 h-16 mb-8">
          <svg viewBox="0 0 100 100" class="animate-spin text-orange-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
          </svg>
        </div>
        <p id="progressText" class="text-2xl font-bold text-orange-600 dark:text-orange-400">Fetching page...</p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">Analyzing content for AI patterns – please wait</p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progressText');
    const messages = [
      "Fetching page...",
      "Extracting main content",
      "Analyzing predictability",
      "Measuring variation & rhythm",
      "Checking repetition patterns",
      "Evaluating structure & depth",
      "Assessing vocabulary richness",
      "Calculating final score..."
    ];
    let delay = 800;
    messages.forEach(msg => {
      setTimeout(() => {
        if (progressText) progressText.textContent = msg;
      }, delay);
      delay += 800;
    });

    const minLoadTime = 5500;
    const startTime = Date.now();

    try {
      const res = await fetch(PROXY + encodeURIComponent(urlToFetch));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const mainElement = getMainContent(doc);
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      let text = cleanElement.textContent || '';
      text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
      wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;

      const analysis = analyzeAIContent(text);
      const yourScore = analysis.totalScore;
      const mainGrade = getOverallEmojiGrade(yourScore);
      const mainGradeColor = mainGrade.color;
      const verdict = mainGrade.text;
      const verdictEmoji = mainGrade.emoji;

      // Define the 5 core AI Audit modules with correct scores
      const modules = [
        { name: 'Perplexity', score: analysis.moduleScores[0] },
        { name: 'Burstiness', score: analysis.moduleScores[1] },
        { name: 'Repetition', score: analysis.moduleScores[2] },
        { name: 'Sentence Length', score: analysis.moduleScores[3] },
        { name: 'Vocabulary', score: analysis.moduleScores[4] }
      ];

      const scores = modules.map(m => m.score); // for radar chart
      const failingModules = modules.filter(m => m.score < 20).length;
      const boost = failingModules * 15;
      const optimizedScore = Math.min(100, yourScore + boost);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        // Scroll to results
        const offset = 240;
        const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        results.innerHTML = `
<!-- Overall Score Card (AI Audit) -->
<div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall AI Audit Score</p>
    <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(yourScore / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
            ${yourScore}
          </div>
          <div class="text-lg sm:text-xl opacity-80 -mt-1"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>
    ${(() => {
      const title = (doc?.title || '').trim();
      if (!title) return '';
      const truncated = title.length > 65 ? title.substring(0, 65) : title;
      return `<p class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>`;
    })()}
    ${(() => {
      const gradeText = yourScore >= 80 ? 'Excellent' : yourScore >= 60 ? 'Needs Improvement' : 'Needs Work';
      const gradeEmoji = yourScore >= 80 ? '✅' : yourScore >= 60 ? '⚠️' : '❌';
      const gradeColor = yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
      return `<p class="${gradeColor} text-4xl sm:text-5xl font-bold text-center mt-4 sm:mt-6 drop-shadow-lg">${gradeEmoji} ${gradeText}</p>`;
    })()}
  </div>
</div>

<!-- On-Page Health Radar Chart -->
<div class="max-w-5xl mx-auto my-16 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
    <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">On-Page Health Radar</h3>
    <div class="hidden md:block w-full">
      <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
      Radar chart available on desktop/tablet
    </p>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
      Visual overview of your page performance across 5 key SEO Intent factors
    </p>
  </div>
</div>

<!-- Metrics Layout -->
<div class="space-y-8">
  <!-- Perplexity - Full width -->
  <div class="max-w-2xl mx-auto">
    ${(() => {
      const m = {
        name: 'Perplexity',
        score: analysis.moduleScores[0],
        details: analysis.details.perplexity,
        info: 'Measures how unpredictable your text is through bigram and trigram entropy calculations. High entropy indicates varied and surprising word sequences, which are hallmarks of human writing. AI-generated text often has lower entropy due to its reliance on common patterns.',
        fixes: {
          trigram: analysis.details.perplexity.scores.trigram < 10 ? 'To improve trigram entropy, deliberately introduce unexpected word combinations and personal anecdotes that don’t follow common patterns. This breaks predictable flows and makes your writing feel more spontaneous and human. Avoid sticking to safe, formulaic phrasing—edit specifically for surprise in every few sentences.' : '',
          bigram: analysis.details.perplexity.scores.bigram < 10 ? 'Boost bigram entropy by actively swapping overused two-word pairs with creative alternatives or rephrased expressions. Incorporate transitional phrases that aren’t common and sprinkle in idiomatic expressions unique to your voice. These small changes create a less robotic rhythm and significantly increase overall unpredictability.' : ''
        }
      };
      const grade = getModuleGrade(m.score);
      const gradeColor = grade.color;
      const failedCount = Object.values(m.fixes).filter(f => f).length;
      const sub1Score = m.details.scores.trigram;
      const sub2Score = m.details.scores.bigram;
      return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4" style="border-left-color: ${gradeColor}">
        <div class="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 160 160" class="-rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb dark:#4b5563" stroke-width="16" fill="none"/>
            <circle cx="80" cy="80" r="70" stroke="${gradeColor}" stroke-width="16" fill="none"
                    stroke-dasharray="${m.score * 22} 440" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-5xl font-bold" style="color: ${gradeColor}">${m.score}</div>
            <div class="text-lg text-gray-500 dark:text-gray-400">/20</div>
          </div>
        </div>
        <p class="mt-6 text-2xl font-bold" style="color: ${gradeColor}">${m.name}</p>
        <p class="mt-2 text-xl flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
        <div class="mt-4 space-y-3 text-base">
          <p class="font-medium" style="color: ${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)} Trigram Entropy</p>
          <p class="font-medium" style="color: ${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)} Bigram Entropy</p>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          More Details
        </button>
        <div class="hidden mt-6 space-y-6 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          <p class="text-center mb-8"><a href="#perplexity" class="text-orange-500 font-bold hover:underline">How Perplexity is tested? →</a></p>
          <p><span class="font-bold text-blue-600 dark:text-blue-400">What it is:</span> ${m.info}</p>
          <p><span class="font-bold text-green-600 dark:text-green-400">How to Improve Overall:</span> Use varied phrasing, personal anecdotes, and unexpected ideas to boost scores. Mix short and long elements for rhythm, and incorporate synonyms or rarer words. Always edit with readability in mind to align with human patterns.</p>
          <p><span class="font-bold text-orange-600 dark:text-orange-400">Why it matters:</span> Search engines prioritize human-like content for higher rankings and user trust. Strong scores here reduce AI penalties and improve engagement metrics. Ultimately, this leads to better organic traffic and authority signals.</p>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          Show Fixes (${failedCount})
        </button>
        <div class="hidden mt-6 space-y-8">
          ${failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">All tests passed! ✅</p>` : ''}
          ${sub1Score < 10 ? `
            <div class="text-center">
              <div class="text-5xl mb-3" style="color: ${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)}</div>
              <p class="font-bold text-xl mb-3" style="color: ${getSubColor(sub1Score)}">Trigram Entropy</p>
              <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">${m.fixes.trigram}</p>
            </div>` : ''}
          ${sub2Score < 10 ? `
            <div class="text-center mt-8">
              <div class="text-5xl mb-3" style="color: ${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)}</div>
              <p class="font-bold text-xl mb-3" style="color: ${getSubColor(sub2Score)}">Bigram Entropy</p>
              <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">${m.fixes.bigram}</p>
            </div>` : ''}
          <p class="mt-8 text-center"><a href="#perplexity" class="text-orange-500 font-bold hover:underline">← More details about Perplexity</a></p>
        </div>
      </div>`;
    })()}
  </div>

  <!-- Remaining 4 metrics -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
    ${[
      {name: 'Burstiness', id: 'burstiness', score: analysis.moduleScores[1], details: analysis.details.burstiness, info: 'Evaluates the variation in sentence and word lengths to ensure natural rhythm in your content. Human writing typically mixes short, punchy sentences with longer, descriptive ones for engagement. Consistent lengths can signal AI generation, as it often prioritizes uniformity over dynamic flow.', fixes: {sentence: analysis.details.burstiness.scores.sentence < 10 ? 'To address low sentence burstiness, alternate between short, impactful sentences and longer, explanatory ones throughout your text. This creates a more engaging rhythm that mimics human speech patterns. Review paragraphs for uniformity and split or combine sentences to add variety.' : '', word: analysis.details.burstiness.scores.word < 10 ? 'Fix word length burstiness by mixing short, simple words with longer, more descriptive ones to avoid monotony. Incorporate varied vocabulary that includes both everyday terms and specialized jargon where appropriate. This enhances readability and makes the content feel more authentic and less machine-like.' : ''}, subNames: ['Sentence Length Variation', 'Word Length Burstiness'], fixTexts: ['To address low sentence burstiness, alternate between short, impactful sentences and longer, explanatory ones throughout your text. This creates a more engaging rhythm that mimics human speech patterns. Review paragraphs for uniformity and split or combine sentences to add variety.', 'Fix word length burstiness by mixing short, simple words with longer, more descriptive ones to avoid monotony. Incorporate varied vocabulary that includes both everyday terms and specialized jargon where appropriate. This enhances readability and makes the content feel more authentic and less machine-like.']},
      {name: 'Repetition', id: 'repetition', score: analysis.moduleScores[2], details: analysis.details.repetition, info: 'Detects overuse of bigram and trigram phrases, which can make text feel redundant and AI-like. Human writers naturally vary expressions to maintain interest and flow. High repetition scores indicate a need for more diverse phrasing to improve originality and engagement.', fixes: {bigram: analysis.details.repetition.scores.bigram < 10 ? 'Reduce bigram repetition by identifying common two-word phrases and replacing them with synonyms or restructured sentences. Use a thesaurus to find fresh alternatives and ensure no phrase dominates. This will make your writing more dynamic and less predictable.' : '', trigram: analysis.details.repetition.scores.trigram < 10 ? 'To fix trigram repetition, scan for recurring three-word sequences and rewrite them with varied structures or vocabulary. Introduce new ideas or transitions to break patterns. Editing for diversity here will elevate the text’s natural feel and reduce AI flags.' : ''}, subNames: ['Bigram Repetition', 'Trigram Repetition'], fixTexts: ['Reduce bigram repetition by identifying common two-word phrases and replacing them with synonyms or restructured sentences. Use a thesaurus to find fresh alternatives and ensure no phrase dominates. This will make your writing more dynamic and less predictable.', 'To fix trigram repetition, scan for recurring three-word sequences and rewrite them with varied structures or vocabulary. Introduce new ideas or transitions to break patterns. Editing for diversity here will elevate the text’s natural feel and reduce AI flags.']},
      {name: 'Sentence Length', id: 'sentence-length', score: analysis.moduleScores[3], details: analysis.details.sentenceLength, info: 'Combines average sentence length with complexity measures like comma usage to assess structural depth. Ideal human writing balances lengths between 15-23 words while incorporating clauses for nuance. Deviations can suggest overly simplistic or convoluted AI output, impacting readability.', fixes: {avg: analysis.details.sentenceLength.scores.avg < 10 ? 'Adjust average sentence length by breaking up long run-ons or combining short fragments to hit the 15-23 word sweet spot. This improves flow and readability for users. Regularly count words per sentence during edits to achieve balance.' : '', complexity: analysis.details.sentenceLength.scores.complexity < 10 ? 'Increase sentence complexity by adding clauses with commas, semicolons, or conjunctions to layer ideas. This adds depth without overwhelming the reader. Aim for 1-2 clauses per sentence in key sections to mimic human thought processes.' : ''}, subNames: ['Average Length', 'Sentence Complexity'], fixTexts: ['Adjust average sentence length by breaking up long run-ons or combining short fragments to hit the 15-23 word sweet spot. This improves flow and readability for users. Regularly count words per sentence during final edits to achieve balance.', 'Increase sentence complexity by adding clauses with commas, semicolons, or conjunctions to layer ideas. This adds depth without overwhelming the reader. Aim for 1-2 clauses per sentence in key sections to mimic human thought processes.']},
      {name: 'Vocabulary', id: 'vocabulary', score: analysis.moduleScores[4], details: analysis.details.vocabulary, info: 'Assesses unique word diversity and the frequency of rare words to gauge lexical richness. Human content often includes a broad, context-specific vocabulary with unique terms. Low scores here point to limited word choice, common in AI for efficiency, reducing perceived expertise.', fixes: {diversity: analysis.details.vocabulary.scores.diversity < 10 ? 'Boost vocabulary diversity by incorporating synonyms and avoiding word repetition through active editing. Draw from broader themes or analogies to introduce new terms. This enriches the text and signals deeper knowledge to search engines.' : '', rare: analysis.details.vocabulary.scores.rare < 10 ? 'Enhance rare word frequency by adding unique, context-specific terms that appear only once or twice. Research niche vocabulary related to your topic and weave it in naturally. This creates a more authentic, expert tone and improves SEO signals.' : ''}, subNames: ['Diversity', 'Rare Word Frequency'], fixTexts: ['Boost vocabulary diversity by incorporating synonyms and avoiding word repetition through active editing. Draw from broader themes or analogies to introduce new terms. This enriches the text and signals deeper knowledge to search engines.', 'Enhance rare word frequency by adding unique, context-specific terms that appear only once or twice. Research specialized vocabulary relevant to your topic and weave it in naturally. This creates a more authentic, authoritative tone that stands out as genuinely human-written.']}
    ].map(m => {
      const grade = getModuleGrade(m.score);
      const gradeColor = grade.color;
      const sub1Score = m.name === 'Burstiness' ? m.details.scores.sentence : m.name === 'Repetition' ? m.details.scores.bigram : m.name === 'Sentence Length' ? m.details.scores.avg : m.details.scores.diversity;
      const sub2Score = m.name === 'Burstiness' ? m.details.scores.word : m.name === 'Repetition' ? m.details.scores.trigram : m.name === 'Sentence Length' ? m.details.scores.complexity : m.details.scores.rare;
      const failedCount = (sub1Score < 10 ? 1 : 0) + (sub2Score < 10 ? 1 : 0);
      return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-center border-l-4" style="border-left-color: ${gradeColor}">
        <div class="relative w-32 h-32 mx-auto">
          <svg viewBox="0 0 128 128" class="-rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb dark:#4b5563" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="${gradeColor}" stroke-width="12" fill="none"
                    stroke-dasharray="${m.score * 17.6} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-3xl font-bold" style="color: ${gradeColor}">${m.score}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">/20</div>
          </div>
        </div>
        <p class="mt-4 text-xl font-bold" style="color: ${gradeColor}">${m.name}</p>
        <p class="mt-1 text-lg flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
        <div class="mt-3 space-y-2 text-sm">
          <p class="font-medium" style="color: ${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)} ${m.subNames[0]}</p>
          <p class="font-medium" style="color: ${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)} ${m.subNames[1]}</p>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          More Details
        </button>
        <div class="hidden mt-4 space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <p class="text-center mb-8"><a href="#${m.id}" class="text-orange-500 font-bold hover:underline">How ${m.name} is tested? →</a></p>
          <p><span class="font-bold text-blue-600 dark:text-blue-400">What it is?:</span> ${m.info}</p>
          <p><span class="font-bold text-green-600 dark:text-green-400">How to Improve?:</span> Use varied phrasing, personal anecdotes, and unexpected ideas to boost scores. Mix short and long elements for rhythm, and incorporate synonyms or rarer words. Always edit with readability in mind to align with human patterns.</p>
          <p><span class="font-bold text-orange-600 dark:text-orange-400">Why it matters?:</span> Search engines prioritize human-like content for higher rankings and user trust. Strong scores here reduce AI penalties and improve engagement metrics. Ultimately, this leads to better organic traffic and authority signals.</p>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          Show Fixes (${failedCount})
        </button>
        <div class="hidden mt-4 space-y-8">
          ${failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold">All tests passed! ✅</p>` : ''}
          ${sub1Score < 10 ? `
            <div class="text-center">
              <div class="text-4xl mb-2" style="color: ${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)}</div>
              <p class="font-bold mb-2" style="color: ${getSubColor(sub1Score)}">${m.subNames[0]}</p>
              <p class="text-gray-700 dark:text-gray-300 max-w-md mx-auto">${m.fixTexts[0]}</p>
            </div>` : ''}
          ${sub2Score < 10 ? `
            <div class="text-center mt-8">
              <div class="text-4xl mb-2" style="color: ${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)}</div>
              <p class="font-bold mb-2" style="color: ${getSubColor(sub2Score)}">${m.subNames[1]}</p>
              <p class="text-gray-700 dark:text-gray-300 max-w-md mx-auto">${m.fixTexts[1]}</p>
            </div>` : ''}
          <p class="mt-8 text-center"><a href="#${m.id}" class="text-orange-500 font-bold hover:underline">← More details about ${m.name}</a></p>
        </div>
      </div>`;
    }).join('')}
  </div>
</div>

<!-- Top 3 Priority Fixes -->
<div class="mt-20 space-y-8">
  <h2 class="text-4xl md:text-5xl font-black text-center text-gray-500 dark:text-gray-100">Top 3 Priority Fixes</h2>
  ${(() => {
    const priorityModules = [
      {
        name: 'Perplexity',
        score: analysis.moduleScores[0],
        details: analysis.details.perplexity,
        fixes: [
          analysis.details.perplexity.scores.trigram < 10 ? 'To improve trigram entropy, deliberately introduce unexpected word combinations and personal anecdotes that don’t follow common patterns. This breaks predictable flows and makes your writing feel more spontaneous and human. Avoid sticking to safe, formulaic phrasing—edit specifically for surprise in every few sentences.' : '',
          analysis.details.perplexity.scores.bigram < 10 ? 'Boost bigram entropy by actively swapping overused two-word pairs with creative alternatives or rephrased expressions. Incorporate transitional phrases that aren’t common and sprinkle in idiomatic expressions unique to your voice. These small changes create a less robotic rhythm and significantly increase overall unpredictability.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Burstiness',
        score: analysis.moduleScores[1],
        details: analysis.details.burstiness,
        fixes: [
          analysis.details.burstiness.scores.sentence < 10 ? 'To increase sentence burstiness, consciously alternate between short, punchy sentences and longer, more detailed ones throughout your paragraphs. This variation mimics natural human speech rhythm and keeps readers engaged. Go through your text and intentionally split or combine sentences to eliminate uniform length patterns.' : '',
          analysis.details.burstiness.scores.word < 10 ? 'Improve word length burstiness by mixing very short, simple words with longer, descriptive ones to avoid monotony. Use everyday terms alongside occasional specialized or evocative vocabulary where it fits naturally. This creates subtle emphasis and makes the content feel more authentic and less mechanically generated.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Repetition',
        score: analysis.moduleScores[2],
        details: analysis.details.repetition,
        fixes: [
          analysis.details.repetition.scores.bigram < 10 ? 'Reduce bigram repetition by identifying the most common two-word phrases in your text and replacing them with synonyms or fully restructured sentences. Use a thesaurus strategically and ensure no single phrase dominates the content. This simple edit makes your writing far more dynamic and less predictable to both readers and search engines.' : '',
          analysis.details.repetition.scores.trigram < 10 ? 'To fix trigram repetition, scan for any three-word sequences that appear multiple times and rewrite them with fresh vocabulary or different sentence structure. Introduce new transitional ideas to break recurring patterns. Consistent variation here dramatically improves the natural flow and reduces obvious AI-like flags.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Sentence Length',
        score: analysis.moduleScores[3],
        details: analysis.details.sentenceLength,
        fixes: [
          analysis.details.sentenceLength.scores.avg < 10 ? 'Bring your average sentence length into the ideal 15–23 word range by breaking up overly long run-on sentences and combining short, choppy ones where appropriate. This balance significantly improves readability and flow for all readers. Make it a habit to count words per sentence during final edits to maintain optimal rhythm.' : '',
          analysis.details.sentenceLength.scores.complexity < 10 ? 'Increase sentence complexity by adding subordinate clauses using commas, semicolons, or conjunctions to layer related ideas naturally. This adds depth and sophistication without overwhelming the reader. Aim for 1–2 clauses in key sentences to better reflect complex human thought processes.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Vocabulary',
        score: analysis.moduleScores[4],
        details: analysis.details.vocabulary,
        fixes: [
          analysis.details.vocabulary.scores.diversity < 10 ? 'Boost vocabulary diversity by actively using synonyms and avoiding repetition of the same words throughout your content. Draw from broader themes, analogies, or related concepts to naturally introduce new terms. Higher unique word usage signals expertise and depth to both readers and search engines.' : '',
          analysis.details.vocabulary.scores.rare < 10 ? 'Enhance rare word frequency by incorporating context-specific or niche terms that appear only once or twice in the text. Research specialized vocabulary relevant to your topic and weave it in thoughtfully. These unique words create an authentic, authoritative tone that stands out as genuinely human-written.' : ''
        ].filter(f => f).join('<br><br>')
      }
    ];

    const priority = priorityModules
      .filter(m => m.score < 20 && m.fixes)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    if (priority.length === 0) {
      return `
        <div class="bg-green-50 dark:bg-green-900/20 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-green-500">
          <h3 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-6 text-center">No Major Fixes Needed!</h3>
          <p class="text-lg text-center text-gray-800 dark:text-gray-200">All modules scored 20/20. Your content is highly human-like and optimized.</p>
        </div>`;
    }

    return priority.map((m, i) => {
      const sub1Score = m.name === 'Perplexity' ? m.details.scores.trigram : m.name === 'Burstiness' ? m.details.scores.sentence : m.name === 'Repetition' ? m.details.scores.bigram : m.name === 'Sentence Length' ? m.details.scores.avg : m.details.scores.diversity;
      const sub2Score = m.name === 'Perplexity' ? m.details.scores.bigram : m.name === 'Burstiness' ? m.details.scores.word : m.name === 'Repetition' ? m.details.scores.trigram : m.name === 'Sentence Length' ? m.details.scores.complexity : m.details.scores.rare;
      const sub1Name = m.name === 'Perplexity' ? 'Trigram Entropy' : m.name === 'Burstiness' ? 'Sentence Length Variation' : m.name === 'Repetition' ? 'Bigram Repetition' : m.name === 'Sentence Length' ? 'Average Length' : 'Diversity';
      const sub2Name = m.name === 'Perplexity' ? 'Bigram Entropy' : m.name === 'Burstiness' ? 'Word Length Burstiness' : m.name === 'Repetition' ? 'Trigram Repetition' : m.name === 'Sentence Length' ? 'Sentence Complexity' : 'Rare Word Frequency';

      return `
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-3xl p-8 md:p-10 shadow-lg border-l-8 border-orange-500">
          <div class="flex items-center mb-4">
            <div class="text-5xl font-black text-orange-600 dark:text-orange-400 mr-6">${i + 1}</div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">${m.name} – ${m.score}/20</h3>
              <div class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span style="color:${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)}</span> ${sub1Name}</p>
                <p><span style="color:${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)}</span> ${sub2Name}</p>
              </div>
            </div>
          </div>
          <p class="text-lg text-gray-800 dark:text-gray-200 mt-6"><span class="font-bold text-orange-600 dark:text-orange-400">Recommended Fix:</span><br><br>${m.fixes || 'Focus on improving variation and authenticity in this area.'}</p>
        </div>`;
    }).join('');
  })()}
</div>

<!-- Human Score & Potential Gains -->
<div class="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
  <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
    <h3 class="text-3xl font-bold text-center mb-8 text-orange-500">Human Score Improvement</h3>
    <div class="flex justify-center items-baseline gap-4 mb-8">
      <div class="text-5xl font-black text-gray-500">${yourScore}</div>
      <div class="text-4xl text-gray-400">→</div>
      <div class="text-6xl font-black text-green-500">${Math.min(100, yourScore + boost)}</div>
      <div class="text-2xl text-green-600 font-medium">(${boost > 0 ? '+' + boost : 'Optimal'})</div>
    </div>
    ${failingModules === 0 ? `
      <div class="text-center py-8">
        <p class="text-4xl mb-4">🎉 Optimal Human Score Achieved!</p>
        <p class="text-lg text-gray-600 dark:text-gray-400">Your content shows excellent human-like patterns. Focus on building authority with quality backlinks.</p>
      </div>
    ` : `
      <div class="space-y-4">
        <p class="font-medium text-gray-700 dark:text-gray-300 text-center mb-4">Top priority fixes & estimated impact:</p>
        ${[
          {name: 'Perplexity', score: analysis.moduleScores[0], impact: '15–25 points'},
          {name: 'Burstiness', score: analysis.moduleScores[1], impact: '10–20 points'},
          {name: 'Repetition', score: analysis.moduleScores[2], impact: '10–20 points'},
          {name: 'Sentence Length', score: analysis.moduleScores[3], impact: '10–20 points'},
          {name: 'Vocabulary', score: analysis.moduleScores[4], impact: '15–25 points'}
        ].filter(m => m.score < 20)
         .sort((a, b) => a.score - b.score)
         .slice(0, 3)
         .map(m => `
          <div class="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <span class="text-sm md:text-base">${m.name}</span>
            <span class="font-bold text-orange-600">${m.impact}</span>
          </div>
        `).join('')}
      </div>
    `}
    <details class="mt-8 text-sm text-gray-600 dark:text-gray-400">
      <summary class="cursor-pointer font-medium text-orange-500 hover:underline">How We Calculated This</summary>
      <div class="mt-4 space-y-2">
        <p>• Perplexity & Vocabulary: High weight (up to 25 points each) – critical for authenticity</p>
        <p>• Burstiness & Sentence Length: Medium weight (up to 20 points) – improves natural rhythm</p>
        <p>• Repetition: Medium weight (up to 20 points) – reduces pattern detection</p>
        <p>• Top-ranking pages typically achieve 85+ human scores</p>
        <p class="italic">Conservative estimates — actual gains may vary</p>
      </div>
    </details>
  </div>

  <div class="p-8 bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-3xl font-bold text-center mb-8">Potential Ranking & Traffic Gains</h3>
    ${failingModules === 0 ? `
      <div class="text-center py-12">
        <p class="text-4xl mb-4">🌟 Elite Human-Like Performance</p>
        <p class="text-xl">Your page demonstrates strong human patterns. Next step: build topical authority with backlinks and fresh content.</p>
      </div>
    ` : `
      <div class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="text-4xl">📈</div>
          <div class="flex-1">
            <p class="font-medium">Ranking Position Lift</p>
            <p class="text-2xl font-bold">5–20 positions potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🚀</div>
          <div class="flex-1">
            <p class="font-medium">Organic Traffic Increase</p>
            <p class="text-2xl font-bold">+15–40% potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">👥</div>
          <div class="flex-1">
            <p class="font-medium">User Engagement Boost</p>
            <p class="text-2xl font-bold">Higher dwell time & lower bounce</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🔍</div>
          <div class="flex-1">
            <p class="font-medium">Search Visibility Enhancement</p>
            <p class="text-2xl font-bold">Stronger presence in queries</p>
          </div>
        </div>
      </div>
    `}
    <div class="mt-10 text-sm space-y-2 opacity-90">
      <p>Conservative estimates based on on-page human pattern benchmarks.</p>
      <p>Improvements typically visible within 1–4 weeks after re-crawl.</p>
      <p>Actual results depend on competition, domain authority, and off-page factors.</p>
    </div>
  </div>
</div>

<div class="text-center my-16">
  <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
          class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
    Save Report 📄
  </button>
</div>
        `;

        // RADAR CHART
        setTimeout(() => {
          const canvas = document.getElementById('health-radar');
          if (!canvas) return;
          try {
            const ctx = canvas.getContext('2d');
            const labelColor = '#9ca3af';
            const gridColor = 'rgba(156, 163, 175, 0.3)';
            const borderColor = '#fb923c';
            const fillColor = 'rgba(251, 146, 60, 0.15)';

            const normalizedScores = modules.map(m => m.score * 5);

            window.myChart = new Chart(ctx, {
              type: 'radar',
              data: {
                labels: modules.map(m => m.name),
                datasets: [{
                  label: 'Human-Like Score',
                  data: normalizedScores,
                  backgroundColor: fillColor,
                  borderColor: borderColor,
                  borderWidth: 4,
                  pointRadius: 8,
                  pointHoverRadius: 12,
                  pointBackgroundColor: normalizedScores.map(s => s >= 80 ? '#22c55e' : s >= 50 ? '#fb923c' : '#ef4444'),
                  pointBorderColor: '#fff',
                  pointBorderWidth: 3
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: labelColor },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 15, weight: '600' } }
                  }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const rawScore = modules[context.dataIndex].score;
                        return `${context.dataset.label}: ${rawScore}/20 (${context.parsed.r}/100)`;
                      }
                    }
                  }
                }
              }
            });
          } catch (e) {
            console.error('Radar chart failed', e);
          }
        }, 150);

        // Clean URL for PDF/print
        let fullUrl = document.getElementById('url-input').value.trim();
        let displayUrl = 'traffictorch.net';
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

      }, remaining);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }, remaining);
    }
  });
});