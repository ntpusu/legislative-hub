// server/api/statutes/single/[id].ts
// statutes 為自治法規之英譯，包含本會組織章程與自治法令（組織章程第 61 條參照）。
// 原始檔的解析與排版由 shared/utils 提供，與線上法規排版共用同一套邏輯。

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const paddedId = id.padStart(4, '0')

  const config = useRuntimeConfig(event)
  const { repo, branch, basePath } = config.public.legiDataSource

  const fileUrl = `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${basePath}/${paddedId}.md`

  let raw: string
  try {
    const res = await fetch(fileUrl)
    if (!res.ok)
      throw new Error(
        `API /statutes/single/:id 嘗試讀取 NTPU Legislative Database 公開的法規檔案，但發生 ${res.status} 狀況。`
      )
    raw = await res.text()
  } catch (err) {
    console.error('讀取錯誤：', err)
    throw createError({ statusCode: 404, statusMessage: '找不到法規檔案' })
  }

  const parsed = parseStatuteSource(raw)
  if (parsed.yamlError) {
    console.error(
      `法規 ${paddedId} 的 YAML 基本資料有語法錯誤：`,
      parsed.issues
    )
    throw createError({
      statusCode: 422,
      statusMessage: '法規檔案的 YAML 基本資料有語法錯誤'
    })
  }

  return buildStatuteView(parsed.meta, parsed.content)
})
