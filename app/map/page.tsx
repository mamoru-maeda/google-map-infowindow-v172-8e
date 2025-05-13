"use client"

import MapContainer from "@/components/map-container"
import { disasterCategories } from "@/types/disaster-types"
import { generateDisasterMarkers } from "@/utils/generate-disaster-markers"

export default function MapPage() {
  // 静岡県の中心座標（少し南に調整して全体が見えるように）
  const shizuokaCenterPosition = { lat: 34.95, lng: 138.38 }

  // 120個の災害マーカーを生成
  const disasterMarkers = generateDisasterMarkers()

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
