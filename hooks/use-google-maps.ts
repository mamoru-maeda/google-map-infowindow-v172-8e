"use client"

import { useState, useEffect } from "react"

// グローバル変数でAPIの読み込み状態を管理
let isLoadingScript = false
let isScriptLoaded = false
let scriptLoadCallbacks: Array<() => void> = []

export function useGoogleMaps(apiKey: string | null) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // APIキーがない場合は何もしない
    if (!apiKey) {
      return
    }

    // すでにAPIがロードされている場合
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // すでにスクリプトがロードされている場合
    if (isScriptLoaded) {
      setIsLoaded(true)
      return
    }

    // スクリプトがロード中の場合はコールバックを登録
    if (isLoadingScript) {
      scriptLoadCallbacks.push(() => setIsLoaded(true))
      return
    }

    // スクリプトのロードを開始
    isLoadingScript = true

    // コールバック関数名を生成
    const callbackName = `googleMapsInitCallback_${Math.random().toString(36).substring(2, 9)}`

    // グローバルコールバック関数を定義
    window[callbackName] = () => {
      isScriptLoaded = true
      isLoadingScript = false
      setIsLoaded(true)

      // 登録されたコールバックを実行
      scriptLoadCallbacks.forEach((callback) => callback())
      scriptLoadCallbacks = []

      // コールバック関数を削除
      delete window[callbackName]
    }

    // スクリプトタグを作成
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`
    script.async = true
    script.defer = true

    // エラーハンドリング
    script.onerror = () => {
      setError("Google Maps APIの読み込みに失敗しました")
      isLoadingScript = false
      delete window[callbackName]
    }

    // スクリプトをDOMに追加
    document.head.appendChild(script)

    // クリーンアップ関数
    return () => {
      // コンポーネントがアンマウントされた場合、コールバックリストから削除
      scriptLoadCallbacks = scriptLoadCallbacks.filter((callback) => callback !== (() => setIsLoaded(true)))
    }
  }, [apiKey])

  return { isLoaded, error }
}
