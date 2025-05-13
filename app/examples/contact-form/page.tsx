"use client"

import { useState } from "react"
import SimpleGenericFormLayout from "@/layouts/simple-generic-form-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ContactFormPage() {
  const [activeTab, setActiveTab] = useState("customer")
  const [submissionCount, setSubmissionCount] = useState({ customer: 0, technical: 0, business: 0 })

  // カスタム送信処理
  const handleSubmit = async (values: any) => {
    console.log(`${activeTab}フォームデータを送信:`, values)

    // 実際のAPIリクエストをシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 送信カウントを更新
    setSubmissionCount((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab as keyof typeof prev] + 1,
    }))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">お問い合わせフォーム</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="customer">カスタマーサポート</TabsTrigger>
          <TabsTrigger value="technical">技術サポート</TabsTrigger>
          <TabsTrigger value="business">ビジネス提携</TabsTrigger>
        </TabsList>

        <TabsContent value="customer">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SimpleGenericFormLayout
                title="カスタマーサポート"
                description="製品の使用方法や一般的なお問い合わせについてはこちらのフォームをご利用ください。"
                onSubmit={handleSubmit}
              />
            </div>
            <ContactSidebar
              type="customer"
              count={submissionCount.customer}
              email="customer@example.com"
              phone="0120-123-456"
              hours="平日 9:00-18:00"
            />
          </div>
        </TabsContent>

        <TabsContent value="technical">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SimpleGenericFormLayout
                title="技術サポート"
                description="技術的な問題や障害報告についてはこちらのフォームをご利用ください。"
                onSubmit={handleSubmit}
              />
            </div>
            <ContactSidebar
              type="technical"
              count={submissionCount.technical}
              email="tech@example.com"
              phone="0120-789-012"
              hours="平日 10:00-20:00"
            />
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SimpleGenericFormLayout
                title="ビジネス提携のお問い合わせ"
                description="ビジネス提携や協業についてのご相談はこちらのフォームをご利用ください。"
                onSubmit={handleSubmit}
              />
            </div>
            <ContactSidebar
              type="business"
              count={submissionCount.business}
              email="business@example.com"
              phone="03-1234-5678"
              hours="平日 9:00-17:00"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ContactSidebarProps {
  type: string
  count: number
  email: string
  phone: string
  hours: string
}

function ContactSidebar({ type, count, email, phone, hours }: ContactSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>お問い合わせ方法</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">メールアドレス</h3>
            <p className="text-blue-600">{email}</p>
          </div>
          <div>
            <h3 className="font-medium">電話番号</h3>
            <p>{phone}</p>
          </div>
          <div>
            <h3 className="font-medium">受付時間</h3>
            <p>{hours}</p>
          </div>
          <div className="pt-2">
            <Button variant="outline" className="w-full">
              よくある質問を確認する
            </Button>
          </div>
        </CardContent>
      </Card>

      {count > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-green-700">{count}件のお問い合わせを送信しました。ありがとうございます。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
