export function computeScannability(doc, mainEl) {
  const headings = doc.querySelectorAll('h1,h2,h3,h4').length;
  const lists = doc.querySelectorAll('ul,ol').length;
  const tables = doc.querySelectorAll('table, [role="table"], [style*="display: table"], [class*="table"], .wp-block-table').length;
  const shortParas = Array.from(mainEl.querySelectorAll('p'))
    .filter(p => p.textContent.trim().split(/\s+/).length < 35).length;
  let scannability = 0;
  if (headings >= 12) scannability += 45;
  else if (headings >= 8) scannability += 40;
  else if (headings >= 5) scannability += 30;
  if (lists > 3) scannability += 20;
  else if (lists > 1) scannability += 12;
  if (tables > 0) scannability += 18;
  if (shortParas > 10) scannability += 15;
  else if (shortParas > 6) scannability += 10;
  else if (shortParas > 3) scannability += 5;
  return {
    score: scannability,
    flags: {
      sufficientHeadings: headings > 5,
      listsUsed: lists > 2,
      tablesPresent: tables > 0,
      shortParas: shortParas > 5,
      excellentHeadings: headings > 8
    }
  };
}