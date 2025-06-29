import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ローカルストレージのユーティリティ関数
export const localStorageUtils = {
  saveData: (key: string, data: any) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(data))
      }
    } catch (error) {
      console.error("ローカルストレージへの保存に失敗しました:", error)
    }
  },

  loadData: (key: string, defaultValue: any = null) => {
    try {
      if (typeof window !== "undefined") {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
      }
      return defaultValue
    } catch (error) {
      console.error("ローカルストレージからの読み込みに失敗しました:", error)
      return defaultValue
    }
  },

  removeData: (key: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error("ローカルストレージからの削除に失敗しました:", error)
    }
  },
}
