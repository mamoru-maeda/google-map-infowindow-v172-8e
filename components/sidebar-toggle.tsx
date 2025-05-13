"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="fixed top-4 left-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white shadow-md dark:bg-gray-950"
              onClick={toggleSidebar}
              aria-label="メニューを切り替え"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">メニューを切り替え</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>メニューを切り替え</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
