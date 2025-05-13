"use client"

import type React from "react"
import type { google } from "@/types/google-maps"

interface AnimatedMarkerProps {
  map: google.maps.Map
  marker: google.maps.Marker
  isActive: boolean
}

// Version 13では使用しないため、空のコンポーネントにする
const AnimatedMarker: React.FC<AnimatedMarkerProps> = () => {
  return null
}

export default AnimatedMarker
