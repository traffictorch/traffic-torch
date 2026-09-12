export function analyzeRenderBlocking(html, doc) {
  // Stub
  const scripts = doc.querySelectorAll('script[src]').length;
  const score = scripts > 10 ? 40 : scripts > 5 ? 60 : 80;
  const metrics = { blockingScripts: scripts };
  const failed = scripts > 5 ? ['Too many blocking scripts'] : [];
  return { score, metrics, failed };
}
