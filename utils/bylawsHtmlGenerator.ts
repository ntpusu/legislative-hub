/**
 * 將法規資料格式化為 HTML 字串
 */
export function generateHtmlSource(reg: any): string {
  if (!reg) return ''

  const abandonedSpan =
    reg.status === 'abandoned' ? ' <span style="color: red;">(廢止)</span>' : ''

  let historyItems = ''
  if (Array.isArray(reg.history)) {
    historyItems = reg.history
      .map((item: string) => `  <li>${item}</li>`)
      .join('\n')
  }

  return `
<p><span style="font-weight: bold;">法規名稱：</span>${reg.titleFull}${abandonedSpan}</p>
<p><span style="font-weight: bold;">${reg.modifiedType}日期：</span>${reg.modifiedDate}</p>
<h2 class="wp-block-heading">全文</h2>
<div>
${reg.fullText || ''}
</div>
<h2 class="wp-block-heading">沿革</h2>
<ol>
${historyItems}
</ol>
  `.trim()
}

/**
 * 產生 HTML 並複製到剪貼簿
 */
export async function copyHtmlSourceToClipboard(reg: any) {
  const htmlSource = generateHtmlSource(reg)
  if (!htmlSource) return

  try {
    await navigator.clipboard.writeText(htmlSource)
    alert('已成功複製 HTML 原始碼到剪貼簿！')
  } catch (err) {
    console.error('無法複製文字: ', err)
    alert('複製失敗，請檢查瀏覽器權限或主控台錯誤。')
  }
}
