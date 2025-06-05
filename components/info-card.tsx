"use client"

import type React from "react"
import { Minimize2, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface InfoCardProps {
  title: string
  description: string
  image?: string
  category?: string
  categoryColor?: string
  severity?: "low" | "medium" | "high" | "critical"
  reportDate?: string
  status?: "reported" | "investigating" | "in_progress" | "resolved"
  city?: string
  onClose?: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
  isDragging?: boolean
  isOtherDragging?: boolean
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  image,
  category,
  categoryColor = "#6B7280",
  severity,
  reportDate,
  status,
  city,
  onClose,
  isMinimized = false,
  onToggleMinimize,
  isDragging = false,
  isOtherDragging = false,
}) => {
  // 深刻度に基づく色とラベルを取得
  const getSeverityInfo = () => {
    switch (severity) {
      case "critical":
        return { color: "bg-red-600 text-white", label: "緊急" }
      case "high":
        return { color: "bg-orange-500 text-white", label: "重大" }
      case "medium":
        return { color: "bg-yellow-500 text-white", label: "中程度" }
      case "low":
        return { color: "bg-green-500 text-white", label: "軽微" }
      default:
        return { color: "bg-gray-500 text-white", label: "不明" }
    }
  }

  // ステータスに基づく色とラベルを取得
  const getStatusInfo = () => {
    switch (status) {
      case "reported":
        return { color: "bg-blue-500 text-white", label: "報告済" }
      case "investigating":
        return { color: "bg-purple-500 text-white", label: "調査中" }
      case "in_progress":
        return { color: "bg-yellow-500 text-white", label: "対応中" }
      case "resolved":
        return { color: "bg-green-500 text-white", label: "解決済" }
      default:
        return { color: "bg-gray-500 text-white", label: "不明" }
    }
  }

  const severityInfo = getSeverityInfo()
  const statusInfo = getStatusInfo()

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300",
        isMinimized ? "w-48" : "w-72", // 幅を少し広げる
        isDragging && "shadow-xl", // ドラッグ中はシャドウを強調
        isOtherDragging && "opacity-70", // 他の吹き出しがドラッグ中の場合は透明度を下げる
      )}
      style={{
        userSelect: "none", // テキスト選択を防止
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        transition: isDragging ? "none" : undefined, // ドラッグ中はトランジションを無効化
      }}
    >
      <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2 overflow-hidden">
          {category && (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor }} />
          )}
          <h3 className="font-medium text-gray-800 truncate">{title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleMinimize}
            aria-label={isMinimized ? "最大化" : "最小化"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
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

      {!isMinimized && (
        <div className="p-3 transition-all duration-300 ease-in-out">
          {image && (
            <div className="mb-2">
              <img
                src={image || "/placeholder.svg"}
                alt={title}
                className="w-full h-32 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = "/generic-location.png"
                }}
                draggable="false" // 画像のドラッグを防止
              />
            </div>
          )}

          {/* 災害情報の詳細 */}
          <div className="mb-2 flex flex-wrap gap-1">
            {severity && <Badge className={severityInfo.color}>{severityInfo.label}</Badge>}
            {status && <Badge className={statusInfo.color}>{statusInfo.label}</Badge>}
            {city && <Badge variant="outline">{city}</Badge>}
          </div>

          {reportDate && <div className="mb-2 text-xs text-gray-500">報告日: {reportDate}</div>}

          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}
    </div>
  )
}

export default InfoCard
