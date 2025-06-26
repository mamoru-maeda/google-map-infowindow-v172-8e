"use client"

import { useState, useEffect, useCallback } from "react"
import type { MapSnapshot } from "@/types/snapshot-types"
import type { InfoWindowState } from "@/types/map-types"

const SNAPSHOTS_STORAGE_KEY = "google-map-snapshots-v2"
const MAX_SNAPSHOTS = 50

export const useSnapshots = () => {
  const [snapshots, setSnapshots] = useState<MapSnapshot[]>([])

  // ローカルストレージからスナップショットを読み込む
  const loadSnapshots = useCallback(() => {
    try {
      if (typeof window === "undefined") return []

      const stored = localStorage.getItem(SNAPSHOTS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as MapSnapshot[]
        console.log(`📚 スナップショット読み込み: ${parsed.length}件`)
        return parsed.sort((a, b) => b.timestamp - a.timestamp) // 新しい順にソート
      }
    } catch (error) {
      console.error("❌ スナップショット読み込みエラー:", error)
    }
    return []
  }, [])

  // ローカルストレージにスナップショットを保存する
  const saveSnapshots = useCallback((snapshots: MapSnapshot[]) => {
    try {
      if (typeof window === "undefined") return

      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots))
      console.log(`💾 スナップショット保存: ${snapshots.length}件`)
    } catch (error) {
      console.error("❌ スナップショット保存エラー:", error)
    }
  }, [])

  // 初期化時にスナップショットを読み込む
  useEffect(() => {
    const loadedSnapshots = loadSnapshots()
    setSnapshots(loadedSnapshots)
  }, [loadSnapshots])

  // 新しいスナップショットを保存する
  const saveSnapshot = useCallback(
    (
      title: string,
      infoWindows: Record<string, InfoWindowState>,
      mapCenter: { lat: number; lng: number },
      mapZoom: number,
      selectedCategories: string[],
    ): MapSnapshot => {
      const newSnapshot: MapSnapshot = {
        id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim() || `スナップショット ${new Date().toLocaleString("ja-JP")}`,
        timestamp: Date.now(),
        infoWindows,
        mapCenter,
        mapZoom,
        selectedCategories,
        totalInfoWindows: Object.keys(infoWindows).length,
      }

      setSnapshots((prev) => {
        const updated = [newSnapshot, ...prev].slice(0, MAX_SNAPSHOTS) // 最大件数を制限
        saveSnapshots(updated)
        return updated
      })

      console.log(`📸 スナップショット保存: "${newSnapshot.title}"`)
      return newSnapshot
    },
    [saveSnapshots],
  )

  // スナップショットを削除する
  const deleteSnapshot = useCallback(
    (snapshotId: string) => {
      setSnapshots((prev) => {
        const updated = prev.filter((s) => s.id !== snapshotId)
        saveSnapshots(updated)
        console.log(`🗑️ スナップショット削除: ${snapshotId}`)
        return updated
      })
    },
    [saveSnapshots],
  )

  // スナップショットのタイトルを更新する
  const updateSnapshotTitle = useCallback(
    (snapshotId: string, newTitle: string) => {
      setSnapshots((prev) => {
        const updated = prev.map((s) => (s.id === snapshotId ? { ...s, title: newTitle.trim() } : s))
        saveSnapshots(updated)
        console.log(`✏️ スナップショットタイトル更新: ${snapshotId} -> "${newTitle}"`)
        return updated
      })
    },
    [saveSnapshots],
  )

  // 全スナップショットを削除する
  const clearAllSnapshots = useCallback(() => {
    setSnapshots([])
    saveSnapshots([])
    console.log("🗑️ 全スナップショット削除")
  }, [saveSnapshots])

  return {
    snapshots,
    saveSnapshot,
    deleteSnapshot,
    updateSnapshotTitle,
    clearAllSnapshots,
  }
}
