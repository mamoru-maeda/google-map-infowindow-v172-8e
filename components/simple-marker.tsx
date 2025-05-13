"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import type { google } from "@/types/google-maps"

interface SimpleMarkerProps {
  position: google.maps.LatLng
  map: google.maps.Map
  title: string
  category?: string
  categoryColor?: string
  onClick?: () => void
  isActive?: boolean
}

const SimpleMarker: React.FC<SimpleMarkerProps> = ({
  position,
  map,
  title,
  category,
  categoryColor,
  onClick,
  isActive = false,
}) => {
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const outerMarkerRef = useRef<google.maps.Marker | null>(null)
  const prevActiveRef = useRef<boolean>(false)

  // マーカーのサイズ設定
  const normalScale = 7 // 通常マーカーのサイズ（少し大きく）
  const activeScale = 10 // アクティブマーカーのサイズ（さらに大きく）
  const outerBorderOffset = 2 // 外側の縁のオフセット

  // マーカーの色設定
  const normalStrokeWeight = 1.5 // 通常の縁の太さ
  const activeStrokeWeight = 3 // アクティブ時の縁の太さ
  const outerStrokeWeight = 3.5 // 外側の縁の太さ（2から3.5に増加）
  const innerStrokeColor = "#FFFFFF" // 内側の縁の色（白）
  const outerStrokeColor = "#4285F4" // 外側の縁の色（Googleブルー）

  // マーカーの作成と更新
  useEffect(() => {
    if (!map) return

    // 既存のマーカーをクリーンアップ
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    if (outerMarkerRef.current) {
      outerMarkerRef.current.setMap(null)
      outerMarkerRef.current = null
    }

    // マーカーオプションを設定
    const markerOptions: google.maps.MarkerOptions = {
      position,
      map,
      title,
    }

    // カテゴリーカラーがある場合はカスタムマーカーを使用
    if (categoryColor) {
      // 現在の状態に基づいてスケールを決定
      const scale = isActive ? activeScale : normalScale
      const strokeWeight = isActive ? activeStrokeWeight : normalStrokeWeight

      // 内側のマーカー（メインのマーカー）
      markerOptions.icon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: categoryColor,
        fillOpacity: 1,
        strokeWeight: strokeWeight,
        strokeColor: innerStrokeColor,
        scale: scale,
      }

      // アクティブな場合は外側の青い縁を追加
      if (isActive) {
        // 内側のマーカーのzIndexを高く設定
        markerOptions.zIndex = 2

        // 外側の青い縁用のマーカーを作成
        const outerCircle = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "transparent",
          fillOpacity: 0,
          strokeWeight: outerStrokeWeight,
          strokeColor: outerStrokeColor,
          scale: scale + outerBorderOffset,
        }

        const outerMarker = new window.google.maps.Marker({
          position,
          map,
          icon: outerCircle,
          clickable: false,
          zIndex: 1,
        })

        outerMarkerRef.current = outerMarker
      }
    }

    // マーカーを作成
    const newMarker = new window.google.maps.Marker(markerOptions)

    // クリックイベントを設定
    if (onClick) {
      newMarker.addListener("click", onClick)
    }

    setMarker(newMarker)
    markerRef.current = newMarker

    // 前回の状態を更新
    prevActiveRef.current = isActive

    return () => {
      // マーカーをクリーンアップ
      if (newMarker) {
        newMarker.setMap(null)
      }
      if (outerMarkerRef.current) {
        outerMarkerRef.current.setMap(null)
      }
    }
  }, [map, position, title, categoryColor, onClick, isActive])

  // アクティブ状態が変わったときにアイコンを更新
  useEffect(() => {
    if (!marker || !categoryColor || !map) return

    // アクティブ状態が変わった場合のみアイコンを更新
    if (isActive !== prevActiveRef.current) {
      // 現在の状態に基づいてスケールを決定
      const scale = isActive ? activeScale : normalScale
      const strokeWeight = isActive ? activeStrokeWeight : normalStrokeWeight

      // 内側のマーカーを更新
      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: categoryColor,
        fillOpacity: 1,
        strokeWeight: strokeWeight,
        strokeColor: innerStrokeColor,
        scale: scale,
      })

      // zIndexを設定
      marker.setZIndex(isActive ? 2 : 0)

      // 外側のマーカーを処理
      if (isActive) {
        // アクティブになった場合、外側の青い縁を追加
        if (outerMarkerRef.current) {
          // 既存の外側マーカーがあれば位置を更新
          outerMarkerRef.current.setPosition(marker.getPosition() as google.maps.LatLng)
          outerMarkerRef.current.setMap(map)

          // アイコンも更新（太さの変更を反映）
          outerMarkerRef.current.setIcon({
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "transparent",
            fillOpacity: 0,
            strokeWeight: outerStrokeWeight,
            strokeColor: outerStrokeColor,
            scale: scale + outerBorderOffset,
          })
        } else {
          // 外側の青い縁用のマーカーを新規作成
          const outerCircle = {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "transparent",
            fillOpacity: 0,
            strokeWeight: outerStrokeWeight,
            strokeColor: outerStrokeColor,
            scale: scale + outerBorderOffset,
          }

          const outerMarker = new window.google.maps.Marker({
            position: marker.getPosition() as google.maps.LatLng,
            map,
            icon: outerCircle,
            clickable: false,
            zIndex: 1,
          })

          outerMarkerRef.current = outerMarker
        }
      } else {
        // 非アクティブになった場合、外側の青い縁を削除
        if (outerMarkerRef.current) {
          outerMarkerRef.current.setMap(null)
        }
      }

      prevActiveRef.current = isActive
    }
  }, [marker, isActive, categoryColor, map])

  return null
}

export default SimpleMarker
