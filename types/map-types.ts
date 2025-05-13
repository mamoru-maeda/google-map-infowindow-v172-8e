export interface MarkerData {
  id: string
  position: {
    lat: number
    lng: number
  }
  title: string
  description: string
  image?: string
  category: string
  severity?: "low" | "medium" | "high" | "critical"
  reportDate?: string
  status?: "reported" | "investigating" | "in_progress" | "resolved"
}

export interface InfoWindowState {
  markerId: string
  position: {
    lat: number
    lng: number
  }
  isMinimized: boolean
  userPositioned?: boolean // ユーザーが配置した位置かどうか
}

export interface Category {
  id: string
  name: string
  color: string
  description?: string
}
