// shared/utils/statuteFormat.ts
// 自治法規（statutes）內文排版：把依〈法規排版格式〉撰寫的純文字轉成會網樣式 HTML。
// 前端（線上法規排版、預覽）與後端（/api/statutes/single/:id）共用，確保兩邊輸出一致。
// 原始邏輯來自第 1 版工具 ntpusu-regulation-typesetting 的 regulation-formatter.js。

/** 章節標題的層級與對應的 class */
const HEADING_CLASS: Record<string, string> = {
  編: 'law-division',
  章: 'law-chapter',
  節: 'law-section',
  款: 'law-hsubsection',
  項: 'law-hxiang',
  目: 'law-hitem'
}

const HEADING_RE = /^第[一二三四五六七八九十百千萬零]+([編章節款項目])/
const ARTICLE_RE = /^第\s*\d+\s*條|^第[一二三四五六七八九十百]+條/
const SUBPARAGRAPH_RE = /^[一二三四五六七八九十]+、/
const ITEM_RE = /^（[一二三四五六七八九十]+）/

/** 項（及不分項條文）的行首標記：一個全形空白 */
export const PARAGRAPH_MARK = '　'

/**
 * 一行內文的種類：
 * blank 空行、heading 編章節、article 條號、paragraph 項、
 * subparagraph 款、item 目、text 無法辨識（原樣輸出）
 */
export type StatuteLineKind =
  | 'blank'
  | 'heading'
  | 'article'
  | 'paragraph'
  | 'subparagraph'
  | 'item'
  | 'text'

/**
 * 判斷一行內文的種類，並回傳去除行首標記與前後空白後的文字。
 * 注意：JavaScript 的 trim() 也會移除全形空白，所以必須先檢查行首的全形空白。
 */
export function classifyStatuteLine(rawLine: string): {
  kind: StatuteLineKind
  text: string
} {
  if (rawLine.startsWith(PARAGRAPH_MARK)) {
    return { kind: 'paragraph', text: rawLine.slice(1).trim() }
  }

  const line = rawLine.trim()
  if (line === '') return { kind: 'blank', text: '' }
  if (HEADING_RE.test(line)) return { kind: 'heading', text: line }
  if (ARTICLE_RE.test(line)) return { kind: 'article', text: line }
  if (SUBPARAGRAPH_RE.test(line)) return { kind: 'subparagraph', text: line }
  if (ITEM_RE.test(line)) return { kind: 'item', text: line }
  return { kind: 'text', text: line }
}

/**
 * 西元日期轉中文日期：2023-01-01 → 2023年1月1日（月、日不補零）。
 * 接受 YYYY-MM-DD 字串或 Date 物件；無法判讀時原樣回傳，讓使用者看得出資料有誤。
 */
export function formatStatuteDate(date: unknown): string {
  if (date == null || date === '') return ''

  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return ''
    // YAML 的日期一律視為 UTC 午夜，用 UTC 取值才不會因時區差一天
    return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`
  }

  const match = String(date)
    .trim()
    .match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) return String(date)

  const [, year, month, day] = match
  return `${year}年${Number(month)}月${Number(day)}日`
}

/**
 * 法規內文轉 HTML。
 * class 名稱須與會網（RPage）載入的 regulation-format.css 一致，請勿任意更改。
 * the div class name "jfpc" means "just-for-paragraph-count"
 */
export function statuteContentToHtml(content: string): string {
  let outputHtml = '<div class="statute-content">\n'
  let inArticle = false

  for (const rawLine of content.split('\n')) {
    const { kind, text } = classifyStatuteLine(rawLine)

    switch (kind) {
      case 'blank':
        outputHtml += '\n<!-- 空行 -->\n'
        break

      case 'heading': {
        if (inArticle) {
          outputHtml += '\t</div>\n\t<!-- end 條 -->\n'
          inArticle = false
        }
        const headingType = text.match(HEADING_RE)![1]!
        outputHtml += `\t<div class="zhangJie">\n\t\t<p class="${HEADING_CLASS[headingType]}">${text}</p>\n\t</div>\n`
        break
      }

      case 'article': {
        if (inArticle) outputHtml += '\t</div>\n'
        // 條號與括註的條旨，例如「第1條（目的）」
        const [articleNum = '', ...rest] = text.split('（')
        const caption = rest.length ? '（' + rest.join('（') : ''
        outputHtml += `\t<div class="law-article">\n\t\t<div class="jfpc"><p class="law-art-num">${articleNum.trim()}${caption}</p></div>\n`
        inArticle = true
        break
      }

      case 'paragraph':
        // 不在條內（例如序言），另建容器，避免被計入項次編號
        if (!inArticle) {
          outputHtml += `\t<div class="preamble">\n\t\t<p class="xiang">${text}</p>\n\t</div>\n`
        } else {
          outputHtml += `\t\t<p class="xiang">${text}</p>\n`
        }
        break

      case 'subparagraph':
        outputHtml += `\t\t<div class="jfpc"><p class="kuan">${text}</p></div>\n`
        break

      case 'item':
        outputHtml += `\t\t<div class="jfpc"><p class="mu">${text}</p></div>\n`
        break

      default:
        // 無法辨識的行原樣輸出
        outputHtml += `\t\t${text}\n`
    }
  }

  if (inArticle) {
    outputHtml += '\t</div>\n\t<!--end single article-->\n'
  }

  outputHtml += '</div> <!-- end statute content --> \n'

  return outputHtml
}
