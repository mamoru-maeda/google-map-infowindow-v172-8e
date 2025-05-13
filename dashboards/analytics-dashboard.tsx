"use client"

import { useState, useEffect, useRef } from "react"
import {
  Filter,
  Download,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Info,
  Layers,
  ChevronDown,
  Plus,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  PieChart as RechartsePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// モックデータ
const disasterStats = {
  total: 120,
  critical: 12,
  high: 28,
  medium: 45,
  low: 35,
  trend: "+8%",
  trendDirection: "up", // "up" or "down"
}

const responseStats = {
  reported: 42,
  investigating: 28,
  inProgress: 35,
  resolved: 15,
  avgResponseTime: "4.2時間",
  trend: "-12%",
  trendDirection: "down", // "up" or "down"
}

// 災害種別データ
const disasterTypeData = [
  { name: "河川", value: 32, color: "#4FC3F7" },
  { name: "急傾斜", value: 24, color: "#FF5722" },
  { name: "道路", value: 18, color: "#7E57C2" },
  { name: "その他", value: 26, color: "#78909C" },
]

// 地域別被害状況データ
const regionData = [
  { name: "静岡市", value: 32, fill: "#4FC3F7" },
  { name: "浜松市", value: 28, fill: "#FF5722" },
  { name: "沼津市", value: 24, fill: "#7E57C2" },
  { name: "富士市", value: 18, fill: "#26A69A" },
  { name: "三島市", value: 12, fill: "#FF7043" },
  { name: "下田市", value: 6, fill: "#78909C" },
]

// 最近の報告データ
const recentReports = [
  {
    id: 1001,
    title: "河川護岸崩壊",
    location: "静岡市葵区",
    category: "river",
    severity: "critical",
    date: "2023-11-15",
    time: "2時間前",
  },
  {
    id: 1002,
    title: "道路陥没",
    location: "浜松市中区",
    category: "road",
    severity: "medium",
    date: "2023-11-14",
    time: "5時間前",
  },
  {
    id: 1003,
    title: "急傾斜地崩壊",
    location: "沼津市大平",
    category: "steep_slope",
    severity: "high",
    date: "2023-11-13",
    time: "1日前",
  },
  {
    id: 1004,
    title: "下水道管破損",
    location: "富士市松岡",
    category: "sewage",
    severity: "low",
    date: "2023-11-12",
    time: "2日前",
  },
]

// 詳細レポートデータ
const detailedReports = Array.from({ length: 10 }).map((_, index) => {
  const id = 1000 + index + 1
  const date = new Date(2023, 10, 15 - (index % 5))
  const categories = ["river", "steep_slope", "road", "sewage"]
  const category = categories[index % 4]
  const titles = ["河川護岸崩壊", "急傾斜地崩壊", "道路陥没", "下水道管破損"]
  const title = titles[index % 4]
  const locations = ["静岡市葵区", "浜松市中区", "沼津市大平", "富士市松岡", "三島市大場", "下田市白浜"]
  const location = locations[index % 6]
  const severities = ["critical", "high", "medium", "low"]
  const severity = severities[index % 4]
  const statuses = ["reported", "investigating", "in_progress", "resolved"]
  const status = statuses[index % 4]

  return {
    id,
    date: date.toISOString().split("T")[0],
    category,
    title,
    location,
    severity,
    status,
    isNew: index === 0,
  }
})

export default function AnalyticsDashboard() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("week")
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 地図の初期化（実際の実装ではGoogle Maps APIを使用）
  useEffect(() => {
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
            <div class="text-center">
              <p>ここに地図が表示されます</p>
              <p class="text-sm">（実際の実装ではGoogle Maps APIを使用）</p>
            </div>
          </div>
        `
        setIsLoading(false)
      }
    }, 1000)
  }, [])

  // 時間範囲に基づくデータの取得（実際の実装ではAPIからデータを取得）
  useEffect(() => {
    setIsLoading(true)
    // データ取得のシミュレーション
    setTimeout(() => {
      setIsLoading(false)
    }, 800)
  }, [timeRange])

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

  // 深刻度に基づくバッジを取得
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

  // ステータスに基づくバッジを取得
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            報告済
          </Badge>
        )
      case "investigating":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-700">
            調査中
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            対応中
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            解決済
          </Badge>
        )
      default:
        return <Badge variant="outline">不明</Badge>
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">災害情報分析ダッシュボード</h1>
          <p className="text-gray-500">静岡県内の被害状況をリアルタイムで分析</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>表示期間</SelectLabel>
                <SelectItem value="day">24時間</SelectItem>
                <SelectItem value="week">1週間</SelectItem>
                <SelectItem value="month">1ヶ月</SelectItem>
                <SelectItem value="quarter">3ヶ月</SelectItem>
                <SelectItem value="year">1年</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                エクスポート
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>データ形式を選択</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>CSV形式</DropdownMenuItem>
              <DropdownMenuItem>Excel形式</DropdownMenuItem>
              <DropdownMenuItem>PDF形式</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>レポートを生成</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規報告
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>被害状況の新規報告</DialogTitle>
                <DialogDescription>
                  被害の詳細情報を入力してください。できるだけ正確な情報の提供にご協力ください。
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-center text-gray-500">（ここに報告フォームが表示されます）</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={() => setIsReportDialogOpen(false)}>報告を送信</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* メインコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="map">地図分析</TabsTrigger>
          <TabsTrigger value="reports">詳細レポート</TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-4">
          {/* KPI カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">総被害報告数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold">{disasterStats.total}</div>
                  <div
                    className={`flex items-center text-sm ${
                      disasterStats.trendDirection === "up" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {disasterStats.trendDirection === "up" ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {disasterStats.trend}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">前週比</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">緊急・重大案件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold">{disasterStats.critical + disasterStats.high}</div>
                  <div className="flex gap-2">
                    <Badge className="bg-red-500">{disasterStats.critical}</Badge>
                    <Badge className="bg-orange-500">{disasterStats.high}</Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  緊急: {disasterStats.critical}, 重大: {disasterStats.high}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">対応状況</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold">{responseStats.resolved}</div>
                  <div className="text-sm text-gray-500">/ {disasterStats.total}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${(responseStats.resolved / disasterStats.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  解決済み: {Math.round((responseStats.resolved / disasterStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">平均対応時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold">{responseStats.avgResponseTime}</div>
                  <div
                    className={`flex items-center text-sm ${
                      responseStats.trendDirection === "up" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {responseStats.trendDirection === "up" ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {responseStats.trend}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">前週比</p>
              </CardContent>
            </Card>
          </div>

          {/* チャートとマップ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">災害種別の内訳</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsePieChart>
                      <Pie
                        data={disasterTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {disasterTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}件`, "報告数"]} />
                    </RechartsePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {disasterTypeData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">地域別被害状況</CardTitle>
                  <CardDescription>静岡県内の地域別報告数</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px]">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">データを読み込み中...</p>
                      </div>
                    </div>
                  ) : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}件`, "報告数"]} />
                      <Legend />
                      <Bar dataKey="value" name="報告数">
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近の報告と対応状況 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">最近の報告</CardTitle>
                <Button variant="ghost" size="sm">
                  すべて表示
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map((report, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          report.severity === "critical"
                            ? "bg-red-500"
                            : report.severity === "high"
                              ? "bg-orange-500"
                              : report.severity === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                        }`}
                      ></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{report.title}</p>
                          {getSeverityBadge(report.severity)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {report.location}
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          {report.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">対応状況</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>ステータスでフィルター</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>すべて表示</DropdownMenuItem>
                    <DropdownMenuItem>報告済み</DropdownMenuItem>
                    <DropdownMenuItem>調査中</DropdownMenuItem>
                    <DropdownMenuItem>対応中</DropdownMenuItem>
                    <DropdownMenuItem>解決済み</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>報告済み</span>
                      <span className="font-medium">{responseStats.reported}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(responseStats.reported / disasterStats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>調査中</span>
                      <span className="font-medium">{responseStats.investigating}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(responseStats.investigating / disasterStats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>対応中</span>
                      <span className="font-medium">{responseStats.inProgress}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(responseStats.inProgress / disasterStats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>解決済み</span>
                      <span className="font-medium">{responseStats.resolved}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(responseStats.resolved / disasterStats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 地図分析タブ */}
        <TabsContent value="map">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">災害マップ分析</CardTitle>
                <CardDescription>地図上で被害状況を分析</CardDescription>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Layers className="h-4 w-4 mr-2" />
                      レイヤー
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>表示レイヤー</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>すべての災害</DropdownMenuItem>
                    <DropdownMenuItem>河川関連</DropdownMenuItem>
                    <DropdownMenuItem>道路関連</DropdownMenuItem>
                    <DropdownMenuItem>急傾斜地関連</DropdownMenuItem>
                    <DropdownMenuItem>ハザードマップ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  フィルター
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div ref={mapRef} className="w-full h-[600px] rounded-md overflow-hidden"></div>

                {/* マップ上のコントロール */}
                <div className="absolute top-4 left-4 z-10">
                  <Card className="w-64">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">災害種別でフィルター</p>
                        <div className="grid grid-cols-2 gap-1">
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                            河川
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                            急傾斜
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                            道路
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            その他
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 凡例 */}
                <div className="absolute bottom-4 right-4 z-10">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium mb-2">深刻度</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-xs">緊急</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="text-xs">重大</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-xs">中程度</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs">軽微</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 詳細レポートタブ */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">詳細レポート</CardTitle>
                <CardDescription>被害報告の詳細リスト</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
                  <Input placeholder="検索..." className="pl-8 w-[250px]" />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  フィルター
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  エクスポート
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-gray-100 p-3 text-sm font-medium">
                  <div className="col-span-1">#ID</div>
                  <div className="col-span-2">日時</div>
                  <div className="col-span-2">種別</div>
                  <div className="col-span-3">タイトル</div>
                  <div className="col-span-2">場所</div>
                  <div className="col-span-1">深刻度</div>
                  <div className="col-span-1">状態</div>
                </div>

                {detailedReports.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 p-3 text-sm border-t hover:bg-gray-50 cursor-pointer">
                    <div className="col-span-1 text-gray-500">#{item.id}</div>
                    <div className="col-span-2">{item.date}</div>
                    <div className="col-span-2">{getCategoryBadge(item.category)}</div>
                    <div className="col-span-3 font-medium">
                      {item.title}
                      {item.isNew && <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">新規</Badge>}
                    </div>
                    <div className="col-span-2">{item.location}</div>
                    <div className="col-span-1">{getSeverityBadge(item.severity)}</div>
                    <div className="col-span-1">{getStatusBadge(item.status)}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">全120件中 1-10件を表示</div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled>
                    前へ
                  </Button>
                  <Button variant="outline" size="sm" className="bg-gray-100">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    3
                  </Button>
                  <Button variant="outline" size="sm">
                    ...
                  </Button>
                  <Button variant="outline" size="sm">
                    12
                  </Button>
                  <Button variant="outline" size="sm">
                    次へ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
