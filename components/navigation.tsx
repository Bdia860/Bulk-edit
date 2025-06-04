import { ChevronRight, Home, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface NavigationProps {
  breadcrumbs: BreadcrumbItem[]
  onSettings?: () => void
  className?: string
}

export function Navigation({ breadcrumbs, onSettings, className }: NavigationProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-3 border-b bg-muted/30", className)}>
      <div className="flex items-center space-x-2">
        <Link href="/" className="hover:text-primary">
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            {item.href ? (
              <Link href={item.href} className="text-sm hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">{item.label}</span>
            )}
          </div>
        ))}
      </div>
      {onSettings && (
        <Button variant="ghost" size="icon" onClick={onSettings}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      )}
    </div>
  )
}
