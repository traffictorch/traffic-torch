export function analyzeDepth(cleanedText) {
  const words = cleanedText ? cleanedText.split(' ').filter(w => w.length > 0).length : 0;
  
  const normalized = words >= 1500 ? 100 : words >= 800 ? 75 : words >= 400 ? 50 : 20;
  
  return { words, normalized };
}