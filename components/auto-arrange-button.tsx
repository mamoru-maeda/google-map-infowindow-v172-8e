"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Target } from "lucide-react"

interface AutoArrangeButtonProps {
  onAutoArrange: () => void
  disabled?: boolean
}

const AutoArrangeButton: React.FC<AutoArrangeButtonProps> = ({ onAutoArrange, disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onAutoArrange}
            disabled={disabled}
            size="sm"
            variant="outline"
            className="h-8 gap-1 bg-white backdrop-blur-sm hover:bg-white active:bg-white focus:bg-white"
          >
            <Target className="h-4 w-4" />
            <span>中心整列</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>吹き出しを地図中心に整列</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default AutoArrangeButton
