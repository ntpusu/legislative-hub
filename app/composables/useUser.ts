// app/composables/useUser.ts

/**
 * 使用者資料介面定義
 * 定義了 User 物件的結構，確保 TypeScript 能提供正確的自動補全
 */
export interface User {
  id: string
  name: string // 顯示名稱 (e.g., 自治幹部A)
  email: string // Email (用來比對白名單)
  department: string // 單位 (e.g., 學生會行政中心)
  avatar?: string // 大頭貼 URL (選填)
  role: 'ADMIN' | 'STAFF' // 簡單的權限分級
}

/**
 * useUser Composable
 * * 這是全域的使用者狀態。
 * 使用 useState<User | null>('user') 建立一個全域共享的響應式狀態。
 * 初始值為 null (未登入)。
 */
export const useUser = () => {
  // 'user' 是這個狀態的唯一 Key，確保在不同組件間共享同一個狀態
  return useState<User | null>('user', () => null)
}

/**
 * (選擇性) 模擬登入功能的 Composable
 * 如果您希望把登入邏輯從頁面中抽離出來，可以使用這個 useAuth
 */
export const useAuth = () => {
  const user = useUser()
  const router = useRouter()

  // 模擬登入動作
  const login = async () => {
    // 這裡模擬打 API 的延遲
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 設定模擬的使用者資料
    user.value = {
      id: 'mock-user-001',
      name: '綠頭鴨',
      email: 'ntpusu@gm.ntpu.edu.tw',
      department: '三峽校區學生會',
      avatar: '', // 空字串會觸發 UI 顯示姓名字首
      role: 'STAFF'
    }

    // 登入成功後導向首頁
    router.push('/')
  }

  // 登出動作
  const logout = () => {
    user.value = null
    router.push('/login')
  }

  return {
    login,
    logout
  }
}
