// seo-intent-tool/metric-explanations.js

const metricExplanations = [
  {
    id: "experience",
    emoji: "🧑‍💻",
    name: "Experience",
    what: "Proof that the content creator has genuine first-hand involvement with the topic through personal anecdotes, real-world testing, timelines, and original media.",
    how: "Detects first-person pronouns (I/we/my/our), personal anecdote phrases, timeline/date mentions tied to personal context, and original images/videos with personal captions or alt text.",
    why: "Google prioritizes content demonstrating real experience over theoretical advice. Strong experience signals improve trust, dwell time, engagement, and rankings — especially in YMYL and competitive niches."
  },
  {
    id: "expertise",
    emoji: "🎓",
    name: "Expertise",
    what: "Evidence of deep knowledge and qualifications through author identification, credentials, professional background, and supporting citations.",
    how: "Checks for visible author byline, dedicated bio section, credential keywords (PhD, certified, years of experience, etc.), and links to studies, sources, or references.",
    why: "Expertise establishes credibility and reduces misinformation risk. Search engines reward content from demonstrably qualified authors with higher visibility and authority."
  },
  {
    id: "authoritativeness",
    emoji: "🏆",
    name: "Authoritativeness",
    what: "Recognition of the author or site as a leading voice through structured data, awards, endorsements, and transparent entity information.",
    how: "Analyzes JSON-LD schema types (Article, Person, Organization), mentions of awards or media features, and presence of About/Team page links.",
    why: "Authoritative sources earn topical leadership and richer search features. It boosts entity trust, backlink potential, and long-term ranking stability."
  },
  {
    id: "trustworthiness",
    emoji: "🔒",
    name: "Trustworthiness",
    what: "Clear indicators of reliability, security, transparency, and accountability that build user confidence.",
    how: "Verifies HTTPS, visible contact methods (email, form, phone), privacy/terms links, and displayed update or publish dates.",
    why: "Trust signals prevent bounces and complaints. Google favors secure, transparent sites to protect users, directly impacting rankings and traffic."
  },
  {
    id: "depth",
    emoji: "📚",
    name: "Content Depth",
    what: "The comprehensiveness and thoroughness of coverage that fully satisfies user intent with detailed, valuable information.",
    how: "Counts visible main content words in the rendered page body. Compares against benchmarks: Strong (1,500+ words), Average (800–1,499), Needs work (<800).",
    why: "In-depth content ranks highest because it provides the most helpful answer. It increases time on page, reduces pogo-sticking, and dominates competitive SERPs."
  },
  {
    id: "readability",
    emoji: "📖",
    name: "Readability",
    what: "How easy and enjoyable the text is to read through clear structure, simple language, and natural flow.",
    how: "Calculates Flesch Reading Ease score. Ideal = 60–70 (plain English), Acceptable = 50–80, Difficult = outside range.",
    why: "Readable content improves comprehension, engagement, and user satisfaction signals. Search engines track these metrics to prioritize helpful, accessible pages."
  },
  {
    id: "schema",
    emoji: "⚡",
    name: "Schema Markup",
    what: "Structured data that helps search engines understand content type, entities, and context for enhanced display.",
    how: "Detects valid JSON-LD script blocks and counts relevant schema types (Article, Person, Organization, FAQPage, etc.).",
    why: "Proper schema unlocks rich snippets, increases click-through rates dramatically, strengthens E-E-A-T, and improves visibility in featured results."
  }
];

function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const target = document.getElementById(hash);
    if (target) {
      const details = target.querySelector('details');
      if (details) {
        details.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('metric-cards-container');
  if (!container) return;

  container.innerHTML = metricExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-500 font-bold hover:underline inline-flex items-center justify-center gap-2 whitespace-nowrap">
          Learn More <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-600 dark:text-gray-400 leading-relaxed">
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ${m.name} tested?</p>
            <p>${m.how}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">Why does ${m.name} matter?</p>
            <p>${m.why}</p>
          </div>
          <div class="mt-8 text-center">
            <a href="/seo-intent-tool/#audit-form" class="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-full hover:opacity-90 transition">
              Run Analysis Now →
            </a>
          </div>
        </div>
      </details>
    </div>
  `).join('');

  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);