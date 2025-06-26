// 吹き出しのサイズ設定を統一管理
export const INFO_WINDOW_SIZES = {
  // デフォルトサイズ（メインサイズ）
  DEFAULT: {
    width: 240,
    height: 320,
  },

  // 最小化時のプリセットサイズ
  MINIMIZE_PRESETS: {
    tiny: { width: 100, height: 160, label: "極小", description: "タイトルのみ" },
    small: { width: 120, height: 180, label: "小", description: "タイトル + 重要度" },
    medium: { width: 160, height: 210, label: "中", description: "タイトル + バッジ + 画像" },
    large: { width: 200, height: 280, label: "大", description: "タイトル + 詳細情報" },
    custom: { width: 150, height: 300, label: "カスタム", description: "自由設定" },
  },

  // 旧InfoWindowコンポーネント用のサイズ
  LEGACY: {
    width: 176,
    height: 200,
  },

  // 境界計算用のサイズ（重なり判定など）
  BOUNDS_CALCULATION: {
    width: 240, // DEFAULTと同じ
    height: 320, // DEFAULTと同じ
  },

  // サイズ制限
  CONSTRAINTS: {
    MIN_WIDTH: 120,
    MAX_WIDTH: 600,
    MIN_HEIGHT: 100,
    MAX_HEIGHT: 500,
  },
} as const

// タイプ定義
export type InfoWindowSize = {
  width: number
  height: number
}

export type MinimizePresetKey = keyof typeof INFO_WINDOW_SIZES.MINIMIZE_PRESETS

// ヘルパー関数
export const getDefaultSize = (): InfoWindowSize => INFO_WINDOW_SIZES.DEFAULT

export const getMinimizePresetSize = (preset: MinimizePresetKey): InfoWindowSize => {
  return {
    width: INFO_WINDOW_SIZES.MINIMIZE_PRESETS[preset].width,
    height: INFO_WINDOW_SIZES.MINIMIZE_PRESETS[preset].height,
  }
}

export const getBoundsCalculationSize = (): InfoWindowSize => INFO_WINDOW_SIZES.BOUNDS_CALCULATION

export const clampSize = (size: InfoWindowSize): InfoWindowSize => {
  return {
    width: Math.max(
      INFO_WINDOW_SIZES.CONSTRAINTS.MIN_WIDTH,
      Math.min(INFO_WINDOW_SIZES.CONSTRAINTS.MAX_WIDTH, size.width),
    ),
    height: Math.max(
      INFO_WINDOW_SIZES.CONSTRAINTS.MIN_HEIGHT,
      Math.min(INFO_WINDOW_SIZES.CONSTRAINTS.MAX_HEIGHT, size.height),
    ),
  }
}
