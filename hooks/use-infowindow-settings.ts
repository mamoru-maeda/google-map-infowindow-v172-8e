"use client"

import { useState, useEffect, useCallback } from "react"
import { INFO_WINDOW_SIZES, type InfoWindowSize, clampSize } from "@/constants/infowindow-sizes"

const SETTINGS_STORAGE_KEY = "infowindow-settings-v1"

interface InfoWindowSettings {
  defaultSize: InfoWindowSize
  autoApplyToExisting: boolean
}

const DEFAULT_SETTINGS: InfoWindowSettings = {
  defaultSize: INFO_WINDOW_SIZES.DEFAULT,
  autoApplyToExisting: false,
}

export function useInfoWindowSettings() {
  const [settings, setSettings] = useState<InfoWindowSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // 設定を読み込む
  const loadSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (saved) {
        const parsedSettings = JSON.parse(saved) as InfoWindowSettings
        // サイズを制約内に収める
        const clampedSize = clampSize(parsedSettings.defaultSize)
        setSettings({
          ...parsedSettings,
          defaultSize: clampedSize,
        })
      }
    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error)
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 設定を保存する
  const saveSettings = useCallback((newSettings: InfoWindowSettings) => {
    try {
      // サイズを制約内に収める
      const clampedSettings = {
        ...newSettings,
        defaultSize: clampSize(newSettings.defaultSize),
      }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(clampedSettings))
      setSettings(clampedSettings)
      console.log("設定を保存しました:", clampedSettings)
    } catch (error) {
      console.error("設定の保存に失敗しました:", error)
    }
  }, [])

  // デフォルトサイズを更新
  const updateDefaultSize = useCallback(
    (size: InfoWindowSize) => {
      const newSettings = {
        ...settings,
        defaultSize: clampSize(size),
      }
      saveSettings(newSettings)
    },
    [settings, saveSettings],
  )

  // 自動適用設定を更新
  const updateAutoApplyToExisting = useCallback(
    (autoApply: boolean) => {
      const newSettings = {
        ...settings,
        autoApplyToExisting: autoApply,
      }
      saveSettings(newSettings)
    },
    [settings, saveSettings],
  )

  // 設定をリセット
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
  }, [saveSettings])

  // 初期化
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    isLoading,
    updateDefaultSize,
    updateAutoApplyToExisting,
    resetSettings,
    saveSettings,
  }
}

// グローバルに現在の設定を取得する関数
export function getCurrentDefaultSize(): InfoWindowSize {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      const parsedSettings = JSON.parse(saved) as InfoWindowSettings
      return clampSize(parsedSettings.defaultSize)
    }
  } catch (error) {
    console.error("設定の取得に失敗しました:", error)
  }
  return INFO_WINDOW_SIZES.DEFAULT
}
