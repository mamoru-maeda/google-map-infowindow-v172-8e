"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Grid3X3 } from 'lucide-react'

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
            className="bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
          >
            整列
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
