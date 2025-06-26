"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import SimpleMarker from "./simple-marker"
import CustomOverlay from "./custom-overlay"
import InfoCard from "./info-card"
import CategoryFilter from "./category-filter"
import AutoArrangeButton from "./auto-arrange-button"
import CloseAllButton from "./close-all-button"
import OrganizeButton from "./organize-button"
import CameraButton from "./camera-button"
import HistoryPanel from "./history-panel"
import { localStorageUtils } from "@/lib/utils"
import type { MarkerData, InfoWindowState, Category } from "@/types/map-types"
import type { MapSnapshot } from "@/types/snapshot-types"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import { useSnapshots } from "@/hooks/use-snapshots"
import { getEdgeAlignedPositions, getClosestMapEdge } from "@/utils/region-utils"
import { getCurrentDefaultSize } from "@/hooks/use-infowindow-settings"

interface MapContainerProps {
  center: {
    lat: number
    lng: number
  }
  zoom: number
  markers: MarkerData[]
  categories: Category[]
}

const STORAGE_KEY = "google-map-infowindows-v14"
const CATEGORY_FILTER_KEY = "google-map-categories-v14"

// グローバルに google 変数を宣言
declare global {
  interface Window {
    google: any
    initGoogleMap: () => void
  }
}

const MapContainer: React.FC<MapContainerProps> = ({ center, zoom, markers, categories }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [activeInfoWindows, setActiveInfoWindows] = useState<Record<string, InfoWindowState>>({})
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isMapDragging, setIsMapDragging] = useState(false)
  const [isDraggingAny, setIsDraggingAny] = useState(isMapDragging)
  const [currentDraggingId, setCurrentDraggingId] = useState<string | null>(null)
  const [initAttempts, setInitAttempts] = useState(0)

  // スナップショット管理フックを使用
  const { snapshots, saveSnapshot, deleteSnapshot, updateSnapshotTitle, clearAllSnapshots } = useSnapshots()

  // APIキーを取得する関数（サーバーサイドAPIエンドポイントのみ使用）
  const fetchApiKey = useCallback(async (retryCount = 0): Promise<string | null> => {
    const maxRetries = 3

    try {
      console.log(`APIキー取得試行 ${retryCount + 1}/${maxRetries + 1}`)

      // サーバーサイドAPIエンドポイントからAPIキーを取得
      console.log("APIエンドポイントからAPIキーを取得します")
      const response = await fetch("/api/maps-key", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`APIキー取得エラー (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`APIエンドポイントエラー: ${data.error}`)
      }

      if (!data.apiKey || data.apiKey.trim() === "") {
        throw new Error("APIキーが返されませんでした")
      }

      console.log(`APIキーの取得に成功しました (長さ: ${data.apiKey.length})`)
      return data.apiKey
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`APIキーの取得に失敗しました (試行 ${retryCount + 1}): ${errorMessage}`)

      // リトライ
      if (retryCount < maxRetries) {
        console.log(`${1000 * (retryCount + 1)}ms後にリトライします...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
        return fetchApiKey(retryCount + 1)
      }

      throw new Error(`APIキーの取得に失敗しました (${maxRetries + 1}回試行): ${errorMessage}`)
    }
  }, [])

  // APIキーを設定
  useEffect(() => {
    let isMounted = true

    const initApiKey = async () => {
      try {
        setIsLoadingApiKey(true)
        setApiKeyError(null)

        const key = await fetchApiKey()

        if (isMounted) {
          if (key) {
            setApiKey(key)
            console.log("APIキーが正常に設定されました")
          } else {
            throw new Error("APIキーの取得に失敗しました")
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`APIキーの初期化に失敗しました: ${errorMessage}`)

        if (isMounted) {
          setApiKeyError(errorMessage)
          setLoadError(`APIキーの取得に失敗しました: ${errorMessage}`)
        }
      } finally {
        if (isMounted) {
          setIsLoadingApiKey(false)
        }
      }
    }

    initApiKey()

    return () => {
      isMounted = false
    }
  }, [fetchApiKey])

  // Google Maps APIをロード（APIキーが取得できた場合のみ）
  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGoogleMaps(apiKey)

  // Google Maps APIのエラーを処理
  useEffect(() => {
    if (googleMapsError) {
      console.error("Google Maps APIエラー:", googleMapsError)
      setLoadError(googleMapsError)
    }
  }, [googleMapsError])

  // ローカルストレージから吹き出し状態を読み込む
  const loadInfoWindowStates = useCallback(() => {
    return localStorageUtils.loadData(STORAGE_KEY, {})
  }, [])

  // ローカルストレージに吹き出し状態を保存
  const saveInfoWindowStates = useCallback((states: Record<string, InfoWindowState>) => {
    localStorageUtils.saveData(STORAGE_KEY, states)
  }, [])

  // ローカルストレージからカテゴリーフィルター状態を読み込む
  const loadCategoryFilterState = useCallback(() => {
    return localStorageUtils.loadData(CATEGORY_FILTER_KEY, [])
  }, [])

  // ローカルストレージにカテゴリーフィルター状態を保存
  const saveCategoryFilterState = useCallback((categories: string[]) => {
    localStorageUtils.saveData(CATEGORY_FILTER_KEY, categories)
  }, [])

  // 吹き出しを地図の10ピクセル内側に調整する関数
  const adjustToMapEdge = useCallback((lat: number, lng: number, map: any) => {
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

    // 地図の各辺との距離を計算
    const distanceToTop = ne.lat() - lat
    const distanceToBottom = lat - sw.lat()
    const distanceToRight = ne.lng() - lng
    const distanceToLeft = lng - sw.lng()

    // 最も近い辺を判定
    const minDistance = Math.min(distanceToTop, distanceToBottom, distanceToRight, distanceToLeft)

    let adjustedPosition: { lat: number; lng: number }

    if (minDistance === distanceToTop) {
      // 上辺に最も近い：吹き出しの上辺が地図上辺から10px内側になるように配置
      adjustedPosition = {
        lat: ne.lat() - marginLat - infoWindowHeightLat / 2,
        lng: lng, // 経度はそのまま維持
      }
      console.log(`🔝 上辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
    } else if (minDistance === distanceToBottom) {
      // 下辺に最も近い：吹き出しの下辺が地図下辺から10px内側になるように配置
      adjustedPosition = {
        lat: sw.lat() + marginLat + infoWindowHeightLat / 2,
        lng: lng, // 経度はそのまま維持
      }
      console.log(`🔽 下辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
    } else if (minDistance === distanceToLeft) {
      // 左辺に最も近い：吹き出しの左辺が地図左辺から10px内側になるように配置
      adjustedPosition = {
        lat: lat, // 緯度はそのまま維持
        lng: sw.lng() + marginLng + infoWindowWidthLng / 2,
      }
      console.log(`◀️ 左辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
    } else {
      // 右辺に最も近い：吹き出しの右辺が地図右辺から10px内側になるように配置
      adjustedPosition = {
        lat: lat, // 緯度はそのまま維持
        lng: ne.lng() - marginLng - infoWindowWidthLng / 2,
      }
      console.log(`▶️ 右辺に調整: (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)})`)
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
  }, [])

  // マップの初期化
  const initMap = useCallback(() => {
    if (!mapRef.current) {
      console.error("マップコンテナの参照が見つかりません")
      setLoadError("マップコンテナの参照が見つかりません")
      return false
    }

    if (!window.google || !window.google.maps) {
      console.error("Google Maps APIが利用できません")
      setLoadError("Google Maps APIが利用できません")
      return false
    }

    try {
      console.log("マップインスタンスを作成します")
      const mapOptions = {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
      }

      // マップインスタンスを作成
      const mapInstance = new window.google.maps.Map(mapRef.current, mapOptions)
      console.log("マップインスタンスが作成されました")

      setMap(mapInstance)

      // マップのイベントリスナーを設定
      mapInstance.addListener("click", () => {
        // Version 14では何もしない
      })

      mapInstance.addListener("dragstart", () => {
        setIsMapDragging(true)
      })

      mapInstance.addListener("dragend", () => {
        setIsMapDragging(false)
      })

      // マップがアイドル状態になったら（完全にロードされたら）フラグを設定
      window.google.maps.event.addListenerOnce(mapInstance, "idle", () => {
        console.log("マップが完全にロードされました")
        setIsMapLoaded(true)

        // 保存された吹き出し状態を読み込む
        const savedStates = loadInfoWindowStates()
        setActiveInfoWindows(savedStates)

        // 保存されたカテゴリーフィルター状態を読み込む
        const savedCategories = loadCategoryFilterState()
        if (savedCategories.length > 0) {
          setSelectedCategories(savedCategories)
        } else {
          // 初期状態ではすべてのカテゴリーを選択
          setSelectedCategories(categories.map((cat) => cat.id))
          saveCategoryFilterState(categories.map((cat) => cat.id))
        }
      })

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`マップの初期化に失敗しました: ${errorMessage}`)
      setLoadError(`マップの初期化に失敗しました: ${errorMessage}`)
      return false
    }
  }, [center, zoom, loadInfoWindowStates, categories, loadCategoryFilterState, saveCategoryFilterState])

  // マップの初期化を試みる
  useEffect(() => {
    if (isGoogleMapsLoaded && apiKey && mapRef.current && !isMapLoaded && !map) {
      console.log(`マップの初期化を試みます (試行回数: ${initAttempts + 1})`)
      const success = initMap()

      if (!success && initAttempts < 3) {
        // 初期化に失敗した場合、最大3回まで再試行
        console.log(`マップの初期化に失敗しました。再試行します (${initAttempts + 1}/3)`)
        const timer = setTimeout(() => {
          setInitAttempts((prev) => prev + 1)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [isGoogleMapsLoaded, apiKey, initMap, isMapLoaded, map, initAttempts])

  // マーカークリック時のハンドラー
  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      setActiveInfoWindows((prev) => {
        // 既存の状態があれば使用、なければ新規作成
        const updatedState = {
          ...prev,
          [marker.id]: {
            markerId: marker.id,
            position: { ...marker.position }, // マーカーと同じ位置に初期配置
            isMinimized: prev[marker.id]?.isMinimized || false,
            userPositioned: prev[marker.id]?.userPositioned || false,
            isOrganized: false, // 新しく開いた吹き出しは整頓状態ではない
          },
        }

        // 状態を保存
        saveInfoWindowStates(updatedState)
        return updatedState
      })
    },
    [saveInfoWindowStates],
  )

  // 吹き出しを閉じるハンドラー
  const handleCloseInfoWindow = useCallback(
    (markerId: string) => {
      setActiveInfoWindows((prev) => {
        const { [markerId]: removed, ...rest } = prev
        saveInfoWindowStates(rest)
        return rest
      })
    },
    [saveInfoWindowStates],
  )

  // 全ての吹き出しを閉じるハンドラー
  const handleCloseAllInfoWindows = useCallback(() => {
    setActiveInfoWindows({})
    saveInfoWindowStates({})
  }, [saveInfoWindowStates])

  // 吹き出しのドラッグ開始ハンドラー
  const handleInfoWindowDragStart = useCallback((markerId: string) => {
    setIsDraggingAny(true)
    setCurrentDraggingId(markerId)

    // テキスト選択を防止
    document.body.classList.add("select-none")
  }, [])

  // 吹き出しのドラッグ終了ハンドラー
  const handleInfoWindowDragEnd = useCallback(
    (position: any, markerId: string) => {
      setIsDraggingAny(false)
      setCurrentDraggingId(null)

      // テキスト選択を元に戻す
      document.body.classList.remove("select-none")

      if (!map) return

      const draggedLat = position.lat()
      const draggedLng = position.lng()

      console.log(
        `🖱️ 手動移動完了: ${markerId} をドラッグ位置 (${draggedLat.toFixed(6)}, ${draggedLng.toFixed(6)}) に移動`,
      )

      // 最も近い辺に10ピクセル内側に自動調整
      const adjustedPosition = adjustToMapEdge(draggedLat, draggedLng, map)

      setActiveInfoWindows((prev) => {
        const updatedState = {
          ...prev,
          [markerId]: {
            ...prev[markerId],
            position: adjustedPosition,
            userPositioned: true,
            isOrganized: false,
          },
        }
        saveInfoWindowStates(updatedState)
        return updatedState
      })
    },
    [saveInfoWindowStates, map, adjustToMapEdge],
  )

  // 吹き出しの最小化切り替えハンドラー
  const handleToggleMinimize = useCallback(
    (markerId: string, isMinimized: boolean) => {
      setActiveInfoWindows((prev) => {
        const updatedState = {
          ...prev,
          [markerId]: {
            ...prev[markerId],
            isMinimized,
          },
        }
        saveInfoWindowStates(updatedState)
        return updatedState
      })
    },
    [saveInfoWindowStates],
  )

  // カテゴリーフィルター変更ハンドラー
  const handleCategoryChange = useCallback(
    (categoryId: string, isSelected: boolean) => {
      setSelectedCategories((prev) => {
        const newCategories = isSelected ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
        saveCategoryFilterState(newCategories)
        return newCategories
      })
    },
    [saveCategoryFilterState],
  )

  // すべてのカテゴリーを選択
  const handleSelectAllCategories = useCallback(() => {
    const allCategories = categories.map((cat) => cat.id)
    setSelectedCategories(allCategories)
    saveCategoryFilterState(allCategories)
  }, [categories, saveCategoryFilterState])

  // すべてのカテゴリーを選択解除
  const handleClearAllCategories = useCallback(() => {
    setSelectedCategories([])
    saveCategoryFilterState([])
  }, [saveCategoryFilterState])

  // 吹き出しの自動整列
  const handleAutoArrange = useCallback(() => {
    if (!map) return

    const bounds = map.getBounds()
    if (!bounds) return

    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const mapWidth = ne.lng() - sw.lng()
    const mapHeight = ne.lat() - sw.lat()

    // 表示されているマーカーを取得
    const visibleMarkers = markers.filter((marker) => selectedCategories.includes(marker.category))

    // アクティブな吹き出しを取得
    const activeMarkerIds = Object.keys(activeInfoWindows)
    const activeMarkers = visibleMarkers.filter((marker) => activeMarkerIds.includes(marker.id))

    if (activeMarkers.length === 0) return

    // マップの中心を基準に吹き出しを円形に配置
    const center = map.getCenter()
    const radius = Math.min(mapWidth, mapHeight) * 0.3 // マップサイズの30%を半径とする
    const angleStep = (2 * Math.PI) / activeMarkers.length

    const newInfoWindows: Record<string, InfoWindowState> = { ...activeInfoWindows }

    activeMarkers.forEach((marker, index) => {
      const angle = index * angleStep
      const x = center.lng() + radius * Math.cos(angle)
      const y = center.lat() + radius * Math.sin(angle)

      newInfoWindows[marker.id] = {
        ...newInfoWindows[marker.id],
        position: { lat: y, lng: x },
        userPositioned: true, // 自動整列後はユーザー配置済みとしてマーク
        isOrganized: false, // 円形配置は整頓状態ではない
      }
    })

    setActiveInfoWindows(newInfoWindows)
    saveInfoWindowStates(newInfoWindows)
  }, [map, markers, selectedCategories, activeInfoWindows, saveInfoWindowStates])

  // 吹き出しの地域別整列（地図内側）
  const handleAlignInfoWindows = useCallback(() => {
    if (!map) {
      console.log("🗺️ 地図インスタンスが利用できません")
      return
    }

    console.log("🗺️ 辺配置整列を開始します")

    try {
      // 地図の状態を確認
      const bounds = map.getBounds()
      if (!bounds) {
        console.error("❌ 地図の境界を取得できません")
        return
      }

      console.log("✅ 地図の境界を取得しました")

      // 表示されているマーカーを取得
      const visibleMarkers = markers.filter((marker) => selectedCategories.includes(marker.category))
      console.log(`📍 表示中のマーカー数: ${visibleMarkers.length}`)

      // アクティブな吹き出しを取得
      const activeMarkerIds = Object.keys(activeInfoWindows)
      const activeMarkers = visibleMarkers.filter((marker) => activeMarkerIds.includes(marker.id))

      if (activeMarkers.length === 0) {
        console.log("📍 アクティブなマーカーがありません")
        return
      }

      console.log(`📍 ${activeMarkers.length}個のアクティブマーカーを処理します`)

      // 既存の整頓状態をリセット
      const resetInfoWindows: Record<string, InfoWindowState> = { ...activeInfoWindows }
      Object.keys(resetInfoWindows).forEach((markerId) => {
        resetInfoWindows[markerId] = {
          ...resetInfoWindows[markerId],
          isOrganized: false,
          organizationRegion: undefined,
          organizationIndex: undefined,
          organizationTotal: undefined,
        }
      })

      console.log("🔄 整頓状態をリセットしました")

      // 辺配置位置を計算
      console.log("🔧 辺配置位置を計算中（現在の吹き出し位置基準）...")
      const edgePositions = getEdgeAlignedPositions(activeInfoWindows, map)
      console.log(`✅ ${Object.keys(edgePositions).length}個の位置を計算しました`)

      // 新しい吹き出し状態を作成
      const newInfoWindows: Record<string, InfoWindowState> = { ...resetInfoWindows }
      let successCount = 0

      activeMarkers.forEach((marker) => {
        try {
          const position = edgePositions[marker.id]
          if (position) {
            // 現在の吹き出し位置を基準に最も近い辺を判定
            const currentInfoWindow = activeInfoWindows[marker.id]
            const closestEdge = getClosestMapEdge(currentInfoWindow.position.lat, currentInfoWindow.position.lng, map)

            newInfoWindows[marker.id] = {
              ...newInfoWindows[marker.id],
              position: { lat: position.lat, lng: position.lng },
              userPositioned: true,
              isOrganized: true, // 整頓状態としてマーク
              organizationRegion: `${closestEdge}辺`, // 整頓時の辺を記録
              organizationIndex: undefined, // 辺配置では使用しない
              organizationTotal: undefined, // 辺配置では使用しない
            }
            successCount++
            console.log(
              `✅ "${marker.id}" の配置完了（現在位置 ${currentInfoWindow.position.lat.toFixed(6)}, ${currentInfoWindow.position.lng.toFixed(6)} から ${closestEdge}辺に移動）`,
            )
          } else {
            console.warn(`⚠️ "${marker.id}" の位置が計算されませんでした`)
          }
        } catch (error) {
          console.error(`❌ マーカー "${marker.id}" の状態更新に失敗:`, error)
        }
      })

      console.log(`💾 新しい吹き出し位置を保存中 (成功: ${successCount}個)`)
      setActiveInfoWindows(newInfoWindows)
      saveInfoWindowStates(newInfoWindows)
      console.log("✅ 辺配置整列が完了しました")
    } catch (error) {
      console.error("❌ 辺配置整列中にエラーが発生しました:", error)
      // エラーが発生してもアプリケーションが停止しないようにする
    }
  }, [map, markers, selectedCategories, activeInfoWindows, saveInfoWindowStates])

  // スナップショット保存ハンドラー
  const handleTakeSnapshot = useCallback(
    (title: string) => {
      console.log("📸 handleTakeSnapshot が呼び出されました", { title, activeInfoWindowCount })

      if (!map) {
        console.error("❌ 地図インスタンスが利用できません")
        return
      }

      console.log(`📸 スナップショット保存開始: "${title}"`)

      try {
        const center = map.getCenter()
        const zoom = map.getZoom()

        console.log("📸 地図情報取得:", {
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
          activeInfoWindows: Object.keys(activeInfoWindows).length,
          selectedCategories: selectedCategories.length,
        })

        const snapshot = saveSnapshot(
          title,
          activeInfoWindows,
          { lat: center.lat(), lng: center.lng() },
          zoom,
          selectedCategories,
        )

        console.log(`✅ スナップショット保存完了: "${snapshot.title}"`, snapshot)
      } catch (error) {
        console.error("❌ スナップショット保存エラー:", error)
      }
    },
    [map, activeInfoWindows, selectedCategories, saveSnapshot],
  )

  // スナップショット復元ハンドラー
  const handleRestoreSnapshot = useCallback(
    (snapshot: MapSnapshot) => {
      console.log("🔄 handleRestoreSnapshot が呼び出されました", snapshot)

      if (!map) {
        console.error("❌ 地図インスタンスが利用できません")
        return
      }

      console.log(`🔄 スナップショット復元開始: "${snapshot.title}"`, snapshot)

      try {
        // 地図の位置とズームを復元
        const center = new window.google.maps.LatLng(snapshot.mapCenter.lat, snapshot.mapCenter.lng)
        map.setCenter(center)
        map.setZoom(snapshot.mapZoom)
        console.log(
          `🗺️ 地図位置復元: (${snapshot.mapCenter.lat}, ${snapshot.mapCenter.lng}), ズーム: ${snapshot.mapZoom}`,
        )

        // カテゴリーフィルターを復元
        setSelectedCategories(snapshot.selectedCategories)
        saveCategoryFilterState(snapshot.selectedCategories)
        console.log(`🏷️ カテゴリーフィルター復元: ${snapshot.selectedCategories.length}個`, snapshot.selectedCategories)

        // 吹き出し状態を復元
        setActiveInfoWindows(snapshot.infoWindows)
        saveInfoWindowStates(snapshot.infoWindows)
        console.log(`💬 吹き出し状態復元: ${Object.keys(snapshot.infoWindows).length}個`, snapshot.infoWindows)

        console.log(`✅ スナップショット復元完了: "${snapshot.title}"`)
      } catch (error) {
        console.error(`❌ スナップショット復元エラー:`, error)
      }
    },
    [map, saveCategoryFilterState, saveInfoWindowStates],
  )

  // フィルタリングされたマーカー
  const filteredMarkers = markers.filter((marker) => selectedCategories.includes(marker.category))

  // マーカーが一つもない場合のフォールバックメッセージ
  const noMarkersAvailable = filteredMarkers.length === 0

  // 吹き出しが表示されているマーカーのIDリスト
  const activeMarkerIds = Object.keys(activeInfoWindows)

  // 表示されている吹き出しの数（派生値）
  const activeInfoWindowCount = activeMarkerIds.length

  // APIキーがロード中の場合はローディングメッセージを表示
  if (isLoadingApiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 bg-white rounded-md shadow-md mb-4">
          <p className="mb-2">APIキーを読み込み中...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>
    )
  }

  // APIキーが取得できなかった場合はエラーメッセージを表示
  if (apiKeyError || !apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200 mb-4 max-w-2xl">
          <h3 className="font-bold mb-2">APIキーの取得に失敗しました</h3>
          <p className="mb-2">
            環境変数 GOOGLE_MAPS_API_KEY または mamoru_maeda_disaster_key001 が正しく設定されているか確認してください。
          </p>
          {apiKeyError && <p className="mb-2 text-sm bg-red-100 p-2 rounded">エラー詳細: {apiKeyError}</p>}
          <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
            <p className="font-semibold">デバッグ情報:</p>
            <p>APIキー状態: {apiKey ? "取得済み" : "未取得"}</p>
            <p>エラー状態: {apiKeyError || "なし"}</p>
            <p className="mt-2 text-xs text-gray-600">
              注意: セキュリティ上の理由により、環境変数の詳細は表示されません。
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Google Maps APIのロードに失敗した場合はエラーメッセージを表示
  if (googleMapsError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200 mb-4 max-w-2xl">
          <h3 className="font-bold mb-2">Google Maps APIのロードに失敗しました</h3>
          <p>{googleMapsError}</p>
          <p className="mt-2 text-sm">
            APIキーが有効であることを確認し、ブラウザのコンソールでエラーの詳細を確認してください。
          </p>
          <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
            <p className="font-semibold">デバッグ情報:</p>
            <p>APIキーの長さ: {apiKey ? apiKey.length : 0} 文字</p>
            <p>APIキーの先頭: {apiKey ? apiKey.substring(0, 5) + "..." : "なし"}</p>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    )
  }

  // その他のエラーがある場合はエラーメッセージを表示
  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200 mb-4 max-w-2xl">
          <h3 className="font-bold mb-2">エラーが発生しました</h3>
          <p>{loadError}</p>
          <p className="mt-2 text-sm">
            このエラーが続く場合は、ページを再読み込みするか、ブラウザのコンソールでエラーの詳細を確認してください。
          </p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    )
  }

  // マップがロードされていない場合はローディングメッセージを表示
  if (!isMapLoaded) {
    return (
      <div className="w-full h-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-md shadow-md mb-4">
            <p className="mb-2">地図を読み込み中...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
            </div>
            {initAttempts > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                読み込みに時間がかかっています (試行回数: {initAttempts + 1}/3)
              </p>
            )}
          </div>
        </div>
        <div ref={mapRef} className="w-full h-full" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          onSelectAll={handleSelectAllCategories}
          onClearAll={handleClearAllCategories}
        />
        <div className="flex gap-2">
          <AutoArrangeButton onAutoArrange={handleAutoArrange} />
          <CameraButton
            onTakeSnapshot={handleTakeSnapshot}
            disabled={activeInfoWindowCount === 0}
            infoWindowCount={activeInfoWindowCount}
          />
          <HistoryPanel
            snapshots={snapshots}
            onRestoreSnapshot={handleRestoreSnapshot}
            onDeleteSnapshot={deleteSnapshot}
            onUpdateSnapshotTitle={updateSnapshotTitle}
            onClearAllSnapshots={clearAllSnapshots}
          />
        </div>
        <CloseAllButton onCloseAll={handleCloseAllInfoWindows} disabled={activeInfoWindowCount === 0} />
        <OrganizeButton onOrganize={handleAlignInfoWindows} disabled={activeInfoWindowCount === 0} />
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {noMarkersAvailable && map && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-md shadow-md z-10">
          <p className="text-center">表示するマーカーがありません。カテゴリーフィルターを確認してください。</p>
        </div>
      )}

      {map &&
        isMapLoaded &&
        filteredMarkers.map((marker) => (
          <SimpleMarker
            key={marker.id}
            position={new window.google.maps.LatLng(marker.position.lat, marker.position.lng)}
            map={map}
            title={marker.title}
            category={marker.category}
            categoryColor={categories.find((cat) => cat.id === marker.category)?.color}
            onClick={() => handleMarkerClick(marker)}
            isActive={activeMarkerIds.includes(marker.id)} // 吹き出しが表示されているマーカーを大きく表示
          />
        ))}

      {map &&
        isMapLoaded &&
        Object.entries(activeInfoWindows).map(([markerId, infoWindow]) => {
          const marker = markers.find((m) => m.id === markerId)
          if (!marker || !selectedCategories.includes(marker.category)) return null

          const category = categories.find((cat) => cat.id === marker.category)

          return (
            <CustomOverlay
              key={markerId}
              position={new window.google.maps.LatLng(infoWindow.position.lat, infoWindow.position.lng)}
              markerPosition={new window.google.maps.LatLng(marker.position.lat, marker.position.lng)}
              map={map}
              markerId={markerId}
              onDragStart={handleInfoWindowDragStart}
              onDragEnd={handleInfoWindowDragEnd}
              onToggleMinimize={handleToggleMinimize}
              isMinimized={infoWindow.isMinimized}
              lineColor={category?.color}
              isDraggingAny={isDraggingAny}
              currentDraggingId={currentDraggingId}
              userPositioned={infoWindow.userPositioned}
            >
              <InfoCard
                title={marker.title}
                description={marker.description}
                image={marker.image}
                category={marker.category}
                categoryColor={category?.color}
                severity={marker.severity}
                reportDate={marker.reportDate}
                status={marker.status}
                city={marker.city}
                onClose={() => handleCloseInfoWindow(markerId)}
              />
            </CustomOverlay>
          )
        })}
    </div>
  )
}

export default MapContainer
