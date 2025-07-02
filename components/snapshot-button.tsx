"use client"

import type React from "react"
import { useState } from "react"
import { Camera, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface InfoWindowState {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  marker: any
}

interface SnapshotData {
  name: string
  timestamp: string
  infoWindows: InfoWindowState[]
}

interface SnapshotButtonProps {
  infoWindows: InfoWindowState[]
  onRestoreSnapshot: (snapshot: SnapshotData) => void
  activeCount: number
}

const SnapshotButton: React.FC<SnapshotButtonProps> = ({ infoWindows, onRestoreSnapshot, activeCount }) => {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([])
  const { toast } = useToast()

  const saveSnapshot = () => {
    const validInfoWindows = infoWindows.filter((iw) => iw && iw.marker)
    const now = new Date()
    const timestamp = now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const snapshot: SnapshotData = {
      name: timestamp,
      timestamp,
      infoWindows: validInfoWindows,
    }

    setSnapshots((prev) => [snapshot, ...prev])
    toast({
      title: "スナップショット保存完了",
      description: `${validInfoWindows.length}個の吹き出しを保存しました`,
    })
  }

  const restoreSnapshot = (snapshot: SnapshotData) => {
    onRestoreSnapshot(snapshot)
    toast({
      title: "スナップショット復元完了",
      description: `${snapshot.infoWindows.length}個の吹き出しを復元しました`,
    })
  }

  const deleteSnapshot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSnapshots((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "スナップショット削除完了",
      description: "スナップショットを削除しました",
    })
  }

  const backgroundClass = activeCount === 0 ? "bg-white/85" : "bg-white"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`h-8 gap-1 ${backgroundClass}`}>
          <Camera className="h-4 w-4" />
          <span>スナップショット</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>スナップショット管理</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={saveSnapshot}>
          <Camera className="mr-2 h-4 w-4" />
          現在の状態を保存
        </DropdownMenuItem>
        {snapshots.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>保存済みスナップショット</DropdownMenuLabel>
            {snapshots.map((snapshot, index) => (
              <DropdownMenuItem
                key={index}
                className="flex items-center justify-between p-2"
                onClick={() => restoreSnapshot(snapshot)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{snapshot.name}</span>
                  <span className="text-xs text-muted-foreground">{snapshot.infoWindows.length}個の吹き出し</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => deleteSnapshot(index, e)}
                  >
                    ×
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SnapshotButton
