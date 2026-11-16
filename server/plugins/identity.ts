// server/plugins/identity.ts
// session cookie 只存 email 與 Google 名稱；單位簡稱、角色、權限等欄位，
// 於每次取得 session（SSR 首次載入與前端 fetch）時依白名單重新計算後附上，
// 不寫回 cookie。如此白名單是唯一來源，調整後下次載入頁面即生效。

import { resolveIdentity } from '../utils/whitelist'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const email = session.user?.email
    const identity = email ? resolveIdentity(email) : null

    if (!identity) {
      // 已被移出白名單（或 session 內容異常）：清除 session，視同未登入
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: '您的帳號已無存取權限，請重新登入。'
      })
    }

    session.user = { ...session.user!, ...identity }
  })
})
