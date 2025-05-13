"use client"

import type React from "react"
import { ArrowDownWideNarrow } from "lucide-react"
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
          <Button variant="outline" size="sm" className="h-8" onClick={onAutoArrange}>
            <ArrowDownWideNarrow className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>吹き出しを自動整列</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default AutoArrangeButton
