// js/apis/crux-parser.js
export function parseCrUXFromPSI(psiData) {
  if (!psiData || !psiData.lighthouseResult?.audits?.['chrome-user-experience-report-v2']) return null;
  const crux = psiData.lighthouseResult.audits['chrome-user-experience-report-v2'].details?.items[0];
  if (!crux) return null;
  return {
    lcp: crux.largest_contentful_paint_display || 0,
    inp: crux.interaction_to_next_paint || 0,
    cls: crux.cumulative_layout_shift || 0
  };
}