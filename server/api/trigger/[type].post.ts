// server/api/trigger/[type].post.ts

const ALLOWED_TYPES = ['bills', 'bylaws', 'committee-reports', 'representatives'] as const
type TriggerType = (typeof ALLOWED_TYPES)[number]

export default defineEventHandler(async (event) => {
  // 1. 身份驗證
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const triggeredBy: string =
    session.user.shortName ??
    session.user.googleName ??
    '(trigger api 無法正確獲取使用者名稱)'

  // 2. 路由參數驗證
  const type = getRouterParam(event, 'type') as TriggerType
  if (!ALLOWED_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      message: `Unknown trigger type: ${type}`
    })
  }

  // 3. 呼叫 GitHub API
  const config = useRuntimeConfig()
  const { repo } = config.public.legiDataSource
  const siteInfo = config.public

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': siteInfo.name || 'legihub-app'
    },
    body: JSON.stringify({
      event_type: `refresh-${type}`,
      client_payload: {
        triggered_by: triggeredBy,
        triggered_by_site: siteInfo.name
      }
    })
  })

  if (!res.ok) {
    throw createError({ statusCode: res.status, message: await res.text() })
  }

  return { success: true }
})
