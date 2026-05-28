// server/api/regulation/single/[id].js

import matter from 'gray-matter'

// 日期格式化函數：2023-01-01 → 2023年1月1日
function formatDate(dateString) {
  if (!dateString || dateString === '(原始資料未註記最近異動日期)')
    return dateString

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}年${parseInt(month)}月${parseInt(day)}日`
}

// 法規內容轉 HTML 函數
// the div class name "jfpc" means "just-for-paragraph-count"
function formatToHtml(lawContent) {
  const lines = lawContent.split('\n')
  let outputHtml = '<div class="regulation-content">\n'
  let inTiao = false

  lines.forEach((line) => {
    // Checking for a full-width space
    if (line.startsWith('　')) {
      // Replace the first full-width space with ⊕
      line = '⊕' + line.slice(1)
    }

    line = line.trim()

    // 空行跳過
    if (line === '') outputHtml += '\n<!-- 空行 -->\n'

    // 章節標題
    if (/^第[一二三四五六七八九十百千萬零]+[編章節款項目]/.test(line)) {
      if (inTiao) {
        outputHtml += '\t</div>\n\t<!-- end 條 -->\n'
        inTiao = false
      }
      const headingClass = {
        編: 'law-division',
        章: 'law-chapter',
        節: 'law-section',
        款: 'law-hsubsection',
        項: 'law-hxiang',
        目: 'law-hitem'
      }
      const headingType = line.match(
        /第[一二三四五六七八九十百千萬零]+([編章節款項目])/
      )[1]
      outputHtml += `\t<div class="zhangJie">\n\t\t<p class="${headingClass[headingType]}">${line}</p>\n\t</div>\n`
    }
    // 條號
    else if (
      /^第\s*\d+\s*條/.test(line) ||
      /^第[一二三四五六七八九十百]+條/.test(line)
    ) {
      if (inTiao) {
        outputHtml += '\t</div>\n'
      }
      let [tiaoTitle, ...rest] = line.split('（')
      tiaoTitle = tiaoTitle.trim()
      let title = rest.length ? '（' + rest.join('（') : ''
      outputHtml += `\t<div class="law-article">\n\t\t<div class="jfpc"><p class="law-art-num">${tiaoTitle}${title}</p></div>\n`
      inTiao = true
    }
    // 項 (包括序言)
    else if (/^⊕/.test(line)) {
      line = line.slice(1)

      // 如果不在條內，為序言等特殊情況創建特殊容器，避免編號
      if (!inTiao) {
        outputHtml += `\t<div class="preamble">\n`
        outputHtml += `\t\t<p class="xiang">${line}</p>\n`
        outputHtml += '\t</div>\n'
      } else {
        outputHtml += `\t\t<p class="xiang">${line}</p>\n`
      }
    }
    // 款
    else if (/^[一二三四五六七八九十]+、/.test(line)) {
      outputHtml += `\t\t<div class="jfpc"><p class="kuan">${line}</p></div>\n`
    }
    // 目
    else if (/^（[一二三四五六七八九十]+）/.test(line)) {
      outputHtml += `\t\t<div class="jfpc"><p class="mu">${line}</p></div>\n`
    }

    // 條文結束
    else {
      outputHtml += `\t\t${line}\n`
    }
  }) //end foreach line

  if (inTiao) {
    outputHtml += '\t</div>\n\t<!--end single article-->\n'
  }

  outputHtml += '</div> <!-- end regulation content --> \n'

  return outputHtml
}

export default defineEventHandler(async (event) => {
  const { id } = event.context.params
  const paddedId = id.toString().padStart(4, '0')

  const config = useRuntimeConfig(event)
  const { repo, branch, basePath } = config.public.legiDataSource

  try {
    let raw
    const fileUrl = `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${basePath}/${paddedId}.md`
    const res = await fetch(fileUrl)
    if (!res.ok)
      throw new Error(
        `API /regulation/single/id 嘗試讀取 NTPU Legislative Database 公開的法規檔案，但發生 ${res.status} 狀況。`
      )
    raw = await res.text()

    const parsed = matter(raw)

    return {
      titleFull: parsed.data.titleFull || '(原始資料未註記標題)',
      titleShort: parsed.data.titleShort || '(原始資料未註記簡稱)',
      modifiedType: parsed.data.modifiedType || '異動',
      modifiedDate:
        formatDate(parsed.data.modifiedDate) || '(原始資料未註記最近異動日期)',
      status: parsed.data.status || '(原始資料未註記施行狀態)',
      history: parsed.data.history || '(原始資料未註記歷史沿革)',
      fullText: formatToHtml(parsed.content.trim()) || 'NO CONTENT!'
    }
  } catch (err) {
    console.error('讀取錯誤：', err)
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: '找不到法規檔案' })
    )
  }
})
