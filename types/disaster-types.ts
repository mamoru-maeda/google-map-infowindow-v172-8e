export interface DisasterCategory {
  id: string
  name: string
  color: string
  icon?: string
}

export const disasterCategories: DisasterCategory[] = [
  {
    id: "road",
    name: "道路",
    color: "#FF5722",
    icon: "🛣️",
  },
  {
    id: "bridge",
    name: "橋梁",
    color: "#795548",
    icon: "🌉",
  },
  {
    id: "river",
    name: "河川",
    color: "#2196F3",
    icon: "🌊",
  },
  {
    id: "coast",
    name: "海岸",
    color: "#00BCD4",
    icon: "🏖️",
  },
  {
    id: "flood",
    name: "浸水",
    color: "#03A9F4",
    icon: "💧",
  },
  {
    id: "erosion",
    name: "砂防",
    color: "#8BC34A",
    icon: "⛰️",
  },
  {
    id: "slope",
    name: "急傾斜地",
    color: "#FF9800",
    icon: "⛰️",
  },
  {
    id: "landslide",
    name: "地すべり",
    color: "#FF6F00",
    icon: "🏔️",
  },
  {
    id: "port-coast",
    name: "海岸（港湾）",
    color: "#607D8B",
    icon: "🚢",
  },
  {
    id: "port",
    name: "港湾",
    color: "#3F51B5",
    icon: "⚓",
  },
  {
    id: "fishing-port",
    name: "漁港",
    color: "#009688",
    icon: "🎣",
  },
  {
    id: "sewer",
    name: "下水道",
    color: "#9C27B0",
    icon: "🚰",
  },
  {
    id: "park",
    name: "公園",
    color: "#4CAF50",
    icon: "🌳",
  },
  {
    id: "other",
    name: "その他",
    color: "#9E9E9E",
    icon: "📍",
  },
]

// 後方互換性のためのエクスポート
