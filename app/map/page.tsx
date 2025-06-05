"use client"

import { useState, useEffect } from "react"
import MapContainer from "@/components/map-container"
import { disasterCategories } from "@/types/disaster-types"
import { generateDisasterMarkers } from "@/utils/generate-disaster-markers"
// 静的マーカーをインポート
import { staticDisasterMarkers } from "@/utils/static-markers"

export default function MapPage() {
  // クライアントサイドレンダリングを確認
  const [isClient, setIsClient] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    setIsClient(true)

    // エラーハンドリング
    const handleError = (event: ErrorEvent) => {
      console.error("グローバルエラーが発生しました:", event.error)
      setIsError(true)
      setErrorMessage(event.message || "マップの読み込み中にエラーが発生しました")
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("未処理のPromise拒否:", event.reason)
      setIsError(true)
      setErrorMessage("非同期処理でエラーが発生しました")
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  // 静岡県の中心座標（少し南に調整して全体が見えるように）
  const shizuokaCenterPosition = { lat: 34.95, lng: 138.38 }

  // 既存のコードを変更して、動的生成と静的マーカーを組み合わせる
  // 120個の災害マーカーを生成
  let disasterMarkers = []
  try {
    // 動的生成を試みる
    const dynamicMarkers = generateDisasterMarkers()

    // 動的マーカーが生成できた場合は使用、失敗した場合は静的マーカーを使用
    disasterMarkers = dynamicMarkers.length > 0 ? dynamicMarkers : staticDisasterMarkers

    // 動的マーカーが空の配列の場合も静的マーカーを使用
    if (disasterMarkers.length === 0) {
      console.log("動的マーカーが生成されませんでした。静的マーカーを使用します。")
      disasterMarkers = staticDisasterMarkers
    }
  } catch (error) {
    console.error("災害マーカーの生成に失敗しました:", error)
    console.log("静的マーカーを使用します。")
    disasterMarkers = staticDisasterMarkers
    setIsError(false) // エラー表示を抑制
  }

  // エラーが発生した場合はエラーメッセージを表示
  if (isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-4">
        <div className="w-full max-w-none">
          <h1 className="text-2xl font-bold mb-4">静岡県災害情報マップ</h1>
          <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200 mb-4">
            <h3 className="font-bold mb-2">エラーが発生しました</h3>
            <p>{errorMessage}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      </main>
    )
  }

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-4">
        <div className="w-full max-w-none">
          <h1 className="text-2xl font-bold mb-4">静岡県災害情報マップ</h1>
          <div className="w-full border rounded-lg overflow-hidden mx-auto" style={{ height: "calc(100vh - 200px)" }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="p-4 bg-white rounded-md shadow-md">
                <p className="mb-2">ページを読み込み中...</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-none">
        <h1 className="text-2xl font-bold mb-4">静岡県災害情報マップ</h1>
        <p className="mb-4 text-gray-600">
          静岡県内の災害情報をマップ上に表示しています。マーカーをクリックすると詳細情報が表示されます。
          吹き出しはドラッグ可能で、最小化したり閉じたりすることができます。
          カテゴリーでフィルタリングしたり、吹き出しを自動整列することもできます。
        </p>

        <div className="w-full border rounded-lg overflow-hidden mx-auto" style={{ height: "calc(100vh - 200px)" }}>
          <MapContainer
            center={shizuokaCenterPosition}
            zoom={9}
            markers={disasterMarkers}
            categories={disasterCategories}
          />
        </div>
      </div>
    </main>
  )
}
