"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Grid3X3 } from "lucide-react"

interface OrganizeButtonProps {
  onOrganize: () => void
  disabled?: boolean
}

const OrganizeButton: React.FC<OrganizeButtonProps> = ({ onOrganize, disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onOrganize}
            disabled={disabled}
            size="sm"
            variant="outline"
            className="h-8 gap-1 bg-white backdrop-blur-sm hover:bg-white active:bg-white focus:bg-white"
          >
            <Grid3X3 className="h-4 w-4" />
            <span>周辺整列</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>吹き出しを地図の辺に整列</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default OrganizeButton
