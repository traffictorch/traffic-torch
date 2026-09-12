export function analyzeSemanticStructure(doc, text) {
  // Stub
  const h1Count = doc.querySelectorAll('h1').length;
  const h2Count = doc.querySelectorAll('h2').length;
  const score = h1Count === 1 && h2Count > 0 ? 80 : 50;
  const metrics = { h1Count, h2Count };
  const failed = h1Count !== 1 ? ['H1 count incorrect'] : [];
  return { score, metrics, failed };
}
