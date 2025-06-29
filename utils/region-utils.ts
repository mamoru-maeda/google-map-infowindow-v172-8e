// 静岡県の地域判定ユーティリティ

import type { google } from "google-maps"
import { getCurrentDefaultSize } from "@/hooks/use-infowindow-settings"

// ------------------------------
// 数値フォーマッタ（非有限値も安全に文字列化）
function fmt(num: number, digits = 8): string {
  return Number.isFinite(num) ? num.toFixed(digits) : "∞"
}

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

// 線の情報
export interface LineInfo {
  id: string
  markerPos: { lat: number; lng: number }
  infoWindowPos: { lat: number; lng: number }
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

// 2つの吹き出しが重なっているかチェックする関数（詳細版）
export function checkOverlap(bounds1: InfoWindowBounds, bounds2: InfoWindowBounds): boolean {
  // 重なりの詳細計算
  const horizontalOverlap = Math.max(0, Math.min(bounds1.east, bounds2.east) - Math.max(bounds1.west, bounds2.west))
  const verticalOverlap = Math.max(0, Math.min(bounds1.north, bounds2.north) - Math.max(bounds1.south, bounds2.south))

  const isOverlapping = horizontalOverlap > 0 && verticalOverlap > 0

  if (isOverlapping) {
    console.log(`🔴 重なり検出: ${bounds1.id} と ${bounds2.id}`)
    console.log(
      `  ${bounds1.id}: 範囲 (${fmt(bounds1.west)}, ${fmt(bounds1.south)}) - (${fmt(bounds1.east)}, ${fmt(bounds1.north)})`,
    )
    console.log(
      `  ${bounds2.id}: 範囲 (${fmt(bounds2.west)}, ${fmt(bounds2.south)}) - (${fmt(bounds2.east)}, ${fmt(bounds2.north)})`,
    )
    console.log(
      `  水平重なり: ${fmt(horizontalOverlap)} (${((horizontalOverlap / (bounds1.east - bounds1.west)) * 100).toFixed(2)}%)`,
    )
    console.log(
      `  垂直重なり: ${fmt(verticalOverlap)} (${((verticalOverlap / (bounds1.north - bounds1.south)) * 100).toFixed(2)}%)`,
    )

    // 重なり面積を計算
    const overlapArea = horizontalOverlap * verticalOverlap
    const bounds1Area = (bounds1.east - bounds1.west) * (bounds1.north - bounds1.south)
    const bounds2Area = (bounds2.east - bounds2.west) * (bounds2.north - bounds2.south)
    const overlapPercentage1 = (overlapArea / bounds1Area) * 100
    const overlapPercentage2 = (overlapArea / bounds2Area) * 100

    console.log(`  重なり面積: ${fmt(overlapArea)}`)
    console.log(`  ${bounds1.id}の重なり率: ${fmt(overlapPercentage1, 2)}%`)
    console.log(`  ${bounds2.id}の重なり率: ${fmt(overlapPercentage2, 2)}%`)
  }

  return isOverlapping
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
  existingLines: LineInfo[],
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

// 吹き出しの中心位置から最も近い地図の辺を正確に判定する関数
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

  console.log(`📍 吹き出し中心位置: (${infoWindowLat.toFixed(8)}, ${infoWindowLng.toFixed(8)})`)
  console.log(
    `📏 地図境界: 上=${ne.lat().toFixed(8)}, 下=${sw.lat().toFixed(8)}, 右=${ne.lng().toFixed(8)}, 左=${sw.lng().toFixed(8)}`,
  )

  // 地図の中心を計算
  const mapCenterLat = (ne.lat() + sw.lat()) / 2
  const mapCenterLng = (ne.lng() + sw.lng()) / 2

  console.log(`📍 地図中心: (${mapCenterLat.toFixed(8)}, ${mapCenterLng.toFixed(8)})`)

  // 吹き出し位置から地図の各辺までの絶対距離を計算
  const distanceToTop = ne.lat() - infoWindowLat // 上辺までの距離（正の値）
  const distanceToBottom = infoWindowLat - sw.lat() // 下辺までの距離（正の値）
  const distanceToRight = ne.lng() - infoWindowLng // 右辺までの距離（正の値）
  const distanceToLeft = infoWindowLng - sw.lng() // 左辺までの距離（正の値）

  console.log(`📏 各辺までの距離:`)
  console.log(`  上辺まで: ${distanceToTop.toFixed(8)} (${distanceToTop > 0 ? "地図内" : "地図外"})`)
  console.log(`  下辺まで: ${distanceToBottom.toFixed(8)} (${distanceToBottom > 0 ? "地図内" : "地図外"})`)
  console.log(`  右辺まで: ${distanceToRight.toFixed(8)} (${distanceToRight > 0 ? "地図内" : "地図外"})`)
  console.log(`  左辺まで: ${distanceToLeft.toFixed(8)} (${distanceToLeft > 0 ? "地図内" : "地図外"})`)

  // 各辺までの距離を比較して最も近い辺を判定
  const distances = {
    top: distanceToTop,
    bottom: distanceToBottom,
    right: distanceToRight,
    left: distanceToLeft,
  }

  // 正の値（地図内）の距離のみを考慮
  const validDistances = Object.entries(distances).filter(([_, distance]) => distance > 0)

  if (validDistances.length === 0) {
    console.warn("⚠️ 吹き出しが地図外にあります。最も近い辺を推定します。")
    // 地図外の場合は絶対値で最小距離を計算
    const absDistances = Object.entries(distances).map(([edge, distance]) => [edge, Math.abs(distance)])
    const [closestEdge] = absDistances.reduce((min, current) => (current[1] < min[1] ? current : min))
    console.log(`🎯 推定最近辺: ${closestEdge}`)
    return closestEdge as "top" | "bottom" | "left" | "right"
  }

  // 最小距離の辺を特定
  const [closestEdge, minDistance] = validDistances.reduce((min, current) => (current[1] < min[1] ? current : min))

  console.log(`🎯 最も近い辺: ${closestEdge} (距離: ${minDistance.toFixed(8)})`)

  // 判定の妥当性を検証
  console.log(`🔍 判定検証:`)
  if (closestEdge === "top") {
    console.log(`  上辺判定: 吹き出しは地図上部に位置 (中心より${infoWindowLat > mapCenterLat ? "北" : "南"})`)
  } else if (closestEdge === "bottom") {
    console.log(`  下辺判定: 吹き出しは地図下部に位置 (中心より${infoWindowLat < mapCenterLat ? "南" : "北"})`)
  } else if (closestEdge === "right") {
    console.log(`  右辺判定: 吹き出しは地図右部に位置 (中心より${infoWindowLng > mapCenterLng ? "東" : "西"})`)
  } else if (closestEdge === "left") {
    console.log(`  左辺判定: 吹き出しは地図左部に位置 (中心より${infoWindowLng < mapCenterLng ? "西" : "東"})`)
  }

  return closestEdge as "top" | "bottom" | "left" | "right"
}

// 右上のボタン群の領域を計算する関数
function getButtonAreaBounds(map: google.maps.Map): {
  north: number
  south: number
  east: number
  west: number
} {
  const bounds = map.getBounds()
  const mapDiv = map.getDiv()

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

  // ピクセルサイズを緯度経度に変換するための係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 右上のボタン群の推定サイズ（ピクセル）
  const buttonAreaWidth = 300 // 右上ボタン群の幅（推定）
  const buttonAreaHeight = 200 // 右上ボタン群の高さ（推定）
  const marginFromEdge = 16 // 地図端からのマージン

  // ボタン群の領域を緯度経度で計算
  const buttonAreaWidthLng = buttonAreaWidth * lngPerPixel
  const buttonAreaHeightLat = buttonAreaHeight * latPerPixel
  const marginLng = marginFromEdge * lngPerPixel
  const marginLat = marginFromEdge * latPerPixel

  return {
    north: ne.lat() - marginLat,
    south: ne.lat() - marginLat - buttonAreaHeightLat,
    east: ne.lng() - marginLng,
    west: ne.lng() - marginLng - buttonAreaWidthLng,
  }
}

// 吹き出しがボタン群と重なるかチェックする関数
function checkButtonAreaOverlap(
  infoWindowBounds: InfoWindowBounds,
  buttonAreaBounds: { north: number; south: number; east: number; west: number },
): boolean {
  const horizontalOverlap = !(
    infoWindowBounds.east <= buttonAreaBounds.west || infoWindowBounds.west >= buttonAreaBounds.east
  )
  const verticalOverlap = !(
    infoWindowBounds.north <= buttonAreaBounds.south || infoWindowBounds.south >= buttonAreaBounds.north
  )

  const isOverlapping = horizontalOverlap && verticalOverlap

  if (isOverlapping) {
    console.log(`🔴 ボタン群との重なり検出: ${infoWindowBounds.id}`)
    console.log(
      `  吹き出し範囲: (${infoWindowBounds.west.toFixed(6)}, ${infoWindowBounds.south.toFixed(6)}) - (${infoWindowBounds.east.toFixed(6)}, ${infoWindowBounds.north.toFixed(6)})`,
    )
    console.log(
      `  ボタン群範囲: (${buttonAreaBounds.west.toFixed(6)}, ${buttonAreaBounds.south.toFixed(6)}) - (${buttonAreaBounds.east.toFixed(6)}, ${buttonAreaBounds.north.toFixed(6)})`,
    )
  }

  return isOverlapping
}

// 各吹き出しを最も近い辺に10px内側に配置する関数（線交差最小化版）
export function getEdgeAlignedPositions(
  activeInfoWindows: Record<string, { position: { lat: number; lng: number }; markerId: string }>,
  map: google.maps.Map,
): Record<string, { lat: number; lng: number }> {
  const result: Record<string, { lat: number; lng: number }> = {}
  const bounds = map.getBounds()
  const mapDiv = map.getDiv()

  if (!bounds || !mapDiv) {
    console.error("❌ 地図の境界または DOM エレメントを取得できません")
    return result
  }

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const mapWidth = ne.lng() - sw.lng()
  const mapHeight = ne.lat() - sw.lat()

  // 地図のピクセルサイズ
  const mapPixelWidth = mapDiv.offsetWidth
  const mapPixelHeight = mapDiv.offsetHeight

  // ピクセル→緯度経度変換係数
  const lngPerPixel = mapWidth / mapPixelWidth
  const latPerPixel = mapHeight / mapPixelHeight

  // 吹き出しサイズ
  const currentSize = getCurrentDefaultSize()
  const infoWindowWidth = currentSize.width
  const infoWindowHeight = currentSize.height

  // 10px内側配置のための距離
  const edgeDistancePixels = 10
  const edgeDistanceLng = edgeDistancePixels * lngPerPixel
  const edgeDistanceLat = edgeDistancePixels * latPerPixel

  // 吹き出しサイズ（緯度経度）
  const infoWindowWidthLng = infoWindowWidth * lngPerPixel
  const infoWindowHeightLat = infoWindowHeight * latPerPixel

  // 右上のボタン群の領域を取得
  const buttonAreaBounds = getButtonAreaBounds(map)

  console.log(`🗺️ 最近辺10px内側配置を開始します（線交差最小化版）`)
  console.log(`📐 地図サイズ: ${mapPixelWidth}x${mapPixelHeight}px`)
  console.log(`📐 吹き出しサイズ: ${infoWindowWidth}x${infoWindowHeight}px`)
  console.log(`📐 辺からの距離: ${edgeDistancePixels}px`)

  // 各吹き出しの情報を取得し、最も近い辺を判定
  const infoWindowData = Object.entries(activeInfoWindows).map(([id, info]) => {
    const closestEdge = getClosestMapEdge(info.position.lat, info.position.lng, map)
    return {
      id,
      markerPosition: info.position, // 実際のマーカー位置（現在は吹き出し位置と同じ）
      currentInfoWindowPosition: info.position,
      closestEdge,
    }
  })

  console.log(`📍 処理対象: ${infoWindowData.length}個の吹き出し`)

  // 辺別にグループ化
  const edgeGroups: Record<
    "top" | "bottom" | "left" | "right",
    Array<{
      id: string
      markerPosition: { lat: number; lng: number }
      currentInfoWindowPosition: { lat: number; lng: number }
    }>
  > = { top: [], bottom: [], left: [], right: [] }

  infoWindowData.forEach((info) => {
    edgeGroups[info.closestEdge].push({
      id: info.id,
      markerPosition: info.markerPosition,
      currentInfoWindowPosition: info.currentInfoWindowPosition,
    })
    console.log(`📍 吹き出し "${info.id}" を ${info.closestEdge} 辺に分類`)
  })

  console.log(
    `🏞️ 辺別グループ: 上=${edgeGroups.top.length}, 下=${edgeGroups.bottom.length}, 左=${edgeGroups.left.length}, 右=${edgeGroups.right.length}`,
  )

  // 各辺の利用可能スペースを計算
  const edgeSpaces = {
    top: {
      start: sw.lng() + edgeDistanceLng + infoWindowWidthLng / 2,
      end: Math.min(ne.lng() - edgeDistanceLng - infoWindowWidthLng / 2, buttonAreaBounds.west - edgeDistanceLng),
      lat: ne.lat() - edgeDistanceLat - infoWindowHeightLat / 2,
    },
    bottom: {
      start: sw.lng() + edgeDistanceLng + infoWindowWidthLng / 2,
      end: ne.lng() - edgeDistanceLng - infoWindowWidthLng / 2,
      lat: sw.lat() + edgeDistanceLat + infoWindowHeightLat / 2,
    },
    left: {
      start: sw.lat() + edgeDistanceLat + infoWindowHeightLat / 2,
      end: ne.lat() - edgeDistanceLat - infoWindowHeightLat / 2,
      lng: sw.lng() + edgeDistanceLng + infoWindowWidthLng / 2,
    },
    right: {
      start: sw.lat() + edgeDistanceLat + infoWindowHeightLat / 2,
      end: Math.min(ne.lat() - edgeDistanceLat - infoWindowHeightLat / 2, buttonAreaBounds.south - edgeDistanceLat),
      lng: ne.lng() - edgeDistanceLng - infoWindowWidthLng / 2,
    },
  }

  // 線の交差を最小化するための最適化
  const placedPositions: Array<{ id: string; position: { lat: number; lng: number }; edge: string }> = []
  const lines: LineInfo[] = []

  // 各辺を処理
  const edges = ["top", "bottom", "left", "right"] as const
  edges.forEach((edge) => {
    const markers = edgeGroups[edge]
    if (markers.length === 0) return

    console.log(`🔧 ${edge} 辺の ${markers.length} 個の吹き出しを配置中...`)

    // マーカーの位置に基づいてソート（線の交差を最小化）
    if (edge === "top" || edge === "bottom") {
      // 水平辺：左から右へソート
      markers.sort((a, b) => a.markerPosition.lng - b.markerPosition.lng)
    } else {
      // 垂直辺：上から下へソート
      markers.sort((a, b) => b.markerPosition.lat - a.markerPosition.lat)
    }

    // 各辺での配置を計算
    markers.forEach((marker, idx) => {
      let position: { lat: number; lng: number }

      if (edge === "top" || edge === "bottom") {
        // 水平辺での配置
        const availableWidth = edgeSpaces[edge].end - edgeSpaces[edge].start
        let targetLng: number

        if (markers.length === 1) {
          // 1つの場合は中央に配置
          targetLng = (edgeSpaces[edge].start + edgeSpaces[edge].end) / 2
        } else {
          // 複数の場合は等間隔で配置
          const spacing = availableWidth / (markers.length - 1)
          targetLng = edgeSpaces[edge].start + spacing * idx
        }

        // 境界内に制限
        targetLng = Math.max(edgeSpaces[edge].start, Math.min(edgeSpaces[edge].end, targetLng))
        position = { lat: edgeSpaces[edge].lat, lng: targetLng }

        console.log(`  ${edge}辺配置[${idx}]: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
      } else {
        // 垂直辺での配置
        const availableHeight = edgeSpaces[edge].end - edgeSpaces[edge].start
        let targetLat: number

        if (markers.length === 1) {
          // 1つの場合は中央に配置
          targetLat = (edgeSpaces[edge].start + edgeSpaces[edge].end) / 2
        } else {
          // 複数の場合は等間隔で配置
          const spacing = availableHeight / (markers.length - 1)
          targetLat = edgeSpaces[edge].start + spacing * idx
        }

        // 境界内に制限
        targetLat = Math.max(edgeSpaces[edge].start, Math.min(edgeSpaces[edge].end, targetLat))
        position = { lat: targetLat, lng: edgeSpaces[edge].lng }

        console.log(`  ${edge}辺配置[${idx}]: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
      }

      // 重なりチェック
      const newBounds = calculateInfoWindowBounds(position.lat, position.lng, map, marker.id)
      let hasOverlap = false

      for (const placedPos of placedPositions) {
        const placedBounds = calculateInfoWindowBounds(
          placedPos.position.lat,
          placedPos.position.lng,
          map,
          placedPos.id,
        )
        if (checkOverlap(newBounds, placedBounds)) {
          hasOverlap = true
          console.log(`⚠️ 重なり検出: ${marker.id} が ${placedPos.id} と重なります`)
          break
        }
      }

      // 重なりがある場合は位置を調整
      if (hasOverlap) {
        const existingBounds = placedPositions.map((pos) =>
          calculateInfoWindowBounds(pos.position.lat, pos.position.lng, map, pos.id),
        )
        const adjustedPosition = adjustPositionToAvoidOverlap(newBounds, existingBounds, map, 30)
        position = adjustedPosition
        console.log(`🔧 重なり回避調整: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
      }

      // 最終的な境界チェック
      const finalBounds = {
        north: position.lat + infoWindowHeightLat / 2,
        south: position.lat - infoWindowHeightLat / 2,
        east: position.lng + infoWindowWidthLng / 2,
        west: position.lng - infoWindowWidthLng / 2,
      }

      // 地図境界外チェック
      if (
        finalBounds.north > ne.lat() ||
        finalBounds.south < sw.lat() ||
        finalBounds.east > ne.lng() ||
        finalBounds.west < sw.lng()
      ) {
        console.warn(`⚠️ 境界外配置: ${marker.id}`)
        // 強制的に境界内に修正
        position.lat = Math.max(
          sw.lat() + infoWindowHeightLat / 2,
          Math.min(ne.lat() - infoWindowHeightLat / 2, position.lat),
        )
        position.lng = Math.max(
          sw.lng() + infoWindowWidthLng / 2,
          Math.min(ne.lng() - infoWindowWidthLng / 2, position.lng),
        )
        console.log(`🔧 境界内修正: ${marker.id} → (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`)
      }

      // 結果に追加
      result[marker.id] = position
      placedPositions.push({ id: marker.id, position, edge })
      lines.push({
        id: marker.id,
        markerPos: marker.markerPosition,
        infoWindowPos: position,
      })
    })

    console.log(`✅ ${edge} 辺の配置完了`)
  })

  // 最終的な線の交差数を計算
  let totalIntersections = 0
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (doLinesIntersect(lines[i].markerPos, lines[i].infoWindowPos, lines[j].markerPos, lines[j].infoWindowPos)) {
        totalIntersections++
        console.log(`🔀 線の交差: ${lines[i].id} ↔ ${lines[j].id}`)
      }
    }
  }

  /* ========= 追加: 残存重なりを強制シフトして解消 ========= */
  // ２次元配列から重なり数と詳細を算出するユーティリティ
  function computeOverlaps() {
    let overlaps = 0
    overlapDetails.length = 0
    for (let i = 0; i < placedPositions.length; i++) {
      for (let j = i + 1; j < placedPositions.length; j++) {
        const b1 = calculateInfoWindowBounds(
          placedPositions[i].position.lat,
          placedPositions[i].position.lng,
          map,
          placedPositions[i].id,
        )
        const b2 = calculateInfoWindowBounds(
          placedPositions[j].position.lat,
          placedPositions[j].position.lng,
          map,
          placedPositions[j].id,
        )
        const h = Math.max(0, Math.min(b1.east, b2.east) - Math.max(b1.west, b2.west))
        const v = Math.max(0, Math.min(b1.north, b2.north) - Math.max(b1.south, b2.south))
        if (h > 0 && v > 0) {
          overlaps++
          const area = h * v
          const p1 = (area / ((b1.east - b1.west) * (b1.north - b1.south))) * 100
          const p2 = (area / ((b2.east - b2.west) * (b2.north - b2.south))) * 100
          overlapDetails.push({
            id1: b1.id,
            id2: b2.id,
            horizontalOverlap: h,
            verticalOverlap: v,
            overlapArea: area,
            overlapPercentage1: p1,
            overlapPercentage2: p2,
          })
        }
      }
    }
    return overlaps
  }

  const MAX_SHIFT_LOOPS = 5
  let shiftLoop = 0
  const overlapDetails: Array<{
    id1: string
    id2: string
    horizontalOverlap: number
    verticalOverlap: number
    overlapArea: number
    overlapPercentage1: number
    overlapPercentage2: number
  }> = []
  let totalOverlaps = computeOverlaps() // ★初期重なり数を計算

  while (totalOverlaps > 0 && shiftLoop < MAX_SHIFT_LOOPS) {
    console.warn(`🔄 最終シフト round ${shiftLoop + 1}: 残り ${totalOverlaps} 件`)
    for (const { id2 } of overlapDetails) {
      const posObj = placedPositions.find((p) => p.id === id2)
      if (!posObj) continue

      // シフト方向: 辺が top/bottom → lng 方向、 left/right → lat 方向へ押し出す
      const stepLng = infoWindowWidthLng * 1.2
      const stepLat = infoWindowHeightLat * 1.2
      if (posObj.edge === "top" || posObj.edge === "bottom") {
        posObj.position.lng += stepLng
      } else {
        posObj.position.lat -= stepLat
      }
      result[id2] = { ...posObj.position }
    }

    /* --- 重なりを再計算 --- */
    totalOverlaps = computeOverlaps() // ★再計算
    shiftLoop++
  }
  /* ========= 追加ここまで ========= */
  /* ---------- 残存重なりをグローバルに再解消 ---------- */
  if (totalOverlaps > 0) {
    console.warn(`♻︎ 残存重なり ${totalOverlaps} 件を再解消ループで処理します`)
    const MAX_GLOBAL_FIX_ATTEMPTS = 3
    let fixAttempt = 0

    /**
     * overlapDetails は直前の computeOverlaps 呼び出しで更新済み
     * ここでは id2 側（＝後に配置された吹き出し）を優先的に動かす
     */
    while (totalOverlaps > 0 && fixAttempt < MAX_GLOBAL_FIX_ATTEMPTS) {
      overlapDetails.forEach(({ id2 }) => {
        const targetPosObj = placedPositions.find((p) => p.id === id2)
        if (!targetPosObj) return

        // 現在の境界
        const targetBounds = calculateInfoWindowBounds(targetPosObj.position.lat, targetPosObj.position.lng, map, id2)

        // 他吹き出しの境界
        const otherBounds = placedPositions
          .filter((p) => p.id !== id2)
          .map((p) => calculateInfoWindowBounds(p.position.lat, p.position.lng, map, p.id))

        // 空き位置を探索
        const adjusted = adjustPositionToAvoidOverlap(targetBounds, otherBounds, map, 30)
        targetPosObj.position = adjusted
        result[id2] = adjusted
      })

      // 再計算
      totalOverlaps = computeOverlaps()
      fixAttempt++
      if (totalOverlaps > 0) {
        console.warn(`⏩ 再解消ループ ${fixAttempt} 回目終了：残り ${totalOverlaps} 件`)
      }
    }

    if (totalOverlaps === 0) {
      console.log("✅ グローバル再解消ループで全重なりを解消しました")
    } else {
      console.warn("⚠️ 再解消ループでも重なりが残りました")
    }
  }
  /* ---------- 再解消ここまで ---------- */

  /* ---------- 最終境界クランプ ---------- */
  Object.entries(result).forEach(([id, pos]) => {
    let { lat, lng } = pos
    // 10px マージン分の度数
    const marginLng = edgeDistanceLng
    const marginLat = edgeDistanceLat

    // 緯度方向
    const minLat = sw.lat() + marginLat + infoWindowHeightLat / 2
    const maxLat = ne.lat() - marginLat - infoWindowHeightLat / 2
    lat = Math.min(Math.max(lat, minLat), maxLat)

    // 経度方向
    const minLng = sw.lng() + marginLng + infoWindowWidthLng / 2
    const maxLng = ne.lng() - marginLng - infoWindowWidthLng / 2
    lng = Math.min(Math.max(lng, minLng), maxLng)

    result[id] = { lat, lng }
  })
  /* ---------- クランプここまで ---------- */

  // 重なり統計の出力
  if (totalOverlaps > 0) {
    console.error(`❌ 重なり統計:`)
    console.error(`   総重なり数: ${totalOverlaps}個`)

    const avgOverlapRate =
      overlapDetails.length > 0
        ? overlapDetails.reduce((sum, d) => sum + Math.max(d.overlapPercentage1, d.overlapPercentage2), 0) /
          overlapDetails.length
        : 0

    console.error(
      `   最大重なり率: ${fmt(Math.max(...overlapDetails.map((d) => Math.max(d.overlapPercentage1, d.overlapPercentage2))), 2)}%`,
    )
    console.error(`   平均重なり率: ${fmt(avgOverlapRate, 2)}%`)

    // 重なりが多い吹き出しを特定
    const overlapCounts: Record<string, number> = {}
    overlapDetails.forEach((detail) => {
      overlapCounts[detail.id1] = (overlapCounts[detail.id1] || 0) + 1
      overlapCounts[detail.id2] = (overlapCounts[detail.id2] || 0) + 1
    })

    const mostOverlappingId = Object.entries(overlapCounts).reduce(
      (max, [id, count]) => (count > max.count ? { id, count } : max),
      { id: "", count: 0 },
    )

    if (mostOverlappingId.count > 0) {
      console.error(`   最も重なりの多い吹き出し: ${mostOverlappingId.id} (${mostOverlappingId.count}個と重なり)`)
    }
  }

  // 境界チェック
  let boundaryViolations = 0
  Object.entries(result).forEach(([id, position]) => {
    const bounds = {
      north: position.lat + infoWindowHeightLat / 2,
      south: position.lat - infoWindowHeightLat / 2,
      east: position.lng + infoWindowWidthLng / 2,
      west: position.lng - infoWindowWidthLng / 2,
    }

    const violations = []
    if (bounds.north > ne.lat()) violations.push(`上辺越境: ${((bounds.north - ne.lat()) / latPerPixel).toFixed(2)}px`)
    if (bounds.south < sw.lat()) violations.push(`下辺越境: ${((sw.lat() - bounds.south) / latPerPixel).toFixed(2)}px`)
    if (bounds.east > ne.lng()) violations.push(`右辺越境: ${((bounds.east - ne.lng()) / lngPerPixel).toFixed(2)}px`)
    if (bounds.west < sw.lng()) violations.push(`左辺越境: ${((sw.lng() - bounds.west) / lngPerPixel).toFixed(2)}px`)

    if (violations.length > 0) {
      boundaryViolations++
      console.error(`❌ 境界違反: ${id} - ${violations.join(", ")}`)
    }
  })

  console.log(`✅ 最近辺10px内側配置完了: ${Object.keys(result).length} 個の吹き出しを配置`)
  console.log(`📊 線の交差数: ${totalIntersections}個`)
  console.log(`📊 吹き出し重なり数(最終): ${totalOverlaps}個`)
  console.log(`📊 境界違反数: ${boundaryViolations}個`)

  if (totalIntersections === 0 && totalOverlaps === 0 && boundaryViolations === 0) {
    console.log(`🎉 完璧な配置が完了しました！線の交差なし、重なりなし、境界内配置`)
  } else {
    if (totalIntersections > 0) console.warn(`⚠️ ${totalIntersections}個の線の交差があります`)
    if (totalOverlaps > 0) console.warn(`⚠️ ${totalOverlaps}個の吹き出し重なりがあります`)
    if (boundaryViolations > 0) console.warn(`⚠️ ${boundaryViolations}個の境界違反があります`)
  }

  return result
}

// 重なり回避の詳細ログを出力する関数
export function logOverlapAvoidanceDetails(
  targetId: string,
  originalPosition: { lat: number; lng: number },
  adjustedPosition: { lat: number; lng: number },
  existingBounds: InfoWindowBounds[],
  map: google.maps.Map,
): void {
  console.log(`🔧 重なり回避詳細: ${targetId}`)
  console.log(`   元の位置: (${originalPosition.lat.toFixed(8)}, ${originalPosition.lng.toFixed(8)})`)
  console.log(`   調整後位置: (${adjustedPosition.lat.toFixed(8)}, ${adjustedPosition.lng.toFixed(8)})`)

  const originalBounds = calculateInfoWindowBounds(originalPosition.lat, originalPosition.lng, map, targetId)
  const adjustedBounds = calculateInfoWindowBounds(adjustedPosition.lat, adjustedPosition.lng, map, targetId)

  // 元の位置での重なりをチェック
  let originalOverlaps = 0
  existingBounds.forEach((existingBound) => {
    if (checkOverlap(originalBounds, existingBound)) {
      originalOverlaps++
    }
  })

  // 調整後の位置での重なりをチェック
  let adjustedOverlaps = 0
  existingBounds.forEach((existingBound) => {
    if (checkOverlap(adjustedBounds, existingBound)) {
      adjustedOverlaps++
    }
  })

  console.log(`   元の位置での重なり数: ${originalOverlaps}個`)
  console.log(`   調整後の重なり数: ${adjustedOverlaps}個`)
  console.log(
    `   重なり回避${adjustedOverlaps === 0 ? "成功" : "失敗"}: ${originalOverlaps - adjustedOverlaps}個の重なりを解消`,
  )
}

// 指定された位置を最も近い地図の辺に10ピクセル内側に調整する関数
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

  // 右上のボタン群の領域を取得
  const buttonAreaBounds = getButtonAreaBounds(map)

  console.log(`🎯 10px内側調整開始: 入力位置(${lat.toFixed(10)}, ${lng.toFixed(10)})`)
  console.log(
    `📐 地図境界: 上=${ne.lat().toFixed(10)}, 下=${sw.lat().toFixed(10)}, 右=${ne.lng().toFixed(10)}, 左=${sw.lng().toFixed(10)}`,
  )
  console.log(`📐 吹き出しサイズ: ${infoWindowWidth}x${infoWindowHeight}px`)
  console.log(`📐 10pxマージン: 経度=${marginLng.toFixed(12)}, 緯度=${marginLat.toFixed(12)}`)
  console.log(`📐 吹き出しサイズ(度): 幅=${infoWindowWidthLng.toFixed(12)}, 高さ=${infoWindowHeightLat.toFixed(12)}`)

  // 最も近い辺を判定
  const closestEdge = getClosestMapEdge(lat, lng, map)
  console.log(`🎯 調整対象辺: ${closestEdge}`)

  let adjustedLat = lat
  let adjustedLng = lng

  // 各辺に対して10px内側に配置するための中心位置を計算
  switch (closestEdge) {
    case "top":
      // 上辺から10px内側に吹き出しの上辺を配置
      // 吹き出しの中心位置 = 地図上辺 - 10px - 吹き出し高さの半分
      adjustedLat = ne.lat() - marginLat - infoWindowHeightLat / 2
      console.log(`🔝 上辺調整:`)
      console.log(`   地図上辺: ${ne.lat().toFixed(10)}`)
      console.log(`   10pxマージン: ${marginLat.toFixed(10)}`)
      console.log(`   吹き出し高さ半分: ${(infoWindowHeightLat / 2).toFixed(10)}`)
      console.log(
        `   計算式: ${ne.lat().toFixed(10)} - ${marginLat.toFixed(10)} - ${(infoWindowHeightLat / 2).toFixed(10)} = ${adjustedLat.toFixed(10)}`,
      )

      // 経度は地図内に収まるように調整（左右10px内側）、ボタン群を回避
      const topMinLng = sw.lng() + marginLng + infoWindowWidthLng / 2
      const topMaxLng = Math.min(ne.lng() - marginLng - infoWindowWidthLng / 2, buttonAreaBounds.west - marginLng)
      adjustedLng = Math.max(topMinLng, Math.min(topMaxLng, lng))
      console.log(`   経度範囲: ${topMinLng.toFixed(10)} ～ ${topMaxLng.toFixed(10)} (ボタン群回避)`)
      console.log(`   調整後中心経度: ${adjustedLng.toFixed(10)}`)
      break

    case "bottom":
      // 下辺から10px内側に吹き出しの下辺を配置
      // 吹き出しの中心位置 = 地図下辺 + 10px + 吹き出し高さの半分
      adjustedLat = sw.lat() + marginLat + infoWindowHeightLat / 2
      console.log(`🔽 下辺調整:`)
      console.log(`   地図下辺: ${sw.lat().toFixed(10)}`)
      console.log(`   10pxマージン: ${marginLat.toFixed(10)}`)
      console.log(`   吹き出し高さ半分: ${(infoWindowHeightLat / 2).toFixed(10)}`)
      console.log(
        `   計算式: ${sw.lat().toFixed(10)} + ${marginLat.toFixed(10)} + ${(infoWindowHeightLat / 2).toFixed(10)} = ${adjustedLat.toFixed(10)}`,
      )

      // 経度は地図内に収まるように調整（左右10px内側）
      const bottomMinLng = sw.lng() + marginLng + infoWindowWidthLng / 2
      const bottomMaxLng = ne.lng() - marginLng - infoWindowWidthLng / 2
      adjustedLng = Math.max(bottomMinLng, Math.min(bottomMaxLng, lng))
      console.log(`   経度範囲: ${bottomMinLng.toFixed(10)} ～ ${bottomMaxLng.toFixed(10)}`)
      console.log(`   調整後中心経度: ${adjustedLng.toFixed(10)}`)
      break

    case "right":
      // 右辺から10px内側に吹き出しの右辺を配置
      // 吹き出しの中心位置 = 地図右辺 - 10px - 吹き出し幅の半分
      adjustedLng = ne.lng() - marginLng - infoWindowWidthLng / 2
      console.log(`▶️ 右辺調整:`)
      console.log(`   地図右辺: ${ne.lng().toFixed(10)}`)
      console.log(`   10pxマージン: ${marginLng.toFixed(10)}`)
      console.log(`   吹き出し幅半分: ${(infoWindowWidthLng / 2).toFixed(10)}`)
      console.log(
        `   計算式: ${ne.lng().toFixed(10)} - ${marginLng.toFixed(10)} - ${(infoWindowWidthLng / 2).toFixed(10)} = ${adjustedLng.toFixed(10)}`,
      )

      // 緯度は地図内に収まるように調整（上下10px内側）、ボタン群を回避
      const rightMinLat = sw.lat() + marginLat + infoWindowHeightLat / 2
      const rightMaxLat = Math.min(ne.lat() - marginLat - infoWindowHeightLat / 2, buttonAreaBounds.south - marginLat)
      adjustedLat = Math.max(rightMinLat, Math.min(rightMaxLat, lat))
      console.log(`   緯度範囲: ${rightMinLat.toFixed(10)} ～ ${rightMaxLat.toFixed(10)} (ボタン群回避)`)
      console.log(`   調整後中心緯度: ${adjustedLat.toFixed(10)}`)
      break

    case "left":
      // 左辺から10px内側に吹き出しの左辺を配置
      // 吹き出しの中心位置 = 地図左辺 + 10px + 吹き出し幅の半分
      adjustedLng = sw.lng() + marginLng + infoWindowWidthLng / 2
      console.log(`◀️ 左辺調整:`)
      console.log(`   地図左辺: ${sw.lng().toFixed(10)}`)
      console.log(`   10pxマージン: ${marginLng.toFixed(10)}`)
      console.log(`   吹き出し幅半分: ${(infoWindowWidthLng / 2).toFixed(10)}`)
      console.log(
        `   計算式: ${sw.lng().toFixed(10)} + ${marginLng.toFixed(10)} + ${(infoWindowWidthLng / 2).toFixed(10)} = ${adjustedLng.toFixed(10)}`,
      )

      // 緯度は地図内に収まるように調整（上下10px内側）
      const leftMinLat = sw.lat() + marginLat + infoWindowHeightLat / 2
      const leftMaxLat = ne.lat() - marginLat - infoWindowHeightLat / 2
      adjustedLat = Math.max(leftMinLat, Math.min(leftMaxLat, lat))
      console.log(`   緯度範囲: ${leftMinLat.toFixed(10)} ～ ${leftMaxLat.toFixed(10)}`)
      console.log(`   調整後中心緯度: ${adjustedLat.toFixed(10)}`)
      break
  }

  const finalPosition = { lat: adjustedLat, lng: adjustedLng }

  // ボタン群との重なりをチェック
  const finalBounds = calculateInfoWindowBounds(finalPosition.lat, finalPosition.lng, map, "temp")
  const hasButtonOverlap = checkButtonAreaOverlap(finalBounds, buttonAreaBounds)

  if (hasButtonOverlap) {
    console.warn(`⚠️ 調整後もボタン群と重なりがあります`)
    // ボタン群を避けるための追加調整
    switch (closestEdge) {
      case "top":
        // 上辺の場合は左に移動
        adjustedLng = Math.max(
          sw.lng() + marginLng + infoWindowWidthLng / 2,
          buttonAreaBounds.west - marginLng - infoWindowWidthLng / 2,
        )
        console.log(`   ボタン群回避のため左に移動: ${adjustedLng.toFixed(10)}`)
        break
      case "right":
        // 右辺の場合は下に移動
        adjustedLat = Math.max(
          sw.lat() + marginLat + infoWindowHeightLat / 2,
          buttonAreaBounds.south - marginLat - infoWindowHeightLat / 2,
        )
        console.log(`   ボタン群回避のため下に移動: ${adjustedLat.toFixed(10)}`)
        break
    }
  }

  // 調整結果の検証
  console.log(`✅ 調整完了: (${finalPosition.lat.toFixed(10)}, ${finalPosition.lng.toFixed(10)})`)

  // 最終的な吹き出し境界を計算
  const finalBoundsCheck = {
    north: finalPosition.lat + infoWindowHeightLat / 2,
    south: finalPosition.lat - infoWindowHeightLat / 2,
    east: finalPosition.lng + infoWindowWidthLng / 2,
    west: finalPosition.lng - infoWindowWidthLng / 2,
  }

  console.log(`📏 調整後の吹き出し境界:`)
  console.log(`  上辺: ${finalBoundsCheck.north.toFixed(10)}`)
  console.log(`  下辺: ${finalBoundsCheck.south.toFixed(10)}`)
  console.log(`  右辺: ${finalBoundsCheck.east.toFixed(10)}`)
  console.log(`  左辺: ${finalBoundsCheck.west.toFixed(10)}`)

  // 地図境界からの実際の距離を計算（ピクセル単位）
  const actualDistances = {
    top: (ne.lat() - finalBoundsCheck.north) / latPerPixel,
    bottom: (finalBoundsCheck.south - sw.lat()) / latPerPixel,
    right: (ne.lng() - finalBoundsCheck.east) / lngPerPixel,
    left: (finalBoundsCheck.west - sw.lng()) / lngPerPixel,
  }

  console.log(`📏 地図境界からの実際の距離:`)
  console.log(
    `  上: ${actualDistances.top.toFixed(2)}px (目標: 10px) ${Math.abs(actualDistances.top - 10) < 1 ? "✅" : "❌"}`,
  )
  console.log(
    `  下: ${actualDistances.bottom.toFixed(2)}px (目標: 10px) ${Math.abs(actualDistances.bottom - 10) < 1 ? "✅" : "❌"}`,
  )
  console.log(
    `  右: ${actualDistances.right.toFixed(2)}px (目標: 10px) ${Math.abs(actualDistances.right - 10) < 1 ? "✅" : "❌"}`,
  )
  console.log(
    `  左: ${actualDistances.left.toFixed(2)}px (目標: 10px) ${Math.abs(actualDistances.left - 10) < 1 ? "✅" : "❌"}`,
  )

  // 境界外チェック
  const isOutOfBounds = {
    top: finalBoundsCheck.north > ne.lat(),
    bottom: finalBoundsCheck.south < sw.lat(),
    right: finalBoundsCheck.east > ne.lng(),
    left: finalBoundsCheck.west < sw.lng(),
  }

  let hasError = false
  if (isOutOfBounds.top || isOutOfBounds.bottom || isOutOfBounds.right || isOutOfBounds.left) {
    console.error(`❌ 境界外エラー検出:`)
    if (isOutOfBounds.top) {
      console.error(
        `   上辺が地図外: ${finalBoundsCheck.north.toFixed(10)} > ${ne.lat().toFixed(10)} (差分: ${(finalBoundsCheck.north - ne.lat()).toFixed(10)})`,
      )
      hasError = true
    }
    if (isOutOfBounds.bottom) {
      console.error(
        `   下辺が地図外: ${finalBoundsCheck.south.toFixed(10)} < ${sw.lat().toFixed(10)} (差分: ${(sw.lat() - finalBoundsCheck.south).toFixed(10)})`,
      )
      hasError = true
    }
    if (isOutOfBounds.right) {
      console.error(
        `   右辺が地図外: ${finalBoundsCheck.east.toFixed(10)} > ${ne.lng().toFixed(10)} (差分: ${(finalBoundsCheck.east - ne.lng()).toFixed(10)})`,
      )
      hasError = true
    }
    if (isOutOfBounds.left) {
      console.error(
        `   左辺が地図外: ${finalBoundsCheck.west.toFixed(10)} < ${sw.lng().toFixed(10)} (差分: ${(sw.lng() - finalBoundsCheck.west).toFixed(10)})`,
      )
      hasError = true
    }
  }

  if (!hasError) {
    console.log(`✅ 境界チェック: すべての辺が地図内に正しく配置されています`)
  }

  // 調整対象辺の距離が正確に10pxかチェック
  const targetEdgeDistance = actualDistances[closestEdge as keyof typeof actualDistances]
  if (Math.abs(targetEdgeDistance - 10) > 1) {
    console.warn(`⚠️ ${closestEdge}辺の距離が目標から外れています: ${targetEdgeDistance.toFixed(2)}px (目標: 10px)`)
  } else {
    console.log(`✅ ${closestEdge}辺の距離が正確です: ${targetEdgeDistance.toFixed(2)}px`)
  }

  return finalPosition
}
