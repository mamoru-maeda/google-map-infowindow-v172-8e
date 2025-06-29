"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AutoArrangeButtonProps {
  onAutoArrange: () => void
}

const AutoArrangeButton: React.FC<AutoArrangeButtonProps> = ({ onAutoArrange }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onAutoArrange}
            size="sm"
            variant="outline"
            className="bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
          >
            中心整列
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>吹き出しを中心に整列</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default AutoArrangeButton
