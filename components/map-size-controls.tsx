"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Maximize2, Minimize2, Monitor, Smartphone, Tablet } from "lucide-react"

interface MapSizeControlsProps {
  mapSize: { width: number; height: number }
  onSizeChange: (size: Partial<{ width: number; height: number }>) => void
  isResizing: boolean
}

const MapSizeControls: React.FC<MapSizeControlsProps> = ({ mapSize, onSizeChange, isResizing }) => {
  const [customWidth, setCustomWidth] = React.useState(mapSize.width.toString())
  const [customHeight, setCustomHeight] = React.useState(mapSize.height.toString())

  // プリセットサイズ
  const presetSizes = [
    { name: "デスクトップ", icon: Monitor, width: 1200, height: 800 },
    { name: "タブレット", icon: Tablet, width: 768, height: 600 },
    { name: "スマートフォン", icon: Smartphone, width: 375, height: 500 },
    { name: "全画面", icon: Maximize2, width: window.innerWidth - 100, height: window.innerHeight - 200 },
  ]

  const handlePresetSize = (width: number, height: number) => {
    onSizeChange({ width, height })
    setCustomWidth(width.toString())
    setCustomHeight(height.toString())
  }

  const handleCustomSize = () => {
    const width = Number.parseInt(customWidth)
    const height = Number.parseInt(customHeight)

    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      onSizeChange({ width, height })
    }
  }

  // mapSizeが変更されたときにカスタム値を更新
  React.useEffect(() => {
    setCustomWidth(mapSize.width.toString())
    setCustomHeight(mapSize.height.toString())
  }, [mapSize])

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          地図サイズ管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在のサイズ表示 */}
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium mb-1">現在のサイズ</p>
          <p className="text-lg font-mono">
            {mapSize.width} × {mapSize.height} px
          </p>
          {isResizing && <p className="text-xs text-blue-600 mt-1">サイズ変更中...</p>}
        </div>

        {/* プリセットサイズ */}
        <div>
          <Label className="text-sm font-medium mb-2 block">プリセットサイズ</Label>
          <div className="grid grid-cols-2 gap-2">
            {presetSizes.map((preset) => {
              const Icon = preset.icon
              return (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSize(preset.width, preset.height)}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  disabled={isResizing}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{preset.name}</span>
                  <span className="text-xs text-gray-500">
                    {preset.width}×{preset.height}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* カスタムサイズ */}
        <div>
          <Label className="text-sm font-medium mb-2 block">カスタムサイズ</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="width" className="text-xs">
                  幅 (px)
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  min="200"
                  max="2000"
                  className="h-8"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="height" className="text-xs">
                  高さ (px)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  min="200"
                  max="1500"
                  className="h-8"
                />
              </div>
            </div>
            <Button onClick={handleCustomSize} className="w-full" size="sm" disabled={isResizing}>
              サイズを適用
            </Button>
          </div>
        </div>

        {/* 比率調整 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">アスペクト比</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "16:9", ratio: 16 / 9 },
              { name: "4:3", ratio: 4 / 3 },
              { name: "1:1", ratio: 1 },
            ].map((aspect) => (
              <Button
                key={aspect.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  const newHeight = Math.round(mapSize.width / aspect.ratio)
                  onSizeChange({ height: newHeight })
                }}
                disabled={isResizing}
              >
                {aspect.name}
              </Button>
            ))}
          </div>
        </div>

        {/* リセット */}
        <Button
          variant="outline"
          onClick={() => {
            const defaultWidth = 1000
            const defaultHeight = 600
            onSizeChange({ width: defaultWidth, height: defaultHeight })
          }}
          className="w-full"
          disabled={isResizing}
        >
          <Minimize2 className="h-4 w-4 mr-2" />
          デフォルトサイズに戻す
        </Button>
      </CardContent>
    </Card>
  )
}

export default MapSizeControls
