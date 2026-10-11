// log-parser.js — client-side access log parser
// Supports Apache combined, Nginx combined, Nginx JSON, and Cloudflare CSV.
// Reads via FileReader chunks so large files don't block the UI.

export const FORMATS = {
  APACHE_COMBINED: 'apache-combined',
  NGINX_COMBINED:  'nginx-combined',
  NGINX_JSON:      'nginx-json',
  CLOUDFLARE_CSV:  'cloudflare-csv',
  UNKNOWN:         'unknown'
};

// Apache/Nginx combined regex — captures IP, time, method, path, status, size, referrer, UA
const COMBINED_RE = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)(?:\s+(\S+))?"\s+(\d{3})\s+(\S+)(?:\s+"([^"]*)"\s+"([^"]*)")?/;

export function detectFormat(sampleLines) {
  const sample = sampleLines.slice(0, 20).join('\n').trim();
  if (!sample) return FORMATS.UNKNOWN;

  // Nginx JSON: lines start with '{' and contain "remote_addr" or similar
  const firstNonEmpty = sampleLines.find(l => l.trim());
  if (firstNonEmpty && firstNonEmpty.trim().startsWith('{')) {
    try { JSON.parse(firstNonEmpty); return FORMATS.NGINX_JSON; } catch {}
  }

  // Cloudflare CSV headers
  if (/^"?ip"?,/i.test(firstNonEmpty || '') || /\bRayID\b/.test(sample)) {
    return FORMATS.CLOUDFLARE_CSV;
  }

  // Combined format
  if (COMBINED_RE.test(firstNonEmpty || '')) return FORMATS.APACHE_COMBINED;

  return FORMATS.UNKNOWN;
}

export function parseLine(line, format) {
  if (!line || !line.trim()) return null;

  if (format === FORMATS.NGINX_JSON) {
    try {
      const o = JSON.parse(line);
      return {
        ip: o.remote_addr || o.client_ip || o.ip || '',
        time: o.time_local || o.time_iso8601 || o.timestamp || '',
        method: o.request_method || (o.request || '').split(' ')[0] || '',
        path: o.request_uri || (o.request || '').split(' ')[1] || '',
        status: parseInt(o.status || '0', 10),
        size: parseInt(o.body_bytes_sent || '0', 10),
        ua: o.http_user_agent || o.user_agent || '',
        referrer: o.http_referer || o.referrer || ''
      };
    } catch { return null; }
  }

  if (format === FORMATS.CLOUDFLARE_CSV) {
    // Minimal CSV split (no quoted comma handling — Cloudflare logs are simple)
    const parts = line.split(',');
    if (parts.length < 8) return null;
    return {
      ip: parts[0].replace(/"/g, ''),
      time: parts[1]?.replace(/"/g, '') || '',
      method: parts[3]?.replace(/"/g, '') || '',
      path: parts[4]?.replace(/"/g, '') || '',
      status: parseInt(parts[5]?.replace(/"/g, '') || '0', 10),
      size: parseInt(parts[6]?.replace(/"/g, '') || '0', 10),
      ua: parts[7]?.replace(/"/g, '') || '',
      referrer: parts[8]?.replace(/"/g, '') || ''
    };
  }

  // Combined format (Apache & Nginx)
  const m = line.match(COMBINED_RE);
  if (!m) return null;
  return {
    ip: m[1],
    time: m[2],
    method: m[3],
    path: m[4],
    status: parseInt(m[6], 10),
    size: parseInt(m[7], 10) || 0,
    referrer: m[8] || '',
    ua: m[9] || ''
  };
}

export async function streamLogFile(file, { onProgress, maxBytes = 100 * 1024 * 1024 } = {}) {
  if (file.size > maxBytes) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${(maxBytes / 1024 / 1024)} MB.`);
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const format = detectFormat(lines.slice(0, 20));
  const entries = [];
  let parsed = 0;
  for (let i = 0; i < lines.length; i++) {
    const e = parseLine(lines[i], format);
    if (e) { entries.push(e); parsed++; }
    if (onProgress && i % 5000 === 0) {
      onProgress({ line: i, total: lines.length, parsed });
    }
  }
  return { entries, format, totalLines: lines.length, parsed };
}
