/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; connect-src 'self' https://*.googleapis.com; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 環境変数を明示的に設定（機密情報はサーバーサイドのみ）
  env: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    mamoru_maeda_disaster_key001: process.env.mamoru_maeda_disaster_key001,
  },
  // publicRuntimeConfigからNEXT_PUBLIC_プレフィックスのある環境変数を削除
};

export default nextConfig;
