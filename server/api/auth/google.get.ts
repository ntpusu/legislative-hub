const googleRedirectURL = useRuntimeConfig().oauth.google.redirectUrl

export default defineOAuthGoogleEventHandler({
  config: {
    // 強制指定回呼網址，避免 Cloudflare 或 Nuxt 推導錯誤
    redirectURL: googleRedirectURL
  },
  async onSuccess(event, { user }) {
    const email =
      typeof user.email === 'string' ? normalizeEmail(user.email) : ''

    // 未經 Google 驗證的信箱不予採信；白名單判斷見 server/utils/whitelist.ts
    if (
      !email ||
      user.email_verified !== true ||
      !resolveIdentity(email, getAdmins(event))
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: '您的帳號未經授權，如有疑問請洽網管小組。'
      })
    }

    // session cookie 只存身分識別所需的最小資訊；
    // 單位簡稱、角色與權限由 server/plugins/identity.ts 於取得 session 時依白名單計算
    await setUserSession(event, {
      user: {
        email,
        googleName: user.name // Google 回傳的姓名
      }
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('[Google OAuth Error]', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
