"use client"

import type React from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SnapshotButtonProps {
  onSnapshot: () => void
  disabled?: boolean
  activeCount?: number
}

const SnapshotButton: React.FC<SnapshotButtonProps> = ({ onSnapshot, disabled = false, activeCount = 0 }) => {
  // 1つ以上の吹き出しが表示されている場合は白色（透過率0％）、そうでなければ白色（透過率85%）
  const backgroundClass = activeCount > 0 ? "bg-white" : "bg-white/85"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" className={`w-full ${backgroundClass}`} onClick={onSnapshot} disabled={disabled}>
            <Camera className="h-4 w-4 mr-2" />
            スナップショット
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>現在の吹き出し位置を保存</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default SnapshotButton
