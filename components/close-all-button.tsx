"use client"

import type React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CloseAllButtonProps {
  onCloseAll: () => void
  disabled?: boolean
}

const CloseAllButton: React.FC<CloseAllButtonProps> = ({ onCloseAll, disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" onClick={onCloseAll} disabled={disabled}>
            <X className="h-4 w-4 mr-1" />
            <span>全て閉じる</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>吹き出しを全て閉じる</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default CloseAllButton
