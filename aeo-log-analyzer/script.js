// script.js — AEO Log Analyzer controller
import { streamLogFile, FORMATS } from './log-parser.js';
import { aggregateByBot, PUBLISHED_IP_BOTS } from './ip-matcher.js';
import { renderReport } from './report-renderer.js';

const IP_API = 'https://aeo-bot-ips.traffictorch.workers.dev/';
const IP_CACHE_KEY = 'aeo_bot_ips_cache_v1';
const IP_CACHE_TTL = 24 * 60 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  const fileInput   = document.getElementById('log-file');
  const dropZone    = document.getElementById('drop-zone');
  const loading     = document.getElementById('loading');
  const progress    = document.getElementById('progress-text');
  const results     = document.getElementById('results');
  const errorBox    = document.getElementById('error-box');

  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  ['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
  });
  dropZone.addEventListener('drop', e => {
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  });

  async function handleFile(file) {
    errorBox.classList.add('hidden');
    results.classList.add('hidden');
    loading.classList.remove('hidden');
    progress.textContent = 'Reading file…';

    try {
      // 1. Fetch IP lists (with caching)
      progress.textContent = 'Loading bot IP lists…';
      const ipLists = await getIpLists();

      // 2. Parse log
      progress.textContent = 'Parsing log file…';
      const { entries, format, totalLines, parsed } = await streamLogFile(file, {
        onProgress: ({ line, total, parsed }) => {
          progress.textContent = `Parsing… ${Math.floor((line / total) * 100)}% · ${parsed.toLocaleString()} entries`;
        }
      });

      if (format === FORMATS.UNKNOWN) {
        throw new Error('Could not detect log format. Supported: Apache combined, Nginx combined, Nginx JSON, Cloudflare CSV.');
      }
      if (entries.length === 0) {
        throw new Error('No valid log entries found. Check the file format.');
      }

      // 3. Aggregate
      progress.textContent = 'Matching against bot IP lists…';
      const buckets = aggregateByBot(entries, ipLists);

      if (buckets.length === 0) {
        throw new Error('No bot hits found in this log. Try a log that covers a longer period, or check that User-Agent lines are present.');
      }

      // 4. Render
      progress.textContent = 'Rendering report…';
      const reportHtml = renderReport({
        buckets,
        meta: {
          filename: file.name,
          format: formatLabel(format),
          totalLines,
          parsedEntries: parsed
        }
      });

      results.innerHTML = reportHtml;
      results.classList.remove('hidden');
      loading.classList.add('hidden');

      // Wire export buttons
      document.getElementById('export-json')?.addEventListener('click', () => exportJson(buckets));
      document.getElementById('export-csv')?.addEventListener('click', () => exportCsv(buckets));
      document.getElementById('analyze-another')?.addEventListener('click', () => {
        results.classList.add('hidden');
        fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      loading.classList.add('hidden');
      errorBox.textContent = err.message || 'Unknown error';
      errorBox.classList.remove('hidden');
    }
  }

  function formatLabel(f) {
    return {
      'apache-combined': 'Apache combined',
      'nginx-combined': 'Nginx combined',
      'nginx-json': 'Nginx JSON',
      'cloudflare-csv': 'Cloudflare CSV',
      'unknown': 'Unknown'
    }[f] || f;
  }

  async function getIpLists() {
    // Check localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem(IP_CACHE_KEY) || 'null');
      if (cached && (Date.now() - cached.fetchedAt) < IP_CACHE_TTL) {
        return cached.lists;
      }
    } catch {}

    const res = await fetch(IP_API, { method: 'GET' });
    if (!res.ok) throw new Error(`IP list service returned ${res.status}`);
    const data = await res.json();
    if (!data.lists) throw new Error('IP list service returned malformed data');

    try {
      localStorage.setItem(IP_CACHE_KEY, JSON.stringify({
        fetchedAt: Date.now(),
        lists: data.lists
      }));
    } catch {}

    return data.lists;
  }

  function exportJson(buckets) {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), buckets }, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `aeo-log-analyzer-${Date.now()}.json`);
  }

  function exportCsv(buckets) {
    const lines = ['bot,total,verified,unverified,status_2xx,status_3xx,status_4xx,status_5xx,status_401,status_403,status_429,status_503,first_seen,last_seen'];
    for (const b of buckets) {
      lines.push([
        b.bot, b.total, b.verifiedCount, b.unverifiedCount,
        b.statusClasses[2], b.statusClasses[3], b.statusClasses[4], b.statusClasses[5],
        b.suspiciousStatuses[401] || 0, b.suspiciousStatuses[403] || 0,
        b.suspiciousStatuses[429] || 0, b.suspiciousStatuses[503] || 0,
        csvEscape(b.firstSeen || ''), csvEscape(b.lastSeen || '')
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, `aeo-log-analyzer-${Date.now()}.csv`);
  }

  function csvEscape(v) {
    v = String(v);
    if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
