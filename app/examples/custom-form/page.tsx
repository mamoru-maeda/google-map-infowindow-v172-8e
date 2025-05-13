"use client"

import { useState } from "react"
import SimpleGenericFormLayout from "@/layouts/simple-generic-form-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function CustomFormPage() {
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // カスタム送信処理
  const handleSubmit = async (values: any) => {
    console.log("フォームデータを送信:", values)

    // 実際のAPIリクエストをシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 送信されたデータを保存
    setSubmittedData(values)
    setShowSuccess(true)

    // 5秒後に成功メッセージを非表示
    setTimeout(() => {
      setShowSuccess(false)
    }, 5000)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">カスタマイズされたフォーム</h1>

      {showSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">送信完了</AlertTitle>
          <AlertDescription className="text-green-700">
            フォームが正常に送信されました。ありがとうございます。
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SimpleGenericFormLayout
            title="製品フィードバックフォーム"
            description="当社の製品やサービスに関するご意見・ご感想をお聞かせください。いただいたフィードバックは今後の改善に活用させていただきます。"
            onSubmit={handleSubmit}
          />
        </div>

        <div>
          {submittedData && (
            <Card>
              <CardHeader>
                <CardTitle>送信されたデータ</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>カスタマイズ方法</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <h3 className="font-medium">タイトルのカスタマイズ</h3>
                <p className="text-gray-600">
                  <code>title</code>プロパティを使用してフォームのタイトルを変更できます。
                </p>
              </div>

              <div>
                <h3 className="font-medium">説明文のカスタマイズ</h3>
                <p className="text-gray-600">
                  <code>description</code>プロパティを使用して説明文を変更できます。
                </p>
              </div>

              <div>
                <h3 className="font-medium">送信処理のカスタマイズ</h3>
                <p className="text-gray-600">
                  <code>onSubmit</code>プロパティに関数を渡すことで、送信処理をカスタマイズできます。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
