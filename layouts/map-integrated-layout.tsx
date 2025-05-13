"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Camera, Send, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function MapIntegratedLayout() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)

  // Google Maps APIの読み込みと初期化（実際の実装ではAPIキーが必要）
  useEffect(() => {
    // この部分は実際の実装では適切なGoogle Maps APIの初期化コードに置き換える
    const mockMap = () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
            <div class="text-center">
              <p>ここに地図が表示されます</p>
              <p class="text-sm">（実際の実装ではGoogle Maps APIを使用）</p>
            </div>
          </div>
        `
      }
    }

    setTimeout(mockMap, 100)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // 送信処理をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    alert("被害状況が報告されました")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 地図エリア */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full"></div>

        {/* 地図上のコントロール */}
        <div className="absolute top-4 left-4 z-10">
          <Card>
            <CardContent className="p-3">
              <p className="text-sm font-medium mb-2">地図上で被害場所を選択してください</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white">
                  {selectedLocation ? `選択済み` : `未選択`}
                </Badge>
                <Button size="sm" variant="secondary" className="h-7">
                  現在地を使用
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 入力フォームパネル */}
      <div
        className={`bg-white border-l border-gray-200 transition-all duration-300 flex flex-col ${isPanelExpanded ? "w-[450px]" : "w-[50px]"}`}
      >
        {/* パネル開閉ボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-0 transform -translate-x-full bg-white border border-gray-200 rounded-l-md rounded-r-none h-10 w-6 z-20"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          {isPanelExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {isPanelExpanded && (
          <div className="flex-1 overflow-y-auto p-4">
            <h1 className="text-xl font-bold mb-4">被害状況報告</h1>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="info">基本情報</TabsTrigger>
                <TabsTrigger value="details">詳細情報</TabsTrigger>
                <TabsTrigger value="photos">写真</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="info" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="disaster-type">災害種別</Label>
                    <Select required>
                      <SelectTrigger id="disaster-type">
                        <SelectValue placeholder="災害の種類を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="river">河川</SelectItem>
                        <SelectItem value="coast">海岸</SelectItem>
                        <SelectItem value="sediment">砂防</SelectItem>
                        <SelectItem value="steep_slope">急傾斜</SelectItem>
                        <SelectItem value="landslide">地すべり</SelectItem>
                        <SelectItem value="road">道路</SelectItem>
                        <SelectItem value="bridge">橋梁</SelectItem>
                        <SelectItem value="sewage">下水道</SelectItem>
                        <SelectItem value="harbor_coast">海岸(港湾)</SelectItem>
                        <SelectItem value="harbor">港湾</SelectItem>
                        <SelectItem value="fishing_port">漁港</SelectItem>
                        <SelectItem value="park">公園</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-name">場所の名称</Label>
                    <Input id="location-name" placeholder="地名や住所" required />
                  </div>

                  <div className="space-y-2">
                    <Label>被害の深刻度</Label>
                    <RadioGroup defaultValue="medium" className="flex space-x-2">
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low" className="text-green-600">
                          軽微
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium" className="text-yellow-600">
                          中程度
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high" className="text-orange-600">
                          重大
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="critical" id="critical" />
                        <Label htmlFor="critical" className="text-red-600">
                          緊急
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => document.querySelector('[data-value="details"]')?.click()}
                    >
                      次へ <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル</Label>
                    <Input id="title" placeholder="被害の概要を簡潔に" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">被害状況の詳細</Label>
                    <Textarea
                      id="description"
                      placeholder="被害の状況、範囲、影響などを詳しく記入してください"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">連絡先（任意）</Label>
                    <Input id="contact" placeholder="電話番号またはメールアドレス" />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.querySelector('[data-value="info"]')?.click()}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> 戻る
                    </Button>
                    <Button type="button" onClick={() => document.querySelector('[data-value="photos"]')?.click()}>
                      次へ <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="photos" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="image">被害状況の写真</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("image")?.click()}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          写真を追加
                        </Button>
                      </div>

                      {imagePreview ? (
                        <div className="relative mt-2">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="プレビュー"
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setImagePreview(null)}
                          >
                            削除
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                          <p className="text-gray-500">写真をアップロードしてください</p>
                          <p className="text-xs text-gray-400 mt-1">（任意）</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.querySelector('[data-value="details"]')?.click()}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> 戻る
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                      {isSubmitting ? (
                        <>処理中...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          報告を送信
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
