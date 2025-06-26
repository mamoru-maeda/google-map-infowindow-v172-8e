"use client"

import type React from "react"
import { useState, useRef } from "react"
import { ArrowUpIcon as ArrowsOut, ArrowsUpFromLineIcon as ArrowsIn, X, CornerRightDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { INFO_WINDOW_SIZES, getDefaultSize } from "@/constants/infowindow-sizes"

interface InfoWindowProps {
  title: string
  description: string
  image?: string
  onClose?: () => void
}

const InfoWindow: React.FC<InfoWindowProps> = ({ title, description, image, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [size, setSize] = useState(getDefaultSize())
  const [isDragging, setIsDragging] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [resizeHandleColor, setResizeHandleColor] = useState("orange") // デフォルト色
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // プリセットサイズ
  const presetSizes = {
    small: { width: 150, height: 180 },
    medium: { width: 220, height: 250 },
    large: { width: 300, height: 350 },
  }

  const setPresetSize = (preset: keyof typeof presetSizes) => {
    setSize(presetSizes[preset])
    setShowInstructions(false)
  }

  // カラーテーマ
  const colorThemes = {
    orange: {
      normal: "text-orange-500",
      hover: "text-orange-600",
      active: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    blue: {
      normal: "text-blue-500",
      hover: "text-blue-600",
      active: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    green: {
      normal: "text-green-500",
      hover: "text-green-600",
      active: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    purple: {
      normal: "text-purple-500",
      hover: "text-purple-600",
      active: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    red: {
      normal: "text-red-500",
      hover: "text-red-600",
      active: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    teal: {
      normal: "text-teal-500",
      hover: "text-teal-600",
      active: "text-teal-700",
      bg: "bg-teal-50",
      border: "border-teal-200",
    },
  }

  const currentTheme = colorThemes[resizeHandleColor as keyof typeof colorThemes]

  // リサイズハンドラ
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("🎯 リサイズ開始")
    e.preventDefault()
    setShowInstructions(false)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    setIsDragging(true)

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      const constraints = INFO_WINDOW_SIZES.CONSTRAINTS
      const newWidth = Math.max(constraints.MIN_WIDTH, Math.min(constraints.MAX_WIDTH, startWidth + deltaX))
      const newHeight = Math.max(constraints.MIN_HEIGHT, Math.min(constraints.MAX_HEIGHT, startHeight + deltaY))

      setSize({ width: newWidth, height: newHeight })
      console.log(`📏 サイズ: ${newWidth}×${newHeight}`)
    }

    const handleMouseUp = () => {
      console.log("✅ リサイズ完了")
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // ダブルクリックでデフォルトサイズに戻す
  const handleDoubleClick = () => {
    setSize(getDefaultSize())
    console.log("🔄 デフォルトサイズに戻しました")
  }

  return (
    <div
      ref={containerRef}
      className={cn("bg-white rounded-lg shadow-lg overflow-hidden relative", isMinimized ? "w-32 h-auto" : "")}
      style={!isMinimized ? { width: `${size.width}px`, height: `${size.height}px` } : undefined}
    >
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-800 truncate text-sm">{title}</h3>
        <div className="flex items-center space-x-1">
          {/* 外側に向かう矢印アイコン（拡大）/ 内側に向かう矢印アイコン（縮小） */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={toggleMinimize}
            aria-label={isMinimized ? "拡大" : "縮小"}
            title={isMinimized ? "吹き出しを拡大" : "吹き出しを縮小"}
          >
            {isMinimized ? (
              <ArrowsOut className="h-3 w-3 text-blue-600" />
            ) : (
              <ArrowsIn className="h-3 w-3 text-gray-600" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-gray-500 hover:text-red-500"
              onClick={onClose}
              aria-label="閉じる"
              title="吹き出しを閉じる"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      {!isMinimized && (
        <div className="relative" style={{ height: `${size.height - 40}px` }}>
          {/* カラーピッカー */}
          <div className="absolute top-2 left-2 flex gap-1 z-20">
            {Object.keys(colorThemes).map((color) => (
              <button
                key={color}
                onClick={() => setResizeHandleColor(color)}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-200",
                  colorThemes[color as keyof typeof colorThemes].bg,
                  colorThemes[color as keyof typeof colorThemes].border,
                  resizeHandleColor === color ? "scale-125 shadow-md" : "scale-100 hover:scale-110",
                )}
                title={`リサイズハンドルの色を${color}に変更`}
              />
            ))}
          </div>

          {/* プリセットサイズボタン */}
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            <button
              onClick={() => setPresetSize("small")}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              title="小サイズ (150×180)"
            >
              小
            </button>
            <button
              onClick={() => setPresetSize("medium")}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              title="中サイズ (220×250)"
            >
              中
            </button>
            <button
              onClick={() => setPresetSize("large")}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              title="大サイズ (300×350)"
            >
              大
            </button>
          </div>

          <div className="p-2 h-full overflow-auto pt-8">
            {image && (
              <div className="mb-2">
                <img
                  src={image || "/placeholder.svg"}
                  alt={title}
                  className="w-full object-cover rounded"
                  style={{ height: "60px" }}
                  onError={(e) => {
                    e.currentTarget.src = "/generic-location.png"
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-600">{description}</p>
          </div>

          {/* カスタマイズされた三角形リサイズハンドル */}
          <div
            className={cn(
              "absolute bottom-0 right-0 w-12 h-12 cursor-se-resize",
              "flex items-center justify-center rounded-tl-xl",
              "transition-all duration-300 ease-out",
              "border-2 shadow-lg",
              isDragging
                ? cn(currentTheme.active, currentTheme.bg, currentTheme.border, "scale-110 shadow-xl")
                : cn(currentTheme.normal, "bg-white hover:scale-105", currentTheme.border, "hover:shadow-xl"),
            )}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="ドラッグしてサイズ変更 | ダブルクリックでリセット"
          >
            <CornerRightDown
              className={cn(
                "w-7 h-7 transition-all duration-300",
                isDragging ? currentTheme.active : cn(currentTheme.normal, `hover:${currentTheme.hover}`),
              )}
            />

            {/* 追加の視覚的インジケーター */}
            <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-current opacity-30" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-current opacity-50" />
          </div>

          {/* 操作説明（初回のみ） */}
          {showInstructions && (
            <div className="absolute bottom-14 right-2 bg-black bg-opacity-90 text-white text-xs p-3 rounded-lg max-w-48 shadow-xl">
              <div className="mb-2 font-semibold">🎨 カスタマイズ機能:</div>
              <div className="mb-1">• 左上の色ボタンでハンドル色変更</div>
              <div className="mb-1">• 右下の三角形をドラッグでリサイズ</div>
              <div className="mb-1">• 右上の小/中/大ボタン</div>
              <div className="mb-2">• ダブルクリックでリセット</div>
              <button onClick={() => setShowInstructions(false)} className="text-blue-300 underline text-xs">
                閉じる
              </button>
            </div>
          )}

          {/* 現在のサイズとテーマ表示 */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            <div>
              {size.width} × {size.height}px
            </div>
            <div className="text-xs opacity-75">テーマ: {resizeHandleColor}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoWindow
