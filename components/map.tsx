"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import InfoWindow from "./info-window"

interface MapProps {
  apiKey: string
  center: {
    lat: number
    lng: number
  }
  zoom: number
  markers?: Array<{
    position: {
      lat: number
      lng: number
    }
    title: string
    description: string
    image?: string
  }>
}

const Map: React.FC<MapProps> = ({ apiKey, center, zoom, markers = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [activeInfoWindow, setActiveInfoWindow] = useState<number | null>(null)
  const infoWindowRefs = useRef<Array<HTMLDivElement | null>>([])
  const markerRefs = useRef<google.maps.Marker[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Google Maps APIをロード
  useEffect(() => {
    // すでにGoogle Maps APIがロードされている場合
    if (typeof window.google === "object" && window.google.maps) {
      initMap()
      return
    }

    // MapContainerコンポーネントがAPIをロードするので、
    // ここではwindow.initGoogleMapが呼び出されるのを待つ
    const checkGoogleMapsLoaded = () => {
      if (typeof window.google === "object" && window.google.maps) {
        initMap()
      } else {
        // まだロードされていない場合は少し待ってから再チェック
        setTimeout(checkGoogleMapsLoaded, 100)
      }
    }

    checkGoogleMapsLoaded()
  }, [])

  // マップの初期化
  const initMap = useCallback(() => {
    if (!mapRef.current) return

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
    }

    const map = new google.maps.Map(mapRef.current, mapOptions)
    setMapInstance(map)

    // マップがアイドル状態になったら（完全にロードされたら）フラグを設定
    google.maps.event.addListenerOnce(map, "idle", () => {
      setIsMapLoaded(true)
    })
  }, [center, zoom])

  // マーカーの設定
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return

    // 既存のマーカーをクリア
    markerRefs.current.forEach((marker) => marker.setMap(null))
    markerRefs.current = []

    // 新しいマーカーを追加
    markers.forEach((markerData, index) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: mapInstance,
        title: markerData.title,
      })

      marker.addListener("click", () => {
        setActiveInfoWindow((prev) => (prev === index ? null : index))
      })

      markerRefs.current.push(marker)
    })

    // マップ上のどこかをクリックしたら吹き出しを閉じる
    mapInstance.addListener("click", () => {
      setActiveInfoWindow(null)
    })
  }, [mapInstance, markers, isMapLoaded])

  // 吹き出しの位置を更新
  useEffect(() => {
    if (!mapInstance || activeInfoWindow === null || !isMapLoaded) return

    const updateInfoWindowPosition = () => {
      const marker = markerRefs.current[activeInfoWindow]
      const infoWindowElement = infoWindowRefs.current[activeInfoWindow]

      if (!marker || !infoWindowElement) return

      const markerPosition = marker.getPosition()
      if (!markerPosition) return

      // マーカーの位置をピクセル座標に変換
      const scale = Math.pow(2, mapInstance.getZoom() || 0)
      const projection = mapInstance.getProjection()

      if (!projection) return

      const pixelPosition = projection.fromLatLngToPoint(markerPosition)
      const centerPoint = projection.fromLatLngToPoint(mapInstance.getCenter() as google.maps.LatLng)

      const offsetX = (pixelPosition.x - centerPoint.x) * scale
      const offsetY = (pixelPosition.y - centerPoint.y) * scale

      // マップのコンテナの中心からの相対位置を計算
      const mapContainer = mapInstance.getDiv()
      const containerCenter = {
        x: mapContainer.offsetWidth / 2,
        y: mapContainer.offsetHeight / 2,
      }

      // 吹き出しの位置を設定（マーカーの上に表示）
      infoWindowElement.style.left = `${containerCenter.x + offsetX}px`
      infoWindowElement.style.top = `${containerCenter.y + offsetY - 10}px`
    }

    // 初回実行
    updateInfoWindowPosition()

    // マップの移動やズームが変更されたときに位置を更新
    const listeners = [
      mapInstance.addListener("bounds_changed", updateInfoWindowPosition),
      mapInstance.addListener("zoom_changed", updateInfoWindowPosition),
      mapInstance.addListener("center_changed", updateInfoWindowPosition),
    ]

    return () => {
      listeners.forEach((listener) => google.maps.event.removeListener(listener))
    }
  }, [mapInstance, activeInfoWindow, isMapLoaded])

  // 吹き出しを閉じる関数
  const closeInfoWindow = useCallback(() => {
    setActiveInfoWindow(null)
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {activeInfoWindow !== null && (
        <div
          ref={(el) => (infoWindowRefs.current[activeInfoWindow] = el)}
          className="absolute z-10 transform -translate-x-1/2 -translate-y-full"
          style={{ pointerEvents: "auto" }}
        >
          <InfoWindow
            title={markers[activeInfoWindow]?.title || ""}
            description={markers[activeInfoWindow]?.description || ""}
            image={markers[activeInfoWindow]?.image}
            onClose={closeInfoWindow}
          />
        </div>
      )}
    </div>
  )
}

// グローバル型定義の拡張
declare global {
  interface Window {
    initGoogleMap: () => void
    google: any
  }
}

export default Map
