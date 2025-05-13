"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { addTouchHandlers } from "./touch-handlers"
import type { google } from "@/types/google-maps"
import CustomOverlay from "./custom-overlay"

interface CustomOverlayProps {
  position: google.maps.LatLng
  map: google.maps.Map
  markerId: string
  markerPosition: google.maps.LatLng
  children: React.ReactNode
  onDragEnd?: (position: google.maps.LatLng, markerId: string) => void
  onDragStart?: (markerId: string) => void
  onToggleMinimize?: (markerId: string, isMinimized: boolean) => void
  isMinimized?: boolean
  lineColor?: string
  isDraggingAny?: boolean
  currentDraggingId?: string | null
}

const CustomOverlayTouch: React.FC<CustomOverlayProps> = (props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // タッチイベントハンドラーを設定
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      // タッチ開始時の処理
      // ...
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      // タッチ移動時の処理
      // ...
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      // タッチ終了時の処理
      // ...
    }

    return addTouchHandlers(element, handleTouchStart, handleTouchMove, handleTouchEnd)
  }, [props.map, props.markerId, props.onDragStart, props.onDragEnd])

  // 既存の CustomOverlay コンポーネントを使用
  return <CustomOverlay {...props} containerRef={containerRef} />
}

export default CustomOverlayTouch
