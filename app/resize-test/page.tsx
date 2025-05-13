"use client"

import { useState } from "react"
import InfoCard from "@/components/info-card"

export default function ResizeTestPage() {
  const [isMinimized, setIsMinimized] = useState(false)

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">InfoCard リサイズテスト</h1>
      <p className="mb-6">
        各InfoCardの右下にあるリサイズハンドル（ワッフル模様のアイコン）をドラッグして、サイズを変更できます。
        Shiftキーを押しながらリサイズすると、アスペクト比が固定されます。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">切り替え可能な最小化状態</h2>
          <div className="flex justify-center">
            <InfoCard
              title="東京タワー"
              description="東京タワーは、東京都港区芝公園にある総合電波塔です。高さは333メートルで、1958年に完成しました。"
              image="/tokyo-tower-night.png"
              category="観光スポット"
              categoryColor="#FF5722"
              severity="low"
              status="resolved"
              city="東京都港区"
              reportDate="2023-05-15"
              isMinimized={isMinimized}
              onToggleMinimize={toggleMinimize}
            />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">常に最小化状態</h2>
          <div className="flex justify-center">
            <InfoCard
              title="渋谷スクランブル交差点"
              description="渋谷スクランブル交差点は、東京都渋谷区にある世界的に有名な交差点です。一度に3,000人以上の人が横断することもあります。"
              image="/shibuya-scramble.png"
              category="交通"
              categoryColor="#2196F3"
              severity="medium"
              status="investigating"
              city="東京都渋谷区"
              reportDate="2023-06-20"
              isMinimized={true}
            />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">常に拡大状態</h2>
          <div className="flex justify-center">
            <InfoCard
              title="東京スカイツリー"
              description="東京スカイツリーは、東京都墨田区にある電波塔です。高さは634メートルで、2012年に完成しました。世界一高い自立式電波塔として知られています。"
              image="/tokyo-skytree-night.png"
              category="観光スポット"
              categoryColor="#9C27B0"
              severity="high"
              status="in_progress"
              city="東京都墨田区"
              reportDate="2023-07-10"
            />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">画像サイズテスト</h2>
          <div className="flex justify-center">
            <InfoCard
              title="新宿御苑"
              description="新宿御苑は、東京都新宿区と渋谷区にまたがる国民公園です。広大な敷地内には、日本庭園、フランス式庭園、イギリス式風景式庭園などがあります。"
              image="/shinjuku-gyoen-spring.png"
              category="公園"
              categoryColor="#4CAF50"
              severity="low"
              status="reported"
              city="東京都新宿区"
              reportDate="2023-08-05"
            />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">横長画像テスト</h2>
          <div className="flex justify-center">
            <InfoCard
              title="東京シティビュー"
              description="東京の美しい都市景観を一望できる絶景スポットです。高層ビル群と東京湾の眺めが特徴的です。"
              image="/tokyo-cityscape.png"
              category="景観"
              categoryColor="#FF9800"
              severity="medium"
              status="investigating"
              city="東京都"
              reportDate="2023-09-15"
            />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">縦長画像テスト</h2>
          <div className="flex justify-center">
            <InfoCard
              title="浅草寺"
              description="浅草寺は、東京都台東区にある浅草寺観音堂を中心とする東京都内最古の寺院です。雷門と仲見世通りで知られています。"
              image="/sensoji-asakusa.png"
              category="寺院"
              categoryColor="#795548"
              severity="critical"
              status="resolved"
              city="東京都台東区"
              reportDate="2023-10-20"
            />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">プレースホルダー画像</h2>
          <div className="flex justify-center">
            <InfoCard
              title="自由にリサイズしてみてください"
              description="このInfoCardは、リサイズ機能のテスト用です。右下のリサイズハンドルをドラッグして、サイズを変更してみてください。画像のサイズも追従して変化します。"
              image="/beautiful-tokyo-landscape.png"
              category="テスト"
              categoryColor="#607D8B"
              severity="low"
              status="investigating"
              city="テスト市"
              reportDate="2023-11-30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
