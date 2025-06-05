"use client"

import { useState, useEffect } from "react"

// Google Maps APIのロード状態を管理するグローバル変数
let isGoogleMapsScriptLoaded = false
let googleMapsLoadPromise: Promise<void> | null = null

// APIキーが有効かどうかをチェックする関数
const isValidApiKey = (key: string | null | undefined): boolean => {
  return !!key && typeof key === "string" && key.trim() !== ""
}

export function useGoogleMaps(apiKey: string | null | undefined) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // すでにGoogle Maps APIがロードされている場合
    if (window.google && window.google.maps) {
      console.log("Google Maps APIはすでにロードされています")
      setIsLoaded(true)
      return
    }

    // APIキーが無効な場合は何もしない（エラーも設定しない）
    if (!isValidApiKey(apiKey)) {
      console.log("APIキーが無効または未設定です。ロードを待機中...", { apiKey })
      setIsLoaded(false)
      setError(null)
      return
    }

    // すでにスクリプトが読み込み中の場合は既存のPromiseを使用
    if (googleMapsLoadPromise) {
      googleMapsLoadPromise
        .then(() => {
          console.log("既存のGoogle Maps APIロードプロセスが完了しました")
          setIsLoaded(true)
          setError(null)
        })
        .catch((err) => {
          console.error("既存のGoogle Maps APIロードプロセスでエラーが発生しました:", err)
          setError("Google Maps APIのロードに失敗しました")
        })
      return
    }

    // スクリプトがまだ読み込まれていない場合は新しいPromiseを作成
    googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log(`Google Maps APIをロードします (APIキー: ${apiKey?.substring(0, 5)}...)`)

        // グローバルコールバック関数を定義
        window.initGoogleMap = () => {
          console.log("Google Maps APIのロードが完了しました")
          isGoogleMapsScriptLoaded = true
          resolve()
        }

        // スクリプトを作成
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMap`
        script.async = true
        script.defer = true
        script.id = "google-maps-script"

        // エラーハンドリング
        script.onerror = (e) => {
          const errorMessage = e instanceof Error ? e.message : "スクリプトのロードに失敗しました"
          console.error(`Google Maps APIのロードに失敗しました: ${errorMessage}`)
          reject(new Error(`Google Maps APIのロードに失敗しました: ${errorMessage}`))
        }

        // DOMに追加
        document.head.appendChild(script)
        console.log("Google Maps APIスクリプトをDOMに追加しました")
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Google Maps APIスクリプトの追加に失敗しました: ${errorMessage}`)
        reject(new Error(`Google Maps APIスクリプトの追加に失敗しました: ${errorMessage}`))
      }
    })

    googleMapsLoadPromise
      .then(() => {
        console.log("Google Maps APIのロードが完了しました")
        setIsLoaded(true)
        setError(null)
      })
      .catch((err) => {
        console.error("Google Maps APIのロードに失敗しました:", err)
        setError(err.message || "Google Maps APIのロードに失敗しました")
        googleMapsLoadPromise = null // エラー時にPromiseをリセット
      })

    // クリーンアップ関数
    return () => {
      // スクリプトは削除しない（他のコンポーネントでも使用される可能性があるため）
    }
  }, [apiKey])

  return { isLoaded, error }
}

// グローバル型定義の拡張
declare global {
  interface Window {
    initGoogleMap: () => void
    google: any
  }
}
