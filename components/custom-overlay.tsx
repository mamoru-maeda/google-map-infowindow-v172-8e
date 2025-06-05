"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import type { google } from "@/types/google-maps"

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
  userPositioned?: boolean
}

const CustomOverlay: React.FC<CustomOverlayProps> = ({
  position,
  map,
  markerId,
  markerPosition,
  children,
  onDragEnd,
  onDragStart,
  onToggleMinimize,
  isMinimized = false,
  lineColor = "#6B7280", // デフォルトは gray-500
  isDraggingAny = false,
  currentDraggingId = null,
  userPositioned = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const markerPixelPositionRef = useRef<{ x: number; y: number } | null>(null)
  const infoWindowPositionRef = useRef<{ x: number; y: number } | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([])
  const isThisBeingDragged = currentDraggingId === markerId
  const initialRenderRef = useRef(true)
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const updateRequestedRef = useRef(false)
  const lastZoomRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isZoomingRef = useRef(false)

  // マーカーの位置を計算
  const calculateMarkerPosition = useCallback(() => {
    if (!map || !markerPosition) return null

    const projection = map.getProjection()
    if (!projection) return null

    // マップの中心点とズームレベルを取得
    const scale = Math.pow(2, map.getZoom() || 0)
    const centerPoint = projection.fromLatLngToPoint(map.getCenter() as google.maps.LatLng)

    // マップの中心からのオフセットを計算
    const mapDiv = map.getDiv()
    const mapWidth = mapDiv.offsetWidth
    const mapHeight = mapDiv.offsetHeight

    // マーカーの位置を計算
    const markerWorldPoint = projection.fromLatLngToPoint(markerPosition)
    const markerPixelX = (markerWorldPoint.x - centerPoint.x) * scale + mapWidth / 2
    const markerPixelY = (markerWorldPoint.y - centerPoint.y) * scale + mapHeight / 2

    return { x: markerPixelX, y: markerPixelY }
  }, [map, markerPosition])

  // 吹き出しの位置を計算
  const calculateInfoWindowPosition = useCallback(() => {
    if (!map || !position) return null

    const projection = map.getProjection()
    if (!projection) return null

    // マップの中心点とズームレベルを取得
    const scale = Math.pow(2, map.getZoom() || 0)
    const centerPoint = projection.fromLatLngToPoint(map.getCenter() as google.maps.LatLng)

    // マップの中心からのオフセットを計算
    const mapDiv = map.getDiv()
    const mapWidth = mapDiv.offsetWidth
    const mapHeight = mapDiv.offsetHeight

    // 吹き出しの位置を計算
    const worldPoint = projection.fromLatLngToPoint(position)
    const pixelX = (worldPoint.x - centerPoint.x) * scale + mapWidth / 2
    const pixelY = (worldPoint.y - centerPoint.y) * scale + mapHeight / 2

    return { x: pixelX, y: pixelY }
  }, [map, position])

  // マーカーと吹き出しを結ぶ線を描画
  const drawLine = useCallback(() => {
    if (!lineRef.current) return

    // マーカーの位置を計算
    const markerPos = calculateMarkerPosition()
    if (!markerPos) return
    markerPixelPositionRef.current = markerPos

    // 吹き出しの位置を取得
    let infoPos = null

    // 吹き出しの位置を取得する方法を変更
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const mapRect = map.getDiv().getBoundingClientRect()

      infoPos = {
        x: rect.left - mapRect.left + rect.width / 2,
        y: rect.top - mapRect.top + rect.height / 2,
      }
      infoWindowPositionRef.current = infoPos
    } else if (infoWindowPositionRef.current) {
      infoPos = infoWindowPositionRef.current
    } else {
      return
    }

    // マーカーの位置
    const markerX = markerPos.x
    const markerY = markerPos.y

    // 吹き出しの中心位置
    const infoWindowX = infoPos.x
    const infoWindowY = infoPos.y

    // 線の長さと角度を計算
    const dx = infoWindowX - markerX
    const dy = infoWindowY - markerY
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    // 線のスタイルを設定（点線に変更）
    const current = lineRef.current
    current.style.width = `${length}px`
    current.style.transform = `rotate(${angle}deg)`
    current.style.left = `${markerX}px`
    current.style.top = `${markerY}px`
    current.style.transformOrigin = "0 0"
    current.style.borderTop = `4px dashed ${lineColor}`
    current.style.backgroundColor = "transparent"
    current.style.opacity = "0.7" // 透明度を明示的に設定
    current.style.zIndex = "99" // z-indexを明示的に設定
    current.style.display = "block" // 確実に表示
  }, [map, calculateMarkerPosition, lineColor])

  // 位置を更新
  const updatePositions = useCallback(() => {
    if (!map || !containerRef.current) return
    if (updateRequestedRef.current) return

    updateRequestedRef.current = true

    // アニメーションフレームをキャンセル
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // 新しいアニメーションフレームをリクエスト
    animationFrameRef.current = requestAnimationFrame(() => {
      // ドラッグ中は吹き出しの位置更新をスキップするが、線の更新は行う
      if (isDragging) {
        drawLine()
        updateRequestedRef.current = false
        return
      }

      // 現在のズームレベルを取得
      const currentZoom = map.getZoom() || 0
      const zoomChanged = lastZoomRef.current !== null && lastZoomRef.current !== currentZoom
      lastZoomRef.current = currentZoom

      // 吹き出しの位置を計算
      const infoPos = calculateInfoWindowPosition()
      if (!infoPos) {
        updateRequestedRef.current = false
        return
      }

      // 初回表示時またはユーザーが位置を設定していない場合
      if (initialRenderRef.current && !userPositioned) {
        // マーカーの位置を計算
        const markerPos = calculateMarkerPosition()
        if (!markerPos) {
          updateRequestedRef.current = false
          return
        }

        // フローティングウィンドウのサイズを取得
        const infoWindowWidth = containerRef.current.offsetWidth
        const infoWindowHeight = containerRef.current.offsetHeight

        // フローティングウィンドウの最下部がマーカーの上に来るように配置
        const left = markerPos.x - infoWindowWidth / 2
        const top = markerPos.y - infoWindowHeight // マーカーの上にフローティングウィンドウの最下部を配置

        // 吹き出しの位置を更新
        containerRef.current.style.left = `${left}px`
        containerRef.current.style.top = `${top}px`

        // 吹き出しの中心位置を保存（線の描画用）
        infoWindowPositionRef.current = {
          x: left + infoWindowWidth / 2,
          y: top + infoWindowHeight / 2,
        }

        initialRenderRef.current = false
      } else {
        // ズームが変更された場合、または通常の更新
        const infoWindowWidth = containerRef.current.offsetWidth
        const infoWindowHeight = containerRef.current.offsetHeight

        // 吹き出しの左上の位置を計算
        const left = infoPos.x - infoWindowWidth / 2
        const top = infoPos.y - infoWindowHeight / 2

        // 吹き出しの位置を更新
        containerRef.current.style.left = `${left}px`
        containerRef.current.style.top = `${top}px`

        // 吹き出しの中心位置を更新
        infoWindowPositionRef.current = {
          x: infoPos.x,
          y: infoPos.y,
        }
      }

      // 線を描画
      drawLine()
      updateRequestedRef.current = false
    })
  }, [map, isDragging, userPositioned, calculateMarkerPosition, calculateInfoWindowPosition, drawLine])

  // マップイベントリスナーの設定と解除
  const setupMapListeners = useCallback(() => {
    if (!map) return () => {}

    // 既存のリスナーをクリーンアップ
    mapListenersRef.current.forEach((listener) => window.google.maps.event.removeListener(listener))
    mapListenersRef.current = []

    // 新しいリスナーを設定
    const handleMapChange = () => {
      updatePositions()
    }

    // ズーム変更時の特別なハンドラー
    const handleZoomStart = () => {
      isZoomingRef.current = true
    }

    const handleZoomChange = () => {
      // ズーム変更中も継続的に位置を更新
      updatePositions()
    }

    const handleZoomEnd = () => {
      isZoomingRef.current = false
      // ズーム変更後に位置を更新
      updatePositions()
      // 少し遅延して再度更新（ズーム変更後のアニメーション完了後）
      setTimeout(() => {
        updatePositions()
      }, 100)
    }

    // ドラッグ中の特別なハンドラー
    const handleDrag = () => {
      // ドラッグ中も線の位置を更新
      drawLine()
    }

    const listeners = [
      map.addListener("bounds_changed", handleMapChange),
      map.addListener("zoom_changed", handleZoomChange),
      map.addListener("center_changed", handleMapChange),
      map.addListener("drag", handleDrag), // ドラッグ中のイベント
      map.addListener("dragend", handleMapChange), // ドラッグ終了時のイベント
      // ズーム変更後のアニメーション完了時にも更新
      map.addListener("idle", handleMapChange),
    ]

    mapListenersRef.current = listeners

    return () => {
      listeners.forEach((listener) => window.google.maps.event.removeListener(listener))
      mapListenersRef.current = []
    }
  }, [map, updatePositions, drawLine])

  // 初期化
  useEffect(() => {
    if (!map || !position || !markerPosition) return

    // 初期位置を設定
    lastPositionRef.current = { lat: position.lat(), lng: position.lng() }
    lastZoomRef.current = map.getZoom()

    // 位置を更新
    const projection = map.getProjection()
    if (projection) {
      requestAnimationFrame(() => {
        updatePositions()
      })
    } else {
      // プロジェクションが利用可能になるまで待機
      const listener = map.addListener("projection_changed", () => {
        window.google.maps.event.removeListener(listener)
        requestAnimationFrame(() => {
          updatePositions()
        })
      })
    }

    // マップのイベントリスナーを設定
    const cleanup = setupMapListeners()

    return () => {
      // アニメーションフレームをキャンセル
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      cleanup()
    }
  }, [map, position, markerPosition, updatePositions, setupMapListeners])

  // ドラッグ中はマップイベントリスナーを一時停止
  useEffect(() => {
    if (isDraggingAny && !isThisBeingDragged) {
      // 他の吹き出しがドラッグ中の場合、このコンポーネントのマップリスナーを一時停止
      mapListenersRef.current.forEach((listener) => window.google.maps.event.removeListener(listener))
      mapListenersRef.current = []
    } else if (!isDraggingAny) {
      // ドラッグが終了したらリスナーを再設定
      setupMapListeners()
    }
  }, [isDraggingAny, isThisBeingDragged, setupMapListeners])

  // ズーム変更中も線を継続的に更新するための特別なハンドラー
  useEffect(() => {
    if (!map) return

    // ズーム変更中のイベントを監視
    const zoomListener = map.addListener("zoom_changed", () => {
      // ズーム中は高頻度で線を更新
      const updateLinePosition = () => {
        if (isZoomingRef.current) {
          drawLine()
          requestAnimationFrame(updateLinePosition)
        }
      }

      isZoomingRef.current = true
      updateLinePosition()

      // ズーム終了を検出するために少し遅延
      setTimeout(() => {
        isZoomingRef.current = false
      }, 200)
    })

    return () => {
      window.google.maps.event.removeListener(zoomListener)
    }
  }, [map, drawLine])

  // 地図ドラッグ中も線を更新するための特別なハンドラー
  useEffect(() => {
    if (!map) return

    const dragListener = map.addListener("drag", () => {
      requestAnimationFrame(() => {
        drawLine()
      })
    })

    return () => {
      window.google.maps.event.removeListener(dragListener)
    }
  }, [map, drawLine])

  // ドラッグ開始ハンドラー
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    e.preventDefault() // テキスト選択を防止
    e.stopPropagation() // イベントの伝播を停止

    setIsDragging(true)
    if (onDragStart) {
      onDragStart(markerId)
    }

    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })

    // マップのドラッグを無効化
    map.setOptions({ draggable: false })
  }

  // ドラッグ中ハンドラー
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    e.preventDefault() // テキスト選択を防止

    const mapContainer = map.getDiv()
    const mapRect = mapContainer.getBoundingClientRect()

    // マップコンテナ内の相対位置を計算
    const left = e.clientX - mapRect.left - dragOffset.x
    const top = e.clientY - mapRect.top - dragOffset.y

    // 吹き出しの位置を直接更新
    containerRef.current.style.left = `${left}px`
    containerRef.current.style.top = `${top}px`

    // 吹き出しの中心位置を更新
    const infoWindowWidth = containerRef.current.offsetWidth
    const infoWindowHeight = containerRef.current.offsetHeight
    infoWindowPositionRef.current = {
      x: left + infoWindowWidth / 2,
      y: top + infoWindowHeight / 2,
    }

    // 線を再描画
    requestAnimationFrame(() => {
      drawLine()
    })
  }

  // ドラッグ終了ハンドラー
  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return

    e.preventDefault() // テキスト選択を防止

    setIsDragging(false)

    // マップのドラッグを再有効化
    map.setOptions({ draggable: true })

    // ドラッグ終了時のコールバックを呼び出し
    if (onDragEnd && containerRef.current) {
      const mapContainer = map.getDiv()
      const mapRect = mapContainer.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      // マップコンテナ内の相対位置を計算
      const left = containerRect.left - mapRect.left
      const top = containerRect.top - mapRect.top

      // 吹き出しの中心位置を更新
      const infoWindowWidth = containerRef.current.offsetWidth
      const infoWindowHeight = containerRef.current.offsetHeight
      infoWindowPositionRef.current = {
        x: left + infoWindowWidth / 2,
        y: top + infoWindowHeight / 2,
      }

      // 画面上の位置をLatLngに変換
      const projection = map.getProjection()
      if (projection) {
        // マップの中心点とズームレベルを取得
        const scale = Math.pow(2, map.getZoom() || 0)
        const centerPoint = projection.fromLatLngToPoint(map.getCenter() as google.maps.LatLng)
        const mapDiv = map.getDiv()
        const mapWidth = mapDiv.offsetWidth
        const mapHeight = mapDiv.offsetHeight

        // 吹き出しの中心位置をLatLngに変換
        const centerX = left + infoWindowWidth / 2
        const centerY = top + infoWindowHeight / 2

        // ピクセル座標からワールド座標に変換
        const worldX = (centerX - mapWidth / 2) / scale + centerPoint.x
        const worldY = (centerY - mapHeight / 2) / scale + centerPoint.y

        // ワールド座標からLatLngに変換
        const latLng = projection.fromPointToLatLng(new window.google.maps.Point(worldX, worldY))

        // 新しい位置を保存
        lastPositionRef.current = { lat: latLng.lat(), lng: latLng.lng() }

        // コールバックを呼び出し
        onDragEnd(latLng, markerId)
      }
    }
  }

  // グローバルのマウスイベントを設定
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      // テキスト選択を防止
      document.body.style.userSelect = "none"
      document.body.style.webkitUserSelect = "none"
      document.body.style.msUserSelect = "none"
      document.body.style.mozUserSelect = "none"
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      // テキスト選択を元に戻す
      document.body.style.userSelect = ""
      document.body.style.webkitUserSelect = ""
      document.body.style.msUserSelect = ""
      document.body.style.mozUserSelect = ""
    }
  }, [isDragging])

  // 最小化状態の切り替え
  const handleToggleMinimize = () => {
    if (onToggleMinimize) {
      onToggleMinimize(markerId, !isMinimized)
    }
  }

  // マップのDOMが存在する場合のみレンダリング
  if (!map) return null

  // マップコンテナにポータルでレンダリング
  return createPortal(
    <>
      {/* マーカーと吹き出しを結ぶ線（点線） */}
      <div
        ref={lineRef}
        className="absolute pointer-events-none"
        style={{
          height: "0",
          opacity: 0.7,
          zIndex: 99,
          position: "absolute",
          pointerEvents: "none",
          borderTop: `4px dashed ${lineColor}`,
          backgroundColor: "transparent",
        }}
      />

      {/* 吹き出しコンテナ */}
      <div
        ref={containerRef}
        className="absolute z-[100] cursor-move"
        style={{
          userSelect: "none", // テキスト選択を防止
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          pointerEvents: isDraggingAny && !isThisBeingDragged ? "none" : "auto", // 他の吹き出しがドラッグ中の場合、ポインターイベントを無効化
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (!containerRef.current) return

          e.preventDefault() // テキスト選択を防止

          setIsDragging(true)
          if (onDragStart) {
            onDragStart(markerId)
          }

          const touch = e.touches[0]
          const rect = containerRef.current.getBoundingClientRect()
          setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          })

          map.setOptions({ draggable: false })
        }}
      >
        {/* 子要素（InfoCard）をレンダリング */}
        {React.cloneElement(children as React.ReactElement, {
          isMinimized,
          onToggleMinimize: handleToggleMinimize,
          isDragging: isDragging,
          isOtherDragging: isDraggingAny && !isThisBeingDragged,
        })}
      </div>
    </>,
    map.getDiv(),
  )
}

export default CustomOverlay
