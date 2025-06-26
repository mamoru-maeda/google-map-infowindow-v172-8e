import type { InfoWindowState } from "./map-types"

export interface MapSnapshot {
  id: string
  title: string
  timestamp: number
  infoWindows: Record<string, InfoWindowState>
  mapCenter: { lat: number; lng: number }
  mapZoom: number
  selectedCategories: string[]
  totalInfoWindows: number
}
