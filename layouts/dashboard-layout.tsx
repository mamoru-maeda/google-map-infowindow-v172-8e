"use client"

import type React from "react"

import { useState } from "react"
import { Camera, MapPin, BarChart3, Clock, Filter, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function DashboardLayout() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
    setIsDialogOpen(false)
    alert("被害状況が報告されました")
  }

  // サンプルの報告データ
  const recentReports = [
    { id: 1, title: "河川護岸崩壊", location: "静岡市葵区", category: "river", severity: "high", date: "2023-11-15" },
    { id: 2, title: "道路陥没", location: "浜松市中区", category: "road", severity: "medium", date: "2023-11-14" },
    {
      id: 3,
      title: "急傾斜地崩壊",
      location: "沼津市大平",
      category: "steep_slope",
      severity: "critical",
      date: "2023-11-13",
    },
    { id: 4, title: "下水道管破損", location: "富士市松岡", category: "sewage", severity: "low", date: "2023-11-12" },
    { id: 5, title: "橋梁損傷", location: "三島市大場", category: "bridge", severity: "high", date: "2023-11-11" },
  ]

  // 深刻度に基づくバッジの色を取得
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500">緊急</Badge>
      case "high":
        return <Badge className="bg-orange-500">重大</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">中程度</Badge>
      case "low":
        return <Badge className="bg-green-500">軽微</Badge>
      default:
        return <Badge className="bg-gray-500">不明</Badge>
    }
  }

  // カテゴリに基づくバッジを取得
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "river":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            河川
          </Badge>
        )
      case "road":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-700">
            道路
          </Badge>
        )
      case "steep_slope":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700">
            急傾斜
          </Badge>
        )
      case "sewage":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            下水道
          </Badge>
        )
      case "bridge":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-700">
            橋梁
          </Badge>
        )
      default:
        return <Badge variant="outline">その他</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">災害情報ダッシュボード</h1>
          <p className="text-gray-500">被害状況の報告・確認</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規報告
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>被害状況の新規報告</DialogTitle>
              <DialogDescription>
                被害の詳細情報を入力してください。できるだけ正確な情報の提供にご協力ください。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">タイトル</Label>
                <Input id="title" placeholder="被害の概要を簡潔に" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">発生場所</Label>
                <div className="flex gap-2">
                  <Input id="location" placeholder="住所または地名" required className="flex-1" />
                  <Button type="button" variant="outline" className="flex-shrink-0">
                    <MapPin className="h-4 w-4 mr-2" />
                    地図で選択
                  </Button>
                </div>
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
                <Label htmlFor="image">写真</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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

                  {imagePreview && (
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
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">連絡先（任意）</Label>
                <Input id="contact" placeholder="電話番号またはメールアドレス" />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "送信中..." : "報告を送信"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左側: 統計情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">災害種別の内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <BarChart3 className="h-24 w-24 mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">グラフ表示エリア</p>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>河川</span>
                  </div>
                  <span className="font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span>急傾斜</span>
                  </div>
                  <span className="font-medium">24%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span>道路</span>
                  </div>
                  <span className="font-medium">18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>その他</span>
                  </div>
                  <span className="font-medium">26%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">深刻度の分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>緊急</span>
                </div>
                <Badge className="bg-red-500">12</Badge>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span>重大</span>
                </div>
                <Badge className="bg-orange-500">28</Badge>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span>中程度</span>
                </div>
                <Badge className="bg-yellow-500">45</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>軽微</span>
                </div>
                <Badge className="bg-green-500">35</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">地域別報告数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>静岡市</span>
                  <span className="font-medium">32</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>浜松市</span>
                  <span className="font-medium">28</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>沼津市</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>富士市</span>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>三島市</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>下田市</span>
                  <span className="font-medium">6</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中央・右側: 報告リストとマップ */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">最近の報告</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    フィルター
                  </Button>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
                    <Input placeholder="検索..." className="pl-8 h-9 w-[180px]" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{report.title}</div>
                      {getSeverityBadge(report.severity)}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-600">{report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(report.category)}
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {report.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <Button variant="outline">もっと見る</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">災害マップ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>地図表示エリア</p>
                  <p className="text-sm">（実際の実装ではGoogle Maps等を表示）</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">対応状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>報告済み</span>
                  </div>
                  <span className="font-medium">42</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>調査中</span>
                  </div>
                  <span className="font-medium">28</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>対応中</span>
                  </div>
                  <span className="font-medium">35</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>解決済み</span>
                  </div>
                  <span className="font-medium">15</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
