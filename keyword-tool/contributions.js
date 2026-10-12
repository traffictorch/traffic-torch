// Contributor cards for this tool.
// Entries are auto-merged on /contributors/ by handle.
import { renderToolContributions } from '/shared/contributions-renderer.js';

export const contributors = [];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}
