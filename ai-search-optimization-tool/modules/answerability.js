export function computeAnswerability(doc, first300) {
  let answerability = 0;
  const openingLen = first300.length;
  if (openingLen > 900) answerability += 15;
  else if (openingLen > 550) answerability += 10;
  else if (openingLen > 300) answerability += 5;
  const hasBoldInFirst = /<strong>|<b>|<em>|<mark>|<u>|class=["']([^"']*?bold|strong)[^"']*["']/i.test(first300);
  const hasDefinition = /\b(is|means|refers to|defined as|stands for|known as|typically refers|commonly understood as|represents|equals|consists of|involves|includes|contains|features|covers|describes|explains|shows|outlines|details|breaks down|summarizes|highlights|focuses on|centers on)\b/i.test(first300.toLowerCase());
  const hasFAQSchema = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
    .some(s => s.textContent.includes('"FAQPage"') || s.textContent.includes('"HowTo"'));
  const questionWords = /^(what|how|why|when|where|who|which|can|should|do|does|is|are|will|would|could|may|might|shall)\b/i;
  const hasQuestionH2 = Array.from(doc.querySelectorAll('h2,h3')).some(h => {
    const txt = h.textContent.trim();
    return txt.length > 15 && txt.length < 120 && questionWords.test(txt) && /[?]/.test(txt);
  });
  const hasSteps = /\b(step|guide|how to|instructions|follow these|here's how|process|walkthrough|tutorial|do this|start by|next|then|finally|first|second|third|begin with|let's start|to get started|quick steps|simple steps|easy way|method|approach|technique|tip|trick|secret|pro tip|best way|recommended way|one way|another way|option|alternative|sequence|order|phase|stage)\b/i.test(first300.toLowerCase());
  if (hasBoldInFirst || hasDefinition) answerability += 30;
  if (hasFAQSchema) answerability += 25;
  if (hasQuestionH2) answerability += 15;
  if (hasSteps) answerability += 20;
  return {
    score: answerability,
    flags: {
      hasBoldInFirst,
      hasDefinition,
      hasFAQSchema,
      hasQuestionH2,
      hasSteps,
      strongOpening: first300.length > 600
    }
  };
}