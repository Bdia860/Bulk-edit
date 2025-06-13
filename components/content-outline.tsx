"use client"

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import type { HeadingInfo } from '../lib/html-utils';

interface ContentOutlineProps {
  content: string;
  onDeleteSection?: (headingInfos: HeadingInfo[]) => void;
}

interface HeadingNode extends HeadingInfo {
  id: string;
}

export function ContentOutline({ content, onDeleteSection }: ContentOutlineProps) {
  const [headings, setHeadings] = React.useState<HeadingNode[]>([]);
  const [selectedHeadings, setSelectedHeadings] = React.useState<Set<string>>(new Set());
  const [implicitlyHighlightedHeadings, setImplicitlyHighlightedHeadings] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Recalculate which headings are implicitly part of a selected section
    const newImplicitlyHighlighted = new Set<string>();

    if (selectedHeadings.size > 0) {
      const headingsById = new Map(headings.map(h => [h.id, h]));
      const allHeadingsIndices = new Map(headings.map((h, index) => [h.id, index]));

      for (const selectedId of selectedHeadings) {
        const startHeading = headingsById.get(selectedId);
        const startIndex = allHeadingsIndices.get(selectedId);

        if (!startHeading || startIndex === undefined) continue;

        for (let i = startIndex + 1; i < headings.length; i++) {
          const currentHeading = headings[i];
          if (currentHeading.level > startHeading.level) {
            newImplicitlyHighlighted.add(currentHeading.id);
          } else {
            break; // End of section
          }
        }
      }
    }
    setImplicitlyHighlightedHeadings(newImplicitlyHighlighted);
  }, [selectedHeadings, headings]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    const extractedHeadings: HeadingNode[] = headingElements.map((tag, index) => ({
      level: parseInt(tag.tagName.substring(1), 10),
      text: tag.textContent || '',
      originalIndex: index,
      id: `heading-${index}-${tag.tagName.toLowerCase()}`,
    }));

    setHeadings(extractedHeadings);
    setSelectedHeadings(new Set()); // Reset selection on content change
  }, [content]);

  const handleToggleSelection = (headingId: string) => {
    setSelectedHeadings(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(headingId)) {
        newSelected.delete(headingId);
      } else {
        newSelected.add(headingId);
      }
      return newSelected;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedHeadings.size === headings.length) {
      setSelectedHeadings(new Set());
    } else {
      const allHeadingIds = new Set(headings.map(h => h.id));
      setSelectedHeadings(allHeadingIds);
    }
  };

  const handleDeleteSelected = () => {
    if (!onDeleteSection || selectedHeadings.size === 0) return;

    const isConfirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer les ${selectedHeadings.size} section(s) sélectionnée(s) ? Cette action est irréversible.`
    );

    if (isConfirmed) {
      const headingsToDelete: HeadingInfo[] = headings
        .filter(h => selectedHeadings.has(h.id))
        .map(({ id, ...rest }) => rest); // Exclude 'id' to match HeadingInfo type

      onDeleteSection(headingsToDelete);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-2 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Checkbox
            id="select-all-headings"
            checked={headings.length > 0 && selectedHeadings.size === headings.length}
            onCheckedChange={handleToggleSelectAll}
            disabled={headings.length === 0}
            aria-label="Tout sélectionner"
          />
          <label htmlFor="select-all-headings" className="text-sm font-medium text-muted-foreground cursor-pointer">
            {selectedHeadings.size} / {headings.length} sélectionné(s)
          </label>
        </div>
        <Button
          onClick={handleDeleteSelected}
          disabled={selectedHeadings.size === 0}
          variant="destructive"
          size="sm"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer la sélection
        </Button>
      </div>

      {headings.length > 0 ? (
        <ul className="space-y-1 p-2">
          {headings.map((heading) => {
            const isExplicitlySelected = selectedHeadings.has(heading.id);
            const isImplicitlyHighlighted = implicitlyHighlightedHeadings.has(heading.id);

            let liClassName = 'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors';
            if (isExplicitlySelected) {
              liClassName += ' bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500';
            } else if (isImplicitlyHighlighted) {
              liClassName += ' bg-yellow-100/70 dark:bg-yellow-800/20 border-l-4 border-yellow-400';
            } else {
              liClassName += ' hover:bg-gray-100 dark:hover:bg-gray-800/50';
            }

            return (
              <li
                key={heading.id}
                className={liClassName}
                onClick={() => handleToggleSelection(heading.id)}
              >
                <Checkbox
                  checked={selectedHeadings.has(heading.id)}
                  onCheckedChange={() => handleToggleSelection(heading.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-labelledby={`heading-label-${heading.id}`}
                />
                <span
                  id={`heading-label-${heading.id}`}
                  className="flex-grow select-none"
                  style={{ paddingLeft: `${(heading.level - 1) * 20}px` }}
                >
                  <span className="font-bold text-muted-foreground mr-2">H{heading.level}</span>
                  {heading.text}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground text-center p-6">
          Aucun titre (H1-H6) trouvé dans le contenu.
        </p>
      )}
    </div>
  );
}
