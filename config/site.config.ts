// config/site.config.ts
// 本專案的名稱、組織與相關文案的唯一定義處。
// 其他地方（nuxt.config.ts、app/、server/、docs/）一律引用此處，
// 避免未來更名時需要四處修改。
const orgName = '國立臺北大學學生自治會'
const orgShortName = '北大學生會'

export const siteConfig = {
  // ── 名稱 ─────────────────────────────────────────────
  name: 'NTPUSU Governance Cloud',
  shortName: 'GovCloud',
  /** 一句話說明本系統的定位，用於頁尾等處 */
  tagline: '讓自治，更方便',
  /** 網站描述的預設值，用於 meta description */
  description:
    '國立臺北大學學生自治會治理雲端系統：維護學生代表名冊及法規等線上公開資訊。',

  // ── 組織 ─────────────────────────────────────────────
  orgName,
  orgNameEn: 'NTPU Student Union',
  /** 組織名稱的簡稱，用於組成其他文案（例如「北大學生會自治法規系統」） */
  orgShortName,
  orgUrl: 'https://cloud.ntpusu.org/',

  // ── 其他 ─────────────────────────────────────────────
  /** GitHub 儲存庫網址 */
  repoUrl: 'https://github.com/ntpusu/legislative-hub',
  /** 頁尾版權所有者 */
  copyright: orgName,
  /** 系統開始運作之年分，用於頁尾版權年份 */
  sinceYear: 2026,
  /** 本會所在時區，用於產生「今天」的日期（RPage 資料更新日期等） */
  timeZone: 'Asia/Taipei',

  // ── 自治法規 ─────────────────────────────────────────
  /**
   * 法規代碼第一碼 → 主管機關。
   * 值會直接貼到會網（RPage）的「負責單位」欄位，須與 RPage 上的寫法一致。
   */
  statuteAuthorities: {
    '1': '三峽校區學生會',
    '2': '三峽校區學生議會',
    '3': '學生法院',
    '4': '臺北校區學生會',
    '5': '臺北校區學生議會',
    '6': '總會秘書處'
  } as Record<string, string>,

  // ── 頁面文案用的複合字串 ─────────────────────────────
  /** 例如「北大學生會自治法規系統」，用於列印頁與頁面標題 */
  statuteSystemName: `${orgShortName}自治法規系統`
} as const

/**
 * 「statutes」為自治法規之英譯，包含本會組織章程與自治法令
 * （組織章程第 61 條參照）。
 * 因此程式、路徑與 API 一律以 statutes 稱之，不再使用
 * regulation／bylaw 等同義詞。
 */
export const statuteNamingNote =
  '自治法規：包含本會組織章程與自治法令（自治法律、自治命令，組織章程第 61 條參照）。'
