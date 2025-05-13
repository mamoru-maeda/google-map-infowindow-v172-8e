"use client"

import type React from "react"

import { useState } from "react"
import { Camera, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function SimpleFormLayout() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">被害状況報告</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>被害情報を入力</CardTitle>
          <CardDescription>
            被害の詳細情報を入力してください。できるだけ正確な情報の提供にご協力ください。
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline">
              キャンセル
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
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
