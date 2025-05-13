import Link from "next/link"
import { BarChart3, Clock, Map, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-bold mb-2">災害情報システム</h1>
        <p className="text-gray-600 mb-8">静岡県の災害情報を可視化・分析するためのプラットフォーム</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="h-5 w-5 mr-2" />
                災害マップ
              </CardTitle>
              <CardDescription>静岡県内の災害情報をインタラクティブなマップで確認</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                マップ上で災害の位置を確認し、詳細情報を表示できます。吹き出しはドラッグ可能で、最小化したり閉じたりすることができます。
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/map" className="w-full">
                <Button className="w-full">マップを表示</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                被害報告・分析ダッシュボード
              </CardTitle>
              <CardDescription>災害情報を分析し、傾向や統計を確認</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                災害種別の内訳、地域別被害状況、対応状況などを視覚的に分析できます。詳細なレポートも確認できます。
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboards/analytics" className="w-full">
                <Button className="w-full">分析ダッシュボードを表示</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                タイムラインダッシュボード
              </CardTitle>
              <CardDescription>災害情報を時系列で確認</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                災害の発生から対応までの流れを時系列で確認できます。カレンダー表示や地図表示も可能です。
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboards/timeline" className="w-full">
                <Button className="w-full">タイムラインを表示</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="h-5 w-5 mr-2" />
                新規報告
              </CardTitle>
              <CardDescription>新しい災害情報を報告</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                災害の種別、位置、詳細情報、写真などを入力して新しい報告を作成できます。
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/reports/new" className="w-full">
                <Button className="w-full">新規報告を作成</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
