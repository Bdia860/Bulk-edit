export interface HeadingInfo {
  originalIndex: number;
  level: number;
  text: string; // Not strictly needed for removal logic but good for context/logging
}

export function removeSectionFromHtml(htmlContent: string, headingInfo: HeadingInfo): string {
  if (typeof window === 'undefined') {
    // This function relies on DOMParser, so it should only run in the browser.
    console.warn('removeSectionFromHtml called in a non-browser environment. HTML will not be modified.');
    return htmlContent;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const body = doc.body; // Work within the body to handle fragments correctly

  const allHeadings = Array.from(body.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  if (headingInfo.originalIndex < 0 || headingInfo.originalIndex >= allHeadings.length) {
    console.warn(`Heading index ${headingInfo.originalIndex} is out of bounds.`);
    return htmlContent;
  }

  const targetHeadingElement = allHeadings[headingInfo.originalIndex];

  if (!targetHeadingElement) {
    console.warn(`Target heading at index ${headingInfo.originalIndex} not found.`);
    return htmlContent;
  }

  // Verify if the found heading matches the expected level, as a sanity check
  const targetHeadingLevel = parseInt(targetHeadingElement.tagName.substring(1), 10);
  if (targetHeadingLevel !== headingInfo.level) {
    console.warn(
      `Mismatch: Expected heading level ${headingInfo.level} but found ${targetHeadingLevel} at index ${headingInfo.originalIndex}. Text: "${targetHeadingElement.textContent?.trim() || ''}".`
    );
    // Depending on desired strictness, could return htmlContent here
  }

  const elementsToRemove: Element[] = [targetHeadingElement];
  let currentElement = targetHeadingElement.nextElementSibling;

  while (currentElement) {
    const tagName = currentElement.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      const currentHeadingLevel = parseInt(tagName.substring(1), 10);
      if (currentHeadingLevel <= headingInfo.level) {
        // Found a subsequent heading of the same or higher level, so stop.
        break;
      }
    }
    elementsToRemove.push(currentElement);
    currentElement = currentElement.nextElementSibling;
  }

  elementsToRemove.forEach(el => el.remove());

  return body.innerHTML;
}

export function removeMultipleSectionsFromHtml(htmlContent: string, headingsToRemove: HeadingInfo[]): string {
  if (typeof window === 'undefined' || headingsToRemove.length === 0) {
    return htmlContent;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const body = doc.body;

  // Crucially, sort the headings to remove in descending order of their original index.
  // This prevents the indices from shifting during removal.
  const sortedHeadings = [...headingsToRemove].sort((a, b) => b.originalIndex - a.originalIndex);

  sortedHeadings.forEach(headingInfo => {
    const allHeadings = Array.from(body.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    if (headingInfo.originalIndex < 0 || headingInfo.originalIndex >= allHeadings.length) {
      console.warn(`Skipping deletion: Heading index ${headingInfo.originalIndex} is out of bounds.`);
      return; // 'continue' for forEach
    }

    const targetHeadingElement = allHeadings[headingInfo.originalIndex];

    const elementsToRemove: Element[] = [targetHeadingElement];
    let currentElement = targetHeadingElement.nextElementSibling;

    while (currentElement) {
      const tagName = currentElement.tagName.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const currentHeadingLevel = parseInt(tagName.substring(1), 10);
        if (currentHeadingLevel <= headingInfo.level) {
          break;
        }
      }
      elementsToRemove.push(currentElement);
      currentElement = currentElement.nextElementSibling;
    }

    elementsToRemove.forEach(el => el.remove());
  });

  return body.innerHTML;
}
