const metricExplanations = [
  {
    id: 'meta-title-desc',
    emoji: '📝',
    name: 'Meta Title & Desc',
    what: 'Checks if your target keyword appears naturally in the page title and meta description. These are the first elements Google reads and displays in search results. Optimized titles and descriptions directly impact visibility and user clicks. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool scans the &lt;title&gt; tag and meta description for the exact or close-match keyword phrase. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Pages with the exact keyword in title and description often rank higher and achieve 20-30% better click-through rates. These elements signal strong relevance to search engines. They also build trust and expectation before the user even visits your page. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'h1-headings',
    emoji: '🔤',
    name: 'H1 & Headings',
    what: 'Evaluates whether your main H1 heading contains the target keyword. Headings structure content and help search engines understand hierarchy and topic relevance. The H1 carries the strongest weight. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool checks the first &lt;h1&gt; tag and scans other headings (H2–H6) for keyword presence. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'A keyword-optimized H1 is one of the strongest on-page signals for topical relevance. It helps both search engines and users quickly grasp what the page is about. Well-structured headings also improve readability and dwell time. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'content-density',
    emoji: '📄',
    name: 'Content Density',
    what: 'Measures how often the target keyword appears relative to total word count. Also evaluates overall content length. Ideal density is 1-2% with substantial depth (800+ words recommended). <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Word count is calculated from main content (excluding navigation, footers, etc.). Keyword mentions are counted, then density is computed as (mentions ÷ words) × 100. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Longer, well-optimized content consistently outranks shorter pages on the same topic. Proper density signals relevance without stuffing. Comprehensive content satisfies user intent better, leading to higher engagement and rankings. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'image-alts',
    emoji: '🖼️',
    name: 'Image Alts',
    what: 'Scans image alt texts for the presence of your target keyword in relevant images. Alt text describes images for screen readers and search engines. It’s crucial for accessibility and SEO. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'All &lt;img&gt; tags are scanned and alt attributes checked for keyword matches. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Optimized alt text improves accessibility compliance and user experience. It enables ranking in Google Images, driving extra traffic. It also provides another contextual relevance signal to search engines. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'anchor-text',
    emoji: '🔗',
    name: 'Anchor Text',
    what: 'Looks for internal links using the target keyword or variations in their visible anchor text. Anchor text helps search engines understand linked page topics and builds topical clusters. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Internal &lt;a&gt; tags are analyzed for visible text containing the keyword. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword-rich internal anchors reinforce site structure and topical clusters. They help search engines crawl and understand relationships between pages. Natural internal linking improves user navigation and time on site. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'url-schema',
    emoji: '🌐',
    name: 'URL & Schema',
    what: 'Checks if the keyword appears in the page URL and if structured data (JSON-LD schema) is present. Both are important direct relevance and enhancement signals. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The URL string is checked for the keyword (with hyphen-aware matching). The page is scanned for &lt;script type="application/ld+json"&gt; tags. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword in URL reinforces topic relevance and improves click rates from search results. Schema markup enables rich snippets that stand out and increase visibility. Both contribute to higher perceived authority and CTR. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  }
];

function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1); // remove #
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
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center gap-2 whitespace-nowrap mx-auto">
          Learn More <span class="text-2xl transition-transform group-open:rotate-180">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-800 dark:text-gray-200 leading-relaxed">
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
        </div>
      </details>
    </div>
  `).join('');

  // Open on initial load if hash present
  openDetailsFromHash();
});

// Open on hash change (e.g., when clicking internal links)
window.addEventListener('hashchange', openDetailsFromHash);

// Export for use in keyword-tool/script.js if needed later
window.metricExplanations = metricExplanations;