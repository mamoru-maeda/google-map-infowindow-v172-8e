"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RotateCcw, Monitor, Smartphone, Tablet } from "lucide-react"
import { useInfoWindowSettings } from "@/hooks/use-infowindow-settings"
import { INFO_WINDOW_SIZES } from "@/constants/infowindow-sizes"

const InfoWindowSizeSettings: React.FC = () => {
  const { settings, isLoading, updateDefaultSize, updateAutoApplyToExisting, resetSettings } = useInfoWindowSettings()

  const [tempWidth, setTempWidth] = React.useState(settings.defaultSize.width.toString())
  const [tempHeight, setTempHeight] = React.useState(settings.defaultSize.height.toString())

  // 設定が変更されたときに一時的な値を更新
  React.useEffect(() => {
    setTempWidth(settings.defaultSize.width.toString())
    setTempHeight(settings.defaultSize.height.toString())
  }, [settings.defaultSize])

  // プリセットサイズ
  const presetSizes = [
    { name: "コンパクト", icon: Smartphone, width: 240, height: 320, description: "小さめの吹き出し" },
    { name: "標準", icon: Monitor, width: 280, height: 360, description: "バランスの良いサイズ" },
    { name: "大きめ", icon: Tablet, width: 320, height: 400, description: "詳細情報向け" },
    { name: "ワイド", icon: Monitor, width: 360, height: 320, description: "横長レイアウト" },
  ]

  const handlePresetSize = (width: number, height: number) => {
    updateDefaultSize({ width, height })
  }

  const handleCustomSize = () => {
    const width = Number.parseInt(tempWidth)
    const height = Number.parseInt(tempHeight)

    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      updateDefaultSize({ width, height })
    }
  }

  const handleInputChange = (dimension: "width" | "height", value: string) => {
    if (dimension === "width") {
      setTempWidth(value)
    } else {
      setTempHeight(value)
    }
  }

  const handleInputBlur = (dimension: "width" | "height") => {
    const value = dimension === "width" ? tempWidth : tempHeight
    const numValue = Number.parseInt(value)
    const constraints = INFO_WINDOW_SIZES.CONSTRAINTS

    if (!isNaN(numValue)) {
      const clampedValue =
        dimension === "width"
          ? Math.max(constraints.MIN_WIDTH, Math.min(constraints.MAX_WIDTH, numValue))
          : Math.max(constraints.MIN_HEIGHT, Math.min(constraints.MAX_HEIGHT, numValue))

      if (dimension === "width") {
        setTempWidth(clampedValue.toString())
      } else {
        setTempHeight(clampedValue.toString())
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>吹き出しサイズ設定</CardTitle>
          <CardDescription>読み込み中...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const constraints = INFO_WINDOW_SIZES.CONSTRAINTS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          吹き出しサイズ設定
        </CardTitle>
        <CardDescription>新しく開く吹き出しのデフォルトサイズを設定します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 現在の設定表示 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">現在の設定</h4>
          <p className="text-lg font-mono">
            {settings.defaultSize.width} × {settings.defaultSize.height} px
          </p>
          <p className="text-sm text-gray-600 mt-1">
            縦横比: {(settings.defaultSize.width / settings.defaultSize.height).toFixed(2)}
          </p>
        </div>

        {/* プリセットサイズ */}
        <div>
          <Label className="text-sm font-medium mb-3 block">プリセットサイズ</Label>
          <div className="grid grid-cols-2 gap-3">
            {presetSizes.map((preset) => {
              const Icon = preset.icon
              const isActive =
                settings.defaultSize.width === preset.width && settings.defaultSize.height === preset.height
              return (
                <Button
                  key={preset.name}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handlePresetSize(preset.width, preset.height)}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-gray-500">
                      {preset.width}×{preset.height}
                    </div>
                    <div className="text-xs text-gray-400">{preset.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* カスタムサイズ */}
        <div>
          <Label className="text-sm font-medium mb-3 block">カスタムサイズ</Label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-width" className="text-sm">
                  幅 ({constraints.MIN_WIDTH}-{constraints.MAX_WIDTH}px)
                </Label>
                <Input
                  id="custom-width"
                  type="number"
                  value={tempWidth}
                  onChange={(e) => handleInputChange("width", e.target.value)}
                  onBlur={() => handleInputBlur("width")}
                  min={constraints.MIN_WIDTH}
                  max={constraints.MAX_WIDTH}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom-height" className="text-sm">
                  高さ ({constraints.MIN_HEIGHT}-{constraints.MAX_HEIGHT}px)
                </Label>
                <Input
                  id="custom-height"
                  type="number"
                  value={tempHeight}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  onBlur={() => handleInputBlur("height")}
                  min={constraints.MIN_HEIGHT}
                  max={constraints.MAX_HEIGHT}
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleCustomSize} className="w-full">
              カスタムサイズを適用
            </Button>
          </div>
        </div>

        <Separator />

        {/* 追加オプション */}
        <div>
          <Label className="text-sm font-medium mb-3 block">追加オプション</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-apply" className="text-sm font-medium">
                  既存の吹き出しにも適用
                </Label>
                <p className="text-xs text-gray-600">サイズ変更時に現在開いている吹き出しのサイズも更新します</p>
              </div>
              <Switch
                id="auto-apply"
                checked={settings.autoApplyToExisting}
                onCheckedChange={updateAutoApplyToExisting}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* アクション */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            デフォルトに戻す
          </Button>
        </div>

        {/* 使用方法の説明 */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm">
          <h4 className="font-medium text-blue-900 mb-1">💡 使用方法</h4>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>• 設定は即座に保存され、新しく開く吹き出しに適用されます</li>
            <li>• 既存の吹き出しは個別にリサイズ可能です</li>
            <li>• プリセットから選ぶか、カスタムサイズを入力できます</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default InfoWindowSizeSettings
