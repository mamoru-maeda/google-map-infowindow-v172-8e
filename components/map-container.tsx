"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import SimpleMarker from "./simple-marker"
import CustomOverlay from "./custom-overlay"
import InfoCard from "./info-card"
import CategoryFilter from "./category-filter"
import AutoArrangeButton from "./auto-arrange-button"
import CloseAllButton from "./close-all-button"
import { localStorageUtils } from "@/lib/utils"
import type { MarkerData, InfoWindowState, Category } from "@/types/map-types"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import type { google } from "google-maps"

interface MapContainerProps {
  center: {
    lat: number
    lng: number
  }
  zoom: number
  markers: MarkerData[]
  categories: Category[]
}

const STORAGE_KEY = "google-map-infowindows-v13"
const CATEGORY_FILTER_KEY = "google-map-categories-v13"

// グローバルに google 変数を宣言
declare global {
  interface Window {
    google: any
    initGoogleMap: () => void
  }
}

const MapContainer: React.FC<MapContainerProps> = ({ center, zoom, markers, categories }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
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
        // Version 13では何もしない
      })

      mapInstance.addListener("dragstart", () => {
        setIsMapDragging(true)
      })

      mapInstance.addListener("dragend", () => {
        setIsMapDragging(false)
        if (Object.keys(activeInfoWindows).length > 0) {
          setActiveInfoWindows({ ...activeInfoWindows })
        }
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
    activeInfoWindows,
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
    (position: google.maps.LatLng, markerId: string) => {
      setIsDraggingAny(false)
      setCurrentDraggingId(null)

      // テキスト選択を元に戻す
      document.body.classList.remove("select-none")

      setActiveInfoWindows((prev) => {
        const updatedState = {
          ...prev,
          [markerId]: {
            ...prev[markerId],
            position: {
              lat: position.lat(),
              lng: position.lng(),
            },
            userPositioned: true, // ユーザーが配置した位置であることを記録
          },
        }
        saveInfoWindowStates(updatedState)
        return updatedState
      })
    },
    [saveInfoWindowStates],
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
      }
    })

    setActiveInfoWindows(newInfoWindows)
    saveInfoWindowStates(newInfoWindows)
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
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          onSelectAll={handleSelectAllCategories}
          onClearAll={handleClearAllCategories}
        />
        <AutoArrangeButton onAutoArrange={handleAutoArrange} />
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
