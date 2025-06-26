"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Minimize2, Maximize2, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { INFO_WINDOW_SIZES, getMinimizePresetSize, type MinimizePresetKey } from "@/constants/infowindow-sizes"
import { getCurrentDefaultSize } from "@/hooks/use-infowindow-settings"

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
  isDragging = false,
  isOtherDragging = false,
}) => {
  // 設定から現在のデフォルトサイズを取得
  const getInitialSize = () => getCurrentDefaultSize()

  const [size, setSize] = useState(getInitialSize())
  const [isResizing, setIsResizing] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [previousSize, setPreviousSize] = useState(getInitialSize())
  const [minimizePreset, setMinimizePreset] = useState<MinimizePresetKey>("small")
  const [customMinimizeSize, setCustomMinimizeSize] = useState(getMinimizePresetSize("custom"))
  const [showMinimizeSettings, setShowMinimizeSettings] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const constraints = INFO_WINDOW_SIZES.CONSTRAINTS

  // 現在の最小化サイズを取得
  const getCurrentMinimizeSize = () => {
    if (minimizePreset === "custom") {
      return customMinimizeSize
    }
    return getMinimizePresetSize(minimizePreset)
  }

  // 縮小・拡大ボタンの処理
  const handleToggleMinimize = () => {
    if (isMinimized) {
      console.log("🔍 拡大: 元のサイズに復元")
      setSize(previousSize)
      setIsMinimized(false)
    } else {
      console.log("🔽 縮小: デフォルトサイズに変更")
      setPreviousSize(size)
      // 縮小時は現在のデフォルトサイズに戻す
      setSize(getCurrentDefaultSize())
      setIsMinimized(true)
    }
  }

  // 最小化プリセットの変更
  const handlePresetChange = (preset: MinimizePresetKey) => {
    setMinimizePreset(preset)
    if (isMinimized) {
      const newSize = preset === "custom" ? customMinimizeSize : getMinimizePresetSize(preset)
      setSize({ width: newSize.width, height: newSize.height })
    }
  }

  // カスタムサイズの変更
  const handleCustomSizeChange = (dimension: "width" | "height", value: number) => {
    const clampedValue =
      dimension === "width"
        ? Math.max(constraints.MIN_WIDTH, Math.min(constraints.MAX_WIDTH, value))
        : Math.max(constraints.MIN_HEIGHT, Math.min(constraints.MAX_HEIGHT, value))

    const newCustomSize = { ...customMinimizeSize, [dimension]: clampedValue }
    setCustomMinimizeSize(newCustomSize)

    if (isMinimized && minimizePreset === "custom") {
      setSize(newCustomSize)
    }
  }

  // リサイズハンドラ
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return

    console.log("🎯 リサイズ開始 - InfoCard")
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    setIsResizing(true)

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      const newWidth = Math.max(constraints.MIN_WIDTH, Math.min(constraints.MAX_WIDTH, startWidth + deltaX))
      const newHeight = Math.max(constraints.MIN_HEIGHT, Math.min(constraints.MAX_HEIGHT, startHeight + deltaY))

      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      console.log("✅ リサイズ完了 - InfoCard")
      setIsResizing(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

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
  const currentPreset = INFO_WINDOW_SIZES.MINIMIZE_PRESETS[minimizePreset]

  // フォントサイズを計算する関数を追加（コンポーネントの先頭付近に）
  const calculateFontSizes = () => {
    const baseWidth = getCurrentDefaultSize().width // 基準となる幅を現在のデフォルトサイズに変更
    const baseHeight = getCurrentDefaultSize().height // 基準となる高さを現在のデフォルトサイズに変更
    const currentArea = size.width * size.height
    const baseArea = baseWidth * baseHeight
    const scaleFactor = Math.sqrt(currentArea / baseArea)

    return {
      title: Math.max(12, Math.min(18, 14 * scaleFactor)),
      description: Math.max(11, Math.min(16, 13 * scaleFactor)),
      badge: Math.max(10, Math.min(14, 11 * scaleFactor)),
      date: Math.max(10, Math.min(13, 11 * scaleFactor)),
    }
  }

  const fontSizes = calculateFontSizes()

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-white rounded-lg shadow-lg relative transition-all duration-300",
        isDragging && "cursor-move shadow-xl",
        isOtherDragging && "opacity-70",
        isMinimized && "shadow-md",
      )}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserUserSelect: "none",
        msUserSelect: "none",
        transition: isDragging || isResizing ? "none" : "all 0.3s ease-in-out",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 最小化設定パネル */}
      {showMinimizeSettings && !isMinimized && (
        <div className="absolute top-12 left-0 bg-white border rounded-lg shadow-lg p-3 z-50 w-64">
          <h4 className="font-medium text-sm mb-2">最小化サイズ設定</h4>

          {/* プリセット選択 */}
          <div className="space-y-2 mb-3">
            {Object.entries(INFO_WINDOW_SIZES.MINIMIZE_PRESETS).map(([key, preset]) => (
              <label key={key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="minimizePreset"
                  value={key}
                  checked={minimizePreset === key}
                  onChange={() => handlePresetChange(key as MinimizePresetKey)}
                  className="text-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{preset.label}</div>
                  <div className="text-xs text-gray-500">
                    {preset.width}×{preset.height}px - {preset.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* カスタムサイズ設定 */}
          {minimizePreset === "custom" && (
            <div className="border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">幅 (80-400px)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={constraints.MIN_WIDTH}
                      max={constraints.MAX_WIDTH}
                      step="10"
                      value={customMinimizeSize.width}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 80 : Number.parseInt(e.target.value)
                        handleCustomSizeChange("width", value)
                      }}
                      onBlur={(e) => {
                        const value = e.target.value === "" ? 80 : Number.parseInt(e.target.value)
                        const clampedValue = Math.max(constraints.MIN_WIDTH, Math.min(constraints.MAX_WIDTH, value))
                        if (value !== clampedValue) {
                          handleCustomSizeChange("width", clampedValue)
                        }
                      }}
                      className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="幅"
                    />
                    <div className="absolute right-1 top-0 h-full flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleCustomSizeChange("width", customMinimizeSize.width + 10)}
                        className="flex-1 px-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t"
                        title="幅を増やす"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCustomSizeChange("width", customMinimizeSize.width - 10)}
                        className="flex-1 px-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-b"
                        title="幅を減らす"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">高さ (30-500px)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={constraints.MIN_HEIGHT}
                      max={constraints.MAX_HEIGHT}
                      step="10"
                      value={customMinimizeSize.height}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 30 : Number.parseInt(e.target.value)
                        handleCustomSizeChange("height", value)
                      }}
                      onBlur={(e) => {
                        const value = e.target.value === "" ? 30 : Number.parseInt(e.target.value)
                        const clampedValue = Math.max(constraints.MIN_HEIGHT, Math.min(constraints.MAX_HEIGHT, value))
                        if (value !== clampedValue) {
                          handleCustomSizeChange("height", clampedValue)
                        }
                      }}
                      className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                      placeholder="高さ"
                    />
                    <div className="absolute right-1 top-0 h-full flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleCustomSizeChange("height", customMinimizeSize.height + 10)}
                        className="flex-1 px-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t"
                        title="高さを増やす"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCustomSizeChange("height", customMinimizeSize.height - 10)}
                        className="flex-1 px-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-b"
                        title="高さを減らす"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                現在のサイズ: {customMinimizeSize.width}×{customMinimizeSize.height}px
              </div>
              <div className="mt-1 flex gap-1">
                <button
                  onClick={() => {
                    setCustomMinimizeSize(getMinimizePresetSize("custom"))
                    if (isMinimized && minimizePreset === "custom") {
                      setSize(getMinimizePresetSize("custom"))
                    }
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  リセット
                </button>
                <button
                  onClick={() => {
                    const newSize = { width: size.width, height: size.height }
                    setCustomMinimizeSize(newSize)
                    if (isMinimized && minimizePreset === "custom") {
                      setSize(newSize)
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
                >
                  現在のサイズを適用
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowMinimizeSettings(false)}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
          >
            設定を閉じる
          </button>
        </div>
      )}

      {/* ヘッダー - 高さを統一 */}
      <div
        className="flex justify-between items-start bg-gray-50 border-b rounded-t-lg"
        style={{ minHeight: "48px", padding: "8px 12px" }}
      >
        <div className="flex items-start space-x-2 overflow-hidden flex-1 pr-2">
          {category && (
            <span className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: categoryColor }} />
          )}
          <h3
            className="font-medium text-gray-800 text-sm leading-tight"
            style={{
              fontSize: `${fontSizes.title}px`,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
              lineHeight: "1.3",
            }}
          >
            {title}
          </h3>
        </div>

        <div className="flex items-start space-x-1 flex-shrink-0 mt-1">
          {/* 最小化設定ボタン - 最小化時は非表示 */}
          {!isMinimized && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-500 hover:text-purple-500"
              onClick={() => setShowMinimizeSettings(!showMinimizeSettings)}
              aria-label="最小化設定"
              title="最小化サイズを設定"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:text-blue-500"
            onClick={handleToggleMinimize}
            aria-label={isMinimized ? "拡大" : "デフォルトサイズに戻す"}
            title={
              isMinimized
                ? `拡大 (${previousSize.width}×${previousSize.height})`
                : `デフォルトサイズに戻す (${getCurrentDefaultSize().width}×${getCurrentDefaultSize().height})`
            }
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

      {/* コンテンツ */}
      <div className="relative rounded-b-lg overflow-hidden flex-1">
        <div className="p-3 h-full overflow-auto">
          {image && (
            <div className="mb-2">
              <img
                src={image || "/placeholder.svg"}
                alt={title}
                className="w-full object-cover rounded"
                style={{
                  height: Math.max(100, Math.min(400, (size.height - 48) * 0.55)) + "px",
                  aspectRatio: "4/3", // 縦横比を4:3に変更
                }}
                onError={(e) => {
                  e.currentTarget.src = "/generic-location.png"
                }}
                draggable="false"
              />
            </div>
          )}

          <div className="mb-2 flex flex-wrap gap-1">
            {severity && (
              <Badge className={severityInfo.color} style={{ fontSize: `${fontSizes.badge}px` }}>
                {severityInfo.label}
              </Badge>
            )}
            {status && (
              <Badge className={statusInfo.color} style={{ fontSize: `${fontSizes.badge}px` }}>
                {statusInfo.label}
              </Badge>
            )}
            {city && (
              <Badge variant="outline" style={{ fontSize: `${fontSizes.badge}px` }}>
                {city}
              </Badge>
            )}
          </div>

          {reportDate && (
            <div className="mb-2 text-xs text-gray-500" style={{ fontSize: `${fontSizes.date}px` }}>
              受信日: {reportDate}
            </div>
          )}

          <p
            className="text-sm text-gray-600 break-words"
            style={{ fontSize: `${fontSizes.description}px`, lineHeight: "1.4" }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* リサイズハンドル */}
      {!isMinimized && (
        <div
          className={cn(
            "absolute cursor-se-resize flex items-center justify-center transition-all duration-200 ease-out z-50",
            isResizing ? "opacity-100 scale-110" : "opacity-70 hover:opacity-100 hover:scale-105",
          )}
          onMouseDown={handleResizeMouseDown}
          title="ドラッグしてサイズ変更"
          style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            width: "18px",
            height: "18px",
            zIndex: 9999,
            backgroundColor: isResizing ? "#4B5563" : "#6B7280",
            borderTopLeftRadius: "8px",
            borderBottomRightRadius: "8px",
          }}
        >
          <div className="grid grid-cols-3 grid-rows-3 gap-0.5" style={{ width: "10px", height: "10px" }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-sm opacity-80" style={{ width: "2px", height: "2px" }} />
            ))}
          </div>
        </div>
      )}

      {/* 最小化状態インジケーター */}
      {isMinimized && (
        <div className="absolute bottom-1 right-1">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
            title={`デフォルトサイズ表示中 (${getCurrentDefaultSize().width}×${getCurrentDefaultSize().height})`}
          />
        </div>
      )}
    </div>
  )
}

export default InfoCard
