import { NextResponse } from "next/server"

export async function GET() {
  // サーバーサイドでのみ使用する環境変数を使用
  // NEXT_PUBLIC_プレフィックスの環境変数は一切使用しない
  const apiKey = process.env.mamoru_maeda_disaster_key001 || process.env.GOOGLE_MAPS_API_KEY || ""

  // デバッグ情報をコンソールに出力（NEXT_PUBLIC_の参照を完全に削除）
  console.log("API Key endpoint called")
  console.log("mamoru_maeda_disaster_key001 exists:", !!process.env.mamoru_maeda_disaster_key001)
  console.log("GOOGLE_MAPS_API_KEY exists:", !!process.env.GOOGLE_MAPS_API_KEY)
  console.log("API key length:", apiKey.length)

  // APIキーが空の場合はデモモードを有効にする
  if (!apiKey) {
    console.warn("Google Maps APIキーが環境変数に設定されていません。デモモードで実行します。")

    return NextResponse.json({
      apiKey: "DEMO_MODE",
      demoMode: true,
      message: "APIキーが設定されていないため、デモモードで実行しています。実際のAPIキーを設定してください。",
    })
  }

  // APIキーを返す
  return NextResponse.json({ apiKey })
}
