"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ZoomInButtonProps {
  onZoomIn: () => void
}

const ZoomInButton: React.FC<ZoomInButtonProps> = ({ onZoomIn }) => {
  return (
    <Button
      onClick={onZoomIn}
      size="sm"
      variant="outline"
      className="bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
    >
      <Plus className="h-4 w-4 mr-1" />
      ズームイン
    </Button>
  )
}

export default ZoomInButton
