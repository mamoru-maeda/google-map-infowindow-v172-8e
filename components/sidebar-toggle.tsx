"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SidebarToggle() {
  const { isOpen, setIsOpen } = useSidebar()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white shadow-md dark:bg-gray-950 transition-all duration-300"
              onClick={toggleSidebar}
              aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
            >
              {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <span className="sr-only">{isOpen ? "メニューを閉じる" : "メニューを開く"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOpen ? "メニューを閉じる" : "メニューを開く"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
