// Quit Risk v2.0 – Epic Prototype (React 18 + Vite Bundle)
import React, { useState, useEffect } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import Chart from 'https://esm.sh/chart.js/auto';

// Import custom styles
import './styles.css';

// PWA Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

const QuitRiskApp = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const analyzeUrl = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      // Proxy fetch HTML (CORS-safe)
      const proxy = 'https://api.allorigins.win/raw?url=';
      const res = await fetch(proxy + encodeURIComponent(url));
      if (!res.ok) throw new Error('Failed to fetch URL');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Calculate 360° Score & Modules (heuristic + API sim)
      const healthScore = Math.round(Math.random() * 100); // Placeholder: Integrate real Lighthouse API here
      const modules = generateModules(doc, healthScore);
      const gaps = await generateCompetitiveGaps(url);
      const fixes = generateAIFixes(modules);
      const forecast = generateForecast(healthScore, fixes);

      setReport({ score: healthScore, modules, gaps, fixes, forecast, title: doc.title?.substring(0, 60) || 'Analyzed Page' });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Generate Deep-Dive Modules (What/Why/How)
  const generateModules = (doc, score) => ({
    performance: { score: score * 0.8, what: 'LCP 2.3s', why: 'Slow images cause 40% quits', how: 'Compress via WebP' },
    usability: { score: score * 0.9, what: 'Deep nav (4 levels)', why: 'Users lost in maze', how: 'Flatten to 2 levels' },
    mobile: { score: score * 0.7, what: 'Tap targets <44px', why: 'Frustrates thumb users', how: 'Increase to 48px min' },
    accessibility: { score: score * 0.85, what: 'Contrast 3.2:1', why: 'Hard for low-vision', how: 'Boost to 4.5:1' },
    content: { score: score * 0.95, what: 'Flesch 65', why: 'Dense text bores', how: 'Shorten paras' },
    engagement: { score: score * 0.75, what: 'No above-fold CTA', why: 'No hook = bounce', how: 'Add hero button' }
  });

  // Competitive Gaps (Sim: Pull from SEMrush-like data)
  const generateCompetitiveGaps = async (url) => {
    // Placeholder API call – replace with real (e.g., Ahrefs)
    return [
      { competitor: 'competitor1.com', gap: 'Mobile score +15%', yourScore: 70, theirScore: 85 },
      { competitor: 'competitor2.com', gap: 'Load time -1s', yourScore: 80, theirScore: 95 }
    ];
  };

  // AI-Generated Fixes (Prompt-based sim)
  const generateAIFixes = (modules) => [
    { id: 1, module: 'performance', fix: 'Add <img loading="lazy"> to images', effort: 'Low', roi: '+20% speed', code: `<img src="img.jpg" loading="lazy" />` },
    { id: 2, module: 'mobile', fix: 'Use media queries for taps', effort: 'Medium', roi: '-15% bounce', code: `@media (max-width: 768px) { button { min-height: 48px; } }` }
    // Add 3-10 more dynamically
  ];

  // Predictive Rank Forecast
  const generateForecast = (score, fixes) => {
    const improvements = fixes.reduce((sum, f) => sum + f.roi, 0);
    return `Fix top 3 → Score to ${score + improvements} → Bounce -${improvements}% → +${Math.round(improvements / 10)} SERP positions in 60 days`;
  };

  if (loading) return <div className="loading-spinner">Analyzing... <div className="spinner"></div></div>;
  if (error) return <div className="error">Error: {error} <button onClick={() => setError('')}>Retry</button></div>;

  return (
    <div className="quit-risk-app">
      <form onSubmit={analyzeUrl} className="input-form">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />
        <button type="submit">Analyze 🚀</button>
      </form>

      {report && (
        <>
          {/* 360° Score Chart */}
          <div className="score-section">
            <h2>{report.title}</h2>
            <canvas id="scoreChart"></canvas>
            <p className="score-desc">{report.score > 70 ? 'High quit risk' : report.score > 40 ? 'Medium' : 'Low'}</p>
          </div>

          {/* Deep-Dive Modules */}
          <div className="modules-grid">
            {Object.entries(report.modules).map(([key, mod]) => (
              <div key={key} className={`module-card ${mod.score > 80 ? 'good' : mod.score > 50 ? 'warn' : 'bad'}`}>
                <h3>{key.toUpperCase()}</h3>
                <p><strong>What:</strong> {mod.what}</p>
                <p><strong>Why:</strong> {mod.why}</p>
                <p><strong>How to Fix:</strong> {mod.how}</p>
              </div>
            ))}
          </div>

          {/* Competitive Gaps */}
          <div className="gaps-section">
            <h3>Competitive Gaps</h3>
            <table>
              <thead><tr><th>Competitor</th><th>Gap</th><th>Your Score</th><th>Theirs</th></tr></thead>
              <tbody>{report.gaps.map(g => <tr key={g.competitor}><td>{g.competitor}</td><td>{g.gap}</td><td>{g.yourScore}</td><td>{g.theirScore}</td></tr>)}</tbody>
            </table>
          </div>

          {/* AI Fixes */}
          <div className="fixes-section">
            <h3>AI-Generated Fixes</h3>
            {report.fixes.map(fix => (
              <div key={fix.id} className={`fix-card ${fix.effort}`}>
                <h4>{fix.fix}</h4>
                <p>Effort: {fix.effort} | ROI: {fix.roi}</p>
                <pre>{fix.code}</pre>
                <button>Copy Code</button>
              </div>
            ))}
          </div>

          {/* Predictive Forecast */}
          <div className="forecast-section">
            <h3>Predictive Rank Forecast</h3>
            <p>{report.forecast}</p>
          </div>

          {/* Exports */}
          <div className="export-section">
            <button>Export PDF</button>
            <button>Export CSV</button>
            <button>Create Trello Card</button>
          </div>
        </>
      )}

      {/* Chart Init */}
      {report && useEffect(() => {
        const ctx = document.getElementById('scoreChart').getContext('2d');
        new Chart(ctx, {
          type: 'doughnut',
          data: { labels: ['Quit Risk', 'Retention'], datasets: [{ data: [100 - report.score, report.score], backgroundColor: ['#ef4444', '#10b981'] }] },
          options: { responsive: true }
        });
      }, [report]);}
    </div>
  );
};

// Render to root
const root = ReactDOM.createRoot(document.getElementById('quit-risk-root'));
root.render(<QuitRiskApp />);
