import { type DisasterMarker, disasterCategories } from "@/types/disaster-types"

// 静岡県の4地域の定義（陸地の都市座標を基準）
const SHIZUOKA_REGIONS = {
  西部: {
    name: "西部",
    center: { lat: 34.7108, lng: 137.7261 }, // 浜松市中心
    cities: [
      { name: "浜松市", lat: 34.7108, lng: 137.7261, weight: 3 }, // 大都市なので重み付け
      { name: "磐田市", lat: 34.7167, lng: 137.8514, weight: 2 },
      { name: "掛川市", lat: 34.7697, lng: 138.0144, weight: 2 },
      { name: "袋井市", lat: 34.75, lng: 137.9167, weight: 1 },
      { name: "湖西市", lat: 34.7, lng: 137.5333, weight: 1 },
      { name: "菊川市", lat: 34.7583, lng: 138.0833, weight: 1 },
      { name: "森町", lat: 34.8333, lng: 137.9333, weight: 1 },
      // 内陸部の追加ポイント
      { name: "浜松市北区", lat: 34.8, lng: 137.7, weight: 1 },
      { name: "浜松市天竜区", lat: 35.0, lng: 137.8, weight: 1 },
    ],
  },
  中部: {
    name: "中部",
    center: { lat: 34.9756, lng: 138.3828 }, // 静岡市中心
    cities: [
      { name: "静岡市", lat: 34.9756, lng: 138.3828, weight: 3 }, // 大都市なので重み付け
      { name: "焼津市", lat: 34.8667, lng: 138.3167, weight: 2 },
      { name: "藤枝市", lat: 34.8667, lng: 138.25, weight: 2 },
      { name: "島田市", lat: 34.8369, lng: 138.1739, weight: 2 },
      { name: "牧之原市", lat: 34.7333, lng: 138.2167, weight: 1 },
      { name: "吉田町", lat: 34.7667, lng: 138.2667, weight: 1 },
      { name: "川根本町", lat: 35.0667, lng: 138.1333, weight: 1 },
      // 内陸部の追加ポイント
      { name: "静岡市葵区", lat: 35.0, lng: 138.4, weight: 2 },
      { name: "静岡市駿河区", lat: 34.95, lng: 138.4, weight: 1 },
      { name: "静岡市清水区", lat: 35.0, lng: 138.5, weight: 1 },
    ],
  },
  東部: {
    name: "東部",
    center: { lat: 35.1614, lng: 138.6764 }, // 富士市中心
    cities: [
      { name: "沼津市", lat: 35.0966, lng: 138.8637, weight: 2 },
      { name: "富士市", lat: 35.1614, lng: 138.6764, weight: 3 }, // 大都市なので重み付け
      { name: "富士宮市", lat: 35.2194, lng: 138.6222, weight: 2 },
      { name: "三島市", lat: 35.1186, lng: 138.9183, weight: 2 },
      { name: "御殿場市", lat: 35.3081, lng: 138.9331, weight: 2 },
      { name: "裾野市", lat: 35.1725, lng: 138.9072, weight: 1 },
      { name: "清水町", lat: 35.1167, lng: 138.8833, weight: 1 },
      { name: "長泉町", lat: 35.1333, lng: 138.8667, weight: 1 },
      { name: "小山町", lat: 35.3667, lng: 138.9333, weight: 1 },
      // 内陸部の追加ポイント
      { name: "富士宮市北部", lat: 35.3, lng: 138.6, weight: 1 },
      { name: "御殿場市北部", lat: 35.35, lng: 138.95, weight: 1 },
    ],
  },
  伊豆: {
    name: "伊豆",
    center: { lat: 34.9658, lng: 139.1019 }, // 伊東市中心
    cities: [
      // 海岸沿いの都市は内陸寄りの座標を使用
      { name: "熱海市", lat: 35.0953, lng: 139.0677, weight: 2 },
      { name: "伊東市", lat: 34.9658, lng: 139.1019, weight: 2 },
      { name: "下田市", lat: 34.6792, lng: 138.9431, weight: 1 },
      { name: "伊豆市", lat: 34.9667, lng: 138.9333, weight: 2 }, // 内陸部
      { name: "伊豆の国市", lat: 35.0333, lng: 138.9167, weight: 2 }, // 内陸部
      { name: "東伊豆町", lat: 34.8167, lng: 139.0333, weight: 1 },
      { name: "河津町", lat: 34.7333, lng: 139.0, weight: 1 },
      { name: "函南町", lat: 35.1, lng: 138.9333, weight: 1 },
      // 内陸部の追加ポイント（確実に陸地）
      { name: "伊豆市中部", lat: 34.98, lng: 138.95, weight: 1 },
      { name: "伊豆の国市中部", lat: 35.04, lng: 138.93, weight: 1 },
      { name: "修善寺", lat: 34.97, lng: 138.93, weight: 1 },
    ],
  },
}

// 災害タイトルのテンプレート（地域特性を考慮）
const DISASTER_TITLE_TEMPLATES = {
  river: ["○○川氾濫", "○○川堤防決壊", "○○川増水被害", "○○川護岸崩壊"],
  coast: ["○○海岸高潮被害", "○○海岸浸食", "○○海岸津波被害", "○○海岸越波"],
  sediment: ["○○地区土石流", "○○地区崖崩れ", "○○地区土砂崩れ", "○○地区砂防ダム損傷"],
  steep_slope: ["○○地区急傾斜地崩壊", "○○地区斜面崩落", "○○地区法面崩壊", "○○地区急斜面被害"],
  landslide: ["○○地区地すべり", "○○地区山腹崩壊", "○○地区斜面崩壊", "○○地区地盤沈下"],
  road: ["○○道路陥没", "○○道路法面崩壊", "○○道路冠水", "○○道路損傷"],
  bridge: ["○○橋梁損傷", "○○橋落橋", "○○橋亀裂", "○○橋支承部損傷"],
  sewage: ["○○地区下水道管破損", "○○処理場被害", "○○地区マンホール浮上", "○○ポンプ場冠水"],
  harbor_coast: ["○○港湾海岸被害", "○○港湾護岸決壊", "○○港湾海岸浸食", "○○港湾海岸施設損傷"],
  harbor: ["○○港岸壁損傷", "○○港防波堤被害", "○○港埠頭施設被害", "○○港浚渫被害"],
  fishing_port: ["○○漁港施設被害", "○○漁港岸壁損傷", "○○漁港防波堤被害", "○○漁港浚渫被害"],
  park: ["○○公園施設被害", "○○公園遊具損傷", "○○公園樹木倒壊", "○○公園法面崩壊"],
  other: ["○○施設被害", "○○公共施設損傷", "○○インフラ被害", "○○ライフライン被害"],
}

// 災害の説明文のテンプレート
const DISASTER_DESCRIPTION_TEMPLATES = [
  "○○地区で発生した災害により、周辺施設に被害が出ています。現在、復旧作業が進められています。",
  "○○における被害状況の調査が行われています。周辺地域は立入禁止となっています。",
  "○○で発生した災害により、周辺道路が通行止めとなっています。迂回路をご利用ください。",
  "○○地区の被災箇所では、応急復旧工事が実施されています。完了までには約○日かかる見込みです。",
  "○○における被害は広範囲に及んでおり、詳細な調査が必要です。周辺住民は避難指示に従ってください。",
  "○○地区では、二次災害防止のため警戒区域が設定されています。住民の皆様はご注意ください。",
  "○○での災害により、ライフラインに影響が出ています。復旧作業を急いでいます。",
]

// ランダムな日付を生成（過去3ヶ月以内）
function generateRandomDate(): string {
  const now = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(now.getMonth() - 3)

  const randomTimestamp = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime())
  const randomDate = new Date(randomTimestamp)

  return randomDate.toISOString().split("T")[0]
}

// 重み付きランダム選択（都市の重要度に応じて選択確率を調整）
function getWeightedRandomCity(cities: Array<{ name: string; lat: number; lng: number; weight: number }>) {
  const totalWeight = cities.reduce((sum, city) => sum + city.weight, 0)
  let random = Math.random() * totalWeight

  for (const city of cities) {
    random -= city.weight
    if (random <= 0) {
      return city
    }
  }

  return cities[cities.length - 1] // フォールバック
}

// 陸地内の安全な位置を生成（都市座標から小さなオフセット）
function generateSafeLandPosition(baseCity: { name: string; lat: number; lng: number; weight: number }): {
  lat: number
  lng: number
} {
  // 都市中心から最大2km以内のランダムオフセット（陸地を保証）
  const maxOffsetKm = 2.0
  const offsetLat = (Math.random() - 0.5) * (maxOffsetKm / 111) // 1度 ≈ 111km
  const offsetLng = (Math.random() - 0.5) * (maxOffsetKm / (111 * Math.cos((baseCity.lat * Math.PI) / 180)))

  // 海岸沿いの都市の場合は内陸方向により重みを付ける
  const isCoastalCity =
    baseCity.name.includes("熱海") || baseCity.name.includes("下田") || baseCity.name.includes("東伊豆")

  let finalOffsetLat = offsetLat
  let finalOffsetLng = offsetLng

  if (isCoastalCity) {
    // 海岸沿いの都市では内陸方向（北または西）により重みを付ける
    finalOffsetLat = Math.abs(offsetLat) * 0.5 // 北方向に偏らせる
    if (baseCity.lng > 139.0) {
      // 伊豆半島東岸の場合は西方向に偏らせる
      finalOffsetLng = -Math.abs(offsetLng) * 0.5
    }
  }

  return {
    lat: baseCity.lat + finalOffsetLat,
    lng: baseCity.lng + finalOffsetLng,
  }
}

// 災害マーカーを生成
export function generateDisasterMarkers(): DisasterMarker[] {
  try {
    const markers: DisasterMarker[] = []
    let idCounter = 1

    // 各地域について処理
    Object.values(SHIZUOKA_REGIONS).forEach((region) => {
      console.log(`${region.name}地域のマーカーを生成中...`)

      // 各カテゴリーについて処理
      disasterCategories.forEach((category) => {
        // 各カテゴリーごとに3～5個のマーカーを生成
        const markerCount = Math.floor(Math.random() * 3) + 3 // 3～5個

        for (let i = 0; i < markerCount; i++) {
          try {
            // 重み付きランダムで都市を選択
            const baseCity = getWeightedRandomCity(region.cities)

            // 選択された都市から安全な陸地位置を生成
            const position = generateSafeLandPosition(baseCity)

            // カテゴリーに基づいたタイトルテンプレートを選択
            const titleTemplates =
              DISASTER_TITLE_TEMPLATES[category.id as keyof typeof DISASTER_TITLE_TEMPLATES] ||
              DISASTER_TITLE_TEMPLATES.other
            const randomTitleIndex = Math.floor(Math.random() * titleTemplates.length)
            const titleTemplate = titleTemplates[randomTitleIndex]

            // タイトルに地名を挿入
            const cityNameForTitle = baseCity.name
              .replace("市", "")
              .replace("町", "")
              .replace("村", "")
              .replace("区", "")
            const title = titleTemplate.replace("○○", cityNameForTitle)

            // ランダムな説明文を選択して地名を挿入
            const randomDescIndex = Math.floor(Math.random() * DISASTER_DESCRIPTION_TEMPLATES.length)
            let description = DISASTER_DESCRIPTION_TEMPLATES[randomDescIndex].replace("○○", cityNameForTitle)

            // 説明文の「約○日」をランダムな日数に置き換え
            if (description.includes("約○日")) {
              const randomDays = Math.floor(Math.random() * 30) + 1
              description = description.replace("約○日", `約${randomDays}日`)
            }

            // ランダムな深刻度を選択（重要都市では重大な災害の確率を上げる）
            const severities: Array<DisasterMarker["severity"]> = ["low", "medium", "high", "critical"]
            let severityWeights = [0.3, 0.4, 0.2, 0.1] // 通常の重み

            if (baseCity.weight >= 3) {
              // 重要都市では重大災害の確率を上げる
              severityWeights = [0.2, 0.3, 0.3, 0.2]
            }

            const randomSeverity = Math.random()
            let cumulativeWeight = 0
            let severityIndex = 0

            for (let j = 0; j < severityWeights.length; j++) {
              cumulativeWeight += severityWeights[j]
              if (randomSeverity <= cumulativeWeight) {
                severityIndex = j
                break
              }
            }

            const severity = severities[severityIndex]

            // ランダムなステータスを選択
            const statuses: Array<DisasterMarker["status"]> = ["reported", "investigating", "in_progress", "resolved"]
            const randomStatusIndex = Math.floor(Math.random() * statuses.length)
            const status = statuses[randomStatusIndex]

            // ランダムな日付を生成
            const reportDate = generateRandomDate()

            // マーカーを作成
            markers.push({
              id: `${region.name}-${category.id}-${idCounter}`,
              position,
              title,
              description,
              category: category.id,
              severity,
              reportDate,
              status,
              city: baseCity.name,
              // 画像はプレースホルダーを使用
              image: `/placeholder.svg?height=200&width=300&query=${category.name}+disaster`,
            })

            idCounter++
          } catch (innerError) {
            console.error(`マーカー生成中のエラー (${region.name}-${category.id}):`, innerError)
            // 個別のマーカー生成エラーは無視して続行
          }
        }
      })
    })

    console.log(`合計 ${markers.length} 個のマーカーを生成しました（すべて陸地に配置）`)

    // マーカーが生成できなかった場合は空の配列を返す
    if (markers.length === 0) {
      console.warn("マーカーが生成できませんでした。")
      return []
    }

    return markers
  } catch (error) {
    console.error("マーカー生成中の重大なエラー:", error)
    return [] // エラー時は空の配列を返す
  }
}
