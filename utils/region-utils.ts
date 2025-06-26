// 静岡県の地域判定ユーティリティ

import type { google } from "google-maps"
import { getCurrentDefaultSize } from "@/hooks/use-infowindow-settings"

export interface RegionBounds {
  name: string
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

// 吹き出しの境界ボックス
export interface InfoWindowBounds {
  id: string
  north: number
  south: number
  east: number
  west: number
  centerLat: number
  centerLng: number
}

// 静岡県の地域境界定義
export const SHIZUOKA_REGIONS: RegionBounds[] = [
  {
    name: "東部・伊豆",
    bounds: {
      north: 35.3,
      south: 34.5,
      east: 139.5,
      west: 138.7,
    },
  },
  {
    name: "中部",
    bounds: {
      north: 35.3,
      south: 34.5,
      east: 138.7,
      west: 137.8,
    },
  },
  {
    name: "西部",
    bounds: {
      north: 35.1,
      south: 34.5,
      east: 137.8,
      west: 137.0,
    },
  },
]

// 座標から地域を判定する関数
export function getRegionFromCoordinates(lat: number, lng: number): string {
  for (const region of SHIZUOKA_REGIONS) {
    const { bounds } = region
    if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east) {
      return region.name
    }
  }
  return "その他" // 静岡県外の場合
}

// 吹き出しの境界ボックスを計算する関数（安全マージン付き）
export function calculateInfoWindowBounds(
  centerLat: number,
  centerLng: number,
  map: google.maps.Map,
  id: string,
): InfoWindowBounds {
  const mapDiv = map.getDiv()
  const bounds = map.getBounds()

  if (!bounds || !mapDiv) {
    throw new Error("地図の境界またはDOMエレメントを取得できません")
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // 現在の設定からサイズを取得
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width + 20 // 20pxの安全マージンを追加
  const infoWindowHeight = currentSize.height + 20 // 20pxの安全マージンを追加

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズを緯度経度に変換
  const halfWidthLng = (infoWindowWidth / 2) * lngPerPixel
  const halfHeightLat = (infoWindowHeight / 2) * latPerPixel

  return {
    id,
    north: centerLat + halfHeightLat,
    south: centerLat - halfHeightLat,
    east: centerLng + halfWidthLng,
    west: centerLng - halfWidthLng,
    centerLat,
    centerLng,
  }
}

// 2つの吹き出しが重なっているかチェックする関数（より厳密版）
export function checkOverlap(bounds1: InfoWindowBounds, bounds2: InfoWindowBounds): boolean {
  // より厳密な重なりチェック（わずかでも重なったら true）
  const horizontalOverlap = !(bounds1.east <= bounds2.west || bounds1.west >= bounds2.east)
  const verticalOverlap = !(bounds1.north <= bounds2.south || bounds1.south >= bounds2.north)

  const isOverlapping = horizontalOverlap && verticalOverlap

  if (isOverlapping) {
    console.log(`🔴 重なり検出: ${bounds1.id} と ${bounds2.id}`)
    console.log(
      `  ${bounds1.id}: 範囲 (${bounds1.west.toFixed(6)}, ${bounds1.south.toFixed(6)}) - (${bounds1.east.toFixed(6)}, ${bounds1.north.toFixed(6)})`,
    )
    console.log(
      `  ${bounds2.id}: 範囲 (${bounds2.west.toFixed(6)}, ${bounds2.south.toFixed(6)}) - (${bounds2.east.toFixed(6)}, ${bounds2.north.toFixed(6)})`,
    )
  }

  return isOverlapping
}

// 重なりを避けるための位置調整を行う関数（強化版）
export function adjustPositionToAvoidOverlap(
  targetBounds: InfoWindowBounds,
  existingBounds: InfoWindowBounds[],
  map: google.maps.Map,
  maxAttempts = 50,
): { lat: number; lng: number } {
  const mapDiv = map.getDiv()
  const bounds = map.getBounds()

  if (!bounds || !mapDiv) {
    return { lat: targetBounds.centerLat, lng: targetBounds.centerLng }
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 現在の設定からサイズを取得
  const currentSize = getCurrentDefaultSize()
  const stepLng = currentSize.width * 1.2 * lngPerPixel // 120%のステップサイズ
  const stepLat = currentSize.height * 1.2 * latPerPixel // 120%のステップサイズ

  let currentLat = targetBounds.centerLat
  let currentLng = targetBounds.centerLng
  let attempts = 0

  // より多様な調整方向のパターン（重なり回避を強化）
  const adjustmentDirections = [
    { lat: 0, lng: stepLng }, // 右
    { lat: 0, lng: -stepLng }, // 左
    { lat: stepLat, lng: 0 }, // 上
    { lat: -stepLat, lng: 0 }, // 下
    { lat: stepLat, lng: stepLng }, // 右上
    { lat: stepLat, lng: -stepLng }, // 左上
    { lat: -stepLat, lng: stepLng }, // 右下
    { lat: -stepLat, lng: -stepLng }, // 左下
    { lat: 0, lng: stepLng * 2 }, // 右（大）
    { lat: 0, lng: -stepLng * 2 }, // 左（大）
    { lat: stepLat * 2, lng: 0 }, // 上（大）
    { lat: -stepLat * 2, lng: 0 }, // 下（大）
  ]

  console.log(`🔧 重なり回避調整開始: ${targetBounds.id} (既存の吹き出し: ${existingBounds.length}個)`)

  while (attempts < maxAttempts) {
    // 現在の位置での境界ボックスを計算
    const currentBounds = calculateInfoWindowBounds(currentLat, currentLng, map, targetBounds.id)

    // 地図境界内に収まっているかチェック
    const marginLng = 20 * lngPerPixel
    const marginLat = 20 * latPerPixel

    const isInMapBounds =
      currentBounds.north <= ne.lat() - marginLat &&
      currentBounds.south >= sw.lat() + marginLat &&
      currentBounds.east <= ne.lng() - marginLng &&
      currentBounds.west >= sw.lng() + marginLng

    if (isInMapBounds) {
      // 他の吹き出しとの重なりをチェック
      let hasOverlap = false
      let overlapWith = ""

      for (const existingBound of existingBounds) {
        if (checkOverlap(currentBounds, existingBound)) {
          hasOverlap = true
          overlapWith = existingBound.id
          break
        }
      }

      if (!hasOverlap) {
        console.log(
          `✅ 重なり回避成功: ${targetBounds.id} - 最終位置(${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}) - 試行回数: ${attempts + 1}`,
        )
        return { lat: currentLat, lng: currentLng }
      } else {
        console.log(`🔄 試行 ${attempts + 1}: ${targetBounds.id} が ${overlapWith} と重なっています`)
      }
    } else {
      console.log(`🔄 試行 ${attempts + 1}: ${targetBounds.id} が地図境界外です`)
    }

    // 次の調整方向を試す
    const directionIndex = attempts % adjustmentDirections.length
    const multiplier = Math.floor(attempts / adjustmentDirections.length) + 1
    const direction = adjustmentDirections[directionIndex]

    currentLat = targetBounds.centerLat + direction.lat * multiplier
    currentLng = targetBounds.centerLng + direction.lng * multiplier

    attempts++
  }

  console.warn(`⚠️ 重なり回避失敗: ${targetBounds.id} - 最大試行回数(${maxAttempts})に達しました`)
  return { lat: targetBounds.centerLat, lng: targetBounds.centerLng }
}

// 線の交差判定を行う関数
export function doLinesIntersect(
  line1Start: { lat: number; lng: number },
  line1End: { lat: number; lng: number },
  line2Start: { lat: number; lng: number },
  line2End: { lat: number; lng: number },
): boolean {
  const x1 = line1Start.lng,
    y1 = line1Start.lat
  const x2 = line1End.lng,
    y2 = line1End.lat
  const x3 = line2Start.lng,
    y3 = line2Start.lat
  const x4 = line2End.lng,
    y4 = line2End.lat

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 1e-10) return false // 平行線

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

// 線の交差をチェックする関数
export function checkLineIntersections(
  newMarkerPos: { lat: number; lng: number },
  newInfoWindowPos: { lat: number; lng: number },
  existingLines: Array<{
    markerPos: { lat: number; lng: number }
    infoWindowPos: { lat: number; lng: number }
    id: string
  }>,
): { hasIntersection: boolean; intersectingIds: string[] } {
  const intersectingIds: string[] = []

  for (const existingLine of existingLines) {
    if (doLinesIntersect(newMarkerPos, newInfoWindowPos, existingLine.markerPos, existingLine.infoWindowPos)) {
      intersectingIds.push(existingLine.id)
    }
  }

  return {
    hasIntersection: intersectingIds.length > 0,
    intersectingIds,
  }
}

// 格子状整列配置を行う関数（線の交差を最小化）
export function getInsideMapOrganizedPositions(
  regionGroups: Record<string, Array<{ id: string; position: { lat: number; lng: number } }>>,
  map: google.maps.Map,
): Record<string, { lat: number; lng: number }> {
  const result: Record<string, { lat: number; lng: number }> = {}
  const allBounds: InfoWindowBounds[] = []
  const existingLines: Array<{
    markerPos: { lat: number; lng: number }
    infoWindowPos: { lat: number; lng: number }
    id: string
  }> = []

  console.log("🗺️ 格子状整列配置を開始します")

  const bounds = map.getBounds()
  const mapDiv = map.getDiv()

  if (!bounds || !mapDiv) {
    console.error("❌ 地図の境界またはDOMエレメントを取得できません")
    return result
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズを取得
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width
  const infoWindowHeight = currentSize.height

  // 吹き出しサイズを緯度経度に変換
  const cellWidthLng = (infoWindowWidth + 30) * lngPerPixel // 30pxの間隔
  const cellHeightLat = (infoWindowHeight + 30) * latPerPixel // 30pxの間隔

  // 地図の使用可能エリアを計算（マージンを考慮）
  const marginLng = 50 * lngPerPixel
  const marginLat = 50 * latPerPixel
  const usableWidth = mapWidth - marginLng * 2
  const usableHeight = mapHeight - marginLat * 2

  // 格子のサイズを計算
  const maxCols = Math.floor(usableWidth / cellWidthLng)
  const maxRows = Math.floor(usableHeight / cellHeightLat)

  console.log(`📐 格子サイズ: ${maxCols}列 × ${maxRows}行`)

  // 全てのマーカーを一つの配列にまとめる
  const allMarkers: Array<{ id: string; position: { lat: number; lng: number } }> = []
  Object.values(regionGroups).forEach((markers) => {
    allMarkers.push(...markers)
  })

  // マーカーを左から右、上から下の順でソート（線の交差を最小化）
  allMarkers.sort((a, b) => {
    if (Math.abs(a.position.lat - b.position.lat) < 0.001) {
      return a.position.lng - b.position.lng // 同じ緯度なら経度順
    }
    return b.position.lat - a.position.lat // 緯度順（北から南）
  })

  console.log(`📍 ${allMarkers.length}個の吹き出しを格子状に整列します`)

  // 格子状に配置
  allMarkers.forEach((marker, index) => {
    try {
      const row = Math.floor(index / maxCols)
      const col = index % maxCols

      // 行数が最大行数を超える場合は、列数を増やして調整
      const actualMaxCols = Math.ceil(allMarkers.length / maxRows)
      const actualRow = Math.floor(index / actualMaxCols)
      const actualCol = index % actualMaxCols

      // 格子位置を計算（吹き出しの上部を揃える）
      const baseLng = sw.lng() + marginLng + cellWidthLng * (actualCol + 0.5)
      const baseLat = ne.lat() - marginLat - cellHeightLat * (actualRow + 0.5)

      // 地図境界内に収まるように調整
      const targetLng = Math.max(
        sw.lng() + marginLng + cellWidthLng * 0.5,
        Math.min(ne.lng() - marginLng - cellWidthLng * 0.5, baseLng),
      )
      const targetLat = Math.max(
        sw.lat() + marginLat + cellHeightLat * 0.5,
        Math.min(ne.lat() - marginLat - cellHeightLat * 0.5, baseLat),
      )

      console.log(
        `📍 "${marker.id}": 格子位置[${actualRow}, ${actualCol}] → (${targetLat.toFixed(6)}, ${targetLng.toFixed(6)})`,
      )

      // 線の交差チェック
      let finalLat = targetLat
      let finalLng = targetLng
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        const intersectionCheck = checkLineIntersections(
          marker.position,
          { lat: finalLat, lng: finalLng },
          existingLines,
        )

        if (!intersectionCheck.hasIntersection) {
          break // 交差なし
        }

        console.log(`🔀 線の交差検出: ${marker.id} が ${intersectionCheck.intersectingIds.join(", ")} と交差`)

        // 交差を回避するために位置を微調整
        const adjustmentLng = (attempts % 2 === 0 ? 1 : -1) * cellWidthLng * 0.3
        const adjustmentLat = (Math.floor(attempts / 2) % 2 === 0 ? 1 : -1) * cellHeightLat * 0.3

        finalLng = targetLng + adjustmentLng
        finalLat = targetLat + adjustmentLat

        // 地図境界内に収まるように再調整
        finalLng = Math.max(sw.lng() + marginLng, Math.min(ne.lng() - marginLng, finalLng))
        finalLat = Math.max(sw.lat() + marginLat, Math.min(ne.lat() - marginLat, finalLat))

        attempts++
      }

      if (attempts >= maxAttempts) {
        console.warn(`⚠️ 線の交差回避失敗: ${marker.id}`)
      }

      // 基本位置での境界ボックスを計算
      const baseBounds = calculateInfoWindowBounds(finalLat, finalLng, map, marker.id)

      // 重なり回避調整を実行
      const adjustedPosition = adjustPositionToAvoidOverlap(baseBounds, allBounds, map, 20)

      // 最終的な境界ボックスを計算して記録
      const finalBounds = calculateInfoWindowBounds(adjustedPosition.lat, adjustedPosition.lng, map, marker.id)
      allBounds.push(finalBounds)

      // 線の情報を記録
      existingLines.push({
        markerPos: marker.position,
        infoWindowPos: adjustedPosition,
        id: marker.id,
      })

      result[marker.id] = adjustedPosition

      console.log(
        `✅ "${marker.id}" 配置完了: 格子[${actualRow}, ${actualCol}] (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`,
      )
    } catch (error) {
      console.error(`❌ マーカー "${marker.id}" の配置に失敗:`, error)
      result[marker.id] = marker.position
    }
  })

  // 最終的な重なりと線の交差チェック
  let overlapCount = 0
  let intersectionCount = 0

  for (let i = 0; i < allBounds.length; i++) {
    for (let j = i + 1; j < allBounds.length; j++) {
      if (checkOverlap(allBounds[i], allBounds[j])) {
        overlapCount++
      }
    }
  }

  for (let i = 0; i < existingLines.length; i++) {
    for (let j = i + 1; j < existingLines.length; j++) {
      if (
        doLinesIntersect(
          existingLines[i].markerPos,
          existingLines[i].infoWindowPos,
          existingLines[j].markerPos,
          existingLines[j].infoWindowPos,
        )
      ) {
        intersectionCount++
      }
    }
  }

  console.log(`✅ 格子状整列配置完了: ${Object.keys(result).length}個の吹き出し`)
  console.log(`📊 最終重なり数: ${overlapCount}個`)
  console.log(`🔀 最終線交差数: ${intersectionCount}個`)

  return result
}

// 地域別配置位置を計算する関数（線の交差回避版）
export function getRegionSpecificPosition(
  region: string,
  map: google.maps.Map,
  index: number,
  totalInRegion: number,
  markerPosition?: { lat: number; lng: number },
  existingLines?: Array<{
    markerPos: { lat: number; lng: number }
    infoWindowPos: { lat: number; lng: number }
    id: string
  }>,
): { lat: number; lng: number } {
  const bounds = map.getBounds()
  const mapDiv = map.getDiv()

  if (!bounds || !mapDiv) {
    throw new Error("地図の境界またはDOMエレメントを取得できません")
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const center = bounds.getCenter()

  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // 現在の設定からサイズを取得
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width + 40
  const infoWindowHeight = currentSize.height + 40

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズを緯度経度に変換
  const infoWindowLngSize = infoWindowWidth * lngPerPixel
  const infoWindowLatSize = infoWindowHeight * latPerPixel

  // 地図内側のマージン
  const marginLng = infoWindowLngSize * 0.7
  const marginLat = infoWindowLatSize * 0.7

  console.log(`🎯 地域 "${region}" の線交差回避配置計算 (${index + 1}/${totalInRegion})`)

  // 基本配置位置を計算
  let basePosition: { lat: number; lng: number }

  switch (region) {
    case "東部・伊豆": {
      const regionWidth = (mapWidth - marginLng * 2) * 0.3
      const baseLng = ne.lng() - marginLng - regionWidth * 0.3

      const availableHeight = mapHeight - marginLat * 2
      const minSpacing = infoWindowLatSize * 1.6 // 線の交差回避のため間隔をさらに拡大
      const spacing = Math.max(minSpacing, (availableHeight / totalInRegion) * 0.8)
      const totalHeight = spacing * totalInRegion
      const startLat = center.lat() + totalHeight / 2 - spacing / 2

      const finalLat = Math.max(sw.lat() + marginLat, Math.min(ne.lat() - marginLat, startLat - spacing * index))

      basePosition = { lat: finalLat, lng: baseLng }
      break
    }

    case "中部": {
      const regionHeight = (mapHeight - marginLat * 2) * 0.3
      const baseLat = sw.lat() + marginLat + regionHeight * 0.3

      const availableWidth = mapWidth - marginLng * 2
      const minSpacing = infoWindowLngSize * 1.6 // 線の交差回避のため間隔をさらに拡大
      const spacing = Math.max(minSpacing, (availableWidth / totalInRegion) * 0.8)
      const totalWidth = spacing * totalInRegion
      const startLng = center.lng() - totalWidth / 2 + spacing / 2

      const finalLng = Math.max(sw.lng() + marginLng, Math.min(ne.lng() - marginLng, startLng + spacing * index))

      basePosition = { lat: baseLat, lng: finalLng }
      break
    }

    case "西部": {
      const regionWidth = (mapWidth - marginLng * 2) * 0.3
      const baseLng = sw.lng() + marginLng + regionWidth * 0.3

      const availableHeight = mapHeight - marginLat * 2
      const minSpacing = infoWindowLatSize * 1.6 // 線の交差回避のため間隔をさらに拡大
      const spacing = Math.max(minSpacing, (availableHeight / totalInRegion) * 0.8)
      const totalHeight = spacing * totalInRegion
      const startLat = center.lat() + totalHeight / 2 - spacing / 2

      const finalLat = Math.max(sw.lat() + marginLat, Math.min(ne.lat() - marginLat, startLat - spacing * index))

      basePosition = { lat: finalLat, lng: baseLng }
      break
    }

    default: {
      const regionHeight = (mapHeight - marginLat * 2) * 0.3
      const baseLat = ne.lat() - marginLat - regionHeight * 0.3

      const availableWidth = mapWidth - marginLng * 2
      const minSpacing = infoWindowLngSize * 1.6 // 線の交差回避のため間隔をさらに拡大
      const spacing = Math.max(minSpacing, (availableWidth / totalInRegion) * 0.8)
      const totalWidth = spacing * totalInRegion
      const startLng = center.lng() - totalWidth / 2 + spacing / 2

      const finalLng = Math.max(sw.lng() + marginLng, Math.min(ne.lng() - marginLng, startLng + spacing * index))

      basePosition = { lat: baseLat, lng: finalLng }
      break
    }
  }

  // 線の交差チェックと調整
  if (markerPosition && existingLines && existingLines.length > 0) {
    const intersectionCheck = checkLineIntersections(markerPosition, basePosition, existingLines)

    if (intersectionCheck.hasIntersection) {
      console.log(`🔀 線の交差検出: ${intersectionCheck.intersectingIds.join(", ")} と交差`)

      // 交差を回避するための位置調整
      const adjustmentStep = infoWindowLatSize * 0.3
      let adjustedPosition = { ...basePosition }
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        // 上下左右に少しずつ調整
        const adjustments = [
          { lat: adjustedPosition.lat + adjustmentStep, lng: adjustedPosition.lng },
          { lat: adjustedPosition.lat - adjustmentStep, lng: adjustedPosition.lng },
          { lat: adjustedPosition.lat, lng: adjustedPosition.lng + adjustmentStep * 0.5 },
          { lat: adjustedPosition.lat, lng: adjustedPosition.lng - adjustmentStep * 0.5 },
        ]

        let foundNonIntersecting = false
        for (const adjustment of adjustments) {
          const newIntersectionCheck = checkLineIntersections(markerPosition, adjustment, existingLines)
          if (!newIntersectionCheck.hasIntersection) {
            adjustedPosition = adjustment
            foundNonIntersecting = true
            console.log(`✅ 線の交差回避成功: 調整後位置 (${adjustment.lat.toFixed(6)}, ${adjustment.lng.toFixed(6)})`)
            break
          }
        }

        if (foundNonIntersecting) break
        attempts++
      }

      if (attempts >= maxAttempts) {
        console.warn(`⚠️ 線の交差回避失敗: 最大試行回数に達しました`)
      }

      basePosition = adjustedPosition
    }
  }

  console.log(
    `📍 ${region} ${index + 1}: 線交差回避配置 (${basePosition.lat.toFixed(6)}, ${basePosition.lng.toFixed(6)})`,
  )

  return basePosition
}

// 後方互換性のための関数群
export function getNoOverlapRegionPositions(
  regionGroups: Record<string, Array<{ id: string; position: { lat: number; lng: number } }>>,
  map: google.maps.Map,
): Record<string, { lat: number; lng: number }> {
  return getInsideMapOrganizedPositions(regionGroups, map)
}

export function getPerimeterRegionPosition(
  region: string,
  map: google.maps.Map,
  index: number,
  totalInRegion: number,
): { lat: number; lng: number } {
  return getRegionSpecificPosition(region, map, index, totalInRegion)
}

export function getPerimeterOrganizedPositions(
  regionGroups: Record<string, Array<{ id: string; position: { lat: number; lng: number } }>>,
  map: google.maps.Map,
): Record<string, { lat: number; lng: number }> {
  return getInsideMapOrganizedPositions(regionGroups, map)
}

export function getRegionPositionInMapArea(
  region: string,
  map: google.maps.Map,
  index: number,
  totalInRegion: number,
): { lat: number; lng: number } {
  return getRegionSpecificPosition(region, map, index, totalInRegion)
}

export function getOptimizedRegionPosition(
  region: string,
  map: google.maps.Map,
  index: number,
  totalInRegion: number,
): { lat: number; lng: number } {
  return getRegionSpecificPosition(region, map, index, totalInRegion)
}

// 地図内側への地域別配置位置を計算する関数（後方互換性のため残す）
export function getInsideMapRegionPosition(
  region: string,
  map: google.maps.Map,
  index: number,
  totalInRegion: number,
): { lat: number; lng: number } {
  return getRegionSpecificPosition(region, map, index, totalInRegion)
}

// 新しい関数を追加：吹き出しの各辺と地図の各辺との距離を測定して最も近い辺を判定する関数
export function getClosestMapEdge(
  infoWindowLat: number,
  infoWindowLng: number,
  map: google.maps.Map,
): "top" | "bottom" | "left" | "right" {
  const bounds = map.getBounds()
  if (!bounds) {
    throw new Error("地図の境界を取得できません")
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapDiv = map.getDiv()
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズを取得
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width
  const infoWindowHeight = currentSize.height

  // 吹き出しサイズを緯度経度に変換
  const infoWindowWidthLng = infoWindowWidth * lngPerPixel
  const infoWindowHeightLat = infoWindowHeight * latPerPixel

  // 現在の吹き出し位置での各辺の座標を計算
  const infoWindowBounds = {
    north: infoWindowLat + infoWindowHeightLat / 2, // 吹き出しの上辺
    south: infoWindowLat - infoWindowHeightLat / 2, // 吹き出しの下辺
    east: infoWindowLng + infoWindowWidthLng / 2, // 吹き出しの右辺
    west: infoWindowLng - infoWindowWidthLng / 2, // 吹き出しの左辺
  }

  // 地図の各辺の座標
  const mapBounds = {
    north: ne.lat(), // 地図の上辺
    south: sw.lat(), // 地図の下辺
    east: ne.lng(), // 地図の右辺
    west: sw.lng(), // 地図の左辺
  }

  // 吹き出しの各辺と地図の各辺との距離を計算
  const distanceToMapTop = Math.abs(mapBounds.north - infoWindowBounds.north) // 吹き出し上辺と地図上辺の距離
  const distanceToMapBottom = Math.abs(infoWindowBounds.south - mapBounds.south) // 吹き出し下辺と地図下辺の距離
  const distanceToMapRight = Math.abs(mapBounds.east - infoWindowBounds.east) // 吹き出し右辺と地図右辺の距離
  const distanceToMapLeft = Math.abs(infoWindowBounds.west - mapBounds.west) // 吹き出し左辺と地図左辺の距離

  console.log(`📍 吹き出し位置: (${infoWindowLat.toFixed(6)}, ${infoWindowLng.toFixed(6)})`)
  console.log(
    `📏 地図境界: 北=${mapBounds.north.toFixed(6)}, 南=${mapBounds.south.toFixed(6)}, 東=${mapBounds.east.toFixed(6)}, 西=${mapBounds.west.toFixed(6)}`,
  )
  console.log(
    `📏 吹き出し境界: 北=${infoWindowBounds.north.toFixed(6)}, 南=${infoWindowBounds.south.toFixed(6)}, 東=${infoWindowBounds.east.toFixed(6)}, 西=${infoWindowBounds.west.toFixed(6)}`,
  )
  console.log(`📏 各辺間の距離:`)
  console.log(`  吹き出し上辺 ↔ 地図上辺: ${distanceToMapTop.toFixed(6)}`)
  console.log(`  吹き出し下辺 ↔ 地図下辺: ${distanceToMapBottom.toFixed(6)}`)
  console.log(`  吹き出し右辺 ↔ 地図右辺: ${distanceToMapRight.toFixed(6)}`)
  console.log(`  吹き出し左辺 ↔ 地図左辺: ${distanceToMapLeft.toFixed(6)}`)

  // 最も近い辺を判定
  const minDistance = Math.min(distanceToMapTop, distanceToMapBottom, distanceToMapRight, distanceToMapLeft)

  let closestEdge: "top" | "bottom" | "left" | "right"

  if (minDistance === distanceToMapTop) {
    closestEdge = "top"
  } else if (minDistance === distanceToMapBottom) {
    closestEdge = "bottom"
  } else if (minDistance === distanceToMapRight) {
    closestEdge = "right"
  } else {
    closestEdge = "left"
  }

  console.log(`🎯 最も近い辺: ${closestEdge} (距離: ${minDistance.toFixed(6)})`)
  return closestEdge
}

// 新しい関数を追加：指定された辺に沿って吹き出しを配置する関数
export function getEdgeAlignedPositions(
  activeInfoWindows: Record<string, { position: { lat: number; lng: number }; markerId: string }>,
  map: google.maps.Map,
): Record<string, { lat: number; lng: number }> {
  const result: Record<string, { lat: number; lng: number }> = {}
  const bounds = map.getBounds()
  const mapDiv = map.getDiv()

  if (!bounds || !mapDiv) {
    console.error("❌ 地図の境界またはDOMエレメントを取得できません")
    return result
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズを取得
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width
  const infoWindowHeight = currentSize.height

  // 固定の10ピクセルマージン
  const marginPixels = 10
  const marginLng = marginPixels * lngPerPixel
  const marginLat = marginPixels * latPerPixel

  // 吹き出しサイズを緯度経度に変換
  const infoWindowWidthLng = infoWindowWidth * lngPerPixel
  const infoWindowHeightLat = infoWindowHeight * latPerPixel

  console.log(`📐 地図サイズ: ${mapPixelWidth}x${mapPixelHeight}px`)
  console.log(`📐 吹き出しサイズ: ${infoWindowWidth}x${infoWindowHeight}px`)
  console.log(`📐 10ピクセルマージン: lng=${marginLng.toFixed(8)}, lat=${marginLat.toFixed(8)}`)
  console.log(
    `📐 吹き出しサイズ(緯度経度): lng=${infoWindowWidthLng.toFixed(8)}, lat=${infoWindowHeightLat.toFixed(8)}`,
  )

  // 各辺別にマーカーをグループ化
  const edgeGroups: Record<string, Array<{ id: string; position: { lat: number; lng: number } }>> = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  }

  // 現在の吹き出し位置を使用して最も近い辺別にグループ化
  Object.entries(activeInfoWindows).forEach(([markerId, infoWindow]) => {
    // 現在の吹き出し位置を使用（マーカー位置ではなく）
    const closestEdge = getClosestMapEdge(infoWindow.position.lat, infoWindow.position.lng, map)
    edgeGroups[closestEdge].push({ id: markerId, position: infoWindow.position })
    console.log(
      `📍 吹き出し "${markerId}" を ${closestEdge} 辺に分類（現在位置: ${infoWindow.position.lat.toFixed(6)}, ${infoWindow.position.lng.toFixed(6)}）`,
    )
  })

  console.log(
    "🏞️ 辺別グループ:",
    Object.keys(edgeGroups).map((edge) => `${edge}: ${edgeGroups[edge].length}個`),
  )

  // 各辺に沿って配置
  Object.entries(edgeGroups).forEach(([edge, edgeMarkers]) => {
    if (edgeMarkers.length === 0) return

    // マーカーをソート（配置を整然とするため）
    const sortedMarkers = [...edgeMarkers]

    switch (edge) {
      case "top":
      case "bottom":
        // 上辺・下辺：左から右へソート（現在の吹き出し位置で）
        sortedMarkers.sort((a, b) => a.position.lng - b.position.lng)
        break
      case "left":
      case "right":
        // 左辺・右辺：上から下へソート（現在の吹き出し位置で）
        sortedMarkers.sort((a, b) => b.position.lat - a.position.lat)
        break
    }

    // 各辺での配置を計算
    sortedMarkers.forEach((marker, index) => {
      let position: { lat: number; lng: number }

      switch (edge) {
        case "top":
          // 上辺：吹き出しの上辺が地図上辺から10px内側になるように配置
          // 吹き出しの中心位置 = 地図上辺 - 10px - 吹き出し高さの半分
          const topLat = ne.lat() - marginLat - infoWindowHeightLat / 2

          // 左右の配置可能エリアを計算（吹き出しが地図外に出ないように）
          const topAvailableWidth = mapWidth - marginLng * 2 - infoWindowWidthLng

          if (edgeMarkers.length === 1) {
            // 1個の場合は中央に配置
            position = {
              lat: topLat,
              lng: (ne.lng() + sw.lng()) / 2,
            }
          } else {
            // 複数の場合は等間隔で配置
            const topSpacing = topAvailableWidth / (edgeMarkers.length - 1)
            const topStartLng = sw.lng() + marginLng + infoWindowWidthLng / 2
            position = {
              lat: topLat,
              lng: topStartLng + topSpacing * index,
            }
          }
          console.log(`🔝 上辺配置: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
          break

        case "bottom":
          // 下辺：吹き出しの下辺が地図下辺から10px内側になるように配置
          // 吹き出しの中心位置 = 地図下辺 + 10px + 吹き出し高さの半分
          const bottomLat = sw.lat() + marginLat + infoWindowHeightLat / 2

          // 左右の配置可能エリアを計算
          const bottomAvailableWidth = mapWidth - marginLng * 2 - infoWindowWidthLng

          if (edgeMarkers.length === 1) {
            // 1個の場合は中央に配置
            position = {
              lat: bottomLat,
              lng: (ne.lng() + sw.lng()) / 2,
            }
          } else {
            // 複数の場合は等間隔で配置
            const bottomSpacing = bottomAvailableWidth / (edgeMarkers.length - 1)
            const bottomStartLng = sw.lng() + marginLng + infoWindowWidthLng / 2
            position = {
              lat: bottomLat,
              lng: bottomStartLng + bottomSpacing * index,
            }
          }
          console.log(`🔽 下辺配置: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
          break

        case "left":
          // 左辺：吹き出しの左辺が地図左辺から10px内側になるように配置
          // 吹き出しの中心位置 = 地図左辺 + 10px + 吹き出し幅の半分
          const leftLng = sw.lng() + marginLng + infoWindowWidthLng / 2

          // 上下の配置可能エリアを計算
          const leftAvailableHeight = mapHeight - marginLat * 2 - infoWindowHeightLat

          if (edgeMarkers.length === 1) {
            // 1個の場合は中央に配置
            position = {
              lat: (ne.lat() + sw.lat()) / 2,
              lng: leftLng,
            }
          } else {
            // 複数の場合は等間隔で配置
            const leftSpacing = leftAvailableHeight / (edgeMarkers.length - 1)
            const leftStartLat = ne.lat() - marginLat - infoWindowHeightLat / 2
            position = {
              lat: leftStartLat - leftSpacing * index,
              lng: leftLng,
            }
          }
          console.log(`◀️ 左辺配置: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
          break

        case "right":
          // 右辺：吹き出しの右辺が地図右辺から10px内側になるように配置
          // 吹き出しの中心位置 = 地図右辺 - 10px - 吹き出し幅の半分
          const rightLng = ne.lng() - marginLng - infoWindowWidthLng / 2

          // 上下の配置可能エリアを計算
          const rightAvailableHeight = mapHeight - marginLat * 2 - infoWindowHeightLat

          if (edgeMarkers.length === 1) {
            // 1個の場合は中央に配置
            position = {
              lat: (ne.lat() + sw.lat()) / 2,
              lng: rightLng,
            }
          } else {
            // 複数の場合は等間隔で配置
            const rightSpacing = rightAvailableHeight / (edgeMarkers.length - 1)
            const rightStartLat = ne.lat() - marginLat - infoWindowHeightLat / 2
            position = {
              lat: rightStartLat - rightSpacing * index,
              lng: rightLng,
            }
          }
          console.log(`▶️ 右辺配置: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
          break

        default:
          position = marker.position
      }

      result[marker.id] = position
      console.log(
        `✅ "${marker.id}" を ${edge} 辺に配置（吹き出しの${edge}辺が地図${edge}辺から10px内側）: (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`,
      )
    })
  })

  console.log(`✅ 辺配置完了: ${Object.keys(result).length}個の吹き出し`)
  return result
}

// 新しい関数を追加：指定された位置を最も近い辺に10ピクセル内側に調整する関数
export function adjustToClosestEdge(lat: number, lng: number, map: google.maps.Map): { lat: number; lng: number } {
  const bounds = map.getBounds()
  const mapDiv = map.getDiv()

  if (!bounds || !mapDiv) {
    console.error("❌ 地図の境界またはDOMエレメントを取得できません")
    return { lat, lng }
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズを取得
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズを取得
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width
  const infoWindowHeight = currentSize.height

  // 固定の10ピクセルマージン
  const marginPixels = 10
  const marginLng = marginPixels * lngPerPixel
  const marginLat = marginPixels * latPerPixel

  // 吹き出しサイズを緯度経度に変換
  const infoWindowWidthLng = infoWindowWidth * lngPerPixel
  const infoWindowHeightLat = infoWindowHeight * latPerPixel

  console.log(`🎯 手動移動後の自動調整: (${lat.toFixed(6)}, ${lng.toFixed(6)})`)

  // 最も近い辺を判定
  const closestEdge = getClosestMapEdge(lat, lng, map)
  console.log(`📍 最も近い辺: ${closestEdge}`)

  // 最も近い辺に10ピクセル内側に調整
  let adjustedPosition: { lat: number; lng: number }

  switch (closestEdge) {
    case "top":
      // 上辺：吹き出しの上辺が地図上辺から10px内側になるように配置
      adjustedPosition = {
        lat: ne.lat() - marginLat - infoWindowHeightLat / 2,
        lng: lng, // 経度はそのまま維持
      }
      console.log(`🔝 上辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
      break

    case "bottom":
      // 下辺：吹き出しの下辺が地図下辺から10px内側になるように配置
      adjustedPosition = {
        lat: sw.lat() + marginLat + infoWindowHeightLat / 2,
        lng: lng, // 経度はそのまま維持
      }
      console.log(`🔽 下辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
      break

    case "left":
      // 左辺：吹き出しの左辺が地図左辺から10px内側になるように配置
      adjustedPosition = {
        lat: lat, // 緯度はそのまま維持
        lng: sw.lng() + marginLng + infoWindowWidthLng / 2,
      }
      console.log(`◀️ 左辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
      break

    case "right":
      // 右辺：吹き出しの右辺が地図右辺から10px内側になるように配置
      adjustedPosition = {
        lat: lat, // 緯度はそのまま維持
        lng: ne.lng() - marginLng - infoWindowWidthLng / 2,
      }
      console.log(`▶️ 右辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
      break

    default:
      adjustedPosition = { lat, lng }
  }

  // 調整後の位置が地図境界内に収まっているかチェック
  const finalLat = Math.max(
    sw.lat() + marginLat + infoWindowHeightLat / 2,
    Math.min(ne.lat() - marginLat - infoWindowHeightLat / 2, adjustedPosition.lat),
  )
  const finalLng = Math.max(
    sw.lng() + marginLng + infoWindowWidthLng / 2,
    Math.min(ne.lng() - marginLng - infoWindowWidthLng / 2, adjustedPosition.lng),
  )

  const finalPosition = { lat: finalLat, lng: finalLng }

  console.log(`✅ 最終調整位置: (${finalPosition.lat.toFixed(6)}, ${finalPosition.lng.toFixed(6)})`)

  return finalPosition
}
