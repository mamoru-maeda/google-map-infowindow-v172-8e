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

interface MapContainerProps {
  center: {
    lat: number
    lng: number
  }
  zoom: number
  markers: MarkerData[]
  categories: Category[]
}

const STORAGE_KEY = "google-map-infowindows-v13-fixed" // 固定バージョン
const CATEGORY_FILTER_KEY = "google-map-categories-v13-fixed" // 固定バージョン

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isMapDragging, setIsMapDragging] = useState(false)
  const [isDraggingAny, setIsDraggingAny] = useState(isMapDragging)
  const [currentDraggingId, setCurrentDraggingId] = useState<string | null>(null)

  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGoogleMaps(apiKey)

  // 既存のuseEffectでエラーを設定
  useEffect(() => {
    if (googleMapsError) {
      setLoadError(googleMapsError)
    }
  }, [googleMapsError])

  // initMapの呼び出しを修正
  useEffect(() => {
    if (apiKey && isGoogleMapsLoaded) {
      initMap()
    }
  }, [apiKey, isGoogleMapsLoaded])

  // APIキーをフェッチ
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoadingApiKey(true)

        const response = await fetch("/api/maps-key")

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`APIキー取得エラー (${response.status}): ${errorText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(`APIエンドポイントエラー: ${data.error}`)
        }

        // デモモードの処理
        if (data.demoMode) {
          console.warn("デモモードで実行中:", data.message)
          setLoadError(`注意: ${data.message}`)
          // デモモードでも続行できるようにAPIキーを設定
          setApiKey(data.apiKey)
        } else if (!data.apiKey) {
          throw new Error("APIキーが返されませんでした")
        } else {
          setApiKey(data.apiKey)
        }

        setIsLoadingApiKey(false)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setLoadError(`APIキーの取得に失敗しました: ${errorMessage}`)
        setIsLoadingApiKey(false)
      }
    }

    fetchApiKey()
  }, [])

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
      setLoadError("マップコンテナの参照が見つかりません")
      return
    }

    try {
      // window.googleが存在するか確認
      if (!window.google || !window.google.maps) {
        setLoadError("Google Maps APIが利用できません")
        return
      }

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

      setMap(mapInstance)

      // マップ上のどこかをクリックしたら吹き出しを閉じる
      mapInstance.addListener("click", () => {
        // Version 13では何もしない
      })

      // マップのドラッグ開始時
      mapInstance.addListener("dragstart", () => {
        setIsMapDragging(true)
      })

      // マップのドラッグ終了時
      mapInstance.addListener("dragend", () => {
        setIsMapDragging(false)
        // アクティブな吹き出しの位置を更新
        if (Object.keys(activeInfoWindows).length > 0) {
          // 状態を更新して再レンダリングをトリガー
          setActiveInfoWindows({ ...activeInfoWindows })
        }
      })

      // マップがアイドル状態になったら（完全にロードされたら）フラグを設定
      window.google.maps.event.addListenerOnce(mapInstance, "idle", () => {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setLoadError(`マップの初期化に失敗しました: ${errorMessage}`)
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

  // マーカークリック時のハンドラー
  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      setActiveInfoWindows((prev) => {
        // 既存の状態があれば使用、なければ新規作成（初期状態は最小化）
        const updatedState = {
          ...prev,
          [marker.id]: {
            markerId: marker.id,
            position: { ...marker.position }, // マーカーと同じ位置に初期配置
            isMinimized: true, // 初期状態を最小化に設定
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

  // 吹き出しが表示されているマーカーのIDリスト
  const activeMarkerIds = Object.keys(activeInfoWindows)

  // 表示されている吹き出しの数
  const activeInfoWindowCount = activeMarkerIds.length

  // APIキーがロード中の場合はローディングメッセージを表示
  if (isLoadingApiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 bg-white rounded-md shadow-md mb-4">APIキーを読み込み中...</div>
      </div>
    )
  }

  // APIキーが取得できなかった場合はエラーメッセージを表示
  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200 mb-4 max-w-2xl">
          <h3 className="font-bold mb-2">APIキーの取得に失敗しました</h3>
          <p>環境変数の設定を確認してください。以下の環境変数のいずれかを設定する必要があります：</p>
          <ul className="list-disc pl-5 mt-2">
            <li>mamoru_maeda_disaster_key001</li>
            <li>GOOGLE_MAPS_API_KEY</li>
          </ul>
          <p className="mt-2">環境変数の設定方法については、プロジェクトのドキュメントを参照してください。</p>
        </div>
      </div>
    )
  }

  // エラーがある場合はエラーメッセージを表示
  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200 mb-4 max-w-2xl">
          <h3 className="font-bold mb-2">エラーが発生しました</h3>
          <p>{loadError}</p>
        </div>
      </div>
    )
  }

  // マップがロードされていない場合はローディングメッセージを表示
  if (!isMapLoaded) {
    return (
      <div className="w-full h-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-md shadow-md mb-4">地図を読み込み中...</div>
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
