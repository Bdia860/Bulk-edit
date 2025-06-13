export interface TableInfo {
  id: string; // e.g., table-${index}
  originalIndex: number; // Its index among all tables in the document
  caption?: string; // Content of <caption> if present
  rowCount: number;
  columnCount: number; // Max columns in any row
  htmlSnippet: string; // A short snippet or the outerHTML of the table for preview/identification
  html: string; // Full HTML of the table element
  className?: string; // CSS class names of the table element
}

export function extractTablesFromHtml(htmlContent: string): TableInfo[] {
  if (typeof window === 'undefined' || !htmlContent) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const tableElements = Array.from(doc.querySelectorAll('table'));

  return tableElements.map((tableEl, index) => {
    const captionEl = tableEl.querySelector('caption');
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    const rowCount = rows.length;
    let maxColumnCount = 0;

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      let currentCellColspanSum = 0;
      cells.forEach(cell => {
        const colspan = cell.getAttribute('colspan');
        currentCellColspanSum += colspan ? parseInt(colspan, 10) : 1;
      });
      if (currentCellColspanSum > maxColumnCount) {
        maxColumnCount = currentCellColspanSum;
      }
    });

    // Create a simple snippet (e.g., first row text content)
    let snippet = 'Tableau vide';
    if (rows.length > 0) {
      const firstRowCells = Array.from(rows[0].querySelectorAll('th, td'));
      snippet = firstRowCells.map(cell => cell.textContent?.trim()).filter(Boolean).join(' | ');
      if (snippet.length > 100) {
        snippet = snippet.substring(0, 97) + '...';
      }
    }
    if (!snippet && captionEl?.textContent) {
        snippet = `Légende: ${captionEl.textContent.trim()}`;
    }


    return {
      id: `table-${index}-${Date.now()}`,
      originalIndex: index,
      caption: captionEl?.textContent?.trim() || undefined,
      rowCount,
      columnCount: maxColumnCount,
      htmlSnippet: snippet || `Tableau ${index + 1}`,
      html: tableEl.outerHTML,
      className: tableEl.className || undefined,
    };
  });
}

export function removeTableFromHtml(htmlContent: string, tableOriginalIndex: number): string {
  if (typeof window === 'undefined' || !htmlContent) return htmlContent;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const body = doc.body;
  const tableElements = Array.from(body.querySelectorAll('table'));

  if (tableOriginalIndex >= 0 && tableOriginalIndex < tableElements.length) {
    tableElements[tableOriginalIndex].remove();
  }

  return body.innerHTML;
}
