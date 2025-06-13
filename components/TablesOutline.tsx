"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import type { TableInfo } from '../lib/table-utils';
import { extractTablesFromHtml } from '../lib/table-utils';

interface TablesOutlineProps {
  content: string;
  onDeleteTable: (tableOriginalIndex: number) => void;
}

export function TablesOutline({ content, onDeleteTable }: TablesOutlineProps) {
  const [tables, setTables] = React.useState<TableInfo[]>([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const extracted = extractTablesFromHtml(content);
      setTables(extracted);
    }
  }, [content]);

  const handleDeleteClick = (tableIndex: number) => {
    const tableToDelete = tables.find(t => t.originalIndex === tableIndex);
    if (tableToDelete) {
        const confirmMessage = `Êtes-vous sûr de vouloir supprimer ce tableau ?\n${tableToDelete.caption ? `Légende: ${tableToDelete.caption}` : `Extrait: ${tableToDelete.htmlSnippet}`}`;
        const isConfirmed = window.confirm(confirmMessage);
        if (isConfirmed) {
            onDeleteTable(tableIndex);
        }
    }
  };

  if (tables.length === 0) {
    return <p className="text-muted-foreground text-center p-6">Aucun tableau trouvé dans le contenu.</p>;
  }

  return (
    <div className="space-y-2 p-4">
      <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-background py-2 z-10 border-b">
        Tableaux Détectés <span className="text-sm font-normal text-muted-foreground">({tables.length})</span>
      </h3>
      <ul className="space-y-3">
        {tables.map((table) => (
          <li
            key={table.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-shadow duration-150 ease-in-out"
          >
            <div className="flex-grow overflow-hidden pr-2">
              {table.caption && (
                <p className="text-sm font-medium text-foreground truncate" title={table.caption}>
                  {table.caption}
                </p>
              )}
              <p 
                className={`text-xs truncate ${table.caption ? 'text-muted-foreground' : 'text-foreground'}`}
                title={table.htmlSnippet}
              >
                {table.htmlSnippet}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {table.rowCount} lignes, {table.columnCount} colonnes (max)
              </p>
              {table.className && (
                <p className="text-xs text-muted-foreground mt-1 truncate" title={table.className}>
                  Classe(s): {table.className}
                </p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center ml-2 space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Visualiser
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw]">
                  <DialogHeader>
                    <DialogTitle>
                      Aperçu du Tableau {table.caption ? `- ${table.caption}` : `(ID: ${table.id})`}
                    </DialogTitle>
                    <DialogDescription>
                      {table.rowCount} lignes, {table.columnCount} colonnes (max).
                      {table.className && <span className="block mt-1">Classe(s): {table.className}</span>}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-auto p-1 border rounded my-4 bg-background table-preview-container">
                    <style>{`
                      .table-preview-container table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-bottom: 1rem;
                        font-size: 0.875rem; /* text-sm */
                        color: initial; /* Reset color to browser default or inherited from a higher parent */
                      }
                      .table-preview-container caption {
                        caption-side: top;
                        font-weight: bold;
                        margin-bottom: 0.5rem;
                        text-align: left;
                        padding: 0.5rem 0;
                        color: initial;
                      }
                      .table-preview-container th,
                      .table-preview-container td {
                        border: 1px solid #e2e8f0; /* zinc-300 or gray-300 equivalent */
                        padding: 0.5rem; /* p-2 */
                        text-align: left;
                        vertical-align: top;
                        color: initial;
                      }
                      .table-preview-container thead th {
                        background-color: #f7fafc; /* zinc-100 or gray-100 equivalent */
                        font-weight: 600; /* font-semibold */
                      }
                      .table-preview-container tbody tr:nth-of-type(even) {
                        background-color: #fdfdfe; /* zinc-50 or gray-50 equivalent for zebra striping */
                      }
                    `}</style>
                    <div dangerouslySetInnerHTML={{ __html: table.html }} />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Fermer
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(table.originalIndex)}
                aria-label={`Supprimer le tableau ${table.caption || `Tableau ${table.originalIndex + 1}`}`}
                className="text-destructive hover:text-destructive-hover hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
