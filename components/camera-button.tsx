"use client"

import type React from "react"
import { useState } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

interface CameraButtonProps {
  onTakeSnapshot: (title: string) => void
  disabled?: boolean
  infoWindowCount: number
}

const CameraButton: React.FC<CameraButtonProps> = ({ onTakeSnapshot, disabled = false, infoWindowCount }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")

  const handleSave = () => {
    console.log("📸 保存ボタンがクリックされました", { title, infoWindowCount })
    const snapshotTitle = title.trim() || `配置状況 ${new Date().toLocaleString("ja-JP")}`
    onTakeSnapshot(snapshotTitle)
    setTitle("")
    setIsOpen(false)
  }

  const handleCancel = () => {
    console.log("❌ キャンセルボタンがクリックされました")
    setTitle("")
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    console.log("🔄 ダイアログの状態変更:", open)
    setIsOpen(open)
    if (open) {
      // ダイアログが開かれた時のデフォルトタイトルを設定
      const defaultTitle = `配置状況 ${new Date().toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
      setTitle(defaultTitle)
    }
  }

  const handleButtonClick = () => {
    console.log("📸 カメラボタンがクリックされました", { disabled, infoWindowCount })
    if (!disabled) {
      setIsOpen(true)
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8" disabled={disabled} onClick={handleButtonClick}>
                <Camera className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {disabled
                ? "吹き出しを配置してからスナップショットを保存できます"
                : `現在の配置状況を保存 (${infoWindowCount}個の吹き出し)`}
            </p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              スナップショットを保存
            </DialogTitle>
            <DialogDescription>
              現在の吹き出し配置状況（{infoWindowCount}個）を保存します。 後でこの配置を復元することができます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                タイトル
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder={`配置状況 ${new Date().toLocaleString("ja-JP")}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave()
                  } else if (e.key === "Escape") {
                    handleCancel()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

export default CameraButton
