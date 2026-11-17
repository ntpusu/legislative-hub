// server/api/statutes/single/[id].ts
// statutes 為自治法規之英譯，包含本會組織章程與自治法令（組織章程第 61 條參照）。
// 內文排版與日期格式化由 shared/utils/statuteFormat.ts 提供，前後端共用。

import matter from 'gray-matter'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const paddedId = id.padStart(4, '0')

  const config = useRuntimeConfig(event)
  const { repo, branch, basePath } = config.public.legiDataSource

  try {
    const fileUrl = `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${basePath}/${paddedId}.md`
    const res = await fetch(fileUrl)
    if (!res.ok)
      throw new Error(
        `API /statutes/single/:id 嘗試讀取 NTPU Legislative Database 公開的法規檔案，但發生 ${res.status} 狀況。`
      )
    const raw = await res.text()

    const parsed = matter(raw)

    return {
      titleFull: parsed.data.titleFull || '(原始資料未註記標題)',
      titleShort: parsed.data.titleShort || '(原始資料未註記簡稱)',
      modifiedType: parsed.data.modifiedType || '異動',
      modifiedDate:
        formatStatuteDate(parsed.data.modifiedDate) ||
        '(原始資料未註記最近異動日期)',
      status: parsed.data.status || '(原始資料未註記施行狀態)',
      history: parsed.data.history || '(原始資料未註記歷史沿革)',
      fullText: statuteContentToHtml(parsed.content.trim()) || 'NO CONTENT!'
    }
  } catch (err) {
    console.error('讀取錯誤：', err)
    throw createError({ statusCode: 404, statusMessage: '找不到法規檔案' })
  }
})
