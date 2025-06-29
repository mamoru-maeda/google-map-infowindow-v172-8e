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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { localStorageUtils } from "@/lib/utils"
import type { MarkerData, InfoWindowState, Category } from "@/types/map-types"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import {
  getEdgeAlignedPositions,
  getClosestMapEdge,
  adjustToClosestEdge,
  calculateInfoWindowBounds,
  checkOverlap,
  adjustPositionToAvoidOverlap,
} from "@/utils/region-utils"

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
const MAX_INFOWINDOWS = 12 // 最大12個まで同時表示可能

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

  console.log(`🎯 最大吹き出し数: ${MAX_INFOWINDOWS}個`)
  console.log(`📊 現在の吹き出し数: ${Object.keys(activeInfoWindows).length}個`)

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
    const savedStates = localStorageUtils.loadData(STORAGE_KEY, {})
    // 12個を超える場合は最新の12個のみ保持
    const stateEntries = Object.entries(savedStates)
    if (stateEntries.length > MAX_INFOWINDOWS) {
      console.log(`⚠️ 保存された吹き出しが${stateEntries.length}個あります。最新の${MAX_INFOWINDOWS}個のみ読み込みます`)
      const limitedStates = Object.fromEntries(stateEntries.slice(-MAX_INFOWINDOWS))
      return limitedStates
    }
    return savedStates
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

  // 整頓された吹き出しの位置を再計算する関数
  const recalculateOrganizedPositions = useCallback(() => {
    if (!map) {
      console.log("🔄 地図インスタンスが利用できません")
      return
    }

    // 整頓された吹き出しを抽出
    const organizedInfoWindows = Object.entries(activeInfoWindows).filter(([_, infoWindow]) => infoWindow.isOrganized)

    if (organizedInfoWindows.length === 0) {
      console.log("📍 整頓された吹き出しがありません")
      return
    }

    console.log(`🔄 ${organizedInfoWindows.length}個の整頓された吹き出しの位置を維持します（再計算なし）`)

    // 整頓された吹き出しの位置は変更しない
    // ユーザーが手動で整列ボタンを押した時のみ位置を変更する
  }, [map, activeInfoWindows])

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
  }, [
    center,
    zoom,
    loadInfoWindowStates,
    categories,
    loadCategoryFilterState,
    saveCategoryFilterState,
    recalculateOrganizedPositions,
  ])

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

  // マーカークリック時のハンドラー（12個制限付き）
  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      setActiveInfoWindows((prev) => {
        const currentCount = Object.keys(prev).length

        // 既に開いている場合は何もしない
        if (prev[marker.id]) {
          console.log(`ℹ️ 既に開いています: ${marker.title}`)
          return prev
        }

        // 12個の制限チェック
        if (currentCount >= MAX_INFOWINDOWS) {
          console.log(`⚠️ 最大吹き出し数(${MAX_INFOWINDOWS})に達しています`)

          // 最も古い吹き出しを閉じる（最初のエントリを削除）
          const entries = Object.entries(prev)
          const [oldestId] = entries[0]
          const { [oldestId]: removed, ...rest } = prev

          console.log(`🔄 最古の吹き出し "${oldestId}" を閉じて新しい吹き出し "${marker.title}" を追加`)

          const updatedState = {
            ...rest,
            [marker.id]: {
              markerId: marker.id,
              position: { ...marker.position },
              isMinimized: false,
              userPositioned: false,
              isOrganized: false,
            },
          }

          saveInfoWindowStates(updatedState)
          return updatedState
        }

        // 新しい吹き出しを追加
        const updatedState = {
          ...prev,
          [marker.id]: {
            markerId: marker.id,
            position: { ...marker.position },
            isMinimized: false,
            userPositioned: false,
            isOrganized: false,
          },
        }

        console.log(`✅ 新しい吹き出しを追加: ${marker.title} (${currentCount + 1}/${MAX_INFOWINDOWS})`)
        saveInfoWindowStates(updatedState)
        return updatedState
      })
    },
    [saveInfoWindowStates],
  )

  // 12個の吹き出しを一度に開くテスト関数
  const handleOpen12InfoWindows = useCallback(() => {
    console.log("🎯 12個の吹き出しを一度に開くテスト開始")

    // 表示されているマーカーを取得
    const visibleMarkers = markers.filter((marker) => selectedCategories.includes(marker.category))
    const testMarkers = visibleMarkers.slice(0, MAX_INFOWINDOWS)

    if (testMarkers.length < MAX_INFOWINDOWS) {
      console.log(`⚠️ テスト用マーカーが不足: ${testMarkers.length}個のみ利用可能`)
    }

    // 12個の吹き出しを一度に開く
    const newInfoWindows: Record<string, InfoWindowState> = {}
    testMarkers.forEach((marker) => {
      newInfoWindows[marker.id] = {
        markerId: marker.id,
        position: { ...marker.position },
        isMinimized: false,
        userPositioned: false,
        isOrganized: false,
      }
    })

    setActiveInfoWindows(newInfoWindows)
    saveInfoWindowStates(newInfoWindows)
    console.log(`✅ ${Object.keys(newInfoWindows).length}個の吹き出しを同時表示`)
  }, [markers, selectedCategories, saveInfoWindowStates])

  // 吹き出しを閉じるハンドラー
  const handleCloseInfoWindow = useCallback(
    (markerId: string) => {
      setActiveInfoWindows((prev) => {
        const { [markerId]: removed, ...rest } = prev
        console.log(`❌ 吹き出しを閉じました: ${markerId} (残り: ${Object.keys(rest).length}個)`)
        saveInfoWindowStates(rest)
        return rest
      })
    },
    [saveInfoWindowStates],
  )

  // 全ての吹き出しを閉じるハンドラー
  const handleCloseAllInfoWindows = useCallback(() => {
    const currentCount = Object.keys(activeInfoWindows).length
    console.log(`🗑️ 全ての吹き出しを閉じます (${currentCount}個)`)
    setActiveInfoWindows({})
    saveInfoWindowStates({})
  }, [activeInfoWindows, saveInfoWindowStates])

  // 吹き出しのドラッグ開始ハンドラー
  const handleInfoWindowDragStart = useCallback((markerId: string) => {
    setIsDraggingAny(true)
    setCurrentDraggingId(markerId)
    console.log(`🖱️ ドラッグ開始: ${markerId}`)

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
      const adjustedPosition = adjustToClosestEdge(draggedLat, draggedLng, map)
      console.log(
        `🎯 自動調整後: ${markerId} を (${adjustedPosition.lat.toFixed(6)}, ${adjustedPosition.lng.toFixed(6)}) に調整`,
      )

      // 他の吹き出しとの重なりをチェック
      const otherInfoWindows = Object.entries(activeInfoWindows).filter(([id]) => id !== markerId)
      const existingBounds = otherInfoWindows.map(([id, infoWindow]) =>
        calculateInfoWindowBounds(infoWindow.position.lat, infoWindow.position.lng, map, id),
      )

      // 調整後の位置での境界ボックスを計算
      const adjustedBounds = calculateInfoWindowBounds(adjustedPosition.lat, adjustedPosition.lng, map, markerId)

      // 重なりチェック
      let hasOverlap = false
      let overlapWith = ""
      for (const existingBound of existingBounds) {
        if (checkOverlap(adjustedBounds, existingBound)) {
          hasOverlap = true
          overlapWith = existingBound.id
          break
        }
      }

      let finalPosition = adjustedPosition

      if (hasOverlap) {
        console.log(`⚠️ 自動調整後に重なり検出: ${markerId} が ${overlapWith} と重なります`)
        // 重なりを回避する位置を計算
        const overlapAvoidedPosition = adjustPositionToAvoidOverlap(adjustedBounds, existingBounds, map, 30)
        finalPosition = overlapAvoidedPosition
        console.log(
          `🔧 重なり回避: ${markerId} を位置 (${overlapAvoidedPosition.lat.toFixed(6)}, ${overlapAvoidedPosition.lng.toFixed(6)}) に再調整`,
        )
      } else {
        console.log(`✅ 自動調整OK: ${markerId} は重なりなし`)
      }

      setActiveInfoWindows((prev) => {
        const updatedState = {
          ...prev,
          [markerId]: {
            ...prev[markerId],
            position: finalPosition,
            userPositioned: true, // ユーザーが配置した位置であることを記録
            isOrganized: false, // 手動移動により整頓状態を解除
          },
        }
        saveInfoWindowStates(updatedState)
        return updatedState
      })
    },
    [saveInfoWindowStates, map, activeInfoWindows],
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

    console.log(`🎯 ${activeMarkers.length}個の吹き出しを自動整列します`)

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
    console.log(`✅ ${activeMarkers.length}個の吹き出しの自動整列が完了`)
  }, [map, markers, selectedCategories, activeInfoWindows, saveInfoWindowStates])

  // 吹き出しの地域別整列（地図内側）
  const handleAlignInfoWindows = useCallback(() => {
    if (!map) {
      console.log("🗺️ 地図インスタンスが利用できません")
      return
    }

    const activeCount = Object.keys(activeInfoWindows).length
    console.log(`🗺️ 辺配置整列を開始します (${activeCount}個の吹き出し)`)

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

      // 辺配置位置を計算（重なり回避強化版）
      console.log("🔧 辺配置位置を計算中（重なり回避強化版）...")
      const edgePositions = getEdgeAlignedPositions(activeInfoWindows, map)
      console.log(`✅ ${Object.keys(edgePositions).length}個の位置を計算しました`)

      // 計算結果をチェック
      if (Object.keys(edgePositions).length === 0) {
        console.error("❌ 配置位置の計算に失敗しました")
        return
      }

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
              `✅ "${marker.id}" の配置完了（${closestEdge}辺に移動: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}）`,
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

      if (successCount === activeMarkers.length) {
        console.log("🎉 辺配置整列が完全に成功しました")
      } else {
        console.warn(`⚠️ 一部の吹き出しの配置に失敗しました (成功: ${successCount}/${activeMarkers.length})`)
      }

      // 重なり確認の詳細ログを出力
      console.log(`🔍 重なり確認を開始します...`)

      const finalBounds: any[] = []
      Object.entries(newInfoWindows).forEach(([id, infoWindow]) => {
        const bounds = calculateInfoWindowBounds(infoWindow.position.lat, infoWindow.position.lng, map, id)
        finalBounds.push(bounds)
      })

      // 全ペアの重なりチェック
      let totalOverlapCount = 0
      const overlapPairs: Array<{ id1: string; id2: string; overlapArea: number }> = []

      for (let i = 0; i < finalBounds.length; i++) {
        for (let j = i + 1; j < finalBounds.length; j++) {
          const bounds1 = finalBounds[i]
          const bounds2 = finalBounds[j]

          const horizontalOverlap = Math.max(
            0,
            Math.min(bounds1.east, bounds2.east) - Math.max(bounds1.west, bounds2.west),
          )
          const verticalOverlap = Math.max(
            0,
            Math.min(bounds1.north, bounds2.north) - Math.max(bounds1.south, bounds2.south),
          )

          if (horizontalOverlap > 0 && verticalOverlap > 0) {
            totalOverlapCount++
            const overlapArea = horizontalOverlap * verticalOverlap
            overlapPairs.push({ id1: bounds1.id, id2: bounds2.id, overlapArea })

            console.error(`❌ 重なり検出: ${bounds1.id} ↔ ${bounds2.id}`)
            console.error(`   重なり面積: ${overlapArea.toFixed(10)} 平方度`)
            console.error(`   水平重なり: ${horizontalOverlap.toFixed(10)} 度`)
            console.error(`   垂直重なり: ${verticalOverlap.toFixed(10)} 度`)
          }
        }
      }

      // 重なり確認結果の出力
      if (totalOverlapCount === 0) {
        console.log(`✅ 重なり確認完了: 吹き出し同士の重なりは完全に回避されています！`)
        console.log(`📊 確認済みペア数: ${(finalBounds.length * (finalBounds.length - 1)) / 2}ペア`)
        console.log(`🎉 重なり回避率: 100%`)
      } else {
        console.error(`❌ 重なり確認失敗: ${totalOverlapCount}個の重なりが検出されました`)
        console.error(`📊 確認済みペア数: ${(finalBounds.length * (finalBounds.length - 1)) / 2}ペア`)
        console.error(
          `📊 重なり回避率: ${((((finalBounds.length * (finalBounds.length - 1)) / 2 - totalOverlapCount) / ((finalBounds.length * (finalBounds.length - 1)) / 2)) * 100).toFixed(2)}%`,
        )

        // 最も重なりの大きいペアを特定
        if (overlapPairs.length > 0) {
          const maxOverlapPair = overlapPairs.reduce((max, pair) => (pair.overlapArea > max.overlapArea ? pair : max))
          console.error(
            `📊 最大重なり: ${maxOverlapPair.id1} ↔ ${maxOverlapPair.id2} (面積: ${maxOverlapPair.overlapArea.toFixed(10)})`,
          )
        }
      }

      // 各吹き出しの境界情報を出力
      console.log(`📏 各吹き出しの境界情報:`)
      finalBounds.forEach((bounds) => {
        const width = bounds.east - bounds.west
        const height = bounds.north - bounds.south
        console.log(
          `  ${bounds.id}: 中心(${bounds.centerLat.toFixed(8)}, ${bounds.centerLng.toFixed(8)}) サイズ(${width.toFixed(8)} × ${height.toFixed(8)})`,
        )
        console.log(
          `    境界: N=${bounds.north.toFixed(8)}, S=${bounds.south.toFixed(8)}, E=${bounds.east.toFixed(8)}, W=${bounds.west.toFixed(8)}`,
        )
      })
    } catch (error) {
      console.error("❌ 辺配置整列中にエラーが発生しました:", error)
      // エラーが発生してもアプリケーションが停止しないようにする
    }
  }, [map, markers, selectedCategories, activeInfoWindows, saveInfoWindowStates])

  // フィルタリングされたマーカー
  const filteredMarkers = markers.filter((marker) => selectedCategories.includes(marker.category))

  // マーカーが一つもない場合のフォールバックメッセージ
  const noMarkersAvailable = filteredMarkers.length === 0

  // 吹き出しが表示されているマーカーのIDリスト
  const activeMarkerIds = Object.keys(activeInfoWindows)

  // 表示されている吹き出しの数
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
        {/* 吹き出し管理パネル */}
        <div className="bg-white p-3 rounded-lg shadow-md border">
          <div className="text-sm font-medium mb-2">吹き出し管理</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">表示中:</span>
              <Badge variant={activeInfoWindowCount >= MAX_INFOWINDOWS ? "destructive" : "default"}>
                {activeInfoWindowCount}/{MAX_INFOWINDOWS}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">最小化:</span>
              <Badge variant="secondary">
                {Object.values(activeInfoWindows).filter((info) => info.isMinimized).length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">整列済み:</span>
              <Badge variant="outline">
                {Object.values(activeInfoWindows).filter((info) => info.isOrganized).length}
              </Badge>
            </div>
            <Button
              onClick={handleOpen12InfoWindows}
              size="sm"
              className="w-full text-xs"
              disabled={filteredMarkers.length < MAX_INFOWINDOWS}
            >
              12個同時表示テスト
            </Button>
          </div>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          onSelectAll={handleSelectAllCategories}
          onClearAll={handleClearAllCategories}
        />
        <div className="flex gap-2">
          <OrganizeButton onOrganize={handleAlignInfoWindows} disabled={activeInfoWindowCount === 0} />
          <AutoArrangeButton onAutoArrange={handleAutoArrange} />
        </div>
        <CloseAllButton onCloseAll={handleCloseAllInfoWindows} disabled={activeInfoWindowCount === 0} />
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
