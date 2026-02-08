export function computeConversational(mainText) {
  const youCount = (mainText.match(/\b(you|your|yours|yourself|yourselves|ya|y'all|yall|you're|you've|you'll|you'd)\b/gi) || []).length;
  const iWeCount = (mainText.match(/\b(I|we|our|ours|us|my|mine|myself|ourselves|I'm|we're|we've|I've|our team|the team)\b/gi) || []).length;
  const sentencesWithQuestion = mainText.split(/[.!?]+/).filter(s => s.trim().includes('?') && s.trim().length > 20);
  const questions = sentencesWithQuestion.length;
  const painRegex = /\b(struggle|problem|issue|challenge|frustrat|hard|difficult|pain|annoy|confus|overwhelm|fail|mistake|wrong|tired|miss|ignore|skip|outdat|generic|robot|buried|hidden|waste|lose|never ranks|no traffic|invisible|confusing)\b/gi;
  const painPointsNearYou = (mainText.match(new RegExp(`\\b(you|your|you're)\\b.*?${painRegex.source}`, 'gi')) || []).length;
  let conversational = 0;
  if (youCount > 5) conversational += 30;
  if (iWeCount > 5) conversational += 25;
  if (questions > 3) conversational += 20;
  if (painPointsNearYou > 2) conversational += 20;
  return {
    score: conversational,
    flags: {
      directYou: youCount > 5,
      personalIWe: iWeCount > 3,
      engagingQuestions: questions > 2,
      painPoints: painPointsNearYou > 2
    }
  };
}