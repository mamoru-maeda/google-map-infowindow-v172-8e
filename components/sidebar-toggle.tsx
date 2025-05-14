"use client"
import { PanelLeft, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SidebarToggle() {
  const { isOpen, setIsOpen } = useSidebar()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-sm shadow-sm border rounded-full w-10 h-10 transition-all duration-300 hover:bg-blue-100"
            onClick={toggleSidebar}
            aria-label={isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          >
            {isOpen ? (
              <PanelLeft className="h-5 w-5 text-blue-600" />
            ) : (
              <PanelRight className="h-5 w-5 text-blue-600" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
