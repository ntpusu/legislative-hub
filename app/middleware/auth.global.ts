// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // 排除 API 路由與其他不需驗證的靜態路徑
  if (to.path.startsWith('/api/')) return

  const { loggedIn, user } = useUserSession()

  console.log(
    `[auth.global] path=${to.path}, loggedIn=${loggedIn.value}, server=${import.meta.server}`
  )

  // 1. 已登入的使用者試圖訪問 /login，導回首頁（或原本的 redirect 目標）
  if (to.path === '/login') {
    if (loggedIn.value) {
      const redirect = to.query.redirect as string | undefined
      return navigateTo(redirect || '/')
    }
    return // 未登入就讓他正常訪問 /login
  }

  // 2. 登入狀態檢查 (Server 端)
  if (import.meta.server) {
    if (!loggedIn.value) {
      // 記住使用者原本想前往的路徑，登入後導回
      return navigateTo(
        { path: '/login', query: { redirect: to.fullPath } },
        { redirectCode: 302 }
      )
    }
  }
  // 3. 登入狀態檢查 (Client 端：確保水合後也會檢查)
  // 也就是在 server 端 session 尚未就緒時，交由 client 端再判斷一次
  else {
    if (!loggedIn.value) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  // ----------------------------------------------------------------
  // 4. 功能權限管控 (執行到此處，代表 loggedIn 必為 true)
  // ----------------------------------------------------------------
  // 頁面以 definePageMeta({ permission }) 宣告所屬功能；
  // 權限由伺服器依 server/utils/whitelist.ts 計算後放進 session，此處只讀不寫
  const requiredPermission = to.meta.permission
  if (requiredPermission && !hasPermission(user.value, requiredPermission)) {
    console.warn(
      `[auth.global] 無權限訪問 ${to.path}（需要 ${requiredPermission} 權限）`
    )

    // 用 useState 設定一個全域 toast 訊息，讓 layout 顯示警告
    // key 需與 congress.vue 中的 useState 一致
    const toastMessage = useState<string | null>('toast-message', () => null)
    toastMessage.value = '您的帳號沒有使用此功能的權限'

    // 無權限，導回首頁
    return navigateTo('/')
  }
})
