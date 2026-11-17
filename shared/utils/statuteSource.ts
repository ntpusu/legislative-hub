// shared/utils/statuteSource.ts
// 自治法規原始檔（Google Drive 上的「法規代碼.txt」、legislative-data 的「法規代碼.md」）
// 的解析、驗證與序列化。原始檔由 YAML front matter（基本資料）與純文字內文組成。
// 以 gray-matter 切出 front matter，交由 js-yaml 解析；前端（線上法規排版）與後端共用。

import matter from 'gray-matter'
import { CORE_SCHEMA, YAMLException, dump, load } from 'js-yaml'

import { siteConfig } from '../../config/site.config'
import {
  classifyStatuteLine,
  formatStatuteDate,
  statuteContentToHtml
} from './statuteFormat'

/** 異動類別 */
export const STATUTE_MODIFIED_TYPES = ['制定', '訂定', '修正', '廢止'] as const

/** 施行狀態 */
export const STATUTE_STATUSES = ['active', 'abandoned'] as const

/** front matter 的欄位，依原始檔慣用的順序排列 */
export const STATUTE_META_KEYS = [
  'titleFull',
  'titleShort',
  'modifiedType',
  'modifiedDate',
  'status',
  'history'
] as const

export type StatuteMetaKey = (typeof STATUTE_META_KEYS)[number]

/** 法規基本資料（front matter），已整理為固定型別 */
export interface StatuteMeta {
  titleFull: string
  titleShort: string
  modifiedType: string
  /** YYYY-MM-DD */
  modifiedDate: string
  status: string
  history: string[]
}

/** 一份法規原始檔的內容 */
export interface StatuteSource {
  meta: StatuteMeta
  content: string
  /** 不認得的 front matter 欄位，原樣保留，序列化時寫回 */
  extra: Record<string, unknown>
}

/** 檢查結果。field 指出問題所在的欄位；line 為行號（從 1 起算） */
export interface StatuteIssue {
  level: 'error' | 'warning'
  message: string
  field?: StatuteMetaKey | 'content' | 'frontMatter'
  line?: number
}

export interface ParsedStatuteSource extends StatuteSource {
  issues: StatuteIssue[]
  /** 檔案開頭是否有 --- 包住的 front matter */
  hasFrontMatter: boolean
  /** YAML 語法錯誤，此時 meta 為空值，不可據以覆寫使用者的資料 */
  yamlError: boolean
  /** 內文從原始檔的第幾行開始（從 1 起算），用於換算內文的行號 */
  contentStartLine: number
}

/** API 與預覽使用的法規資料（已排版） */
export interface StatuteView {
  titleFull: string
  titleShort: string
  modifiedType: string
  /** 中文日期，例如 2025年7月30日 */
  modifiedDate: string
  /** YYYY-MM-DD；原始資料有誤時為空字串 */
  modifiedDateIso: string
  status: string
  history: string[]
  fullText: string
}

const LABELS: Record<StatuteMetaKey, string> = {
  titleFull: '法規全稱',
  titleShort: '法規簡稱',
  modifiedType: '異動類別',
  modifiedDate: '最近異動日期',
  status: '施行狀態',
  history: '沿革'
}

/** 「法規全稱（titleFull）」，用於訊息 */
const label = (key: StatuteMetaKey) => `${LABELS[key]}（${key}）`

export function emptyStatuteMeta(): StatuteMeta {
  return {
    titleFull: '',
    titleShort: '',
    modifiedType: '',
    modifiedDate: '',
    status: 'active',
    history: []
  }
}

/** 統一換行字元並移除 BOM（Windows 記事本存檔可能帶有） */
export function normalizeNewlines(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
}

/**
 * 以 js-yaml 解析 front matter。
 * 使用 CORE_SCHEMA：2025-07-30 這類日期保留為字串，不轉成 Date，避免時區問題。
 */
function parseYaml(text: string): object {
  // gray-matter 的型別要求回傳 object；實際值的型別於 parseStatuteSource() 再檢查
  return load(text, { schema: CORE_SCHEMA }) as object
}

/**
 * gray-matter 會呼叫 Node.js 的 Buffer.from()（只用來保存原始輸入，不影響解析結果），
 * 瀏覽器沒有 Buffer，因此在瀏覽器執行時暫時提供最小的替代品，呼叫完立即移除。
 */
function runGrayMatter(raw: string) {
  const g = globalThis as { Buffer?: unknown }
  const needsShim = typeof g.Buffer === 'undefined'
  if (needsShim) g.Buffer = { from: (input: unknown) => input }
  try {
    // 傳入 options 也會停用 gray-matter 以輸入字串為鍵的快取，避免記憶體隨輸入次數成長
    return matter(raw, { engines: { yaml: parseYaml } })
  } finally {
    if (needsShim) delete g.Buffer
  }
}

/** 把任意值轉成一行文字（用於沿革被誤解析為物件等情形） */
function toText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${toText(v)}`)
      .join(' ')
  }
  return String(value)
}

/**
 * 把 YAML 解析出的物件整理成 StatuteMeta，並回報型別上的問題
 * （例如沿革不是清單、沿革某一行被解析成物件）。
 */
export function normalizeStatuteData(data: Record<string, unknown>): {
  meta: StatuteMeta
  extra: Record<string, unknown>
  issues: StatuteIssue[]
} {
  const issues: StatuteIssue[] = []
  const meta = emptyStatuteMeta()
  const extra: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (!(STATUTE_META_KEYS as readonly string[]).includes(key)) {
      extra[key] = value
    }
  }

  for (const key of STATUTE_META_KEYS) {
    if (key === 'history') continue
    const value = data[key]
    if (value == null) continue
    if (typeof value === 'object' && !(value instanceof Date)) {
      issues.push({
        level: 'error',
        field: key,
        message: `${label(key)}應為一行文字，但被解析為清單或物件，請檢查縮排與冒號。`
      })
    }
    meta[key] = toText(value).trim()
  }

  const history = data.history
  if (Array.isArray(history)) {
    history.forEach((item, index) => {
      if (item != null && typeof item === 'object') {
        issues.push({
          level: 'error',
          field: 'history',
          message: `第 ${index + 1} 筆沿革被解析為物件，通常是因為文字中有「半形冒號加空白」。請改用全形冒號「：」，或用引號包住整行。`
        })
      }
      const text = toText(item).trim()
      if (text) meta.history.push(text)
    })
  } else if (history != null && history !== '') {
    issues.push({
      level: 'error',
      field: 'history',
      message: `${label('history')}應為清單：每筆沿革獨立一行，並以「- 」（短線加半形空白）開頭。`
    })
    meta.history = [toText(history).trim()]
  }

  return { meta, extra, issues }
}

/** 檢查 YYYY-MM-DD 是否為存在的日期 */
export function isValidIsoDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/** 檢查基本資料的值 */
export function validateStatuteMeta(meta: StatuteMeta): StatuteIssue[] {
  const issues: StatuteIssue[] = []
  const { orgName } = siteConfig

  if (!meta.titleFull) {
    issues.push({
      level: 'error',
      field: 'titleFull',
      message: `請填寫${label('titleFull')}。`
    })
  } else if (!meta.titleFull.startsWith(orgName)) {
    issues.push({
      level: 'warning',
      field: 'titleFull',
      message: `法規全稱通常以「${orgName}」開頭，請確認沒有省略。`
    })
  }

  if (!meta.titleShort) {
    issues.push({
      level: 'error',
      field: 'titleShort',
      message: `請填寫${label('titleShort')}。`
    })
  } else if (meta.titleShort.startsWith(orgName)) {
    issues.push({
      level: 'warning',
      field: 'titleShort',
      message: `法規簡稱不需要「${orgName}」前綴；校區單行法規建議冠上「三峽校區」或「臺北校區」。`
    })
  }

  if (!meta.modifiedType) {
    issues.push({
      level: 'error',
      field: 'modifiedType',
      message: `請填寫${label('modifiedType')}，例如${STATUTE_MODIFIED_TYPES.join('、')}。`
    })
  } else if (
    !(STATUTE_MODIFIED_TYPES as readonly string[]).includes(meta.modifiedType)
  ) {
    // 早期法規有「通過」「公開」等寫法，不擋，只提醒
    issues.push({
      level: 'warning',
      field: 'modifiedType',
      message: `${label('modifiedType')}通常為${STATUTE_MODIFIED_TYPES.join('、')}其中之一，請確認「${meta.modifiedType}」是否正確。`
    })
  }

  if (!isValidIsoDate(meta.modifiedDate)) {
    issues.push({
      level: 'error',
      field: 'modifiedDate',
      message: `${label('modifiedDate')}須為 YYYY-MM-DD 格式的有效日期，例如 2025-07-30。`
    })
  }

  if (!(STATUTE_STATUSES as readonly string[]).includes(meta.status)) {
    issues.push({
      level: 'error',
      field: 'status',
      message: `${label('status')}須為 active（施行中）或 abandoned（已廢止）。`
    })
  } else if (meta.modifiedType === '廢止' && meta.status !== 'abandoned') {
    issues.push({
      level: 'warning',
      field: 'status',
      message:
        '異動類別為「廢止」，但施行狀態仍是 active，請確認是否應改為 abandoned。'
    })
  } else if (meta.status === 'abandoned' && meta.modifiedType !== '廢止') {
    issues.push({
      level: 'warning',
      field: 'modifiedType',
      message:
        '施行狀態為 abandoned（已廢止），但異動類別不是「廢止」，請確認。'
    })
  }

  if (meta.history.length === 0) {
    issues.push({
      level: 'warning',
      field: 'history',
      message: '尚未填寫沿革。廢止法規時也請記得把廢止過程寫進沿革。'
    })
  }

  return issues
}

/**
 * 檢查內文格式。lineOffset 為內文第一行在原始檔中的行號減 1，
 * 讓回報的行號與使用者看到的檔案一致。
 */
export function lintStatuteContent(
  content: string,
  lineOffset = 0
): StatuteIssue[] {
  const issues: StatuteIssue[] = []

  if (content.trim() === '') {
    return [{ level: 'error', field: 'content', message: '尚未輸入法規內文。' }]
  }

  content.split('\n').forEach((rawLine, index) => {
    const line = lineOffset + index + 1
    const { kind } = classifyStatuteLine(rawLine)

    if (/^[ \t]/.test(rawLine) && rawLine.trim() !== '') {
      issues.push({
        level: 'warning',
        field: 'content',
        line,
        message:
          '行首有半形空白或 Tab。項請以「一個全形空白」開頭；章節、條號、款、目都不要縮排。'
      })
    } else if (kind === 'text') {
      issues.push({
        level: 'warning',
        field: 'content',
        line,
        message:
          '無法辨識為章節、條號、項、款或目，將原樣輸出、不會排版。若這是一項，請在行首加一個全形空白。'
      })
    }
  })

  return issues
}

/** 解析整份原始檔，並檢查基本資料與內文 */
export function parseStatuteSource(input: string): ParsedStatuteSource {
  const raw = normalizeNewlines(input)
  const hasFrontMatter = /^---\s*\n/.test(raw)

  let file: ReturnType<typeof runGrayMatter>
  try {
    file = runGrayMatter(raw)
  } catch (err) {
    const issue: StatuteIssue = {
      level: 'error',
      field: 'frontMatter',
      message: 'YAML 基本資料有語法錯誤，請檢查縮排、冒號與引號。'
    }
    if (err instanceof YAMLException) {
      // front matter 從第 1 行的 --- 之後開始，因此 YAML 的第 0 行即原始檔第 1 行
      if (err.mark) issue.line = err.mark.line + 1
      issue.message = `YAML 基本資料有語法錯誤（${err.reason}），請檢查縮排、冒號與引號。`
    }
    return {
      meta: emptyStatuteMeta(),
      content: '',
      extra: {},
      issues: [issue],
      hasFrontMatter,
      yamlError: true,
      contentStartLine: 1
    }
  }

  const issues: StatuteIssue[] = []
  if (!hasFrontMatter) {
    issues.push({
      level: 'error',
      field: 'frontMatter',
      line: 1,
      message:
        '找不到 YAML 基本資料。檔案第一行須為「---」，基本資料結束後再以一行「---」隔開內文。'
    })
  }

  const data =
    file.data && typeof file.data === 'object' && !Array.isArray(file.data)
      ? (file.data as Record<string, unknown>)
      : {}
  const normalized = normalizeStatuteData(data)
  issues.push(...normalized.issues, ...validateStatuteMeta(normalized.meta))

  // gray-matter 的 content 是原始檔的後段，以此推算內文從第幾行開始
  const content = file.content
  const contentStartLine = raw
    .slice(0, raw.length - content.length)
    .split('\n').length
  issues.push(...lintStatuteContent(content, contentStartLine - 1))

  return {
    meta: normalized.meta,
    content,
    extra: normalized.extra,
    issues,
    hasFrontMatter,
    yamlError: false,
    contentStartLine
  }
}

/**
 * 把基本資料與內文寫回原始檔格式，與 legislative-data 現有檔案的寫法一致。
 * 不認得的欄位（extra）接在已知欄位之後。
 */
export function stringifyStatuteSource(source: StatuteSource): string {
  const ordered: Record<string, unknown> = {}
  for (const key of STATUTE_META_KEYS) ordered[key] = source.meta[key]
  Object.assign(ordered, source.extra)

  const frontMatter = dump(ordered, {
    schema: CORE_SCHEMA,
    lineWidth: -1, // 沿革常常很長，不要自動折行
    noRefs: true
  })

  return `---\n${frontMatter}---\n\n${source.content.trim()}\n`
}

/** 產生 API 與預覽使用的資料；缺漏的欄位以說明文字代替 */
export function buildStatuteView(
  meta: StatuteMeta,
  content: string
): StatuteView {
  const modifiedDateIso = isValidIsoDate(meta.modifiedDate)
    ? meta.modifiedDate
    : ''
  return {
    titleFull: meta.titleFull || '(原始資料未註記標題)',
    titleShort: meta.titleShort || '(原始資料未註記簡稱)',
    modifiedType: meta.modifiedType || '異動',
    modifiedDate:
      formatStatuteDate(meta.modifiedDate) || '(原始資料未註記最近異動日期)',
    modifiedDateIso,
    status: meta.status || '(原始資料未註記施行狀態)',
    history: meta.history,
    fullText: statuteContentToHtml(content.trim())
  }
}
