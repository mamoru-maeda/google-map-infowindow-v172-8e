import { NextResponse } from "next/server"

export async function GET() {
  try {
    // サーバーサイドでのみ使用する環境変数を使用
    const apiKey = process.env.mamoru_maeda_disaster_key001 || process.env.GOOGLE_MAPS_API_KEY || ""

    // デバッグ情報をコンソールに出力
    console.log("API Key endpoint called")
    console.log("mamoru_maeda_disaster_key001 exists:", !!process.env.mamoru_maeda_disaster_key001)
    console.log("GOOGLE_MAPS_API_KEY exists:", !!process.env.GOOGLE_MAPS_API_KEY)
    console.log("API key length:", apiKey.length)

    // APIキーが空の場合はエラーを返す
    if (!apiKey || apiKey.trim() === "") {
      console.error("Google Maps API key is not set in environment variables")
      return NextResponse.json(
        {
          error: "API key is not configured",
          message: "環境変数 GOOGLE_MAPS_API_KEY または mamoru_maeda_disaster_key001 が設定されていません。",
        },
        { status: 500 },
      )
    }

    // APIキーを返す
    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("API key endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
