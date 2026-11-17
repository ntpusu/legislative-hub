// server/api/statutes/list.ts
// 回傳自治法規清單。statutes 為自治法規之英譯，包含本會組織章程與自治法令
// （組織章程第 61 條參照）。
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { repo, branch, listPath } = config.public.legiDataSource

  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${listPath}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch statute list: ${response.statusText}`)
    }

    const statuteList = await response.json()
    return statuteList
  } catch (error) {
    console.error('Error fetching statute list:', error)
    // 可選：返回空陣列或拋出錯誤
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statutes'
    })
  }
})
