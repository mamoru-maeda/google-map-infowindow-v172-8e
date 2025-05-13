"use client"

import InfoCard from "./info-card"
import { useState } from "react"

export default function InfoCardSample() {
  const [isMinimized, setIsMinimized] = useState(false)

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8">InfoCard リサイズテスト</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">基本的なInfoCard</h2>
        <InfoCard
          title="東京タワー"
          description="東京タワーは、東京都港区芝公園にある総合電波塔の愛称である。正式名称は日本電波塔。2013年に東京スカイツリーにその座を譲るまでは、日本一の高さを誇っていた。"
          image="/tokyo-tower-night.png"
          category="観光スポット"
          categoryColor="#4CAF50"
          severity="low"
          reportDate="2023-05-15"
          status="reported"
          city="東京都港区"
          isMinimized={isMinimized}
          onToggleMinimize={handleToggleMinimize}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">最小化状態のInfoCard</h2>
        <InfoCard
          title="渋谷スクランブル交差点"
          description="渋谷スクランブル交差点は、東京都渋谷区にある交差点。JR渋谷駅のハチ公口前に位置し、一度に3,000人以上の人が行き交うことでも知られる世界的に有名な観光スポットです。"
          image="/shibuya-scramble.png"
          category="観光スポット"
          categoryColor="#2196F3"
          severity="medium"
          reportDate="2023-06-20"
          status="investigating"
          city="東京都渋谷区"
          isMinimized={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div>
          <h2 className="text-xl font-semibold mb-4">東京スカイツリー</h2>
          <InfoCard
            title="東京スカイツリー"
            description="東京スカイツリーは、東京都墨田区押上にある電波塔。高さは634mで、2012年に完成した当時は世界一高い自立式電波塔でした。展望台からは東京の街並みを一望できます。"
            image="/tokyo-skytree-night.png"
            category="観光スポット"
            categoryColor="#9C27B0"
            severity="high"
            reportDate="2023-07-10"
            status="in_progress"
            city="東京都墨田区"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">新宿御苑</h2>
          <InfoCard
            title="新宿御苑"
            description="新宿御苑は、東京都新宿区と渋谷区にまたがる国民公園。かつては江戸時代の大名屋敷で、明治時代には皇室の庭園となりました。現在は一般に開放され、四季折々の自然を楽しめる都会のオアシスです。"
            image="/shinjuku-gyoen-spring.png"
            category="公園"
            categoryColor="#FF9800"
            severity="low"
            reportDate="2023-08-05"
            status="resolved"
            city="東京都新宿区"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">浅草寺</h2>
          <InfoCard
            title="浅草寺"
            description="浅草寺は、東京都台東区浅草にある東京都内最古の寺院。628年に創建されたと伝えられています。雷門と仲見世通りは観光客に人気のスポットで、年間約3000万人が訪れる東京を代表する観光地です。"
            image="/sensoji-asakusa.png"
            category="寺院"
            categoryColor="#F44336"
            severity="critical"
            reportDate="2023-09-15"
            status="investigating"
            city="東京都台東区"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">カスタマイズ可能なInfoCard</h2>
          <InfoCard
            title="自由にリサイズしてみてください"
            description="このInfoCardは自由にリサイズできます。画像のサイズやフォントサイズが動的に調整されることを確認してください。Shiftキーを押しながらリサイズすると、アスペクト比が固定されます。"
            image="/tokyo-cityscape.png"
            category="テスト"
            categoryColor="#607D8B"
            severity="medium"
            reportDate="2023-10-20"
            status="in_progress"
            city="テスト市"
          />
        </div>
      </div>
    </div>
  )
}
