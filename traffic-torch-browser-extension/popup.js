// Tool list - update URLs here if site changes
const tools = [
  { name: "⚜️ Topical Authority Audit", url: "https://traffictorch.net/topical-authority-audit-tool/" },
  { name: "🧬 SEO Entity Extractor", url: "https://traffictorch.net/seo-entity-extractor-tool/" },
  { name: "🔍 AI Search Optimization", url: "https://traffictorch.net/ai-search-optimization-tool/" },
  { name: "🎙️ AI Voice Search Tool", url: "https://traffictorch.net/ai-voice-search-tool/" },
  { name: "🤖 AI Audit Tool", url: "https://traffictorch.net/ai-audit-tool/" },
  { name: "🎯 SEO Intent Tool", url: "https://traffictorch.net/seo-intent-tool/" },
  { name: "📍 Local SEO Tool", url: "https://traffictorch.net/local-seo-tool/" },
  { name: "🛒 Product SEO Tool", url: "https://traffictorch.net/product-seo-tool/" },
  { name: "⛔ Quit Risk Tool", url: "https://traffictorch.net/quit-risk-tool/" },
  { name: "⚖️ SEO & UX Tool", url: "https://traffictorch.net/#seo-ux-tool" },
  { name: "⚙️ Schema Generator", url: "https://traffictorch.net/schema-generator/" },
  { name: "📝 Keyword Research Tool", url: "https://traffictorch.net/keyword-research-tool/" },
  { name: "🗝️ Keyword Tool", url: "https://traffictorch.net/keyword-tool/" },
  { name: "🆚 Keyword VS Tool", url: "https://traffictorch.net/keyword-vs-tool/" },
  { name: "📋 Help Guides", url: "https://traffictorch.net/ai-ux-seo-help-guides/" }
];

document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('tool-list');
  
  // Get current tab URL (safe with activeTab permission)
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tabs[0] ? encodeURIComponent(tabs[0].url) : '';

  tools.forEach(tool => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    // Append ?url=... so your site can read it (e.g. via URLSearchParams)
    const targetUrl = tool.url + (tool.url.includes('?') ? '&' : '?') + `url=${currentUrl}`;
    link.href = targetUrl;
    link.target = '_blank'; // open in new tab
    link.textContent = tool.name;
    li.appendChild(link);
    listEl.appendChild(li);
  });
});