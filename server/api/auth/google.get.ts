export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const entry = allowedEmails.find((item) => item.email === user.email)

    if (!entry) {
      throw createError({
        statusCode: 403,
        statusMessage: '您的帳號未經授權，如有疑問請洽網管小組。'
      })
    }

    // 將 Google 原始名稱與自定義簡稱一併存入 Session
    await setUserSession(event, {
      user: {
        email: user.email,
        googleName: user.name, // Google 回傳的姓名
        shortName: entry.shortName // 本地設定的單位簡稱
      }
    })

    return sendRedirect(event, '/')
  }
})
