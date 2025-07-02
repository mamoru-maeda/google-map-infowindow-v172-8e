"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Minus } from "lucide-react"

interface ZoomOutButtonProps {
  onZoomOut: () => void
}

const ZoomOutButton: React.FC<ZoomOutButtonProps> = ({ onZoomOut }) => {
  return (
    <Button
      onClick={onZoomOut}
      size="sm"
      variant="outline"
      className="bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
    >
      <Minus className="h-4 w-4 mr-1" />
      ズームアウト
    </Button>
  )
}

export default ZoomOutButton
