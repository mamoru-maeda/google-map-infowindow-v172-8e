"use client"

import type React from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { localStorageUtils } from "@/lib/utils"

interface SnapshotButtonProps {
  activeCount?: number
  onSnapshot?: () => void
  disabled?: boolean
}

const SNAPSHOT_STORAGE_KEY = "google-map-snapshots-v1"
const INFOWINDOW_STORAGE_KEY = "google-map-infowindows-v14"

const SnapshotButton: React.FC<SnapshotButtonProps> = ({ activeCount = 0, onSnapshot, disabled = false }) => {
  const { toast } = useToast()

  const handleSnapshot = () => {
    // 現在の吹き出し状態をローカルストレージから取得
    const currentInfoWindows = localStorageUtils.loadData(INFOWINDOW_STORAGE_KEY, {})
    const infoWindowEntries = Object.entries(currentInfoWindows)

    // 有効な吹き出しのみをカウント
    const validInfoWindows = infoWindowEntries.filter(([id, infoWindow]: [string, any]) => {
      return (
        infoWindow &&
        infoWindow.position &&
        typeof infoWindow.position.lat === "number" &&
        typeof infoWindow.position.lng === "number"
      )
    })

    const actualCount = validInfoWindows.length

    if (actualCount === 0) {
      toast({
        title: "保存できません",
        description: "保存する吹き出しがありません",
        variant: "destructive",
      })
      return
    }

    const now = new Date()
    const timestamp = now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    // 有効な吹き出しのみを保存
    const validInfoWindowsObject = Object.fromEntries(validInfoWindows)

    const snapshot = {
      id: `snapshot_${Date.now()}`,
      name: timestamp,
      timestamp: Date.now(),
      infoWindows: validInfoWindowsObject,
    }

    // 既存のスナップショットを読み込み
    const existingSnapshots = localStorageUtils.loadData(SNAPSHOT_STORAGE_KEY, [])
    const updatedSnapshots = [snapshot, ...existingSnapshots]

    // スナップショットを保存
    localStorageUtils.saveData(SNAPSHOT_STORAGE_KEY, updatedSnapshots)

    toast({
      title: "スナップショット保存完了",
      description: `${actualCount}個の吹き出しを保存しました`,
    })

    console.log(`📸 スナップショット保存: ${actualCount}個の吹き出し`)
    console.log("保存されたスナップショット詳細:", snapshot)

    // onSnapshotコールバックがある場合は実行（重複保存を避けるため、ここでは状態更新のみ）
    if (onSnapshot) {
      onSnapshot()
    }
  }

  const backgroundClass = activeCount === 0 ? "bg-white/50" : "bg-white"

  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-8 gap-1 ${backgroundClass}`}
      onClick={handleSnapshot}
      disabled={disabled}
    >
      <Camera className="h-4 w-4" />
      <span>スナップショット</span>
    </Button>
  )
}

export default SnapshotButton
