// Contributor cards for this tool.
// Entries are auto-merged on /contributors/ by handle.

export const contributors = [];

export function renderContributions(containerId = 'contributions-section') {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!contributors.length) { container.remove(); return; }
}
