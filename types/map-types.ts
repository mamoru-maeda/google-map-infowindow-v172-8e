export interface InfoWindowState {
  markerId: string
  position: {
    lat: number
    lng: number
  }
  isMinimized: boolean
  userPositioned: boolean
  isOrganized?: boolean // 整頓配置されているかどうか
  organizationRegion?: string // 整頓時の地域
  organizationIndex?: number // 整頓時のインデックス
  organizationTotal?: number // 整頓時の同地域総数
}
