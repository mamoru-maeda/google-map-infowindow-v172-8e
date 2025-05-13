"use client"

import type React from "react"

import { useState } from "react"
import { Camera, MapPin, AlertTriangle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function StepWizardLayout() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    disasterType: "",
    location: "",
    title: "",
    description: "",
    severity: "medium",
    contact: "",
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, severity: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // 送信処理をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setCurrentStep(currentStep + 1)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>被害状況報告</CardTitle>
          <CardDescription>被害状況を報告するには、以下のステップに従って情報を入力してください。</CardDescription>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>

        <CardContent>
          <div className="flex justify-between mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index + 1 === currentStep
                    ? "text-primary"
                    : index + 1 < currentStep
                      ? "text-primary/70"
                      : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    index + 1 === currentStep
                      ? "border-primary bg-primary/10"
                      : index + 1 < currentStep
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300"
                  }`}
                >
                  {index + 1 < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs mt-1">
                  {index === 0 ? "基本情報" : index === 1 ? "位置情報" : index === 2 ? "詳細情報" : "確認"}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ステップ1: 基本情報 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">基本情報</h2>

                <div className="space-y-2">
                  <Label htmlFor="disasterType">災害種別</Label>
                  <Select
                    value={formData.disasterType}
                    onValueChange={(value) => handleSelectChange("disasterType", value)}
                    required
                  >
                    <SelectTrigger id="disasterType">
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
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    placeholder="被害の概要を簡潔に"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>被害の深刻度</Label>
                  <RadioGroup value={formData.severity} onValueChange={handleRadioChange} className="flex space-x-2">
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
            )}

            {/* ステップ2: 位置情報 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">位置情報</h2>

                <div className="space-y-2">
                  <Label htmlFor="location">発生場所</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="住所または地名"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" className="flex-shrink-0">
                      <MapPin className="h-4 w-4 mr-2" />
                      地図で選択
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-4 mt-4">
                  <div className="text-center text-gray-500 py-8">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>地図表示エリア</p>
                    <p className="text-xs">（実際の実装ではGoogle Maps等を表示）</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <Button type="button" variant="outline" size="sm">
                    現在地を使用
                  </Button>
                  <p className="text-xs text-gray-500">または地図上で位置を選択してください</p>
                </div>
              </div>
            )}

            {/* ステップ3: 詳細情報 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">詳細情報</h2>

                <div className="space-y-2">
                  <Label htmlFor="description">被害状況の詳細</Label>
                  <Textarea
                    id="description"
                    placeholder="被害の状況、範囲、影響などを詳しく記入してください"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
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

                <div className="space-y-2">
                  <Label htmlFor="contact">連絡先（任意）</Label>
                  <Input
                    id="contact"
                    placeholder="電話番号またはメールアドレス"
                    value={formData.contact}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* ステップ4: 確認 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">入力内容の確認</h2>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">災害種別:</div>
                    <div className="col-span-2 font-medium">
                      {formData.disasterType === "river"
                        ? "河川"
                        : formData.disasterType === "coast"
                          ? "海岸"
                          : formData.disasterType === "sediment"
                            ? "砂防"
                            : formData.disasterType === "steep_slope"
                              ? "急傾斜"
                              : formData.disasterType === "landslide"
                                ? "地すべり"
                                : formData.disasterType === "road"
                                  ? "道路"
                                  : formData.disasterType === "bridge"
                                    ? "橋梁"
                                    : formData.disasterType === "sewage"
                                      ? "下水道"
                                      : formData.disasterType === "harbor_coast"
                                        ? "海岸(港湾)"
                                        : formData.disasterType === "harbor"
                                          ? "港湾"
                                          : formData.disasterType === "fishing_port"
                                            ? "漁港"
                                            : formData.disasterType === "park"
                                              ? "公園"
                                              : formData.disasterType === "other"
                                                ? "その他"
                                                : "未選択"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">タイトル:</div>
                    <div className="col-span-2 font-medium">{formData.title || "未入力"}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">深刻度:</div>
                    <div className="col-span-2 font-medium">
                      {formData.severity === "low" ? (
                        <span className="text-green-600">軽微</span>
                      ) : formData.severity === "medium" ? (
                        <span className="text-yellow-600">中程度</span>
                      ) : formData.severity === "high" ? (
                        <span className="text-orange-600">重大</span>
                      ) : (
                        <span className="text-red-600">緊急</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">発生場所:</div>
                    <div className="col-span-2 font-medium">{formData.location || "未入力"}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">詳細情報:</div>
                    <div className="col-span-2 font-medium">{formData.description || "未入力"}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">写真:</div>
                    <div className="col-span-2">
                      {imagePreview ? (
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="プレビュー"
                          className="w-32 h-24 object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">連絡先:</div>
                    <div className="col-span-2 font-medium">{formData.contact || "未入力"}</div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-800 text-sm">
                  <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                  内容をご確認の上、「報告を送信」ボタンをクリックしてください。送信後の修正はできません。
                </div>
              </div>
            )}

            {/* 完了画面 */}
            {currentStep === 5 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">報告が完了しました</h2>
                <p className="text-gray-600 mb-6">
                  被害状況の報告ありがとうございます。
                  <br />
                  担当者が確認次第、対応いたします。
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1)
                    setFormData({
                      disasterType: "",
                      location: "",
                      title: "",
                      description: "",
                      severity: "medium",
                      contact: "",
                    })
                    setImagePreview(null)
                  }}
                >
                  新しい報告を作成
                </Button>
              </div>
            )}
          </form>
        </CardContent>

        {currentStep < 5 && (
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              戻る
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                次へ
              </Button>
            ) : (
              <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "送信中..." : "報告を送信"}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
