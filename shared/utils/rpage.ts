// shared/utils/rpage.ts
// 會網（RPage CMS）上架用的資料：依 RPage「編輯資訊」頁面的欄位，
// 產生各欄位要貼上的值。法規的排版樣式由 RPage 全站載入的 regulation-format.css 提供，
// 因此「資訊詳細內容」只需帶 class，不需內嵌樣式。

import { siteConfig } from '../../config/site.config'
import type { StatuteView } from './statuteSource'

/** RPage 的一個欄位 */
export interface RpageField {
  key: 'title' | 'detail' | 'publishDate' | 'updateDate' | 'unit'
  /** RPage 上的欄位名稱 */
  label: string
  value: string
  /** 填寫說明 */
  hint: string
  /** 內容多行，以多行文字框顯示 */
  multiline?: boolean
}

/** 依法規代碼第一碼判讀主管機關；無法判讀時回傳空字串 */
export function resolveStatuteAuthority(statuteId: string): string {
  const prefix = String(statuteId).trim().charAt(0)
  return siteConfig.statuteAuthorities[prefix] ?? ''
}

/** 指定時區的今天，格式 YYYY-MM-DD */
export function todayIso(
  timeZone: string = siteConfig.timeZone,
  now: Date = new Date()
): string {
  // en-CA 的日期格式即為 YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}

/**
 * RPage「資訊詳細內容」的 HTML 原始碼：
 * 法規名稱、最近異動日期、全文、沿革。
 */
export function buildRpageDetailHtml(view: StatuteView): string {
  const abandoned =
    view.status === 'abandoned'
      ? ' <span style="color: red;">(廢止)</span>'
      : ''

  const historyItems = view.history
    .map((item) => `  <li>${item}</li>`)
    .join('\n')

  return `
<p><span style="font-weight: bold;">法規名稱：</span>${view.titleFull}${abandoned}</p>
<p><span style="font-weight: bold;">${view.modifiedType}日期：</span>${view.modifiedDate}</p>
<h2>全文</h2>
<div>
${view.fullText}
</div>
<h2>沿革</h2>
<ol>
${historyItems}
</ol>
`.trim()
}

/**
 * 產生 RPage 各欄位的值。
 * today 由呼叫端傳入（前端應於瀏覽器掛載後再取得，避免伺服器與瀏覽器渲染結果不一致）。
 */
export function buildRpageFields(
  view: StatuteView,
  statuteId: string,
  today: string
): RpageField[] {
  const authority = resolveStatuteAuthority(statuteId)
  const prefix = String(statuteId).trim().charAt(0)

  return [
    {
      key: 'title',
      label: '資訊標題',
      value: view.titleShort,
      hint: '法規簡稱。'
    },
    {
      key: 'detail',
      label: '資訊詳細內容',
      value: buildRpageDetailHtml(view),
      hint: '包含法規名稱、最近異動日期、全文與沿革。請在 RPage 選擇「HTML」模式後貼上，且不要開啟「HTML編輯/預覽」。',
      multiline: true
    },
    {
      key: 'publishDate',
      label: '發布日期',
      value: view.modifiedDateIso,
      hint: view.modifiedDateIso
        ? `法規最近一次${view.modifiedType}的日期。`
        : '原始資料的最近異動日期缺漏或格式有誤，請先修正。'
    },
    {
      key: 'updateDate',
      label: '資料更新日期、資料檢視日期',
      value: today,
      hint: '今天的日期（臺北時間），兩個欄位都填這個值。'
    },
    {
      key: 'unit',
      label: '負責單位',
      value: authority,
      hint: authority
        ? `依法規代碼第一碼「${prefix}」判讀。`
        : '請先填寫正確的法規代碼，才能判讀主管機關。'
    }
  ]
}
