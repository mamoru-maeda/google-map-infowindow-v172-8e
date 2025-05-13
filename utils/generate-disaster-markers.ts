import { type DisasterMarker, disasterCategories } from "@/types/disaster-types"

// 疑似乱数生成器（シード値固定）
class SeededRandom {
  private seed: number

  constructor(seed = 12345) {
    this.seed = seed
  }

  // 0から1の間の疑似乱数を生成
  random(): number {
    const x = Math.sin(this.seed++) * 10000
    return x - Math.floor(x)
  }

  // 指定された範囲の整数を生成
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }
}

// グローバルな疑似乱数生成器インスタンス
const seededRandom = new SeededRandom(12345)

// 静岡県の市町の中心座標と範囲
const SHIZUOKA_CITIES = [
  { name: "沼津市", lat: 35.0956, lng: 138.8636, count: 25 },
  { name: "富士市", lat: 35.1614, lng: 138.6764, count: 25 },
  { name: "静岡市", lat: 34.9756, lng: 138.3828, count: 20 },
  { name: "浜松市", lat: 34.7108, lng: 137.7261, count: 20 },
  { name: "三島市", lat: 35.1186, lng: 138.9189, count: 15 },
  { name: "下田市", lat: 34.6789, lng: 138.9456, count: 15 },
]

// 各市町の陸地の座標リスト（実際の陸地の座標を複数定義）
// より多くの座標を追加し、バランスよく分散させる
const LAND_COORDINATES = {
  沼津市: [
    // 沼津市中心部
    { lat: 35.0956, lng: 138.8636 }, // 沼津市中心
    { lat: 35.1056, lng: 138.8536 }, // 沼津駅周辺
    { lat: 35.0856, lng: 138.8736 }, // 沼津港周辺
    { lat: 35.1156, lng: 138.8436 }, // 沼津市北部
    { lat: 35.0756, lng: 138.8836 }, // 沼津市南部

    // 沼津市西部
    { lat: 35.1023, lng: 138.8312 }, // 沼津市西部
    { lat: 35.0934, lng: 138.8245 }, // 沼津市西部住宅地
    { lat: 35.1145, lng: 138.8178 }, // 沼津市北西部
    { lat: 35.0867, lng: 138.8123 }, // 沼津市南西部

    // 沼津市東部
    { lat: 35.1087, lng: 138.8912 }, // 沼津市東部
    { lat: 35.0923, lng: 138.8978 }, // 沼津市東部住宅地
    { lat: 35.1234, lng: 138.9034 }, // 沼津市北東部
    { lat: 35.0812, lng: 138.9123 }, // 沼津市南東部

    // 沼津市北部
    { lat: 35.1345, lng: 138.8567 }, // 沼津市北部住宅地
    { lat: 35.1423, lng: 138.8712 }, // 沼津市北部商業地
    { lat: 35.1512, lng: 138.8456 }, // 沼津市北部工業地

    // 沼津市南部
    { lat: 35.0645, lng: 138.8523 }, // 沼津市南部住宅地
    { lat: 35.0712, lng: 138.8678 }, // 沼津市南部商業地
    { lat: 35.0534, lng: 138.8789 }, // 沼津市南部工業地

    // 沼津市内陸部
    { lat: 35.1123, lng: 138.8345 }, // 沼津市内陸部住宅地
    { lat: 35.0978, lng: 138.8456 }, // 沼津市内陸部商業地
    { lat: 35.1234, lng: 138.8567 }, // 沼津市内陸部工業地
    { lat: 35.0845, lng: 138.8234 }, // 沼津市内陸部公園
    { lat: 35.1067, lng: 138.8789 }, // 沼津市内陸部学校
    { lat: 35.0934, lng: 138.8678 }, // 沼津市内陸部病院
  ],
  富士市: [
    // 富士市中心部
    { lat: 35.1614, lng: 138.6764 }, // 富士市中心
    { lat: 35.1714, lng: 138.6664 }, // 富士駅周辺
    { lat: 35.1514, lng: 138.6864 }, // 富士市役所周辺
    { lat: 35.1814, lng: 138.6564 }, // 富士市北部
    { lat: 35.1414, lng: 138.6964 }, // 富士市南部

    // 富士市西部
    { lat: 35.1567, lng: 138.6423 }, // 富士市西部
    { lat: 35.1678, lng: 138.6345 }, // 富士市西部住宅地
    { lat: 35.1456, lng: 138.6278 }, // 富士市南西部
    { lat: 35.1789, lng: 138.6312 }, // 富士市北西部

    // 富士市東部
    { lat: 35.1645, lng: 138.7123 }, // 富士市東部
    { lat: 35.1734, lng: 138.7234 }, // 富士市東部住宅地
    { lat: 35.1523, lng: 138.7345 }, // 富士市南東部
    { lat: 35.1856, lng: 138.7156 }, // 富士市北東部

    // 富士市北部
    { lat: 35.1923, lng: 138.6645 }, // 富士市北部住宅地
    { lat: 35.2034, lng: 138.6734 }, // 富士市北部商業地
    { lat: 35.1978, lng: 138.6523 }, // 富士市北部工業地

    // 富士市南部
    { lat: 35.1345, lng: 138.6823 }, // 富士市南部住宅地
    { lat: 35.1267, lng: 138.6734 }, // 富士市南部商業地
    { lat: 35.1178, lng: 138.6912 }, // 富士市南部工業地

    // 富士市内陸部
    { lat: 35.1645, lng: 138.6534 }, // 富士市内陸部住宅地
    { lat: 35.1734, lng: 138.6645 }, // 富士市内陸部商業地
    { lat: 35.1567, lng: 138.6734 }, // 富士市内陸部工業地
    { lat: 35.1823, lng: 138.6823 }, // 富士市内陸部公園
    { lat: 35.1456, lng: 138.6645 }, // 富士市内陸部学校
    { lat: 35.1645, lng: 138.6912 }, // 富士市内陸部病院
  ],
  静岡市: [
    // 静岡市中心部
    { lat: 34.9756, lng: 138.3828 }, // 静岡市中心
    { lat: 34.9856, lng: 138.3728 }, // 静岡駅周辺
    { lat: 34.9656, lng: 138.3928 }, // 静岡市役所周辺
    { lat: 34.9956, lng: 138.3628 }, // 静岡市北部
    { lat: 34.9556, lng: 138.4028 }, // 静岡市南部

    // 静岡市西部
    { lat: 34.9723, lng: 138.3523 }, // 静岡市西部
    { lat: 34.9834, lng: 138.3412 }, // 静岡市西部住宅地
    { lat: 34.9645, lng: 138.3345 }, // 静岡市南西部
    { lat: 34.9912, lng: 138.3267 }, // 静岡市北西部

    // 静岡市東部
    { lat: 34.9734, lng: 138.4123 }, // 静岡市東部
    { lat: 34.9845, lng: 138.4234 }, // 静岡市東部住宅地
    { lat: 34.9623, lng: 138.4345 }, // 静岡市南東部
    { lat: 34.9956, lng: 138.4156 }, // 静岡市北東部

    // 静岡市北部
    { lat: 35.0123, lng: 138.3845 }, // 静岡市北部住宅地
    { lat: 35.0234, lng: 138.3734 }, // 静岡市北部商業地
    { lat: 35.0345, lng: 138.3623 }, // 静岡市北部工業地

    // 静岡市南部
    { lat: 34.9345, lng: 138.3923 }, // 静岡市南部住宅地
    { lat: 34.9234, lng: 138.4034 }, // 静岡市南部商業地
    { lat: 34.9123, lng: 138.4145 }, // 静岡市南部工業地

    // 静岡市内陸部
    { lat: 34.9845, lng: 138.3634 }, // 静岡市内陸部住宅地
    { lat: 34.9734, lng: 138.3745 }, // 静岡市内陸部商業地
    { lat: 34.9623, lng: 138.3856 }, // 静岡市内陸部工業地
    { lat: 34.9912, lng: 138.3967 }, // 静岡市内陸部公園
    { lat: 34.9534, lng: 138.4078 }, // 静岡市内陸部学校
    { lat: 34.9845, lng: 138.4189 }, // 静岡市内陸部病院
  ],
  浜松市: [
    // 浜松市中心部
    { lat: 34.7108, lng: 137.7261 }, // 浜松市中心
    { lat: 34.7208, lng: 137.7161 }, // 浜松駅周辺
    { lat: 34.7008, lng: 137.7361 }, // 浜松市役所周辺
    { lat: 34.7308, lng: 137.7061 }, // 浜松市北部
    { lat: 34.6908, lng: 137.7461 }, // 浜松市南部

    // 浜松市西部
    { lat: 34.7123, lng: 137.6923 }, // 浜松市西部
    { lat: 34.7234, lng: 137.6812 }, // 浜松市西部住宅地
    { lat: 34.7045, lng: 137.6745 }, // 浜松市南西部
    { lat: 34.7312, lng: 137.6667 }, // 浜松市北西部

    // 浜松市東部
    { lat: 34.7134, lng: 137.7523 }, // 浜松市東部
    { lat: 34.7245, lng: 137.7634 }, // 浜松市東部住宅地
    { lat: 34.7023, lng: 137.7745 }, // 浜松市南東部
    { lat: 34.7356, lng: 137.7556 }, // 浜松市北東部

    // 浜松市北部
    { lat: 34.7523, lng: 137.7245 }, // 浜松市北部住宅地
    { lat: 34.7634, lng: 137.7134 }, // 浜松市北部商業地
    { lat: 34.7745, lng: 137.7023 }, // 浜松市北部工業地

    // 浜松市南部
    { lat: 34.6745, lng: 137.7323 }, // 浜松市南部住宅地
    { lat: 34.6634, lng: 137.7434 }, // 浜松市南部商業地
    { lat: 34.6523, lng: 137.7545 }, // 浜松市南部工業地

    // 浜松市内陸部
    { lat: 34.7245, lng: 137.7034 }, // 浜松市内陸部住宅地
    { lat: 34.7134, lng: 137.7145 }, // 浜松市内陸部商業地
    { lat: 34.7023, lng: 137.7256 }, // 浜松市内陸部工業地
    { lat: 34.7312, lng: 137.7367 }, // 浜松市内陸部公園
    { lat: 34.6934, lng: 137.7478 }, // 浜松市内陸部学校
    { lat: 34.7245, lng: 137.7589 }, // 浜松市内陸部病院
  ],
  三島市: [
    // 三島市中心部
    { lat: 35.1186, lng: 138.9189 }, // 三島市中心
    { lat: 35.1286, lng: 138.9089 }, // 三島駅周辺
    { lat: 35.1086, lng: 138.9289 }, // 三島市役所周辺
    { lat: 35.1386, lng: 138.8989 }, // 三島市北部
    { lat: 35.0986, lng: 138.9389 }, // 三島市南部

    // 三島市西部
    { lat: 35.1123, lng: 138.8923 }, // 三島市西部
    { lat: 35.1234, lng: 138.8812 }, // 三島市西部住宅地
    { lat: 35.1045, lng: 138.8745 }, // 三島市南西部
    { lat: 35.1312, lng: 138.8667 }, // 三島市北西部

    // 三島市東部
    { lat: 35.1134, lng: 138.9523 }, // 三島市東部
    { lat: 35.1245, lng: 138.9634 }, // 三島市東部住宅地
    { lat: 35.1023, lng: 138.9745 }, // 三島市南東部
    { lat: 35.1356, lng: 138.9556 }, // 三島市北東部

    // 三島市北部
    { lat: 35.1523, lng: 138.9245 }, // 三島市北部住宅地
    { lat: 35.1634, lng: 138.9134 }, // 三島市北部商業地
    { lat: 35.1745, lng: 138.9023 }, // 三島市北部工業地

    // 三島市南部
    { lat: 35.0745, lng: 138.9323 }, // 三島市南部住宅地
    { lat: 35.0634, lng: 138.9434 }, // 三島市南部商業地
    { lat: 35.0523, lng: 138.9545 }, // 三島市南部工業地

    // 三島市内陸部
    { lat: 35.1245, lng: 138.9034 }, // 三島市内陸部住宅地
    { lat: 35.1134, lng: 138.9145 }, // 三島市内陸部商業地
    { lat: 35.1023, lng: 138.9256 }, // 三島市内陸部工業地
    { lat: 35.1312, lng: 138.9367 }, // 三島市内陸部公園
    { lat: 35.0934, lng: 138.9478 }, // 三島市内陸部学校
    { lat: 35.1245, lng: 138.9589 }, // 三島市内陸部病院
  ],
  下田市: [
    // 下田市中心部
    { lat: 34.6789, lng: 138.9456 }, // 下田市中心
    { lat: 34.6889, lng: 138.9356 }, // 下田駅周辺
    { lat: 34.6689, lng: 138.9556 }, // 下田市役所周辺
    { lat: 34.6989, lng: 138.9256 }, // 下田市北部
    { lat: 34.6589, lng: 138.9656 }, // 下田市南部

    // 下田市西部
    { lat: 34.6723, lng: 138.9123 }, // 下田市西部
    { lat: 34.6834, lng: 138.9012 }, // 下田市西部住宅地
    { lat: 34.6645, lng: 138.8945 }, // 下田市南西部
    { lat: 34.6912, lng: 138.8867 }, // 下田市北西部

    // 下田市東部
    { lat: 34.6734, lng: 138.9723 }, // 下田市東部
    { lat: 34.6845, lng: 138.9834 }, // 下田市東部住宅地
    { lat: 34.6623, lng: 138.9945 }, // 下田市南東部
    { lat: 34.6956, lng: 138.9756 }, // 下田市北東部

    // 下田市北部
    { lat: 34.7023, lng: 138.9345 }, // 下田市北部住宅地
    { lat: 34.7134, lng: 138.9234 }, // 下田市北部商業地
    { lat: 34.7245, lng: 138.9123 }, // 下田市北部工業地

    // 下田市南部
    { lat: 34.6345, lng: 138.9523 }, // 下田市南部住宅地
    { lat: 34.6234, lng: 138.9634 }, // 下田市南部商業地
    { lat: 34.6123, lng: 138.9745 }, // 下田市南部工業地

    // 下田市内陸部
    { lat: 34.6845, lng: 138.9234 }, // 下田市内陸部住宅地
    { lat: 34.6734, lng: 138.9345 }, // 下田市内陸部商業地
    { lat: 34.6623, lng: 138.9456 }, // 下田市内陸部工業地
    { lat: 34.6912, lng: 138.9567 }, // 下田市内陸部公園
    { lat: 34.6534, lng: 138.9678 }, // 下田市内陸部学校
    { lat: 34.6845, lng: 138.9789 }, // 下田市内陸部病院
  ],
}

// 災害名のテンプレート
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

// 地名のリスト（市町ごと）
const PLACE_NAMES = {
  沼津市: [
    "沼津",
    "原",
    "片浜",
    "西浦",
    "内浦",
    "戸田",
    "大平",
    "静浦",
    "西沢田",
    "東沢田",
    "岡宮",
    "大岡",
    "下香貫",
    "上香貫",
    "三園",
    "我入道",
    "井出",
    "中沢田",
    "東椎路",
    "西椎路",
    "大塚",
    "松長",
    "本郷",
    "東熊堂",
    "西熊堂",
  ],
  富士市: [
    "富士",
    "吉原",
    "鷹岡",
    "岩松",
    "富士川",
    "松岡",
    "田子浦",
    "入山瀬",
    "元吉原",
    "伝法",
    "今泉",
    "比奈",
    "大淵",
    "須津",
    "天間",
    "松野",
    "富士駅前",
    "水戸島",
    "青葉台",
    "厚原",
    "依田橋",
    "中里",
    "中之郷",
    "神戸",
    "松本",
  ],
  静岡市: [
    "静岡",
    "清水",
    "駿河",
    "葵",
    "駒形",
    "安倍川",
    "長田",
    "用宗",
    "草薙",
    "東静岡",
    "丸子",
    "由比",
    "蒲原",
    "興津",
    "井川",
    "梅ケ島",
    "大谷",
    "小鹿",
    "羽鳥",
    "日本平",
  ],
  浜松市: [
    "浜松",
    "天竜",
    "舞阪",
    "雄踏",
    "細江",
    "引佐",
    "三ヶ日",
    "浜北",
    "東区",
    "西区",
    "南区",
    "北区",
    "中区",
    "天竜川",
    "佐鳴湖",
    "浜名湖",
    "遠州灘",
    "浜松城",
    "浜松駅",
    "新浜松",
  ],
  三島市: [
    "三島",
    "大場",
    "谷田",
    "沢地",
    "富士見台",
    "松本",
    "徳倉",
    "加茂",
    "長伏",
    "中島",
    "安久",
    "大宮町",
    "三島駅",
    "三島田町",
    "三島本町",
  ],
  下田市: [
    "下田",
    "白浜",
    "吉佐美",
    "田牛",
    "須崎",
    "柿崎",
    "蓮台寺",
    "河内",
    "稲梓",
    "箕作",
    "立野",
    "下田港",
    "下田駅",
    "下田温泉",
    "下田海中水族館",
  ],
}

// 災害の説明文のテンプレート
const DISASTER_DESCRIPTION_TEMPLATES = [
  "○○地区で発生した災害により、周辺施設に被害が出ています。現在、復旧作業が進められています。",
  "○○における被害状況の調査が行われています。周辺地域は立入禁止となっています。",
  "○○で発生した災害により、周辺道路が通行止めとなっています。迂回路をご利用ください。",
  "○○地区の被災箇所では、応急復旧工事が実施されています。完了までには約○日かかる見込みです。",
  "○○における被害は広範囲に及んでおり、詳細な調査が必要です。周辺住民は避難指示に従ってください。",
]

// ランダムな日付を生成（過去3ヶ月以内）
function generateRandomDate(): string {
  const now = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(now.getMonth() - 3)

  const randomTimestamp = threeMonthsAgo.getTime() + seededRandom.random() * (now.getTime() - threeMonthsAgo.getTime())
  const randomDate = new Date(randomTimestamp)

  return randomDate.toISOString().split("T")[0]
}

// 陸地の座標からランダムに選択し、より自然なランダム性を加える
function generateRandomPositionOnLand(city: string): { lat: number; lng: number } {
  // 市町の陸地座標リストを取得
  const landCoordinates = LAND_COORDINATES[city as keyof typeof LAND_COORDINATES] || []

  if (landCoordinates.length === 0) {
    // 陸地座標がない場合は市町の中心座標を使用
    const cityInfo = SHIZUOKA_CITIES.find((c) => c.name === city)
    if (!cityInfo) {
      throw new Error(`City not found: ${city}`)
    }
    return { lat: cityInfo.lat, lng: cityInfo.lng }
  }

  // ランダムに座標を選択（重複を避けるためにインデックスを記録）
  const usedIndices = new Set<number>()
  const getRandomIndex = () => {
    // 使用可能なインデックスがなくなった場合はリセット
    if (usedIndices.size >= landCoordinates.length) {
      usedIndices.clear()
    }

    let index
    do {
      index = seededRandom.randomInt(0, landCoordinates.length - 1)
    } while (usedIndices.has(index))

    usedIndices.add(index)
    return index
  }

  const randomIndex = getRandomIndex()
  const baseCoordinate = landCoordinates[randomIndex]

  // より自然なランダム性を加える（ガウス分布を使用して中心付近に集中させる）
  // Box-Muller変換でガウス分布の乱数を生成
  const generateGaussian = () => {
    const u1 = seededRandom.random()
    const u2 = seededRandom.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0
  }

  // 標準偏差を小さくして、より自然な分布に
  const stdDev = 0.0015
  const latOffset = generateGaussian() * stdDev
  const lngOffset = generateGaussian() * stdDev

  return {
    lat: baseCoordinate.lat + latOffset,
    lng: baseCoordinate.lng + lngOffset,
  }
}

// ランダムな災害マーカーを生成
export function generateDisasterMarkers(): DisasterMarker[] {
  const markers: DisasterMarker[] = []
  let idCounter = 1

  // 各市町ごとに指定された数のマーカーを生成
  for (const city of SHIZUOKA_CITIES) {
    for (let i = 0; i < city.count; i++) {
      // 陸地の座標を生成
      const position = generateRandomPositionOnLand(city.name)

      // ランダムなカテゴリーを選択
      const randomCategoryIndex = seededRandom.randomInt(0, disasterCategories.length - 1)
      const category = disasterCategories[randomCategoryIndex]

      // 市町に対応する地名リストからランダムな地名を選択
      const cityPlaceNames = PLACE_NAMES[city.name as keyof typeof PLACE_NAMES] || []
      const randomPlaceIndex = seededRandom.randomInt(0, cityPlaceNames.length - 1)
      const placeName = cityPlaceNames[randomPlaceIndex]

      // カテゴリーに基づいたタイトルテンプレートを選択
      const titleTemplates =
        DISASTER_TITLE_TEMPLATES[category.id as keyof typeof DISASTER_TITLE_TEMPLATES] || DISASTER_TITLE_TEMPLATES.other
      const randomTitleIndex = seededRandom.randomInt(0, titleTemplates.length - 1)
      const titleTemplate = titleTemplates[randomTitleIndex]

      // タイトルに地名を挿入
      const title = titleTemplate.replace("○○", placeName)

      // ランダムな説明文を選択して地名を挿入
      const randomDescIndex = seededRandom.randomInt(0, DISASTER_DESCRIPTION_TEMPLATES.length - 1)
      let description = DISASTER_DESCRIPTION_TEMPLATES[randomDescIndex].replace("○○", placeName)

      // 説明文の「約○日」をランダムな日数に置き換え
      if (description.includes("約○日")) {
        const randomDays = seededRandom.randomInt(1, 30)
        description = description.replace("約○日", `約${randomDays}日`)
      }

      // ランダムな深刻度を選択
      const severities: Array<DisasterMarker["severity"]> = ["low", "medium", "high", "critical"]
      const randomSeverityIndex = seededRandom.randomInt(0, severities.length - 1)
      const severity = severities[randomSeverityIndex]

      // ランダムなステータスを選択
      const statuses: Array<DisasterMarker["status"]> = ["reported", "investigating", "in_progress", "resolved"]
      const randomStatusIndex = seededRandom.randomInt(0, statuses.length - 1)
      const status = statuses[randomStatusIndex]

      // ランダムな日付を生成
      const reportDate = generateRandomDate()

      // マーカーを作成
      markers.push({
        id: `disaster-${idCounter}`,
        position,
        title,
        description,
        category: category.id,
        severity,
        reportDate,
        status,
        city: city.name,
        // 画像はプレースホルダーを使用
        image: `/placeholder.svg?key=disaster-${idCounter}`,
      })

      idCounter++
    }
  }

  return markers
}
