"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

interface RecenterButtonProps {
  onRecenter: () => void
}

const RecenterButton: React.FC<RecenterButtonProps> = ({ onRecenter }) => {
  return (
    <Button
      onClick={onRecenter}
      size="sm"
      variant="outline"
      className="bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
    >
      <Home className="h-4 w-4 mr-1" />
      中心に戻る
    </Button>
  )
}

export default RecenterButton
