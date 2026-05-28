export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { repo, branch, listPath } = config.public.legiDataSource

  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${listPath}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch bylaw list: ${response.statusText}`)
    }

    const lawList = await response.json()
    return lawList
  } catch (error) {
    console.error('Error fetching bylaw list:', error)
    // 可選：返回空陣列或拋出錯誤
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch regulations'
    })
  }
})
