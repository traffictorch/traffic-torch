export function computeUniqueInsights(mainText, words) {
  const hasInsights = /\b(I tested|we tested|in my experience|we found|case study|based on my|hands-on|personally observed|our research|in practice|real-world|client results|our data shows|from experience|based on testing|experimented|analyzed|surveyed|i've seen|i have seen|when i ran|when we ran|my own testing|our testing showed|my clients|our clients)\b/i.test(mainText);
  const hasDated = /\b(recent|latest|current|new|fresh|up-to-date|just (tested|updated|published|released)|ongoing|as of (now|today|202[4-9])|in (recent|the last) (months|weeks|year)|today's|modern|present-day)\b/i.test(mainText.toLowerCase());
  const hasInterviews = /\b(interview(?:ed|s)?|spoke with|talked to|surveyed|asked|quoted|said|reports|says|according to|told me|told us|shared with me|shared with us)\b/i.test(mainText) &&
                       /["“][^"]{20,}["”]/.test(mainText);
  let uniqueInsights = 0;
  if (words > 2000) uniqueInsights += 35;
  else if (words > 1500) uniqueInsights += 25;
  else if (words > 1000) uniqueInsights += 15;
  if (hasInsights) uniqueInsights += 35;
  if (hasDated) uniqueInsights += 20;
  if (hasInterviews) uniqueInsights += 15;
  return {
    score: uniqueInsights,
    flags: {
      hasInsights,
      hasDated,
      hasInterviews,
      deepContent: words > 1500
    }
  };
}