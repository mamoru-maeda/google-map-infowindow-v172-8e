import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ローカルストレージ操作のユーティリティ
export const localStorageUtils = {
  // データを保存
  saveData: (key: string, data: any) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save data to localStorage (${key}):`, error)
    }
  },

  // データを取得
  loadData: (key: string, defaultValue: any = null) => {
    if (typeof window === "undefined") return defaultValue
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error(`Failed to load data from localStorage (${key}):`, error)
      return defaultValue
    }
  },

  // データを削除
  removeData: (key: string) => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove data from localStorage (${key}):`, error)
    }
  },
}
