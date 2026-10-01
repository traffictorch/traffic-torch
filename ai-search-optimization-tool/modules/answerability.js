// answerability.js
export function computeAnswerability(doc, first300Text, first300Html = '') {
  let answerability = 0;

  const openingLen = first300Text.length;
  if (openingLen > 900) answerability += 15;
  else if (openingLen > 550) answerability += 10;
  else if (openingLen > 300) answerability += 5;

  // ✅ Now checks real HTML for bold/strong formatting
  const hasBoldInFirst = /<(strong|b|em|mark|u)\b/i.test(first300Html) ||
                         /class=["'][^"']*?(bold|strong)[^"']*?["']/i.test(first300Html);

  const hasDefinition =
  /\b(means|refers to|is defined as|stands for|commonly understood as|represents|can be described as|is known as)\b/i
    .test(first300Text.toLowerCase());

  const hasFAQSchema = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
    .some(s => s.textContent.includes('"FAQPage"') || s.textContent.includes('"HowTo"'));

  const questionWords = /^(what|how|why|when|where|who|which|can|should|do|does|is|are|will|would|could|may|might|shall)\b/i;
  const hasQuestionH2 = Array.from(doc.querySelectorAll('h2,h3')).some(h => {
    const txt = h.textContent.trim();
    return txt.length > 15 && txt.length < 120 && questionWords.test(txt) && /\?/.test(txt);
  });

  const hasSteps =
  /\b(step[- ]by[- ]step|follow these steps|here'?s how|start by|first,|then,|next,|finally,|to get started|walkthrough|tutorial)\b/i
    .test(first300Text.toLowerCase());

  if (hasBoldInFirst || hasDefinition) answerability += 30;
  if (hasFAQSchema) answerability += 25;
  if (hasQuestionH2) answerability += 15;
  if (hasSteps) answerability += 20;

const MAX = 15 + 30 + 25 + 15 + 20; // = 105
return {
  score: Math.min(100, (answerability / MAX) * 100),
  flags: {
    hasBoldInFirst,
    hasDefinition,
    hasFAQSchema,
    hasQuestionH2,
    hasSteps,
    strongOpening: first300Text.length > 600
  }
};
}