"use client"

import type React from "react"
import { useState } from "react"
import { History, Play, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MapSnapshot } from "@/types/snapshot-types"

interface HistoryPanelProps {
  snapshots: MapSnapshot[]
  onRestoreSnapshot: (snapshot: MapSnapshot) => void
  onDeleteSnapshot: (snapshotId: string) => void
  onUpdateSnapshotTitle: (snapshotId: string, newTitle: string) => void
  onClearAllSnapshots: () => void
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  snapshots,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onUpdateSnapshotTitle,
  onClearAllSnapshots,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingSnapshot, setEditingSnapshot] = useState<MapSnapshot | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const handleRestore = (snapshot: MapSnapshot) => {
    console.log(`🔄 スナップショット復元: "${snapshot.title}"`)
    onRestoreSnapshot(snapshot)
    setIsOpen(false)
  }

  const handleDelete = (snapshotId: string) => {
    console.log(`🗑️ スナップショット削除: ${snapshotId}`)
    onDeleteSnapshot(snapshotId)
  }

  const handleEditStart = (snapshot: MapSnapshot) => {
    console.log(`✏️ タイトル編集開始: "${snapshot.title}"`)
    setEditingSnapshot(snapshot)
    setEditTitle(snapshot.title)
  }

  const handleEditSave = () => {
    if (editingSnapshot && editTitle.trim()) {
      console.log(`✏️ タイトル編集保存: "${editingSnapshot.title}" -> "${editTitle.trim()}"`)
      onUpdateSnapshotTitle(editingSnapshot.id, editTitle.trim())
      setEditingSnapshot(null)
      setEditTitle("")
    }
  }

  const handleEditCancel = () => {
    console.log("❌ タイトル編集キャンセル")
    setEditingSnapshot(null)
    setEditTitle("")
  }

  const handleHistoryButtonClick = () => {
    console.log("📚 履歴ボタンがクリックされました", { snapshotCount: snapshots.length })
    setIsOpen(true)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <TooltipProvider>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 relative" onClick={handleHistoryButtonClick}>
                <History className="h-4 w-4" />
                {snapshots.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {snapshots.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {snapshots.length === 0
                ? "保存されたスナップショットはありません"
                : `${snapshots.length}個のスナップショットを表示`}
            </p>
          </TooltipContent>
        </Tooltip>

        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              スナップショット履歴
            </SheetTitle>
            <SheetDescription>保存された配置状況を復元したり、管理することができます。</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {snapshots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">スナップショットがありません</p>
                <p className="text-sm">
                  吹き出しを配置してカメラボタンを押すと、
                  <br />
                  現在の状況を保存できます。
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">{snapshots.length}個のスナップショット</p>
                  {snapshots.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          全削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>全スナップショットを削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            すべてのスナップショット（{snapshots.length}個）を削除します。 この操作は元に戻せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={onClearAllSnapshots}>削除</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{snapshot.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(snapshot.timestamp)}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {snapshot.totalInfoWindows}個の吹き出し
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ズーム {snapshot.mapZoom}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestore(snapshot)}
                                className="h-8 w-8 p-0"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>この配置を復元</p>
                            </TooltipContent>
                          </Tooltip>

                          <Dialog
                            open={editingSnapshot?.id === snapshot.id}
                            onOpenChange={(open) => {
                              if (!open) handleEditCancel()
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditStart(snapshot)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>タイトルを編集</p>
                              </TooltipContent>
                            </Tooltip>

                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>タイトルを編集</DialogTitle>
                                <DialogDescription>スナップショットのタイトルを変更します。</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-title" className="text-right">
                                    タイトル
                                  </Label>
                                  <Input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="col-span-3"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleEditSave()
                                      } else if (e.key === "Escape") {
                                        handleEditCancel()
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={handleEditCancel}>
                                  キャンセル
                                </Button>
                                <Button onClick={handleEditSave}>保存</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>削除</p>
                              </TooltipContent>
                            </Tooltip>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>スナップショットを削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{snapshot.title}」を削除します。この操作は元に戻せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(snapshot.id)}>削除</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

export default HistoryPanel
