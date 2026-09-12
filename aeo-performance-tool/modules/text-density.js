export function analyzeTextDensity(html, text) {
  // Stub
  const textLength = text.length;
  const htmlLength = html.length;
  const ratio = htmlLength ? textLength / htmlLength : 0;
  const score = ratio > 0.15 ? 80 : ratio > 0.08 ? 60 : 40;
  const metrics = { textToCode: ratio, textToAds: 0, textToScripts: 0 };
  const failed = score < 60 ? ['Low text density'] : [];
  return { score, metrics, failed };
}
