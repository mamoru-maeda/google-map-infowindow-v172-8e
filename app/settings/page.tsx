import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import InfoWindowSizeSettings from "@/components/infowindow-size-settings"
import InfoWindowManagement from "@/components/infowindow-management"
import { Info } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="infowindow">吹き出し</TabsTrigger>
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

        <TabsContent value="infowindow" className="mt-6">
          <div className="space-y-6">
            {/* 吹き出し管理パネル */}
            <InfoWindowManagement />

            {/* 吹き出し管理インフォメーション */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  吹き出し管理について
                </CardTitle>
                <CardDescription>地図上の吹き出し（インフォウィンドウ）の動作と管理方法について</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">基本操作</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• マーカーをクリックして吹き出しを開く</li>
                      <li>• 吹き出しの角をドラッグしてサイズ変更</li>
                      <li>• 吹き出しをドラッグして位置移動</li>
                      <li>• ×ボタンで個別に閉じる</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">一括操作</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• 「すべて閉じる」で全吹き出しを閉じる</li>
                      <li>• 「中心整列」で2つの吹き出しを整列</li>
                      <li>• 「周辺整列」で複数吹き出しを配置</li>
                      <li>• 設定変更は新しい吹き出しに適用</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">サイズ制限</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• 最小サイズ: 200×250px</li>
                      <li>• 最大サイズ: 500×600px</li>
                      <li>• 推奨サイズ: 280×360px</li>
                      <li>• 自動調整で画面内に収まる</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">配置ルール</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• 中心整列: 左右に2つを配置</li>
                      <li>• 周辺整列: 円形に複数配置</li>
                      <li>• 重複回避: 自動で位置調整</li>
                      <li>• 画面外回避: 境界内に配置</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">💡 使用のコツ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <h5 className="font-medium mb-1">効率的な閲覧</h5>
                      <ul className="space-y-1">
                        <li>• 関連する情報は同時に開く</li>
                        <li>• サイズを調整して見やすく</li>
                        <li>• 不要な吹き出しは閉じる</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">パフォーマンス</h5>
                      <ul className="space-y-1">
                        <li>• 同時表示は5個まで推奨</li>
                        <li>• 大きすぎるサイズは避ける</li>
                        <li>• 定期的に不要な吹き出しを閉じる</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 既存の吹き出しサイズ設定 */}
            <InfoWindowSizeSettings />
          </div>
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
