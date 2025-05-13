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
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300",
        isExpanded ? "w-60" : "w-40",
      )}
    >
      <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-800 truncate">{title}</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleExpand}
            aria-label={isExpanded ? "縮小" : "拡大"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-500 hover:text-red-500"
              onClick={onClose}
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 transition-all duration-300 ease-in-out">
        {image && (
          <div className="mb-2">
            <img
              src={image || "/placeholder.svg"}
              alt={title}
              className={cn("w-full object-cover rounded", isExpanded ? "h-32" : "h-24")}
              onError={(e) => {
                e.currentTarget.src = "/generic-location.png"
              }}
            />
          </div>
        )}
        <p className={cn("text-sm text-gray-600", !isExpanded && "line-clamp-2")}>{description}</p>
      </div>
    </div>
  )
}

export default InfoWindow
