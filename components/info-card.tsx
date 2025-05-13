"use client"

import { Minimize2, Maximize2, X, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type React from "react"
import { useRef, useState, useEffect } from "react"

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
  // 内部状態として拡大/縮小を管理
  const [isExpanded, setIsExpanded] = useState(false)

  // リサイズ関連のステート
  const [width, setWidth] = useState<number | null>(null)
  const [height, setHeight] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false)
  const [minimizedWidth, setMinimizedWidth] = useState<number | null>(null)
  const [minimizedHeight, setMinimizedHeight] = useState<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })

  // コンポーネントへの参照
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const initialSizeRef = useRef({ width: 0, height: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const aspectRatioRef = useRef(1)

  // 外部から制御される場合はそちらを優先
  const expanded = onToggleMinimize ? !isMinimized : isExpanded

  // 画像がロードされたときに自然サイズを保存
  const handleImageLoad = () => {
    if (imageRef.current) {
      const naturalWidth = imageRef.current.naturalWidth
      const naturalHeight = imageRef.current.naturalHeight

      console.log("画像がロードされました:", {
        naturalWidth,
        naturalHeight,
        src: imageRef.current.src,
      })

      setImageNaturalSize({
        width: naturalWidth,
        height: naturalHeight,
      })
      setImageLoaded(true)
    }
  }

  // 現在のサイズに基づいてフォントサイズを計算
  const calculateFontSizes = () => {
    // 現在のコンテナサイズを取得
    const containerWidth = expanded ? width || 240 : minimizedWidth || 160

    // 基準となるサイズ
    const baseWidth = expanded ? 240 : 160

    // サイズ比率を計算（最小0.8、最大1.5）
    const sizeRatio = Math.max(0.8, Math.min(1.5, containerWidth / baseWidth))

    // 各要素のベースフォントサイズ
    const baseTitleSize = expanded ? 14 : 12
    const baseDescSize = expanded ? 13 : 11
    const baseBadgeSize = expanded ? 11 : 10
    const baseDateSize = expanded ? 11 : 10

    // 比率に基づいてフォントサイズを計算
    return {
      title: `${Math.round(baseTitleSize * sizeRatio)}px`,
      description: `${Math.round(baseDescSize * sizeRatio)}px`,
      badge: `${Math.round(baseBadgeSize * sizeRatio)}px`,
      date: `${Math.round(baseDateSize * sizeRatio)}px`,
      lineHeight: `${Math.round(1.4 * sizeRatio * 100) / 100}`, // 行間も調整
    }
  }

  // 現在のサイズに基づいて画像のサイズを計算
  const calculateImageSize = () => {
    // コンテナの現在のサイズを取得
    const containerWidth = expanded ? width || 240 : minimizedWidth || 160
    const containerHeight = expanded ? height || 300 : minimizedHeight || 200

    // 利用可能な最大幅（パディングを考慮）
    const availableWidth = containerWidth - 16 // padding 8px * 2

    // 画像の最大高さ（コンテナの高さの割合）- 制限を緩和
    const maxImageHeight = expanded
      ? Math.max(containerHeight * 0.6, 50) // 最小高さを設定して小さすぎないようにする
      : Math.max(containerHeight * 0.5, 40)

    // 画像のアスペクト比を維持しながらサイズを計算
    if (imageLoaded && imageNaturalSize.width > 0 && imageNaturalSize.height > 0) {
      const imageAspectRatio = imageNaturalSize.width / imageNaturalSize.height

      // 幅に基づいて高さを計算
      let calculatedHeight = availableWidth / imageAspectRatio

      // 最大高さを超える場合は、高さに基づいて幅を再計算
      if (calculatedHeight > maxImageHeight) {
        calculatedHeight = maxImageHeight
        const calculatedWidth = calculatedHeight * imageAspectRatio
        return {
          width: `${calculatedWidth}px`,
          height: `${calculatedHeight}px`,
          maxWidth: "100%",
        }
      }

      return {
        width: `${availableWidth}px`,
        height: `${calculatedHeight}px`,
        maxWidth: "100%",
      }
    }

    // 画像がまだロードされていない場合のデフォルトサイズ
    return {
      width: "100%",
      height: expanded ? `${containerHeight * 0.5}px` : `${containerHeight * 0.4}px`,
      maxWidth: "100%",
    }
  }

  const handleToggle = () => {
    if (onToggleMinimize) {
      onToggleMinimize()
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  // アスペクト比固定モードの切り替え
  const toggleAspectRatioLock = () => {
    setIsAspectRatioLocked(!isAspectRatioLocked)
  }

  // リサイズ開始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    initialSizeRef.current = { width: rect.width, height: rect.height }
    startPosRef.current = { x: e.clientX, y: e.clientY }

    // 初期アスペクト比を計算
    aspectRatioRef.current = rect.width / rect.height

    // Shiftキーが押されているかチェック
    if (e.shiftKey) {
      setIsAspectRatioLocked(true)
    }

    setIsResizing(true)

    // テキスト選択を防止
    document.body.style.userSelect = "none"

    console.log("リサイズ開始:", {
      x: e.clientX,
      y: e.clientY,
      initialWidth: rect.width,
      initialHeight: rect.height,
      aspectRatio: aspectRatioRef.current,
      isAspectRatioLocked: e.shiftKey,
      expanded: expanded,
    })
  }

  // リサイズ中と終了のイベントハンドラ
  useEffect(() => {
    if (!isResizing) return

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x
      const deltaY = e.clientY - startPosRef.current.y

      // アスペクト比固定モードの状態を更新（Shiftキーの状態に基づく）
      const isShiftPressed = e.shiftKey
      if (isShiftPressed !== isAspectRatioLocked) {
        setIsAspectRatioLocked(isShiftPressed)
      }

      if (expanded) {
        // 拡大状態の場合
        let newWidth = Math.max(200, initialSizeRef.current.width + deltaX)
        let newHeight = Math.max(150, initialSizeRef.current.height + deltaY)

        // アスペクト比固定モードの場合、アスペクト比を維持
        if (isAspectRatioLocked || isShiftPressed) {
          // どちらの方向に大きく変化したかに基づいて、もう一方の値を計算
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 横方向の変化が大きい場合、高さを計算
            newHeight = newWidth / aspectRatioRef.current
          } else {
            // 縦方向の変化が大きい場合、幅を計算
            newWidth = newHeight * aspectRatioRef.current
          }

          // 最小サイズの制約を再チェック
          if (newWidth < 200) {
            newWidth = 200
            newHeight = newWidth / aspectRatioRef.current
          }
          if (newHeight < 150) {
            newHeight = 150
            newWidth = newHeight * aspectRatioRef.current
          }
        }

        setWidth(newWidth)
        setHeight(newHeight)
      } else {
        // 最小化状態の場合も幅と高さの両方をリサイズ
        const newWidth = Math.max(140, initialSizeRef.current.width + deltaX)
        const newHeight = Math.max(100, initialSizeRef.current.height + deltaY)

        // アスペクト比固定モードの場合、アスペクト比を維持
        if (isAspectRatioLocked || isShiftPressed) {
          // どちらの方向に大きく変化したかに基づいて、もう一方の値を計算
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 横方向の変化が大きい場合、高さを計算
            const calculatedHeight = newWidth / aspectRatioRef.current
            setMinimizedHeight(Math.max(100, calculatedHeight))
            setMinimizedWidth(newWidth)
          } else {
            // 縦方向の変化が大きい場合、幅を計算
            const calculatedWidth = newHeight * aspectRatioRef.current
            setMinimizedWidth(Math.max(140, calculatedWidth))
            setMinimizedHeight(newHeight)
          }
        } else {
          // 自由にリサイズ
          setMinimizedWidth(newWidth)
          setMinimizedHeight(newHeight)
        }
      }

      console.log("リサイズ中:", {
        deltaX,
        deltaY,
        width: expanded ? width : minimizedWidth,
        height: expanded ? height : minimizedHeight,
        isAspectRatioLocked: isAspectRatioLocked || isShiftPressed,
        expanded: expanded,
      })
    }

    const handleResizeEnd = () => {
      setIsResizing(false)
      document.body.style.userSelect = ""
      console.log("リサイズ終了")
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsAspectRatioLocked(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsAspectRatioLocked(false)
      }
    }

    // グローバルにイベントリスナーを追加
    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleResizeEnd)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    // クリーンアップ
    return () => {
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleResizeEnd)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [isResizing, isAspectRatioLocked, expanded, width, height, minimizedWidth, minimizedHeight])

  // サイズ変更時に画像サイズを再計算
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      const imageStyle = calculateImageSize()
      console.log("画像サイズを再計算:", {
        containerWidth: expanded ? width : minimizedWidth,
        containerHeight: expanded ? height : minimizedHeight,
        imageStyle,
        expanded,
      })
    }
  }, [width, height, minimizedWidth, minimizedHeight, expanded, imageLoaded])

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
  const fontSizes = calculateFontSizes()
  const imageSize = calculateImageSize()

  // 画像の高さの割合を計算（コンテナの高さに対する割合）
  const getImageHeightRatio = () => {
    if (expanded) {
      return Math.min(0.6, 0.4 + (width && width > 300 ? 0.2 : 0)) // 幅が大きくなるほど高さの割合を増やす
    } else {
      return Math.min(0.7, 0.5 + (minimizedWidth && minimizedWidth > 200 ? 0.2 : 0))
    }
  }

  // 画像の高さを計算（コンテナの高さに対する割合）
  const getImageHeight = () => {
    const containerHeight = expanded ? height || 300 : minimizedHeight || 200
    return containerHeight * getImageHeightRatio()
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-white rounded-lg shadow-lg overflow-hidden",
        expanded ? "w-60" : "w-40", // 拡大時と縮小時のデフォルトサイズ
        isDragging && "shadow-xl", // ドラッグ中はシャドウを強調
        isOtherDragging && "opacity-70", // 他の吹き出しがドラッグ中の場合は透明度を下げる
      )}
      style={{
        userSelect: "none", // テキスト選択を防止
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        transition: isDragging || isResizing ? "none" : "all 0.3s ease", // ドラッグ中またはリサイズ中はトランジションを無効化
        width: expanded ? (width ? `${width}px` : undefined) : minimizedWidth ? `${minimizedWidth}px` : undefined,
        height: expanded ? (height ? `${height}px` : undefined) : minimizedHeight ? `${minimizedHeight}px` : undefined,
        position: "relative", // リサイズハンドルの配置のため
      }}
    >
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
        <div className="flex items-center space-x-2 overflow-hidden">
          {category && (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor }} />
          )}
          <h3
            className="font-medium text-gray-800 truncate"
            style={{
              fontSize: fontSizes.title,
              transition: isDragging || isResizing ? "none" : "font-size 0.3s ease",
            }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {/* アスペクト比固定ボタンは常に表示 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleAspectRatioLock}
            aria-label={isAspectRatioLocked ? "アスペクト比固定を解除" : "アスペクト比を固定"}
            title={isAspectRatioLocked ? "アスペクト比固定を解除" : "アスペクト比を固定"}
          >
            {isAspectRatioLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleToggle}
            aria-label={expanded ? "縮小" : "拡大"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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

      <div className={cn("p-2", !expanded && "flex flex-col space-y-2")}>
        {image && (
          <div
            className={cn("mb-2", !expanded && "flex-shrink-0")}
            style={{
              overflow: "hidden",
              height: `${getImageHeight()}px`,
              transition: isDragging || isResizing ? "none" : "height 0.3s ease",
            }}
          >
            <img
              ref={imageRef}
              src={image || "/placeholder.svg"}
              alt={title}
              className="w-full h-full rounded"
              style={{
                objectFit: "cover",
                display: "block",
              }}
              onLoad={handleImageLoad}
              onError={(e) => {
                e.currentTarget.src = "/generic-location.png"
              }}
              draggable="false" // 画像のドラッグを防止
            />
          </div>
        )}

        {/* 災害情報の詳細 - 拡大時のみ表示 */}
        {expanded && (
          <>
            <div className="mb-2 flex flex-wrap gap-1">
              {severity && (
                <Badge
                  className={severityInfo.color}
                  style={{
                    fontSize: fontSizes.badge,
                    transition: isDragging || isResizing ? "none" : "font-size 0.3s ease",
                  }}
                >
                  {severityInfo.label}
                </Badge>
              )}
              {status && (
                <Badge
                  className={statusInfo.color}
                  style={{
                    fontSize: fontSizes.badge,
                    transition: isDragging || isResizing ? "none" : "font-size 0.3s ease",
                  }}
                >
                  {statusInfo.label}
                </Badge>
              )}
              {city && (
                <Badge
                  variant="outline"
                  style={{
                    fontSize: fontSizes.badge,
                    transition: isDragging || isResizing ? "none" : "font-size 0.3s ease",
                  }}
                >
                  {city}
                </Badge>
              )}
            </div>

            {reportDate && (
              <div
                className="mb-2 text-gray-500"
                style={{
                  fontSize: fontSizes.date,
                  transition: isDragging || isResizing ? "none" : "font-size 0.3s ease",
                }}
              >
                報告日: {reportDate}
              </div>
            )}
          </>
        )}

        <p
          className={cn("text-gray-600", !expanded && "line-clamp-2")}
          style={{
            fontSize: fontSizes.description,
            lineHeight: fontSizes.lineHeight,
            transition: isDragging || isResizing ? "none" : "font-size 0.3s ease, line-height 0.3s ease",
          }}
        >
          {description}
        </p>
      </div>

      {/* リサイズハンドル - 常に表示（拡大時と最小化時の両方） */}
      <div
        className={cn(
          "absolute bottom-0 right-0 cursor-se-resize z-20",
          expanded ? "w-5 h-5" : "w-4 h-4", // 拡大時と最小化時でサイズを変える
          isAspectRatioLocked
            ? "border-r-2 border-b-2 border-blue-500 rounded-br-lg"
            : "border-r border-b border-gray-300 rounded-br-lg",
        )}
        style={{
          backgroundImage: isAspectRatioLocked
            ? `
              repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.2) 1px, rgba(59, 130, 246, 0.2) 2px),
              repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(59, 130, 246, 0.2) 1px, rgba(59, 130, 246, 0.2) 2px)
            `
            : `
              repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(128, 128, 128, 0.3) 1px, rgba(128, 128, 128, 0.3) 2px),
              repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(128, 128, 128, 0.3) 1px, rgba(128, 128, 128, 0.3) 2px)
            `,
          backgroundSize: expanded ? "2px 2px" : "1.5px 1.5px",
          backgroundPosition: "right bottom",
          backgroundRepeat: "repeat",
          boxShadow: "0 0 2px rgba(0,0,0,0.1)",
        }}
        aria-label="サイズ変更"
        title={
          isAspectRatioLocked ? "アスペクト比固定モード（Shiftキー）" : "自由にリサイズ（Shiftキーでアスペクト比固定）"
        }
        onMouseDown={handleResizeStart}
      />

      {/* サイズ表示 - リサイズ中のみ表示 */}
      {isResizing && (
        <div className="absolute top-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-bl z-30">
          {expanded && width && height ? (
            <>
              {Math.round(width)}×{Math.round(height)}
              {isAspectRatioLocked && <span className="ml-1">🔒</span>}
            </>
          ) : minimizedWidth && minimizedHeight ? (
            <>
              {Math.round(minimizedWidth)}×{Math.round(minimizedHeight)}
              {isAspectRatioLocked && <span className="ml-1">🔒</span>}
            </>
          ) : (
            ""
          )}
        </div>
      )}
    </div>
  )
}

export default InfoCard
