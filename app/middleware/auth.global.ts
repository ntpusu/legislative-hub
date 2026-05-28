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
  // 4. 特定路徑權限管控 (執行到此處，代表 loggedIn 必為 true)
  // ----------------------------------------------------------------
  if (to.path.startsWith('/drafting/')) {
    // 定義可以存取草擬系統的白名單
    const draftingWhitelist = ['ntpuscs@gmail.com']

    // 檢查當前使用者的 email 是否存在於白名單中
    if (!user.value || !draftingWhitelist.includes(user.value.email)) {
      console.warn(
        `[auth.global] 無權限訪問: ${user.value?.email} 嘗試進入 ${to.path}`
      )

      // 用 useState 設定一個全域 toast 訊息，讓 layout 顯示警告
      // key 需與 congress.vue 中的 useState 一致
      const toastMessage = useState<string | null>('toast-message', () => null)
      toastMessage.value = '網頁僅供學生議會使用，您不能瀏覽此網頁'

      // 無權限，導回首頁
      return navigateTo('/')
    }
  }
})
