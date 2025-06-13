"use client"

import React from 'react';

interface ContentOutlineProps {
  content: string;
}

interface HeadingNode {
  level: number; // 1 for H1, 2 for H2, etc.
  text: string;
  id: string;
}

export function ContentOutline({ content }: ContentOutlineProps) {
  const [headings, setHeadings] = React.useState<HeadingNode[]>([]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure this runs only in the browser

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const extractedHeadings: HeadingNode[] = [];
    const headingTags = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    headingTags.forEach((tag, index) => {
      extractedHeadings.push({
        level: parseInt(tag.tagName.substring(1), 10),
        text: tag.textContent || '',
        id: `heading-${index}-${tag.tagName.toLowerCase()}`
      });
    });

    setHeadings(extractedHeadings);
  }, [content]);

  if (headings.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Aucun titre (H1-H6) détecté dans le contenu.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-semibold mb-3">Plan du Document</h2>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ marginLeft: `${(heading.level - 1) * 20}px` }}
            className={`text-sm ${heading.level === 1 ? 'font-bold' : ''} ${heading.level === 2 ? 'font-semibold' : ''}`}
          >
            <span className="text-muted-foreground mr-2">H{heading.level}</span>
            {heading.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
