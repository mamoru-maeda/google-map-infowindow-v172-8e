"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import ExifReader from "exifreader"
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// 事務所のリスト
const offices = [
  "下田土木事務所",
  "熱海土木事務所",
  "沼津土木事務所",
  "富士土木事務所",
  "静岡土木事務所",
  "島田土木事務所",
  "袋井土木事務所",
  "浜松土木事務所",
  "田子の浦港管理事務所",
  "清水港管理事務所",
  "焼津漁港管理事務所",
  "御前崎港管理事務所",
]

// 災害種別
const disasterTypes = ["公共施設被害", "一般被害"]

// 工種
const workTypes = [
  "河川",
  "海岸",
  "砂防",
  "急傾斜地",
  "地すべり",
  "道路",
  "橋梁",
  "下水道",
  "海岸(港湾)",
  "漁港",
  "公園",
  "浸水",
  "その他",
]

// 右左岸
const bankSides = ["右岸", "左岸", "両岸"]

// 優先度判定(堤防)
const embankmentTypes = ["築堤部", "堀込部"]

// 優先度判定(背後地)
const backgroundTypes = ["人家・道路有り", "無し"]

// 優先度
const priorityLevels = ["A", "B", "C"]

// 優先度自動判定ロジック
const calculatePriority = (embankment: string, background: string): string => {
  if (embankment === "築堤部" && background === "人家・道路有り") return "A"
  if (embankment === "築堤部" && background === "無し") return "B"
  if (embankment === "堀込部" && background === "人家・道路有り") return "B"
  if (embankment === "堀込部" && background === "無し") return "C"
  return "C" // デフォルト
}

// フォームのスキーマを定義
const formSchema = z.object({
  office: z.string({
    required_error: "報告事務所を選択してください",
  }),
  disasterType: z.string({
    required_error: "災害種別を選択してください",
  }),
  workType: z.string({
    required_error: "工種を選択してください",
  }),
  title: z.string().min(2, {
    message: "件名は2文字以上で入力してください",
  }),
  bankSide: z.string().optional(),
  embankmentType: z.string().optional(),
  backgroundType: z.string().optional(),
  priority: z.string(),
  content: z.string().min(10, {
    message: "本文は10文字以上で入力してください",
  }),
})

type FormValues = z.infer<typeof formSchema>

// 画像情報の型定義
interface ImageInfo {
  id: string
  file: File
  gpsLocation?: { lat: number; lng: number }
  address?: string // 住所情報を追加
  exifData?: any // Exifデータ全体を保存
  rawExifData?: any // 生のExifデータを保存
}

// マーカー情報の型定義
interface MarkerInfo {
  id: string
  position: { lat: number; lng: number }
  imageIndex: number
}

// 吹き出し情報の型定義
interface InfoWindowInfo {
  markerId: string
  isOpen: boolean
  isMinimized?: boolean
}

// グローバル型定義
declare global {
  interface Window {
    google: any
    initMap: () => void
    googleMapsCallback: () => void
  }
}

export default function DamageReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<ImageInfo[]>([])
  const [markers, setMarkers] = useState<MarkerInfo[]>([])
  const [activeInfoWindow, setActiveInfoWindow] = useState<InfoWindowInfo | null>(null)
  const [mapExpanded, setMapExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [mapInfoWindow, setMapInfoWindow] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("gps")
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [geocoder, setGeocoder] = useState<any>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState<{ [key: string]: boolean }>({})
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [manualLat, setManualLat] = useState<string>("")
  const [manualLng, setManualLng] = useState<string>("")
  const [showExifModal, setShowExifModal] = useState(false)
  const [currentExifData, setCurrentExifData] = useState<any>(null)

  // デバッグ情報を追加する関数
  const addDebugInfo = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]}: ${message}`])
  }

  // フォームの初期値
  const defaultValues: Partial<FormValues> = {
    office: "",
    disasterType: "",
    workType: "",
    title: "",
    bankSide: "",
    embankmentType: "",
    backgroundType: "",
    priority: "",
    content: "",
  }

  // フォームの定義
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // 優先度の自動判定
  useEffect(() => {
    const embankmentType = form.watch("embankmentType")
    const backgroundType = form.watch("backgroundType")

    if (embankmentType && backgroundType) {
      const calculatedPriority = calculatePriority(embankmentType, backgroundType)
      form.setValue("priority", calculatedPriority)
    }
  }, [form.watch("embankmentType"), form.watch("backgroundType"), form])

  // APIキーの取得
  useEffect(() => {
    const fetchApiKey = async () => {
      if (apiKey) return // すでにAPIキーがある場合は何もしない

      try {
        addDebugInfo("APIキーを取得中...")
        const response = await fetch("/api/maps-key")
        if (!response.ok) {
          throw new Error(`APIキー取得エラー (${response.status})`)
        }

        const data = await response.json()
        addDebugInfo(`APIキー取得成功: ${data.apiKey ? "成功" : "失敗"}`)

        if (data.apiKey) {
          setApiKey(data.apiKey)
        } else {
          throw new Error("APIキーが返されませんでした")
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        addDebugInfo(`APIキー取得エラー: ${errorMessage}`)
        setLoadError(`APIキーの取得に失敗しました: ${errorMessage}`)
      }
    }

    fetchApiKey()
  }, [apiKey])

  // Google Maps APIのロード状態を監視
  useEffect(() => {
    if (
      (activeTab !== "map" && !images.some((img) => img.gpsLocation && !img.address)) ||
      !apiKey ||
      typeof window === "undefined"
    )
      return

    addDebugInfo("Google Maps APIをロードします")
    setIsLoadingMap(true)

    // すでにGoogle Maps APIがロードされているか確認
    if (window.google && window.google.maps) {
      addDebugInfo("Google Maps APIはすでにロードされています")
      if (activeTab === "map" && !isMapInitialized) {
        initializeMap()
      }

      // Geocoderの初期化を試みる
      if (!geocoder && window.google.maps.Geocoder) {
        try {
          const geocoderInstance = new window.google.maps.Geocoder()
          setGeocoder(geocoderInstance)

          // テスト用のダミーリクエストでAPIの権限を確認
          geocoderInstance.geocode(
            { location: { lat: 35.6812, lng: 139.7671 } }, // 東京駅の座標
            (results, status) => {
              if (status === "REQUEST_DENIED") {
                addDebugInfo("Geocoding APIの権限がありません")
                setLoadError("Geocoding APIの権限がありません。座標のみ表示します。")
              }
            },
          )
        } catch (error) {
          addDebugInfo(`Geocoder初期化エラー: ${error}`)
        }
      }
      return
    }

    // コールバック関数を設定
    window.googleMapsCallback = () => {
      addDebugInfo("Google Maps APIコールバックが呼び出されました")
      if (activeTab === "map") {
        initializeMap()
      }

      // Geocoderの初期化を試みる
      if (window.google.maps.Geocoder) {
        try {
          const geocoderInstance = new window.google.maps.Geocoder()
          setGeocoder(geocoderInstance)

          // テスト用のダミーリクエストでAPIの権限を確認
          geocoderInstance.geocode(
            { location: { lat: 35.6812, lng: 139.7671 } }, // 東京駅の座標
            (results, status) => {
              if (status === "REQUEST_DENIED") {
                addDebugInfo("Geocoding APIの権限がありません")
                setLoadError("Geocoding APIの権限がありません。座標のみ表示します。")
              }
            },
          )
        } catch (error) {
          addDebugInfo(`Geocoder初期化エラー: ${error}`)
        }
      }
    }

    // スクリプトを作成
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=googleMapsCallback`
    script.async = true
    script.defer = true
    script.id = "google-maps-script"

    // エラーハンドリング
    script.onerror = () => {
      addDebugInfo("Google Maps APIスクリプトのロードに失敗しました")
      setLoadError("Google Maps APIの読み込みに失敗しました")
      setIsLoadingMap(false)
    }

    // すでにスクリプトが存在するか確認
    const existingScript = document.getElementById("google-maps-script")
    if (existingScript) {
      addDebugInfo("既存のGoogle Maps APIスクリプトを削除します")
      existingScript.remove()
    }

    addDebugInfo("Google Maps APIスクリプトを追加します")
    document.head.appendChild(script)

    // クリーンアップ
    return () => {
      if (window.googleMapsCallback) {
        delete window.googleMapsCallback
      }
    }
  }, [activeTab, apiKey, isMapInitialized, images, geocoder])

  // 住所の取得
  useEffect(() => {
    if (!geocoder) return

    // 住所が未取得のGPS情報を持つ画像を探す
    const imagesNeedingAddress = images.filter((img) => img.gpsLocation && !img.address && !isLoadingAddress[img.id])

    if (imagesNeedingAddress.length === 0) return

    // 各画像の住所を取得
    imagesNeedingAddress.forEach((image) => {
      // ローディング状態を設定
      setIsLoadingAddress((prev) => ({ ...prev, [image.id]: true }))

      addDebugInfo(`画像 ${image.id} の住所を取得中...`)

      // 緯度・経度が0,0の場合は住所取得をスキップ
      if (image.gpsLocation.lat === 0 && image.gpsLocation.lng === 0) {
        addDebugInfo(`緯度・経度が0,0のため住所取得をスキップします: ${image.id}`)
        setImages((prevImages) =>
          prevImages.map((img) => (img.id === image.id ? { ...img, address: "座標が無効です" } : img)),
        )
        setIsLoadingAddress((prev) => {
          const newState = { ...prev }
          delete newState[image.id]
          return newState
        })
        return
      }

      geocoder.geocode({ location: image.gpsLocation }, (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          const address = results[0].formatted_address
          addDebugInfo(`住所取得成功: ${address}`)

          // 画像情報を更新
          setImages((prevImages) => prevImages.map((img) => (img.id === image.id ? { ...img, address } : img)))
        } else {
          addDebugInfo(`住所取得失敗: ${status}`)

          // APIキーの権限エラーの場合
          if (status === "REQUEST_DENIED") {
            // 住所取得機能が利用できないことを記録
            setLoadError("Geocoding APIが利用できません。APIキーの権限を確認してください。")
          }

          // エラーの場合でも住所欄に「取得できません」と表示
          setImages((prevImages) =>
            prevImages.map((img) => (img.id === image.id ? { ...img, address: "住所を取得できません" } : img)),
          )
        }

        // ローディング状態を解除
        setIsLoadingAddress((prev) => {
          const newState = { ...prev }
          delete newState[image.id]
          return newState
        })
      })
    })
  }, [geocoder, images, isLoadingAddress])

  // マップの初期化
  const initializeMap = () => {
    try {
      if (!mapRef.current) {
        addDebugInfo("マップコンテナが見つかりません")
        setLoadError("マップコンテナが見つかりません")
        setIsLoadingMap(false)
        return
      }

      addDebugInfo("マップを初期化します")

      // 静岡県の中心付近
      const defaultCenter = { lat: 34.97, lng: 138.38 }

      // マップオプションを設定
      const mapOptions = {
        center: defaultCenter,
        zoom: 10,
        mapTypeId: "roadmap",
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      }

      // マップを作成
      const mapInstance = new window.google.maps.Map(mapRef.current, mapOptions)

      // InfoWindowを作成
      const infoWindow = new window.google.maps.InfoWindow({
        maxWidth: 300,
      })

      addDebugInfo("マップとInfoWindowが作成されました")

      setMap(mapInstance)
      setMapInfoWindow(infoWindow)
      setIsMapInitialized(true)
      setIsLoadingMap(false)

      // Geocoderを初期化
      if (!geocoder && window.google.maps.Geocoder) {
        try {
          const geocoderInstance = new window.google.maps.Geocoder()
          setGeocoder(geocoderInstance)

          // テスト用のダミーリクエストでAPIの権限を確認
          geocoderInstance.geocode(
            { location: { lat: 35.6812, lng: 139.7671 } }, // 東京駅の座標
            (results, status) => {
              if (status === "REQUEST_DENIED") {
                addDebugInfo("Geocoding APIの権限がありません")
                setLoadError("Geocoding APIの権限がありません。座標のみ表示します。")
              }
            },
          )
        } catch (error) {
          addDebugInfo(`Geocoder初期化エラー: ${error}`)
        }
      }

      // マップのリサイズイベントを発火（初期表示のため）
      setTimeout(() => {
        addDebugInfo("マップリサイズイベントを発火します")
        window.google.maps.event.trigger(mapInstance, "resize")
        mapInstance.setCenter(defaultCenter)

        // マーカーがある場合は表示
        if (markers.length > 0) {
          addDebugInfo(`${markers.length}個のマーカーを表示します`)
          updateMapMarkers(mapInstance, infoWindow)
        }
      }, 500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addDebugInfo(`マップの初期化に失敗しました: ${errorMessage}`)
      setLoadError(`マップの初期化に失敗しました: ${errorMessage}`)
      setIsLoadingMap(false)
    }
  }

  // マーカーの更新
  const updateMapMarkers = (mapInstance: any, infoWindow: any) => {
    try {
      // 既存のマーカーをクリア
      mapMarkers.forEach((marker) => marker.setMap(null))

      if (!mapInstance || !window.google) {
        addDebugInfo("マップインスタンスまたはGoogle APIが利用できません")
        return
      }

      addDebugInfo(`${markers.length}個のマーカーを更新します`)

      // 新しいマーカーを作成
      const newMapMarkers = markers.map((marker) => {
        // マーカーの位置情報を確認
        addDebugInfo(
          `マーカー作成: ID=${marker.id}, 位置=${JSON.stringify(marker.position)}, 画像インデックス=${marker.imageIndex}`,
        )

        // 対応する画像情報を取得
        const image = images[marker.imageIndex]
        if (!image) {
          addDebugInfo(`警告: インデックス ${marker.imageIndex} の画像が見つかりません`)
        }

        // マーカーの位置情報と画像のGPS情報が一致しているか確認
        if (image && image.gpsLocation) {
          const imgPos = image.gpsLocation
          const markerPos = marker.position

          if (imgPos.lat !== markerPos.lat || imgPos.lng !== markerPos.lng) {
            addDebugInfo(`警告: マーカー位置と画像GPS情報が一致しません:
              マーカー: ${JSON.stringify(markerPos)}
              画像GPS: ${JSON.stringify(imgPos)}`)

            // 位置情報を画像のGPS情報に合わせて修正
            marker.position = { ...imgPos }
          }
        }

        const mapMarker = new window.google.maps.Marker({
          position: marker.position,
          map: mapInstance,
          title: `画像 ${marker.imageIndex + 1}: ${images[marker.imageIndex]?.file.name || ""}`,
          animation: window.google.maps.Animation.DROP,
        })

        // マーカークリック時のイベントハンドラ
        mapMarker.addListener("click", () => {
          if (infoWindow) {
            const image = images[marker.imageIndex]

            if (!image) {
              addDebugInfo(
                `エラー: クリックされたマーカーに対応する画像が見つかりません (インデックス: ${marker.imageIndex})`,
              )
              return
            }

            // InfoWindowの内容を設定
            const content = `
              <div class="p-2">
                <div class="font-bold mb-1">画像: ${image.file.name}</div>
                <div class="text-xs">
                  <div>緯度: ${image.gpsLocation?.lat.toFixed(6) || "不明"}</div>
                  <div>経度: ${image.gpsLocation?.lng.toFixed(6) || "不明"}</div>
                  ${image.address ? `<div class="mt-1 font-medium">住所: ${image.address}</div>` : ""}
                </div>
              </div>
            `

            infoWindow.setContent(content)
            infoWindow.open(mapInstance, mapMarker)

            // アクティブな吹き出しを設定
            setActiveInfoWindow({
              markerId: marker.id,
              isOpen: true,
              isMinimized: true, // 初期表示時は最小化状態
            })
          }
        })

        return mapMarker
      })

      setMapMarkers(newMapMarkers)

      // マーカーがある場合は地図の表示領域を調整
      if (newMapMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        markers.forEach((marker) => {
          bounds.extend(marker.position)
        })
        mapInstance.fitBounds(bounds)

        // マーカーが1つだけの場合はズームレベルを調整
        if (markers.length === 1) {
          mapInstance.setZoom(15)
        }

        addDebugInfo("マーカーに合わせて表示領域を調整しました")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addDebugInfo(`マーカーの更新に失敗しました: ${errorMessage}`)
    }
  }

  // マーカーが変更された時にマップマーカーを更新
  useEffect(() => {
    if (isMapInitialized && map && mapInfoWindow) {
      addDebugInfo("マーカーの変更を検出しました")
      updateMapMarkers(map, mapInfoWindow)
    }
  }, [markers, isMapInitialized, map, mapInfoWindow])

  // タブ切り替え時のマップリサイズ処理
  useEffect(() => {
    addDebugInfo(`タブが切り替わりました: ${activeTab}`)

    if (activeTab === "map" && map && window.google && isMapInitialized) {
      // マップのリサイズイベントを発火
      setTimeout(() => {
        addDebugInfo("タブ切り替え後のマップリサイズイベントを発火します")
        window.google.maps.event.trigger(map, "resize")

        // マーカーがある場合は表示領域を調整
        if (markers.length > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          markers.forEach((marker) => {
            bounds.extend(marker.position)
          })
          map.fitBounds(bounds)
          addDebugInfo("マーカーに合わせて表示領域を調整しました")
        } else {
          // マーカーがない場合はデフォルトの中心位置とズームレベルを設定
          map.setCenter({ lat: 34.97, lng: 138.38 })
          map.setZoom(10)
          addDebugInfo("デフォルトの中心位置とズームレベルを設定しました")
        }
      }, 500)
    }
  }, [activeTab, map, markers, isMapInitialized])

  // ファイル名から緯度・経度を抽出する関数
  const extractGpsFromFilename = (file: File): { lat: number; lng: number } | null => {
    try {
      const fileName = file.name
      addDebugInfo(`ファイル名からGPS情報の抽出を試みます: ${fileName}`)

      // パターン1: 緯度：経度：のパターンを検索
      // 例: "地点A_緯度：35.681236：経度：139.767125：.jpg"
      const latMatch1 = fileName.match(/緯度[：:]([\d.-]+)[：:]/)
      const lngMatch1 = fileName.match(/経度[：:]([\d.-]+)[：:]/)

      if (latMatch1 && lngMatch1) {
        const lat = Number.parseFloat(latMatch1[1])
        const lng = Number.parseFloat(lngMatch1[1])

        // 有効な数値かチェック
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          addDebugInfo(`ファイル名から抽出したGPS情報(パターン1): 緯度=${lat}, 経度=${lng}`)
          return { lat, lng }
        }
      }

      // パターン2: "地点B_35.681236_139.767125.jpg"
      const coordsMatch = fileName.match(/([\d.-]+)_([\d.-]+)/)
      if (coordsMatch) {
        const lat = Number.parseFloat(coordsMatch[1])
        const lng = Number.parseFloat(coordsMatch[2])

        // 有効な数値かつ妥当な範囲内かチェック
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          addDebugInfo(`ファイル名から抽出したGPS情報(パターン2): 緯度=${lat}, 経度=${lng}`)
          return { lat, lng }
        }
      }

      // パターン3: 緯度と経度が括弧内にある場合
      // 例: "地点C(35.681236,139.767125).jpg"
      const bracketMatch = fileName.match(/$$([\d.-]+),([\d.-]+)$$/)
      if (bracketMatch) {
        const lat = Number.parseFloat(bracketMatch[1])
        const lng = Number.parseFloat(bracketMatch[2])

        // 有効な数値かつ妥当な範囲内かチェック
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          addDebugInfo(`ファイル名から抽出したGPS情報(パターン3): 緯度=${lat}, 経度=${lng}`)
          return { lat, lng }
        }
      }

      // パターン4: 緯度と経度がカンマ区切りで含まれる場合
      // 例: "地点D_35.681236,139.767125.jpg"
      const commaMatch = fileName.match(/([\d.-]+),([\d.-]+)/)
      if (commaMatch) {
        const lat = Number.parseFloat(commaMatch[1])
        const lng = Number.parseFloat(commaMatch[2])

        // 有効な数値かつ妥当な範囲内かチェック
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          addDebugInfo(`ファイル名から抽出したGPS情報(パターン4): 緯度=${lat}, 経度=${lng}`)
          return { lat, lng }
        }
      }

      addDebugInfo(`ファイル名からGPS情報を抽出できませんでした: ${fileName}`)
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addDebugInfo(`ファイル名からのGPS情報抽出に失敗しました: ${errorMessage}`)
      return null
    }
  }

  // ExifデータからGPS情報を抽出する関数（完全に修正版）
  const extractGpsFromExif = (exifData: any): { lat: number; lng: number } | null => {
    try {
      // GPS情報が存在するか確認
      if (!exifData) {
        addDebugInfo("Exifデータがありません")
        return null
      }

      // 利用可能なGPSタグをログに記録
      const gpsKeys = Object.keys(exifData).filter((key) => key.startsWith("GPS"))
      addDebugInfo(`利用可能なGPSタグ: ${gpsKeys.join(", ")}`)

      // すべてのExifタグを詳細にログ出力（デバッグ用）
      addDebugInfo(`すべてのExifタグ: ${Object.keys(exifData).join(", ")}`)

      // GPSLatitude/GPSLongitudeタグがない場合
      if (!exifData.GPSLatitude || !exifData.GPSLongitude) {
        addDebugInfo("GPSLatitudeまたはGPSLongitudeタグがありません")
        return null
      }

      // ExifReaderのデータ構造をデバッグ
      addDebugInfo(`GPSLatitude構造: ${JSON.stringify(exifData.GPSLatitude)}`)
      addDebugInfo(`GPSLongitude構造: ${JSON.stringify(exifData.GPSLongitude)}`)

      // 方角の取得
      const latRef = exifData.GPSLatitudeRef && exifData.GPSLatitudeRef.value ? exifData.GPSLatitudeRef.value : "N"
      const lngRef = exifData.GPSLongitudeRef && exifData.GPSLongitudeRef.value ? exifData.GPSLongitudeRef.value : "E"

      addDebugInfo(`緯度方角: ${latRef}, 経度方角: ${lngRef}`)

      // 緯度・経度の値を取得
      let latitude = null
      let longitude = null

      // 正確なExifReader形式での度分秒取得
      if (exifData.GPSLatitude && exifData.GPSLatitude.value && Array.isArray(exifData.GPSLatitude.value)) {
        const dmsValues = exifData.GPSLatitude.value
        addDebugInfo(`緯度DMS値: ${JSON.stringify(dmsValues)}`)

        // 度、分、秒の取得
        let degrees = 0,
          minutes = 0,
          seconds = 0

        // 度の取得
        if (
          dmsValues[0] &&
          typeof dmsValues[0] === "object" &&
          "numerator" in dmsValues[0] &&
          "denominator" in dmsValues[0]
        ) {
          degrees = dmsValues[0].numerator / dmsValues[0].denominator
        }

        // 分の取得
        if (
          dmsValues[1] &&
          typeof dmsValues[1] === "object" &&
          "numerator" in dmsValues[1] &&
          "denominator" in dmsValues[1]
        ) {
          minutes = dmsValues[1].numerator / dmsValues[1].denominator
        }

        // 秒の取得
        if (
          dmsValues[2] &&
          typeof dmsValues[2] === "object" &&
          "numerator" in dmsValues[2] &&
          "denominator" in dmsValues[2]
        ) {
          seconds = dmsValues[2].numerator / dmsValues[2].denominator
        }

        // 10進数に変換
        latitude = degrees + minutes / 60 + seconds / 3600
        addDebugInfo(`緯度計算: ${degrees}° + (${minutes}' / 60) + (${seconds}" / 3600) = ${latitude}`)
      }

      if (exifData.GPSLongitude && exifData.GPSLongitude.value && Array.isArray(exifData.GPSLongitude.value)) {
        const dmsValues = exifData.GPSLongitude.value
        addDebugInfo(`経度DMS値: ${JSON.stringify(dmsValues)}`)

        // 度、分、秒の取得
        let degrees = 0,
          minutes = 0,
          seconds = 0

        // 度の取得
        if (
          dmsValues[0] &&
          typeof dmsValues[0] === "object" &&
          "numerator" in dmsValues[0] &&
          "denominator" in dmsValues[0]
        ) {
          degrees = dmsValues[0].numerator / dmsValues[0].denominator
        }

        // 分の取得
        if (
          dmsValues[1] &&
          typeof dmsValues[1] === "object" &&
          "numerator" in dmsValues[1] &&
          "denominator" in dmsValues[1]
        ) {
          minutes = dmsValues[1].numerator / dmsValues[1].denominator
        }

        // 秒の取得
        if (
          dmsValues[2] &&
          typeof dmsValues[2] === "object" &&
          "numerator" in dmsValues[2] &&
          "denominator" in dmsValues[2]
        ) {
          seconds = dmsValues[2].numerator / dmsValues[2].denominator
        }

        // 10進数に変換
        longitude = degrees + minutes / 60 + seconds / 3600
        addDebugInfo(`経度計算: ${degrees}° + (${minutes}' / 60) + (${seconds}" / 3600) = ${longitude}`)
      }

      // 緯度・経度が取得できなかった場合
      if (latitude === null || longitude === null) {
        addDebugInfo("緯度または経度の値を取得できませんでした")
        return null
      }

      // 南緯・西経の場合は負の値にする
      const finalLat = latRef === "S" ? -latitude : latitude
      const finalLng = lngRef === "W" ? -longitude : longitude

      // NaNチェック
      if (isNaN(finalLat) || isNaN(finalLng)) {
        addDebugInfo(`GPS座標の変換に失敗しました: 緯度=${finalLat}, 経度=${finalLng}`)
        return null
      }

      // 有効な範囲内かチェック
      if (Math.abs(finalLat) > 90 || Math.abs(finalLng) > 180) {
        addDebugInfo(`GPS座標が有効な範囲外です: 緯度=${finalLat}, 経度=${finalLng}`)
        return null
      }

      addDebugInfo(`最終GPS座標: 緯度=${finalLat}, 経度=${finalLng}`)
      return {
        lat: Number.parseFloat(finalLat.toFixed(6)),
        lng: Number.parseFloat(finalLng.toFixed(6)),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addDebugInfo(`GPS情報の抽出に失敗しました: ${errorMessage}`)
      return null
    }
  }

  // 画像のアップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files)
    if (images.length + newFiles.length > 5) {
      toast({
        title: "画像アップロードエラー",
        description: "画像は最大5枚までアップロードできます",
        variant: "destructive",
      })
      return
    }

    addDebugInfo(`${newFiles.length}枚の画像がアップロードされました`)

    // 新しい画像を処理
    Promise.all(
      newFiles.map(async (file) => {
        // 画像からGPS情報を抽出
        let gpsLocation = null
        let exifData = null
        let rawExifData = null

        try {
          // まずファイル名からGPS情報の抽出を試みる
          gpsLocation = extractGpsFromFilename(file)

          // ファイル名から抽出できなかった場合はExifから抽出を試みる
          if (!gpsLocation) {
            const result = await extractExifData(file)
            gpsLocation = result.gpsLocation
            exifData = result.exifData
            rawExifData = result.rawExifData
          } else {
            addDebugInfo(`ファイル名から直接GPS情報を抽出しました: ${JSON.stringify(gpsLocation)}`)
          }

          // GPS情報が取得できなかった場合
          if (!gpsLocation) {
            addDebugInfo(`GPS情報が取得できませんでした: ${file.name}`)
            // GPS情報なしとして処理
            return {
              id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              file,
              exifData,
              rawExifData,
            }
          }

          // GPS情報が無効な場合
          if (isNaN(gpsLocation.lat) || isNaN(gpsLocation.lng)) {
            addDebugInfo(`無効なGPS情報です: ${JSON.stringify(gpsLocation)}`)
            // GPS情報なしとして処理
            return {
              id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              file,
              exifData,
              rawExifData,
            }
          }

          // 有効なGPS情報が取得できた場合
          return {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            gpsLocation,
            exifData,
            rawExifData,
          }
        } catch (error) {
          addDebugInfo(`GPS情報の抽出に失敗しました: ${error}`)
          // GPS情報なしとして処理
          return {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            exifData,
            rawExifData,
          }
        }
      }),
    ).then((newImageInfos) => {
      // 既存の画像と新しい画像を結合
      setImages((prevImages) => {
        const updatedImages = [...prevImages, ...newImageInfos]

        // GPS情報を持つ画像に対応するマーカーを作成
        const newMarkers = newImageInfos
          .filter((img) => img.gpsLocation)
          .map((img, idx) => {
            const imageIndex = prevImages.length + idx
            addDebugInfo(`マーカーを作成: 画像インデックス ${imageIndex}, 位置: ${JSON.stringify(img.gpsLocation)}`)

            return {
              id: `marker_${img.id}`,
              position: img.gpsLocation!,
              imageIndex: imageIndex,
            }
          })

        // マーカーを更新
        if (newMarkers.length > 0) {
          setMarkers((prevMarkers) => [...prevMarkers, ...newMarkers])
        }

        return updatedImages
      })
    })

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 画像からExif情報を抽出する関数（改善版）
  const extractExifData = async (
    file: File,
  ): Promise<{ gpsLocation: { lat: number; lng: number } | null; exifData: any; rawExifData: any }> => {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        if (!e.target || !e.target.result) {
          addDebugInfo(`ファイル読み込み結果がありません: ${file.name}`)
          resolve({ gpsLocation: null, exifData: null, rawExifData: null })
          return
        }

        try {
          // ExifReaderを使用してExif情報を抽出
          const exifData = await ExifReader.load(e.target.result as ArrayBuffer)
          addDebugInfo(`Exifデータを読み込みました: ${file.name}`)

          // 生のExifデータを保存（デバッグ用）
          const rawExifData = JSON.parse(JSON.stringify(exifData))

          // デバッグ: 利用可能なExifタグを表示
          const availableTags = Object.keys(exifData).filter(
            (tag) => tag.startsWith("GPS") || ["Make", "Model", "DateTime"].includes(tag),
          )
          addDebugInfo(`利用可能なExifタグ: ${availableTags.join(", ")}`)

          // すべてのExifタグを表示（デバッグ用）
          addDebugInfo(`すべてのExifタグ: ${Object.keys(exifData).join(", ")}`)

          // GPS情報を抽出
          const gpsLocation = extractGpsFromExif(exifData)

          if (gpsLocation && !isNaN(gpsLocation.lat) && !isNaN(gpsLocation.lng)) {
            addDebugInfo(`GPS情報を抽出しました: ${JSON.stringify(gpsLocation)} (ファイル: ${file.name})`)
            resolve({ gpsLocation, exifData, rawExifData })
          } else {
            addDebugInfo(`Exifからの有効なGPS情報が見つかりませんでした: ${file.name}、ファイル名からの抽出を試みます`)

            // ファイル名からGPS情報の抽出を試みる
            const gpsFromFilename = extractGpsFromFilename(file)

            if (gpsFromFilename) {
              addDebugInfo(`ファイル名からGPS情報を抽出しました: ${JSON.stringify(gpsFromFilename)}`)
              resolve({ gpsLocation: gpsFromFilename, exifData, rawExifData })
            } else {
              addDebugInfo(`ファイル名からもGPS情報を抽出できませんでした: ${file.name}`)
              // GPS情報なしとして処理
              resolve({ gpsLocation: null, exifData, rawExifData })
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          addDebugInfo(`Exifデータの解析に失敗しました: ${errorMessage}`)

          // ファイル名からGPS情報の抽出を試みる
          const gpsFromFilename = extractGpsFromFilename(file)

          if (gpsFromFilename) {
            addDebugInfo(`ファイル名からGPS情報を抽出しました: ${JSON.stringify(gpsFromFilename)}`)
            resolve({ gpsLocation: gpsFromFilename, exifData: null, rawExifData: null })
          } else {
            // GPS情報なしとして処理
            resolve({ gpsLocation: null, exifData: null, rawExifData: null })
          }
        }
      }

      reader.onerror = () => {
        addDebugInfo(`ファイルの読み込みに失敗しました: ${file.name}`)

        // ファイル名からGPS情報の抽出を試みる
        const gpsFromFilename = extractGpsFromFilename(file)

        if (gpsFromFilename) {
          addDebugInfo(`ファイル名からGPS情報を抽出しました: ${JSON.stringify(gpsFromFilename)}`)
          resolve({ gpsLocation: gpsFromFilename, exifData: null, rawExifData: null })
        } else {
          // GPS情報なしとして処理
          resolve({ gpsLocation: null, exifData: null, rawExifData: null })
        }
      }

      // ファイルをバイナリとして読み込む
      reader.readAsArrayBuffer(file)
    })
  }

  // 画像の削除
  const removeImage = (index: number) => {
    const imageToRemove = images[index]
    addDebugInfo(`画像を削除します: インデックス ${index}, ID ${imageToRemove.id}`)

    // 画像に関連するマーカーを削除
    const updatedMarkers = markers.filter((marker) => {
      return marker.imageIndex !== index
    })

    // インデックスを更新
    updatedMarkers.forEach((marker) => {
      if (marker.imageIndex > index) {
        addDebugInfo(`マーカーのインデックスを更新: ${marker.imageIndex} -> ${marker.imageIndex - 1}`)
        marker.imageIndex -= 1
      }
    })

    // マーカーを更新
    setMarkers(updatedMarkers)

    // 画像を削除
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    // InfoWindowが開いている場合は閉じる
    if (mapInfoWindow) {
      mapInfoWindow.close()
      setActiveInfoWindow(null)
    }

    // 選択中の画像が削除された場合、選択をクリア
    if (selectedImageIndex === index) {
      setSelectedImageIndex(null)
      setManualLat("")
      setManualLng("")
    } else if (selectedImageIndex !== null && selectedImageIndex > index) {
      // 選択中の画像より前の画像が削除された場合、インデックスを調整
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  // 緯度・経度を表示用にフォーマット
  const formatCoordinate = (coord: number | undefined): string => {
    if (coord === undefined || isNaN(coord)) return "不明"
    // 6桁の小数点で表示（約10cm精度）
    return coord.toFixed(6)
  }

  // 緯度・経度が有効かどうかを確認する関数を追加
  const isValidCoordinate = (lat?: number, lng?: number): boolean => {
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return false
    // 緯度・経度が両方とも0の場合は無効と判断（実際の0,0座標である可能性は非常に低い）
    if (lat === 0 && lng === 0) return false
    return true
  }

  // 地図の拡大/縮小を切り替え
  const toggleMapExpanded = () => {
    setMapExpanded(!mapExpanded)
    addDebugInfo(`マップサイズを${!mapExpanded ? "拡大" : "縮小"}します`)

    // 地図のサイズが変更されたことをGoogle Mapsに通知
    if (map && window.google) {
      // 少し遅延させてリサイズイベントを発火（DOMの更新後に実行するため）
      setTimeout(() => {
        addDebugInfo("マップサイズ変更後のリサイズイベントを発火します")
        window.google.maps.event.trigger(map, "resize")

        // マーカーがある場合は表示領域を調整
        if (markers.length > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          markers.forEach((marker) => {
            bounds.extend(marker.position)
          })
          map.fitBounds(bounds)
          addDebugInfo("マーカーに合わせて表示領域を調整しました")
        }
      }, 500)
    }
  }

  // フォーム送信ハンドラー
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // 画像情報を含めたデータを作成
      const formData = new FormData()

      // フォームの値をFormDataに追加
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value)
      })

      // 画像をFormDataに追加
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image.file)
        if (image.gpsLocation) {
          formData.append(`image_${index}_gps`, JSON.stringify(image.gpsLocation))
        }
        if (image.address) {
          formData.append(`image_${index}_address`, image.address)
        }
      })

      // 実際のAPIエンドポイントに送信する代わりに、送信シミュレーション
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "報告が送信されました",
        description: "被害報告が正常に送信されました。",
      })

      // フォームとイメージをリセット
      form.reset(defaultValues)
      setImages([])
      setMarkers([])

      // InfoWindowが開いている場合は閉じる
      if (mapInfoWindow) {
        mapInfoWindow.close()
        setActiveInfoWindow(null)
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // マップの再読み込み
  const reloadMap = () => {
    addDebugInfo("マップを再読み込みします")
    setLoadError(null)
    setIsMapInitialized(false)

    // Google Maps APIスクリプトを削除
    const script = document.getElementById("google-maps-script")
    if (script) {
      script.remove()
    }

    // コールバック関数をリセット
    if (window.googleMapsCallback) {
      delete window.googleMapsCallback
    }
  }

  // 緯度経度を度分秒形式に変換する関数
  const convertToDMS = (coordinate: number, isLatitude: boolean): string => {
    if (isNaN(coordinate)) return "不明"

    // 0,0の場合は特別なメッセージを返す
    if (coordinate === 0) return "位置情報なし"

    const absolute = Math.abs(coordinate)
    const degrees = Math.floor(absolute)
    const minutesNotTruncated = (absolute - degrees) * 60
    const minutes = Math.floor(minutesNotTruncated)
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2)

    const direction = isLatitude ? (coordinate >= 0 ? "N" : "S") : coordinate >= 0 ? "E" : "W"

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`
  }

  // 座標をクリップボードにコピー
  const copyCoordinatesToClipboard = (lat: number, lng: number) => {
    const text = `${lat}, ${lng}`
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "コピー成功",
          description: "座標をクリップボードにコピーしました",
        })
      },
      (err) => {
        toast({
          title: "コピー失敗",
          description: "座標のコピーに失敗しました",
          variant: "destructive",
        })
      },
    )
  }

  // Google Mapsで座標を開く
  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, "_blank")
  }

  // GPS座標をCSVとしてエクスポート
  const exportGpsAsCSV = () => {
    // GPS情報を持つ画像のみをフィルタリング
    const gpsImages = images.filter((img) => img.gpsLocation)

    if (gpsImages.length === 0) {
      toast({
        title: "エクスポートエラー",
        description: "GPS情報を持つ画像がありません",
        variant: "destructive",
      })
      return
    }

    // CSVヘッダー
    const csvHeader = "ファイル名,緯度,経度,住所\n"

    // CSVデータ行
    const csvRows = gpsImages.map((img) => {
      const fileName = img.file.name
      const lat = img.gpsLocation?.lat || ""
      const lng = img.gpsLocation?.lng || ""
      const address = img.address || ""

      // CSVフォーマットでエスケープ
      const escapedAddress = address.replace(/"/g, '""')

      return `"${fileName}",${lat},${lng},"${escapedAddress}"`
    })

    // CSVデータを作成
    const csvContent = csvHeader + csvRows.join("\n")

    // BlobとURLを作成
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    // ダウンロードリンクを作成して自動クリック
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `gps_coordinates_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()

    // クリーンアップ
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "エクスポート成功",
      description: "GPS座標をCSVファイルとしてエクスポートしました",
    })
  }

  // 手動で位置情報を設定
  const setManualCoordinates = () => {
    if (selectedImageIndex === null) return

    const lat = Number.parseFloat(manualLat)
    const lng = Number.parseFloat(manualLng)

    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      toast({
        title: "座標エラー",
        description: "有効な緯度・経度を入力してください",
        variant: "destructive",
      })
      return
    }

    // 画像の位置情報を更新
    setImages((prevImages) => {
      const updatedImages = [...prevImages]
      updatedImages[selectedImageIndex] = {
        ...updatedImages[selectedImageIndex],
        gpsLocation: { lat, lng },
      }
      return updatedImages
    })

    // 対応するマーカーを更新または作成
    const existingMarkerIndex = markers.findIndex((marker) => marker.imageIndex === selectedImageIndex)
    if (existingMarkerIndex >= 0) {
      // 既存のマーカーを更新
      setMarkers((prevMarkers) => {
        const updatedMarkers = [...prevMarkers]
        updatedMarkers[existingMarkerIndex] = {
          ...updatedMarkers[existingMarkerIndex],
          position: { lat, lng },
        }
        return updatedMarkers
      })
    } else {
      // 新しいマーカーを作成
      const newMarker = {
        id: `marker_manual_${Date.now()}`,
        position: { lat, lng },
        imageIndex: selectedImageIndex,
      }
      setMarkers((prevMarkers) => [...prevMarkers, newMarker])
    }

    // 住所情報をクリア（新しい座標に対応する住所を取得するため）
    setImages((prevImages) => {
      const updatedImages = [...prevImages]
      if (updatedImages[selectedImageIndex].address) {
        updatedImages[selectedImageIndex] = {
          ...updatedImages[selectedImageIndex],
          address: undefined,
        }
      }
      return updatedImages
    })

    toast({
      title: "座標設定完了",
      description: "画像の位置情報を手動で設定しました",
    })
  }

  // 画像を選択して手動入力モードに切り替え
  const selectImageForManualInput = (index: number) => {
    setSelectedImageIndex(index)
    const image = images[index]
    if (image.gpsLocation) {
      setManualLat(image.gpsLocation.lat.toString())
      setManualLng(image.gpsLocation.lng.toString())
    } else {
      setManualLat("")
      setManualLng("")
    }
  }

  // Exifデータを表示
  const showExifData = (index: number) => {
    const image = images[index]
    if (!image.exifData && !image.rawExifData) {
      toast({
        title: "Exifデータなし",
        description: "この画像にはExifデータが含まれていません",
        variant: "destructive",
      })
      return
    }

    // Exifデータをモーダルで表示するために設定
    setCurrentExifData({
      fileName: image.file.name,
      exifData: image.exifData,
      rawExifData: image.rawExifData,
    })
    setShowExifModal(true)

    // コンソールにも出力（デバッグ用）
    console.log("Exifデータ:", image.exifData)
    console.log("生のExifデータ:", image.rawExifData)
  }

  // Exifデータを整形して表示用の文字列に変換
  const formatExifDataForDisplay = (data: any): string => {
    if (!data) return "データがありません"

    try {
      // GPS関連のタグを優先的に表示
      const gpsKeys = Object.keys(data).filter((key) => key.startsWith("GPS"))
      const otherKeys = Object.keys(data).filter((key) => !key.startsWith("GPS"))

      let result = "--- GPS情報 ---\n"
      gpsKeys.forEach((key) => {
        result += `${key}: ${JSON.stringify(data[key], null, 2)}\n`
      })

      result += "\n--- その他の情報 ---\n"
      otherKeys.forEach((key) => {
        result += `${key}: ${JSON.stringify(data[key], null, 2)}\n`
      })

      return result
    } catch (error) {
      return `データの整形に失敗しました: ${error}`
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>被害報告フォーム</CardTitle>
          <CardDescription>被害状況を報告するためのフォームです。必要事項を入力してください。</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormItem>
                  <FormLabel>報告事務所</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("office", value)}
                      value={form.watch("office") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office} value={office}>
                            {office}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div>
                <FormItem>
                  <FormLabel>災害種別</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("disasterType", value)}
                      value={form.watch("disasterType") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {disasterTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div>
                <FormItem>
                  <FormLabel>工種</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("workType", value)}
                      value={form.watch("workType") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            </div>

            <FormItem>
              <FormLabel>件名</FormLabel>
              <FormControl>
                <Input placeholder="件名を入力してください" {...form.register("title")} />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormItem>
                  <FormLabel>右左岸</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("bankSide", value)}
                      value={form.watch("bankSide") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankSides.map((side) => (
                          <SelectItem key={side} value={side}>
                            {side}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div>
                <FormItem>
                  <FormLabel>堤防</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("embankmentType", value)}
                      value={form.watch("embankmentType") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {embankmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div>
                <FormItem>
                  <FormLabel>背後地</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("backgroundType", value)}
                      value={form.watch("backgroundType") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {backgroundTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div>
                <FormItem>
                  <FormLabel>優先度</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => form.setValue("priority", value)}
                      value={form.watch("priority") || ""}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            </div>

            <FormItem>
              <FormLabel>本文</FormLabel>
              <FormControl>
                <Input placeholder="本文を入力してください" {...form.register("content")} />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>画像</FormLabel>
              <FormControl>
                <Input type="file" multiple ref={fileInputRef} onChange={handleImageUpload} />
              </FormControl>
              <FormMessage />
            </FormItem>

            {/* 画像プレビュー */}
            {images.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={URL.createObjectURL(image.file) || "/placeholder.svg"}
                        alt={image.file.name}
                        className="w-full h-auto rounded-md"
                      />
                      <div className="absolute top-0 right-0 p-2">
                        <button
                          type="button"
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                          onClick={() => removeImage(index)}
                        >
                          削除
                        </button>
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="font-medium">{image.file.name}</div>
                        {image.gpsLocation && isValidCoordinate(image.gpsLocation?.lat, image.gpsLocation?.lng) ? (
                          <>
                            <div>緯度: {formatCoordinate(image.gpsLocation?.lat)}</div>
                            <div>経度: {formatCoordinate(image.gpsLocation?.lng)}</div>
                            <div>緯度(度分秒): {convertToDMS(image.gpsLocation?.lat, true)}</div>
                            <div>経度(度分秒): {convertToDMS(image.gpsLocation?.lng, false)}</div>
                          </>
                        ) : (
                          <div className="text-red-500 font-medium">位置情報が取得できませんでした</div>
                        )}
                        {image.address && <div>住所: {image.address}</div>}
                        <div className="mt-2 flex space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => selectImageForManualInput(index)}
                          >
                            座標編集
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => showExifData(index)}>
                            Exif情報
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 手動座標入力フォーム */}
                {selectedImageIndex !== null && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>位置情報の手動設定</CardTitle>
                      <CardDescription>
                        画像「{images[selectedImageIndex]?.file.name}」の位置情報を手動で設定します
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>緯度</FormLabel>
                          <Input
                            type="text"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            placeholder="例: 35.681236"
                          />
                          <p className="text-xs text-gray-500 mt-1">-90から90の間の値を入力してください</p>
                        </div>
                        <div>
                          <FormLabel>経度</FormLabel>
                          <Input
                            type="text"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            placeholder="例: 139.767125"
                          />
                          <p className="text-xs text-gray-500 mt-1">-180から180の間の値を入力してください</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button type="button" variant="outline" onClick={() => setSelectedImageIndex(null)}>
                          キャンセル
                        </Button>
                        <Button type="button" onClick={setManualCoordinates}>
                          座標を設定
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Exifデータモーダル */}
                {showExifModal && currentExifData && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
                      <CardHeader>
                        <CardTitle>Exif情報: {currentExifData.fileName}</CardTitle>
                        <CardDescription>画像に含まれるExifメタデータ</CardDescription>
                      </CardHeader>
                      <CardContent className="overflow-auto max-h-[60vh]">
                        <Textarea
                          readOnly
                          className="font-mono text-xs h-96"
                          value={formatExifDataForDisplay(currentExifData.rawExifData)}
                        />
                      </CardContent>
                      <div className="p-4 flex justify-end">
                        <Button type="button" onClick={() => setShowExifModal(false)}>
                          閉じる
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* デバッグ情報表示トグル */}
                <div className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDebug(!showDebug)}>
                    {showDebug ? "デバッグ情報を隠す" : "デバッグ情報を表示"}
                  </Button>
                  {showDebug && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-md text-xs font-mono h-64 overflow-auto">
                      {debugInfo.map((info, i) => (
                        <div key={i}>{info}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              {isSubmitting ? "送信中..." : "送信"}
            </button>
          </form>
        </Form>
      </Card>
    </div>
  )
}
