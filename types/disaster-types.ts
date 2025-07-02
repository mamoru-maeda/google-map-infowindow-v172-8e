export interface DisasterCategory {
  id: string
  name: string
  color: string
  description: string
}

export const disasterCategories: DisasterCategory[] = [
  { id: "road", name: "道路", color: "#7E57C2", description: "道路陥没、道路損傷など" },
  { id: "bridge", name: "橋梁", color: "#5D4037", description: "橋梁の損傷、落橋など" },
  { id: "river", name: "河川", color: "#4FC3F7", description: "河川の氾濫、堤防決壊など" },
  { id: "coast", name: "海岸", color: "#26A69A", description: "高潮、津波被害など" },
  { id: "flood", name: "浸水", color: "#03A9F4", description: "内水氾濫、浸水被害など" },
  { id: "sediment", name: "砂防", color: "#8D6E63", description: "土石流、崖崩れなど" },
  { id: "steep_slope", name: "急傾斜地", color: "#FF5722", description: "急傾斜地の崩壊など" },
  { id: "landslide", name: "地すべり", color: "#FF7043", description: "地すべり、山腹崩壊など" },
  { id: "harbor_coast", name: "海岸(港湾)", color: "#42A5F5", description: "港湾区域内の海岸被害" },
  { id: "harbor", name: "港湾", color: "#5C6BC0", description: "港湾施設の被害" },
  { id: "fishing_port", name: "漁港", color: "#29B6F6", description: "漁港施設の被害" },
  { id: "sewage", name: "下水道", color: "#9CCC65", description: "下水道管破損、処理場被害など" },
  { id: "park", name: "公園", color: "#66BB6A", description: "公園施設の被害" },
  { id: "other", name: "その他", color: "#78909C", description: "その他の公共施設被害" },
]

export interface DisasterMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  title: string
  description: string
  category: string
  severity: "low" | "medium" | "high" | "critical"
  reportDate: string
  status: "reported" | "investigating" | "in_progress" | "resolved"
  city: string
  image?: string
}
