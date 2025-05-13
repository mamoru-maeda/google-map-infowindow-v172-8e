"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Plus,
  Info,
  ArrowRight,
  MoreHorizontal,
  Layers,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function TimelineDashboard() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("timeline")
  const [timeRange, setTimeRange] = useState("week")
  const [timelineView, setTimelineView] = useState("day")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

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
  }, [timeRange, selectedDate])

  // 日付を変更する関数
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  // 日付をフォーマットする関数
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }

  // タイムラインのイベントデータ（モック）
  const timelineEvents = [
    {
      time: "08:30",
      title: "河川護岸崩壊",
      location: "静岡市葵区",
      category: "river",
      severity: "critical",
      status: "reported",
      description: "大雨による河川護岸の崩壊が発生。周辺住民に避難指示を発令。",
    },
    {
      time: "09:15",
      title: "道路陥没",
      location: "浜松市中区",
      category: "road",
      severity: "medium",
      status: "investigating",
      description: "市道で直径約2mの陥没を確認。現在、原因を調査中。",
    },
    {
      time: "10:45",
      title: "急傾斜地崩壊",
      location: "沼津市大平",
      category: "steep_slope",
      severity: "high",
      status: "in_progress",
      description: "住宅地裏の斜面が崩壊。現在、応急対策工事を実施中。",
    },
    {
      time: "12:20",
      title: "下水道管破損",
      location: "富士市松岡",
      category: "sewage",
      severity: "low",
      status: "resolved",
      description: "下水道管の破損を確認。既に修繕作業が完了。",
    },
    {
      time: "14:00",
      title: "橋梁損傷",
      location: "三島市大場",
      category: "bridge",
      severity: "high",
      status: "in_progress",
      description: "市内の橋梁に亀裂を確認。現在、通行止めにして調査中。",
    },
    {
      time: "15:30",
      title: "土砂崩れ",
      location: "下田市白浜",
      category: "landslide",
      severity: "medium",
      status: "investigating",
      description: "海岸沿いの斜面で土砂崩れが発生。現在、被害状況を確認中。",
    },
  ]

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
      case "landslide":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            地すべり
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
          <h1 className="text-2xl font-bold">災害情報タイムライン</h1>
          <p className="text-gray-500">静岡県内の被害状況を時系列で確認</p>
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
          <TabsTrigger value="timeline">タイムライン</TabsTrigger>
          <TabsTrigger value="map">地図表示</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
        </TabsList>

        {/* タイムラインタブ */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-medium">{formatDate(selectedDate)}</div>
                  <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                    今日
                  </Button>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  <Tabs value={timelineView} onValueChange={setTimelineView} className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="day">日</TabsTrigger>
                      <TabsTrigger value="week">週</TabsTrigger>
                      <TabsTrigger value="month">月</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">データを読み込み中...</p>
                    </div>
                  </div>
                ) : null}

                {/* タイムラインの表示 */}
                <div className="relative pl-8 border-l border-gray-200">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="mb-8 relative">
                      {/* 時間マーカー */}
                      <div className="absolute -left-8 mt-1.5 w-4 h-4 rounded-full bg-white border-4 border-blue-500"></div>

                      {/* 時間 */}
                      <div className="absolute -left-24 mt-0 text-sm font-medium text-gray-500">{event.time}</div>

                      {/* イベントカード */}
                      <Card className="ml-4">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <CardTitle className="text-base">{event.title}</CardTitle>
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {event.location}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {getSeverityBadge(event.severity)}
                              {getCategoryBadge(event.category)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-gray-600">{event.description}</p>

                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center">{getStatusBadge(event.status)}</div>
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>詳細情報を表示</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 地図表示タブ */}
        <TabsContent value="map">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">時系列マップ表示</CardTitle>
                <CardDescription>地図上で時間変化を確認</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-2 text-sm font-medium">{formatDate(selectedDate)}</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  タイムスライダー
                </Button>

                <Button variant="outline" size="sm">
                  <Layers className="h-4 w-4 mr-2" />
                  レイヤー
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
                        <p className="text-sm font-medium">時間帯でフィルター</p>
                        <div className="grid grid-cols-2 gap-1">
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <Clock className="h-3 w-3 mr-2" />
                            午前
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <Clock className="h-3 w-3 mr-2" />
                            午後
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <AlertTriangle className="h-3 w-3 mr-2" />
                            緊急・重大
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start h-7">
                            <CheckCircle className="h-3 w-3 mr-2" />
                            解決済み
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ズームコントロール */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex flex-col gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* タイムスライダー */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-3/4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>00:00</span>
                          <span>06:00</span>
                          <span>12:00</span>
                          <span>18:00</span>
                          <span>24:00</span>
                        </div>
                        <div className="relative">
                          <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                          <div
                            className="absolute left-0 top-0 h-2 bg-blue-500 rounded-full"
                            style={{ width: "45%" }}
                          ></div>
                          <div className="absolute left-[45%] top-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/4"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <Button variant="outline" size="sm" className="h-7 px-2">
                            <ChevronLeft className="h-3 w-3 mr-1" />
                            前へ
                          </Button>
                          <div className="text-sm font-medium">現在時刻: 10:48</div>
                          <Button variant="outline" size="sm" className="h-7 px-2">
                            次へ
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* カレンダータブ */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">災害カレンダー</CardTitle>
                <CardDescription>月別の災害発生状況</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">2023年11月</div>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-1">
                {/* 曜日ヘッダー */}
                {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                  <div key={i} className="text-center py-2 font-medium text-sm">
                    {day}
                  </div>
                ))}

                {/* 日付グリッド */}
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i - 2 // 11月1日が水曜日と仮定
                  const isCurrentMonth = day >= 1 && day <= 30
                  const isToday = day === 15 // 仮に今日が11月15日とする
                  const hasEvents = [3, 8, 12, 15, 20, 25].includes(day)
                  const eventCount = hasEvents ? Math.floor(Math.random() * 3) + 1 : 0

                  return (
                    <div
                      key={i}
                      className={`
                        border rounded-md p-1 h-24 
                        ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
                        ${isToday ? "border-blue-500" : "border-gray-200"}
                        ${hasEvents ? "cursor-pointer hover:border-blue-300" : ""}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className={`
                          w-6 h-6 flex items-center justify-center rounded-full text-sm
                          ${isToday ? "bg-blue-500 text-white" : ""}
                        `}
                        >
                          {isCurrentMonth ? day : ""}
                        </div>
                        {eventCount > 0 && <Badge className="bg-blue-500">{eventCount}</Badge>}
                      </div>

                      {/* イベントインジケーター */}
                      {hasEvents && (
                        <div className="mt-1 space-y-1">
                          {eventCount >= 1 && (
                            <div className="text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded truncate">
                              河川護岸崩壊
                            </div>
                          )}
                          {eventCount >= 2 && (
                            <div className="text-xs px-1 py-0.5 bg-orange-100 text-orange-800 rounded truncate">
                              急傾斜地崩壊
                            </div>
                          )}
                          {eventCount >= 3 && (
                            <div className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded truncate">
                              道路陥没
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 凡例 */}
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">緊急</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">重大</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">中程度</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">軽微</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 最近の報告 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">最近の報告</CardTitle>
          <Button variant="ghost" size="sm">
            すべて表示
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timelineEvents.slice(0, 3).map((event, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{event.title}</h3>
                      {getSeverityBadge(event.severity)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {event.location}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  </div>
                  <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {event.time}
                    </div>
                    <div className="flex gap-2">
                      {getCategoryBadge(event.category)}
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
