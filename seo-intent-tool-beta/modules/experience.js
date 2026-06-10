export function analyzeExperience(cleanedText, doc) {
  const firstPersonCount = (cleanedText.match(/\b(I|we|my|our|I've|we've|me|us|myself|ourselves)\b/gi) || []).length;
  const anecdotePhrases  = (cleanedText.match(/\b(in my experience|I tested|we found that|from my trials|I tried|we tried|my results|our case study|in practice|hands-on|real-world|based on my|after testing|client case|personal review)\b/gi) || []).length;
  const timelineMentions = (cleanedText.match(/\b(last year|in 20\d{2}|this year|over the past \d+|since \d{4}|in \d{4}|during \d{4}|recently|within the last|for \d+ years?|after \d+ months?|as of \d{4}|updated (on|in) \d{4}|published (on|in) \d{4}|20\d{2}|202\d)\b.*\b(I|we|my|our)\b/gi) || []).length;
  const personalMedia = !!doc.querySelector('img[alt*="my" i], img[alt*="our" i], video caption, figure figcaption');

  const metrics = {
    firstPerson: firstPersonCount > 15 ? 100 : firstPersonCount > 5 ? 60 : 20,
    anecdotes:   anecdotePhrases > 2  ? 100 : anecdotePhrases > 0  ? 60 : 20,
    timelines:   timelineMentions > 1 ? 100 : timelineMentions > 0 ? 70 : 20,
    personalMedia: personalMedia ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 4);

  const failed = [];
  if (metrics.firstPerson < 80) failed.push("Add more first-person language (“I/we/my/our”) throughout the content");
  if (metrics.anecdotes   < 80) failed.push("Include personal anecdotes or real-world examples");
  if (metrics.timelines   < 80) failed.push("Mention specific timelines or dates from your experience");
  if (metrics.personalMedia < 80) failed.push("Add original photos/videos with personal captions");

  const normalized = score; // same scale for radar

  return { score, metrics, failed, normalized };
}