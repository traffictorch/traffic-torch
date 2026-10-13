// log-parser.js — client-side access log parser
// Supports Apache combined, Nginx combined, Apache vhost_combined,
// Nginx JSON, and Cloudflare CSV.
//
// v2 change (DrKJING feedback, Oct 2026):
//   The combined regex now tolerates an unquoted vhost field between the
//   response size and the referrer (used by Plesk, CloudPanel, some cPanel
//   vhost configs), and tolerates extra trailing fields after the UA.
//   The tail of the line is parsed by pulling all quoted strings, so UA
//   extraction no longer depends on a fixed layout.

export const FORMATS = {
  APACHE_COMBINED: 'apache-combined',
  NGINX_COMBINED:  'nginx-combined',
  NGINX_JSON:      'nginx-json',
  CLOUDFLARE_CSV:  'cloudflare-csv',
  UNKNOWN:         'unknown'
};

// Header portion shared by all combined variants:
//   IP ident authuser [time] "request" status size [rest...]
// Everything after `size` is format-specific — we extract quoted strings from
// the tail rather than trying to guess the exact layout.
const COMBINED_RE = /^(\S+)\s+(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+"([^"]*)"\s+(\d{3})\s+(\S+)\s*(.*)$/;

export function detectFormat(sampleLines) {
  const sample = sampleLines.slice(0, 20).join('\n').trim();
  if (!sample) return FORMATS.UNKNOWN;

  const firstNonEmpty = sampleLines.find(l => l.trim());
  if (firstNonEmpty && firstNonEmpty.trim().startsWith('{')) {
    try { JSON.parse(firstNonEmpty); return FORMATS.NGINX_JSON; } catch {}
  }

  if (/^"?ip"?,/i.test(firstNonEmpty || '') || /\bRayID\b/.test(sample)) {
    return FORMATS.CLOUDFLARE_CSV;
  }

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

  // Combined format (Apache & Nginx) — tolerant of:
  //   Standard combined:            status size "referrer" "UA"
  //   vhost_combined:               status size VHOST "referrer" "UA"
  //   vhost_combined + extra:       status size VHOST "referrer" "UA" "extra"
  //   combined + extra:             status size "referrer" "UA" "extra"
  // In every variant, the 1st quoted string in the tail is the referrer and
  // the 2nd is the user-agent. Extra trailing fields are ignored.
  const m = line.match(COMBINED_RE);
  if (!m) return null;

  const requestParts = (m[5] || '').split(' ');
  const method = requestParts[0] || '';
  const path   = requestParts[1] || '';

  const tail = m[8] || '';
  const quoted = [...tail.matchAll(/"([^"]*)"/g)].map(x => x[1]);
  const referrer = quoted[0] || '';
  const ua       = quoted[1] || '';

  return {
    ip: m[1],
    time: m[4],
    method,
    path,
    status: parseInt(m[6], 10) || 0,
    size: parseInt(m[7], 10) || 0,
    referrer,
    ua
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
  let parsedWithUa = 0;
  let firstLine = '';
  for (let i = 0; i < lines.length; i++) {
    if (!firstLine && lines[i].trim()) firstLine = lines[i].slice(0, 240);
    const e = parseLine(lines[i], format);
    if (e) {
      entries.push(e);
      parsed++;
      if (e.ua) parsedWithUa++;
    }
    if (onProgress && i % 5000 === 0) {
      onProgress({ line: i, total: lines.length, parsed });
    }
  }
  return { entries, format, totalLines: lines.length, parsed, parsedWithUa, firstLine };
}