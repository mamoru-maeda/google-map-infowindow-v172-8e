import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, PlusCircle, Clock, MapPin } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  // サンプルの報告データ
  const reports = [
    {
      id: 1,
      title: "河川護岸崩壊",
      location: "静岡市葵区",
      category: "river",
      severity: "critical",
      date: "2023-11-15",
      time: "2時間前",
    },
    {
      id: 2,
      title: "道路陥没",
      location: "浜松市中区",
      category: "road",
      severity: "medium",
      date: "2023-11-14",
      time: "5時間前",
    },
    {
      id: 3,
      title: "急傾斜地崩壊",
      location: "沼津市大平",
      category: "steep_slope",
      severity: "high",
      date: "2023-11-13",
      time: "1日前",
    },
    {
      id: 4,
      title: "下水道管破損",
      location: "富士市松岡",
      category: "sewage",
      severity: "low",
      date: "2023-11-12",
      time: "2日前",
    },
    {
      id: 5,
      title: "橋梁損傷",
      location: "三島市大場",
      category: "bridge",
      severity: "high",
      date: "2023-11-11",
      time: "3日前",
    },
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">報告一覧</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
            <Input placeholder="検索..." className="pl-8 w-[250px]" />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            フィルター
          </Button>
          <Link href="/reports/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              新規報告
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">最近の報告</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
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
                      {report.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
