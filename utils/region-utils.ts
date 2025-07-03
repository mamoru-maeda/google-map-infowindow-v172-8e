import type { google } from "google-maps"
import type { MarkerData } from "@/types/map-types"
import type { InfoWindowState } from "@/types/map-types"

// 地図の辺を表す型
type MapEdge = "north" | "south" | "east" | "west"

// 数値フォーマッタ（非有限値も安全に文字列化）
function fmt(num: number, digits = 8): string {
  return Number.isFinite(num) ? num.toFixed(digits) : "∞"
}

export interface RegionBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface RegionInfo {
  center: { lat: number; lng: number }
  bounds: RegionBounds
  markers: MarkerData[]
}

// 吹き出しの境界ボックス
interface InfoWindowBounds {
  id: string
  north: number
  south: number
  east: number
  west: number
  centerLat: number
  centerLng: number
}

// 吹き出しのサイズ（ピクセル単位）
const INFOWINDOW_WIDTH = 280
const INFOWINDOW_HEIGHT = 360

// 地図の境界からの最小距離（ピクセル単位）- 10pxに変更
const EDGE_MARGIN = 10

// 吹き出し間の最小距離（ピクセル単位）
const MIN_DISTANCE_BETWEEN_INFOWINDOWS = 30

/**
 * 地図の境界を取得する
 */
function getMapBounds(map: any) {
  const bounds = map.getBounds()
  if (!bounds) return null

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()

  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng(),
  }
}

/**
 * ピクセル座標を緯度経度に変換する
 */
function pixelToLatLng(map: any, x: number, y: number) {
  const projection = map.getProjection()
  const bounds = map.getBounds()
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()

  const mapDiv = map.getDiv()
  const mapWidth = mapDiv.offsetWidth
  const mapHeight = mapDiv.offsetHeight

  const lng = sw.lng() + ((ne.lng() - sw.lng()) * x) / mapWidth
  const lat = ne.lat() - ((ne.lat() - sw.lat()) * y) / mapHeight

  return { lat, lng }
}

/**
 * 緯度経度をピクセル座標に変換する
 */
function latLngToPixel(map: any, lat: number, lng: number) {
  const bounds = map.getBounds()
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()

  const mapDiv = map.getDiv()
  const mapWidth = mapDiv.offsetWidth
  const mapHeight = mapDiv.offsetHeight

  const x = ((lng - sw.lng()) / (ne.lng() - sw.lng())) * mapWidth
  const y = ((ne.lat() - lat) / (ne.lat() - sw.lat())) * mapHeight

  return { x, y }
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
    north: 35.3,
    south: 34.5,
    east: 139.5,
    west: 138.7,
  },
  {
    north: 35.3,
    south: 34.5,
    east: 138.7,
    west: 137.8,
  },
  {
    north: 35.1,
    south: 34.5,
    east: 137.8,
    west: 137.0,
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

/**
 * 吹き出しの境界ボックスを計算する
 */
export function calculateInfoWindowBounds(lat: number, lng: number, map: any, id: string): InfoWindowBounds {
  const pixel = latLngToPixel(map, lat, lng)

  // 吹き出しの左上角の位置を計算（中心から半分ずつオフセット）
  const leftTopX = pixel.x - INFOWINDOW_WIDTH / 2
  const leftTopY = pixel.y - INFOWINDOW_HEIGHT / 2

  // 吹き出しの右下角の位置を計算
  const rightBottomX = leftTopX + INFOWINDOW_WIDTH
  const rightBottomY = leftTopY + INFOWINDOW_HEIGHT

  // ピクセル座標を緯度経度に変換
  const leftTop = pixelToLatLng(map, leftTopX, leftTopY)
  const rightBottom = pixelToLatLng(map, rightBottomX, rightBottomY)

  return {
    id,
    north: leftTop.lat,
    south: rightBottom.lat,
    east: rightBottom.lng,
    west: leftTop.lng,
    centerLat: lat,
    centerLng: lng,
  }
}

/**
 * 2つの境界ボックスが重なっているかチェックする
 */
export function checkOverlap(bounds1: InfoWindowBounds, bounds2: InfoWindowBounds): boolean {
  const horizontalOverlap = Math.max(0, Math.min(bounds1.east, bounds2.east) - Math.max(bounds1.west, bounds2.west))
  const verticalOverlap = Math.max(0, Math.min(bounds1.north, bounds2.north) - Math.max(bounds1.south, bounds2.south))

  return horizontalOverlap > 0 && verticalOverlap > 0
}

// 線の交差判定を行う関数（改良版）
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

// 線の交差数を計算する関数
export function calculateLineCrossings(lines: LineInfo[]): number {
  let crossings = 0
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (doLinesIntersect(lines[i].markerPos, lines[i].infoWindowPos, lines[j].markerPos, lines[j].infoWindowPos)) {
        crossings++
      }
    }
  }
  return crossings
}

/**
 * 最も近い地図の辺を取得する
 */
export function getClosestMapEdge(lat: number, lng: number, map: any): MapEdge {
  const mapBounds = getMapBounds(map)
  if (!mapBounds) return "north"

  const distanceToNorth = Math.abs(lat - mapBounds.north)
  const distanceToSouth = Math.abs(lat - mapBounds.south)
  const distanceToEast = Math.abs(lng - mapBounds.east)
  const distanceToWest = Math.abs(lng - mapBounds.west)

  const minDistance = Math.min(distanceToNorth, distanceToSouth, distanceToEast, distanceToWest)

  if (minDistance === distanceToNorth) return "north"
  if (minDistance === distanceToSouth) return "south"
  if (minDistance === distanceToEast) return "east"
  return "west"
}

/**
 * 最も近い辺に10ピクセル内側に調整する
 */
export function adjustToClosestEdge(lat: number, lng: number, map: any) {
  const closestEdge = getClosestMapEdge(lat, lng, map)
  const mapBounds = getMapBounds(map)
  if (!mapBounds) return { lat, lng }

  const mapDiv = map.getDiv()
  const mapWidth = mapDiv.offsetWidth
  const mapHeight = mapDiv.offsetHeight

  // 10ピクセルを緯度経度に変換
  const pixelToLatRatio = (mapBounds.north - mapBounds.south) / mapHeight
  const pixelToLngRatio = (mapBounds.east - mapBounds.west) / mapWidth
  const latOffset = EDGE_MARGIN * pixelToLatRatio
  const lngOffset = EDGE_MARGIN * pixelToLngRatio

  let adjustedLat = lat
  let adjustedLng = lng

  switch (closestEdge) {
    case "north":
      adjustedLat = mapBounds.north - latOffset - (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio
      break
    case "south":
      adjustedLat = mapBounds.south + latOffset + (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio
      break
    case "east":
      adjustedLng = mapBounds.east - lngOffset - (INFOWINDOW_WIDTH / 2) * pixelToLngRatio
      break
    case "west":
      adjustedLng = mapBounds.west + lngOffset + (INFOWINDOW_WIDTH / 2) * pixelToLngRatio
      break
  }

  return { lat: adjustedLat, lng: adjustedLng }
}

/**
 * 重なりを回避する位置を計算する
 */
export function adjustPositionToAvoidOverlap(
  targetBounds: InfoWindowBounds,
  existingBounds: InfoWindowBounds[],
  map: any,
  minDistance: number = MIN_DISTANCE_BETWEEN_INFOWINDOWS,
) {
  const mapBounds = getMapBounds(map)
  if (!mapBounds) return { lat: targetBounds.centerLat, lng: targetBounds.centerLng }

  const mapDiv = map.getDiv()
  const mapWidth = mapDiv.offsetWidth
  const mapHeight = mapDiv.offsetHeight

  // ピクセル単位での最小距離を緯度経度に変換
  const pixelToLatRatio = (mapBounds.north - mapBounds.south) / mapHeight
  const pixelToLngRatio = (mapBounds.east - mapBounds.west) / mapWidth
  const latDistance = minDistance * pixelToLatRatio
  const lngDistance = minDistance * pixelToLngRatio

  let bestPosition = { lat: targetBounds.centerLat, lng: targetBounds.centerLng }
  let minOverlapArea = Number.MAX_VALUE

  // 複数の候補位置を試す
  const candidates = [
    // 元の位置
    { lat: targetBounds.centerLat, lng: targetBounds.centerLng },
    // 上下左右に移動
    { lat: targetBounds.centerLat + latDistance, lng: targetBounds.centerLng },
    { lat: targetBounds.centerLat - latDistance, lng: targetBounds.centerLng },
    { lat: targetBounds.centerLat, lng: targetBounds.centerLng + lngDistance },
    { lat: targetBounds.centerLat, lng: targetBounds.centerLng - lngDistance },
    // 斜め方向に移動
    { lat: targetBounds.centerLat + latDistance, lng: targetBounds.centerLng + lngDistance },
    { lat: targetBounds.centerLat + latDistance, lng: targetBounds.centerLng - lngDistance },
    { lat: targetBounds.centerLat - latDistance, lng: targetBounds.centerLng + lngDistance },
    { lat: targetBounds.centerLat - latDistance, lng: targetBounds.centerLng - lngDistance },
  ]

  for (const candidate of candidates) {
    // 地図の境界内かチェック
    if (
      candidate.lat < mapBounds.south ||
      candidate.lat > mapBounds.north ||
      candidate.lng < mapBounds.west ||
      candidate.lng > mapBounds.east
    ) {
      continue
    }

    const candidateBounds = calculateInfoWindowBounds(candidate.lat, candidate.lng, map, targetBounds.id)
    let totalOverlapArea = 0

    for (const existingBound of existingBounds) {
      if (checkOverlap(candidateBounds, existingBound)) {
        const horizontalOverlap = Math.max(
          0,
          Math.min(candidateBounds.east, existingBound.east) - Math.max(candidateBounds.west, existingBound.west),
        )
        const verticalOverlap = Math.max(
          0,
          Math.min(candidateBounds.north, existingBound.north) - Math.max(candidateBounds.south, existingBound.south),
        )
        totalOverlapArea += horizontalOverlap * verticalOverlap
      }
    }

    if (totalOverlapArea < minOverlapArea) {
      minOverlapArea = totalOverlapArea
      bestPosition = candidate
    }

    // 重なりがない位置が見つかったら即座に返す
    if (totalOverlapArea === 0) {
      break
    }
  }

  return bestPosition
}

/**
 * マーカーの位置に基づいて最適な辺を決定する（線の交差を最小化）
 */
function determineOptimalEdge(
  markerLat: number,
  markerLng: number,
  mapBounds: any,
  mapCenter: { lat: number; lng: number },
  existingLines: LineInfo[],
): MapEdge {
  // 各辺への距離を計算
  const distanceToNorth = Math.abs(markerLat - mapBounds.north)
  const distanceToSouth = Math.abs(markerLat - mapBounds.south)
  const distanceToEast = Math.abs(markerLng - mapBounds.east)
  const distanceToWest = Math.abs(markerLng - mapBounds.west)

  // 基本的な辺の候補を距離順にソート
  const edgeCandidates: Array<{ edge: MapEdge; distance: number }> = [
    { edge: "north", distance: distanceToNorth },
    { edge: "south", distance: distanceToSouth },
    { edge: "east", distance: distanceToEast },
    { edge: "west", distance: distanceToWest },
  ].sort((a, b) => a.distance - b.distance)

  // 各辺候補について線の交差数をチェック
  for (const candidate of edgeCandidates) {
    // 仮の吹き出し位置を計算
    let testInfoWindowLat: number
    let testInfoWindowLng: number

    switch (candidate.edge) {
      case "north":
        testInfoWindowLat = mapBounds.north - 0.01 // 仮の位置
        testInfoWindowLng = markerLng
        break
      case "south":
        testInfoWindowLat = mapBounds.south + 0.01
        testInfoWindowLng = markerLng
        break
      case "east":
        testInfoWindowLat = markerLat
        testInfoWindowLng = mapBounds.east - 0.01
        break
      case "west":
        testInfoWindowLat = markerLat
        testInfoWindowLng = mapBounds.west + 0.01
        break
    }

    // この配置での線の交差数をチェック
    const testLine: LineInfo = {
      id: "test",
      markerPos: { lat: markerLat, lng: markerLng },
      infoWindowPos: { lat: testInfoWindowLat, lng: testInfoWindowLng },
    }

    const intersections = checkLineIntersections(testLine.markerPos, testLine.infoWindowPos, existingLines)

    // 交差がない、または最小の場合はこの辺を選択
    if (!intersections.hasIntersection) {
      console.log(`📍 最適辺選択: ${candidate.edge} (交差なし)`)
      return candidate.edge
    }
  }

  // すべての辺で交差がある場合は、最も近い辺を選択
  console.log(`📍 最適辺選択: ${edgeCandidates[0].edge} (最短距離)`)
  return edgeCandidates[0].edge
}

/**
 * 辺配置用の位置を計算する（線の交差を最小化する強化版）
 */
export function getEdgeAlignedPositions(
  activeInfoWindows: Record<string, InfoWindowState>,
  map: any,
): Record<string, { lat: number; lng: number }> {
  console.log("🔧 線の交差を最小化する辺配置位置計算を開始します")

  const mapBounds = getMapBounds(map)
  if (!mapBounds) {
    console.error("❌ 地図の境界を取得できません")
    return {}
  }

  const mapDiv = map.getDiv()
  const mapWidth = mapDiv.offsetWidth
  const mapHeight = mapDiv.offsetHeight

  // ピクセル単位での計算用の変換比率
  const pixelToLatRatio = (mapBounds.north - mapBounds.south) / mapHeight
  const pixelToLngRatio = (mapBounds.east - mapBounds.west) / mapWidth

  // 地図の中心座標を計算
  const mapCenter = {
    lat: (mapBounds.north + mapBounds.south) / 2,
    lng: (mapBounds.east + mapBounds.west) / 2,
  }

  console.log(`📏 地図サイズ: ${mapWidth}×${mapHeight}px`)
  console.log(`📏 地図中心: (${mapCenter.lat.toFixed(6)}, ${mapCenter.lng.toFixed(6)})`)

  const infoWindowEntries = Object.entries(activeInfoWindows)
  const positions: Record<string, { lat: number; lng: number }> = {}
  const processedLines: LineInfo[] = []

  console.log(`📍 処理対象: ${infoWindowEntries.length}個の吹き出し`)

  // 各マーカーをマーカー位置に基づいて最適な辺に配置
  const edgeGroups: Record<
    MapEdge,
    Array<{ markerId: string; infoWindow: InfoWindowState; markerPos: { lat: number; lng: number } }>
  > = {
    north: [],
    south: [],
    east: [],
    west: [],
  }

  // 各マーカーの最適な辺を決定（線の交差を考慮）
  infoWindowEntries.forEach(([markerId, infoWindow]) => {
    const markerLat = infoWindow.position.lat
    const markerLng = infoWindow.position.lng

    // 線の交差を考慮して最適な辺を決定
    const optimalEdge = determineOptimalEdge(markerLat, markerLng, mapBounds, mapCenter, processedLines)

    edgeGroups[optimalEdge].push({
      markerId,
      infoWindow,
      markerPos: { lat: markerLat, lng: markerLng },
    })

    console.log(
      `📍 ${markerId}: マーカー位置(${markerLat.toFixed(6)}, ${markerLng.toFixed(6)}) → ${optimalEdge}辺に配置予定`,
    )
  })

  // 各辺のグループ内でマーカーの位置に基づいてソート
  Object.keys(edgeGroups).forEach((edge) => {
    const edgeKey = edge as MapEdge
    if (edgeKey === "north" || edgeKey === "south") {
      // 上下の辺では経度順にソート
      edgeGroups[edgeKey].sort((a, b) => a.markerPos.lng - b.markerPos.lng)
    } else {
      // 左右の辺では緯度順にソート
      edgeGroups[edgeKey].sort((a, b) => b.markerPos.lat - a.markerPos.lat) // 北から南へ
    }
    console.log(`📊 ${edge}辺: ${edgeGroups[edgeKey].length}個の吹き出し`)
  })

  // 各辺に配置（10px内側に配置）
  Object.entries(edgeGroups).forEach(([edge, items]) => {
    if (items.length === 0) return

    const edgeKey = edge as MapEdge

    items.forEach((item, index) => {
      let targetLat: number
      let targetLng: number

      const totalItemsOnEdge = items.length
      const positionRatio = totalItemsOnEdge === 1 ? 0.5 : index / (totalItemsOnEdge - 1)

      switch (edgeKey) {
        case "north":
          // 上辺から10px内側に配置
          targetLat = mapBounds.north - EDGE_MARGIN * pixelToLatRatio - (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio
          if (totalItemsOnEdge === 1) {
            // 1個の場合はマーカーの経度に合わせる
            targetLng = item.markerPos.lng
          } else {
            // 複数の場合はマーカーの経度分布に基づいて配置
            const startLng = mapBounds.west + (INFOWINDOW_WIDTH / 2) * pixelToLngRatio + EDGE_MARGIN * pixelToLngRatio
            const endLng = mapBounds.east - (INFOWINDOW_WIDTH / 2) * pixelToLngRatio - EDGE_MARGIN * pixelToLngRatio
            targetLng = startLng + (endLng - startLng) * positionRatio
          }
          break

        case "south":
          // 下辺から10px内側に配置
          targetLat = mapBounds.south + EDGE_MARGIN * pixelToLatRatio + (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio
          if (totalItemsOnEdge === 1) {
            targetLng = item.markerPos.lng
          } else {
            const startLng = mapBounds.west + (INFOWINDOW_WIDTH / 2) * pixelToLngRatio + EDGE_MARGIN * pixelToLngRatio
            const endLng = mapBounds.east - (INFOWINDOW_WIDTH / 2) * pixelToLngRatio - EDGE_MARGIN * pixelToLngRatio
            targetLng = startLng + (endLng - startLng) * positionRatio
          }
          break

        case "east":
          // 右辺から10px内側に配置
          targetLng = mapBounds.east - EDGE_MARGIN * pixelToLngRatio - (INFOWINDOW_WIDTH / 2) * pixelToLngRatio
          if (totalItemsOnEdge === 1) {
            targetLat = item.markerPos.lat
          } else {
            const startLat = mapBounds.south + (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio + EDGE_MARGIN * pixelToLatRatio
            const endLat = mapBounds.north - (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio - EDGE_MARGIN * pixelToLatRatio
            targetLat = startLat + (endLat - startLat) * positionRatio
          }
          break

        case "west":
          // 左辺から10px内側に配置
          targetLng = mapBounds.west + EDGE_MARGIN * pixelToLngRatio + (INFOWINDOW_WIDTH / 2) * pixelToLngRatio
          if (totalItemsOnEdge === 1) {
            targetLat = item.markerPos.lat
          } else {
            const startLat = mapBounds.south + (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio + EDGE_MARGIN * pixelToLatRatio
            const endLat = mapBounds.north - (INFOWINDOW_HEIGHT / 2) * pixelToLatRatio - EDGE_MARGIN * pixelToLatRatio
            targetLat = startLat + (endLat - startLat) * positionRatio
          }
          break
      }

      positions[item.markerId] = { lat: targetLat, lng: targetLng }

      // 処理済みの線として記録
      processedLines.push({
        id: item.markerId,
        markerPos: item.markerPos,
        infoWindowPos: { lat: targetLat, lng: targetLng },
      })

      console.log(
        `✅ ${item.markerId} を${edgeKey}辺の${index + 1}/${totalItemsOnEdge}番目に配置: (${targetLat.toFixed(6)}, ${targetLng.toFixed(6)})`,
      )
    })
  })

  // 最終的な線の交差数を計算
  const finalCrossings = calculateLineCrossings(processedLines)
  console.log(`📊 最終的な線の交差数: ${finalCrossings}個`)

  console.log("🎉 線の交差を最小化する辺配置が完了しました")
  return positions
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

// 地域の中心を計算する関数
export function calculateRegionCenter(markers: MarkerData[]): { lat: number; lng: number } {
  if (markers.length === 0) {
    return { lat: 35.6762, lng: 139.6503 } // 東京駅をデフォルトとする
  }

  const totalLat = markers.reduce((sum, marker) => sum + marker.position.lat, 0)
  const totalLng = markers.reduce((sum, marker) => sum + marker.position.lng, 0)

  return {
    lat: totalLat / markers.length,
    lng: totalLng / markers.length,
  }
}

// 地域の境界を計算する関数
export function calculateRegionBounds(markers: MarkerData[]): RegionBounds {
  if (markers.length === 0) {
    return {
      north: 35.7,
      south: 35.65,
      east: 139.7,
      west: 139.6,
    }
  }

  const lats = markers.map((m) => m.position.lat)
  const lngs = markers.map((m) => m.position.lng)

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  }
}

// 地域内のマーカーを整理する関数
export function organizeMarkersInRegion(markers: MarkerData[]): RegionInfo {
  const center = calculateRegionCenter(markers)
  const bounds = calculateRegionBounds(markers)

  return {
    center,
    bounds,
    markers,
  }
}

// 地図の中心からマーカーを左右に配置する関数
export function arrangeMarkersAroundCenter(
  markers: MarkerData[],
  mapBounds: RegionBounds,
): Array<{ marker: MarkerData; side: "left" | "right" }> {
  if (markers.length === 0) return []

  const center = calculateRegionCenter(markers)
  const mapCenter = {
    lat: (mapBounds.north + mapBounds.south) / 2,
    lng: (mapBounds.east + mapBounds.west) / 2,
  }

  console.log("Map center:", mapCenter)
  console.log("Markers center:", center)

  // マーカーを地図の中心からの相対位置で分類
  const arrangements = markers.map((marker) => {
    const isLeftSide = marker.position.lng < mapCenter.lng
    console.log(
      `Marker ${marker.id} at lng ${marker.position.lng}, map center lng ${mapCenter.lng}, isLeftSide: ${isLeftSide}`,
    )

    return {
      marker,
      side: isLeftSide ? "left" : "right", // 左側のマーカーは左辺に、右側のマーカーは右辺に配置
    }
  })

  console.log("Final arrangements:", arrangements)
  return arrangements
}

// 地域の統計情報を取得する関数
export function getRegionStats(region: RegionInfo) {
  const { markers, bounds } = region

  const width = bounds.east - bounds.west
  const height = bounds.north - bounds.south
  const area = width * height

  return {
    markerCount: markers.length,
    width: width * 111000, // 概算でメートルに変換
    height: height * 111000,
    area: area * 111000 * 111000, // 概算で平方メートルに変換
    density: markers.length / area,
  }
}
