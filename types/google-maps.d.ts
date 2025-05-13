declare global {
  interface Window {
    google: typeof google
    initGoogleMap: () => void
  }
}

// Google Maps API の型定義
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions)
      setOptions(options: MapOptions): void
      getDiv(): Element
      getCenter(): LatLng
      setCenter(latLng: LatLng | LatLngLiteral): void
      getBounds(): LatLngBounds | undefined
      getZoom(): number
      setZoom(zoom: number): void
      getProjection(): Projection
      addListener(eventName: string, handler: Function): MapsEventListener
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      getPosition(): LatLng | null
      setPosition(latLng: LatLng | LatLngLiteral): void
      addListener(eventName: string, handler: Function): MapsEventListener
      getTitle(): string | undefined
      setTitle(title: string): void
    }

    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
      toJSON(): LatLngLiteral
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng)
      getNorthEast(): LatLng
      getSouthWest(): LatLng
      extend(latLng: LatLng): LatLngBounds
    }

    class Point {
      constructor(x: number, y: number)
      x: number
      y: number
    }

    class Projection {
      // 修正: 正しいメソッド名に変更
      fromLatLngToPoint(latLng: LatLng): Point
      fromPointToLatLng(point: Point, noWrap?: boolean): LatLng
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      disableDefaultUI?: boolean
      zoomControl?: boolean
      mapTypeControl?: boolean
      scaleControl?: boolean
      streetViewControl?: boolean
      rotateControl?: boolean
      fullscreenControl?: boolean
      draggable?: boolean
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral
      map?: Map
      title?: string
      icon?: string | Icon | Symbol
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface Icon {
      url: string
      size?: Size
      scaledSize?: Size
      origin?: Point
      anchor?: Point
    }

    interface Symbol {
      path: SymbolPath | string
      fillColor?: string
      fillOpacity?: number
      scale?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
    }

    enum SymbolPath {
      CIRCLE,
      FORWARD_CLOSED_ARROW,
      FORWARD_OPEN_ARROW,
      BACKWARD_CLOSED_ARROW,
      BACKWARD_OPEN_ARROW,
    }

    class Size {
      constructor(width: number, height: number)
      width: number
      height: number
    }

    interface MapsEventListener {
      remove(): void
    }

    namespace event {
      function addListener(instance: object, eventName: string, handler: Function): MapsEventListener
      function removeListener(listener: MapsEventListener): void
      function addListenerOnce(instance: object, eventName: string, handler: Function): MapsEventListener
    }
  }
}

// グローバル変数としての google
declare var google: any

// 型定義をエクスポート
export { google }
