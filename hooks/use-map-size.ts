"use client"

import { useState, useEffect, useCallback, type RefObject } from "react"

interface MapSize {
  width: number
  height: number
}

interface UseMapSizeReturn {
  mapSize: MapSize
  setMapSize: (size: Partial<MapSize>) => void
  getMapSize: () => MapSize
  isResizing: boolean
}

export function useMapSize(
  mapRef: RefObject<HTMLDivElement>,
  map: google.maps.Map | null | undefined,
): UseMapSizeReturn {
  const [mapSize, setMapSizeState] = useState<MapSize>({ width: 0, height: 0 })
  const [isResizing, setIsResizing] = useState(false)

  // 地図サイズを取得する関数
  const getMapSize = useCallback((): MapSize => {
    if (!mapRef.current) {
      return { width: 0, height: 0 }
    }

    const rect = mapRef.current.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
    }
  }, [mapRef])

  // 地図サイズを設定する関数
  const setMapSize = useCallback(
    (size: Partial<MapSize>) => {
      if (!mapRef.current) return

      setIsResizing(true)

      const currentSize = getMapSize()
      const newSize = {
        width: size.width ?? currentSize.width,
        height: size.height ?? currentSize.height,
      }

      // CSSでサイズを設定
      if (size.width !== undefined) {
        mapRef.current.style.width = `${newSize.width}px`
      }
      if (size.height !== undefined) {
        mapRef.current.style.height = `${newSize.height}px`
      }

      // Google Maps APIにサイズ変更を通知
      if (map) {
        setTimeout(() => {
          if (map) {
            google.maps.event.trigger(map, "resize")
          }
          setIsResizing(false)
        }, 100)
      } else {
        setIsResizing(false)
      }

      setMapSizeState(newSize)
    },
    [mapRef, map, getMapSize],
  )

  // 初期サイズの設定とリサイズ監視
  useEffect(() => {
    if (!mapRef.current) return

    const updateSize = () => {
      const size = getMapSize()
      setMapSizeState(size)
    }

    // 初期サイズを設定
    updateSize()

    // ResizeObserverでサイズ変更を監視
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setMapSizeState({ width, height })

        // Google Maps APIにサイズ変更を通知
        if (map) {
          setTimeout(() => {
            if (map) {
              google.maps.event.trigger(map, "resize")
            }
          }, 50)
        }
      }
    })

    resizeObserver.observe(mapRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [mapRef, map, getMapSize])

  return {
    mapSize,
    setMapSize,
    getMapSize,
    isResizing,
  }
}
