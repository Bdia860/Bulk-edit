"use client"

import { Copy, Save, Search, Lightbulb } from "lucide-react"
import { Button } from "./ui/button"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

interface EditorToolbarProps {
  mode: "content" | "style" | "logs" | "css-preview" | "header" | "footer" | "general"
  onModeChange: (mode: "content" | "style" | "logs" | "css-preview" | "header" | "footer" | "general") => void
  onCopy: () => void
  onSave: () => void
  onSearchReplace: () => void
  onSuggestions?: () => void
  isCopied: boolean
  isSaving: boolean
  canSave: boolean
  className?: string
}

export function EditorToolbar({
  mode,
  onModeChange,
  onCopy,
  onSave,
  onSearchReplace,
  onSuggestions,
  isCopied,
  isSaving,
  canSave,
  className,
}: EditorToolbarProps) {
  return (
    <div className={`flex items-center justify-between p-2 border-b ${className}`}>
      <Tabs
        value={mode}
        onValueChange={(value) =>
          onModeChange(value as "content" | "style" | "logs" | "css-preview" | "header" | "footer")
        }
      >
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="css-preview">CSS Preview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
      </Tabs>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {onSuggestions && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onSuggestions}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggestions
                </Button>
              </TooltipTrigger>
              <TooltipContent>Suggestions de corrections</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onSearchReplace}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <kbd>⌘</kbd> + <kbd>F</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <kbd>⌘</kbd> + <kbd>C</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={onSave} disabled={!canSave || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <kbd>⌘</kbd> + <kbd>S</kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}
