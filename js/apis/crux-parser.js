// js/apis/crux-parser.js
export function parseCrUXFromPSI(psiData) {
  const crux = psiData?.loadingExperience || psiData?.originLoadingExperience;
  if (!crux) return null;

  const metrics = crux.metrics || {};
  return {
    lcp: metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentiles?.p75 || "N/A",
    inp: metrics.INTERACTION_TO_NEXT_PAINT_MS?.percentiles?.p75 || "N/A",
    cls: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentiles?.p75 || "N/A",
    overall: crux.overall_category || "No data"
  };
}