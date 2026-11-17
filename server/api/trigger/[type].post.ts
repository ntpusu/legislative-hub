// server/api/trigger/[type].post.ts

const ALLOWED_TYPES = [
  'bills',
  'bylaws',
  'committee-reports',
  'representatives'
] as const
type TriggerType = (typeof ALLOWED_TYPES)[number]

const isTriggerType = (value: unknown): value is TriggerType =>
  ALLOWED_TYPES.includes(value as TriggerType)

export default defineEventHandler(async (event) => {
  // 1. 身份驗證（依白名單即時判斷，不採信 session 內的權限欄位）
  const identity = await requireIdentity(event)

  // 2. 路由參數驗證
  const type = getRouterParam(event, 'type')
  if (!isTriggerType(type)) {
    throw createError({
      statusCode: 400,
      message: `Unknown trigger type: ${type}`
    })
  }

  // 3. 功能權限驗證
  assertPermission(identity, `sync:${type}`)

  // 4. 呼叫 GitHub API
  // 帶入 event，Cloudflare 執行期注入的環境變數才會套用到 runtimeConfig
  const config = useRuntimeConfig(event)
  const { repo } = config.public.legiDataSource
  const siteInfo = config.public

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': siteInfo.name || siteInfo.shortName || 'govcloud-app'
    },
    body: JSON.stringify({
      event_type: `refresh-${type}`,
      client_payload: {
        // 單位簡稱（例如「學生議會(三峽)」），會註記於 legislative-data 的同步紀錄
        triggered_by: identity.shortName,
        triggered_by_site: siteInfo.name
      }
    })
  })

  if (!res.ok) {
    throw createError({ statusCode: res.status, message: await res.text() })
  }

  return { success: true }
})
