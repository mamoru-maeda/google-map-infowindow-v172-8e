"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { localStorageUtils } from "@/lib/utils"
import type { InfoWindowState } from "@/types/map-types"

const STORAGE_KEY = "google-map-infowindows-v14"
const MAX_INFOWINDOWS = 12

export default function InfoWindowManagement() {
  const [activeInfoWindows, setActiveInfoWindows] = useState<Record<string, InfoWindowState>>({})

  // ローカルストレージから吹き出し状態を読み込む
  useEffect(() => {
    const loadInfoWindowStates = () => {
      const savedStates = localStorageUtils.loadData(STORAGE_KEY, {})
      setActiveInfoWindows(savedStates)
    }

    loadInfoWindowStates()

    // ストレージの変更を監視
    const handleStorageChange = () => {
      loadInfoWindowStates()
    }

    window.addEventListener("storage", handleStorageChange)

    // 定期的に状態を更新（同一タブ内での変更を検知）
    const interval = setInterval(loadInfoWindowStates, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // 12個の吹き出しを一度に開くテスト関数
  const handleOpen12InfoWindows = () => {
    // この機能は地図ページでのみ動作するため、設定ページでは無効
    alert("この機能は地図ページ（/map）でのみ利用できます。")
  }

  // 全ての吹き出しを閉じる
  const handleCloseAllInfoWindows = () => {
    setActiveInfoWindows({})
    localStorageUtils.saveData(STORAGE_KEY, {})
  }

  const activeInfoWindowCount = Object.keys(activeInfoWindows).length
  const minimizedCount = Object.values(activeInfoWindows).filter((info) => info.isMinimized).length
  const organizedCount = Object.values(activeInfoWindows).filter((info) => info.isOrganized).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>吹き出し管理</CardTitle>
        <CardDescription>現在開いている吹き出しの状態を管理します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">表示中:</span>
            <Badge variant={activeInfoWindowCount >= MAX_INFOWINDOWS ? "destructive" : "default"}>
              {activeInfoWindowCount}/{MAX_INFOWINDOWS}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">最小化:</span>
            <Badge variant="secondary">{minimizedCount}</Badge>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">整列済み:</span>
            <Badge variant="outline">{organizedCount}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={handleOpen12InfoWindows} className="w-full bg-transparent" disabled={true} variant="outline">
            12個同時表示テスト
          </Button>
          <p className="text-xs text-gray-500 text-center">※ この機能は地図ページでのみ利用できます</p>
        </div>

        <Button
          onClick={handleCloseAllInfoWindows}
          variant="destructive"
          className="w-full"
          disabled={activeInfoWindowCount === 0}
        >
          すべての吹き出しを閉じる
        </Button>

        {activeInfoWindowCount > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">現在の吹き出し一覧</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(activeInfoWindows).map(([markerId, infoWindow]) => (
                <div key={markerId} className="flex justify-between items-center text-sm">
                  <span className="text-blue-800 truncate">{markerId}</span>
                  <div className="flex gap-1">
                    {infoWindow.isMinimized && (
                      <Badge variant="secondary" className="text-xs">
                        最小化
                      </Badge>
                    )}
                    {infoWindow.isOrganized && (
                      <Badge variant="outline" className="text-xs">
                        整列済み
                      </Badge>
                    )}
                    {infoWindow.userPositioned && (
                      <Badge variant="default" className="text-xs">
                        手動配置
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
