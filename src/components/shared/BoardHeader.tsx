'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Settings, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Board, Project } from '@/src/types'

interface BoardHeaderProps {
  board: Board
  project: Project & { organization: { slug: string } }
}

export function BoardHeader({ board, project }: BoardHeaderProps) {
  const router = useRouter()

  return (
    <header
      // 1. Fixed height (h-14) and shrink-0 ensures flex layout below calculates perfectly
      // 2. w-full and NO z-index ensures it respects the sidebar and horizontal scrolling
      // 3. Relative positioning allows us to add the contrast overlay safely
      className="relative flex h-14 w-full shrink-0 items-center justify-between gap-4 border-b px-2 md:px-4 transition-colors"
      style={{ backgroundColor: board.color ?? '#0f172a' }}
    >
      {/* Contrast Overlay: 
        A subtle black overlay guarantees that white text is ALWAYS readable, 
        even if the user selects a neon yellow or pure white board color.
      */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true" />

      {/* Left section: Navigation & Breadcrumbs */}
      <div className="relative flex min-w-0 items-center gap-1 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white transition-colors"
          onClick={() =>
            router.push(`/projects/${project.id}`)
          }
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Separator to create a clean breadcrumb feel */}
        <div className="h-5 w-px bg-white/30 mx-1 hidden md:block" aria-hidden="true" />

        <div className="flex min-w-0 items-center gap-2.5 px-1 md:px-2">
          {/* Optional context icon gives the UI depth */}
          <div className="hidden shrink-0 items-center justify-center rounded bg-white/10 p-1.5 md:flex backdrop-blur-sm transition-colors hover:bg-white/20">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          
          {/* min-w-0 and truncate ensure long names never break the layout */}
          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="truncate text-sm font-bold tracking-tight text-white drop-shadow-sm">
              {board.name}
            </h1>
            <p className="truncate text-xs font-medium text-white/80">
              {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="relative flex shrink-0 items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden h-8 text-white bg-white/10 hover:bg-white/20 hover:text-white md:flex backdrop-blur-sm transition-colors"
        >
          Share
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}