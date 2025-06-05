import type { DisasterMarker } from "@/types/disaster-types"

// 静的なダミーマーカーデータ
export const staticDisasterMarkers: DisasterMarker[] = [
  {
    id: "static-river-1",
    position: { lat: 34.9756, lng: 138.3828 }, // 静岡市
    title: "静岡川氾濫",
    description: "静岡地区で発生した災害により、周辺施設に被害が出ています。現在、復旧作業が進められています。",
    category: "river",
    severity: "high",
    reportDate: "2025-05-01",
    status: "in_progress",
    city: "静岡市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-sediment-1",
    position: { lat: 34.9856, lng: 138.4028 }, // 静岡市近郊
    title: "静岡地区土砂崩れ",
    description: "静岡における被害状況の調査が行われています。周辺地域は立入禁止となっています。",
    category: "sediment",
    severity: "critical",
    reportDate: "2025-05-02",
    status: "investigating",
    city: "静岡市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-road-1",
    position: { lat: 34.7108, lng: 137.7261 }, // 浜松市
    title: "浜松道路陥没",
    description: "浜松で発生した災害により、周辺道路が通行止めとなっています。迂回路をご利用ください。",
    category: "road",
    severity: "medium",
    reportDate: "2025-05-03",
    status: "in_progress",
    city: "浜松市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-bridge-1",
    position: { lat: 34.7208, lng: 137.7461 }, // 浜松市近郊
    title: "浜松橋梁損傷",
    description: "浜松地区の被災箇所では、応急復旧工事が実施されています。完了までには約7日かかる見込みです。",
    category: "bridge",
    severity: "high",
    reportDate: "2025-05-04",
    status: "in_progress",
    city: "浜松市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-coast-1",
    position: { lat: 34.9658, lng: 139.1019 }, // 伊東市
    title: "伊東海岸高潮被害",
    description: "伊東における被害は広範囲に及んでおり、詳細な調査が必要です。周辺住民は避難指示に従ってください。",
    category: "coast",
    severity: "critical",
    reportDate: "2025-05-05",
    status: "investigating",
    city: "伊東市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-landslide-1",
    position: { lat: 35.1614, lng: 138.6764 }, // 富士市
    title: "富士地すべり",
    description: "富士地区では、二次災害防止のため警戒区域が設定されています。住民の皆様はご注意ください。",
    category: "landslide",
    severity: "high",
    reportDate: "2025-05-06",
    status: "investigating",
    city: "富士市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-park-1",
    position: { lat: 35.0966, lng: 138.8637 }, // 沼津市
    title: "沼津公園施設被害",
    description: "沼津での災害により、ライフラインに影響が出ています。復旧作業を急いでいます。",
    category: "park",
    severity: "low",
    reportDate: "2025-05-07",
    status: "resolved",
    city: "沼津市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-sewage-1",
    position: { lat: 35.1186, lng: 138.9183 }, // 三島市
    title: "三島下水道管破損",
    description: "三島地区で発生した災害により、周辺施設に被害が出ています。現在、復旧作業が進められています。",
    category: "sewage",
    severity: "medium",
    reportDate: "2025-05-08",
    status: "in_progress",
    city: "三島市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-harbor-1",
    position: { lat: 34.6792, lng: 138.9431 }, // 下田市
    title: "下田港岸壁損傷",
    description: "下田における被害状況の調査が行われています。周辺地域は立入禁止となっています。",
    category: "harbor",
    severity: "high",
    reportDate: "2025-05-09",
    status: "investigating",
    city: "下田市",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "static-fishing_port-1",
    position: { lat: 34.8167, lng: 139.0333 }, // 東伊豆町
    title: "東伊豆漁港施設被害",
    description: "東伊豆で発生した災害により、周辺道路が通行止めとなっています。迂回路をご利用ください。",
    category: "fishing_port",
    severity: "medium",
    reportDate: "2025-05-10",
    status: "in_progress",
    city: "東伊豆町",
    image: "/placeholder.svg?height=200&width=300",
  },
]
