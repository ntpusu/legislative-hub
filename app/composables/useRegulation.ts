import { unref, type Ref } from 'vue'
import { useFetch } from '#app'

// 定義法規資料的介面 (Interface)，確保 TypeScript 能正確提示
export interface RegulationData {
  titleFull: string
  titleShort: string
  modifiedType: string
  modifiedDate: string
  status: string // e.g., 'abandoned'
  history: string[]
  fullText: string
}

export const useRegulation = (id: string | Ref<string>) => {
  // 使用 useFetch 進行 SSR 資料獲取
  return useFetch<RegulationData>(`/api/regulation/single/${unref(id)}`, {
    // 設定唯一的 key，確保不同 ID 切換時會重新觸發
    key: `regulation-${unref(id)}`,

    // 伺服器端發生錯誤時的處理
    onResponseError({ response }: { response: any }) {
      console.error(
        `[Regulation API Error] Status: ${response.status}`,
        response._data
      )
    },

    // 自定義錯誤轉換：將後端的 HTTP Error 轉為前端友善的中文訊息
    transformError(error: any) {
      const statusCode = error.statusCode
      let userMessage = '讀取資料時發生未知錯誤，請稍後再試。'

      if (statusCode === 404) {
        userMessage =
          '找不到這部法規的資料 (404)。請確定網址中的法規代碼是正確的，並且該法規的檔案沒有不小心被刪除。'
      } else if (statusCode === 500) {
        userMessage = '伺服器內部錯誤 (500)，請聯絡會網維護小組。'
      } else if (statusCode === 503 || statusCode === 504) {
        userMessage = '伺服器連線逾時或忙碌中，請稍後重整頁面。'
      }
      // 將處理過的訊息附加在 error 物件上，方便前端直接顯示。蓋 Nuxt H3Error 物件通常唯讀，回傳新的結構，前端始可使用
      return {
        ...error,
        statusCode,
        message: userMessage
      }
    }
  })
}
