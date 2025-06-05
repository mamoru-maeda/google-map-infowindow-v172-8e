"use client"

import type React from "react"

import { useState } from "react"
import { Minimize2, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InfoWindowProps {
  title: string
  description: string
  image?: string
  onClose?: () => void
}

const InfoWindow: React.FC<InfoWindowProps> = ({ title, description, image, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false)

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300",
        isMinimized ? "w-32" : "w-44",
      )}
    >
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-800 truncate text-sm">{title}</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={toggleMinimize}
            aria-label={isMinimized ? "最大化" : "最小化"}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-gray-500 hover:text-red-500"
              onClick={onClose}
              aria-label="閉じる"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="p-2 transition-all duration-300 ease-in-out">
          {image && (
            <div className="mb-2">
              <img
                src={image || "/placeholder.svg"}
                alt={title}
                className="w-full h-24 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = "/generic-location.png"
                }}
              />
            </div>
          )}
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      )}
    </div>
  )
}

export default InfoWindow
