/**
 * FAQs Block — Craftora EDS
 * Renders an accordion of Frequently Asked Questions using native <details> elements.
 *
 * Authored input:
 * Row 1: [Label: "Heading"] [Actual Heading (e.g., <h2>)]
 * Row 2+: [Question (e.g., <p><strong>)] [Answer (e.g., <p>)]
 */

const ICON_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Extract Heading Row
  const headerRow = rows[0];
  const headingContent = headerRow.children[1];

  // Extract QA Rows
  const qaRows = rows.slice(1);

  block.textContent = '';

  // ── 1. Build Header ──
  // The original layout had an h2 and a p (sub).
  // The authored content gives us an h2 (or similar) from headingContent,
  // and the "Heading" label in eyebrowText.

  // Since the user authored this as:
  // Col 1: Heading
  // Col 2: <h2>Frequently Asked Questions</h2>
  // (We don't have a sub-heading from the authored content block, so we'll just style the h2)

  if (headingContent) {
    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'faqs-header';

    // We clone the authored heading content
    headerWrapper.append(...headingContent.cloneNode(true).childNodes);
    block.append(headerWrapper);
  }

  // ── 2. Build Accordion List ──
  if (qaRows.length > 0) {
    const list = document.createElement('div');
    list.className = 'faq-accordion';

    qaRows.forEach((row) => {
      const qCell = row.children[0];
      const aCell = row.children[1];

      if (!qCell || !aCell) return;

      const questionText = qCell.textContent.trim();
      const answerContent = aCell;

      const details = document.createElement('details');
      details.className = 'faq-details';

      const summary = document.createElement('summary');
      summary.textContent = questionText;

      // Inject chevron SVG
      const svgWrapper = document.createElement('div');
      svgWrapper.innerHTML = ICON_CHEVRON;
      summary.append(svgWrapper.firstElementChild);

      const content = document.createElement('div');
      content.className = 'faq-content';
      // Append authored answer content
      content.append(...answerContent.cloneNode(true).childNodes);

      details.append(summary, content);
      list.append(details);
    });

    block.append(list);
  }
}
