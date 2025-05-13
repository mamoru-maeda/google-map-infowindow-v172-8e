import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="account">アカウント</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>一般設定</CardTitle>
              <CardDescription>アプリケーションの基本設定を管理します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">言語</Label>
                <select id="language" className="w-full p-2 border rounded-md">
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">テーマ</Label>
                <select id="theme" className="w-full p-2 border rounded-md">
                  <option value="system">システム設定に合わせる</option>
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">自動更新</Label>
                <Switch id="auto-refresh" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-interval">更新間隔（分）</Label>
                <Input id="refresh-interval" type="number" min="1" max="60" defaultValue="5" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>通知の受け取り方を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">メール通知</Label>
                <Switch id="email-notifications" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">プッシュ通知</Label>
                <Switch id="push-notifications" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="critical-alerts">緊急アラート</Label>
                <Switch id="critical-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="report-updates">報告更新通知</Label>
                <Switch id="report-updates" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>アカウント設定</CardTitle>
              <CardDescription>アカウント情報を管理します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input id="name" defaultValue="山田 太郎" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" defaultValue="yamada@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">所属組織</Label>
                <Input id="organization" defaultValue="静岡県災害対策本部" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">役割</Label>
                <select id="role" className="w-full p-2 border rounded-md">
                  <option value="admin">管理者</option>
                  <option value="reporter">報告者</option>
                  <option value="viewer">閲覧者</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">パスワード変更</Button>
              <Button>保存</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
