<!-- app/pages/statutes/typesetting.vue -->
<!--
  線上法規排版：整併自第 1 版工具 ntpusu-regulation-typesetting。
  提供「分欄位輸入」與「YAML 輸入」兩種模式，即時檢查與預覽，
  可下載 .txt 原始檔備份到 Google Drive，並依 RPage 欄位複製上架資料。
  所有處理都在瀏覽器進行，不會把內容送到伺服器。
-->
<script setup lang="ts">
import { saveAs } from 'file-saver'
import { Download, Eraser, FileText, FileUp } from 'lucide-vue-next'

import type { TypesettingIssue } from '~/components/StatuteIssueList.vue'
import {
  resolveStatuteAuthority,
  buildRpageDetailHtml
} from '~~/shared/utils/rpage'
import {
  STATUTE_MODIFIED_TYPES,
  buildStatuteView,
  lintStatuteContent,
  normalizeNewlines,
  parseStatuteSource,
  stringifyStatuteSource,
  validateStatuteMeta,
  type StatuteMeta,
  type StatuteMetaKey,
  type StatuteSource,
  type StatuteView
} from '~~/shared/utils/statuteSource'

definePageMeta({ layout: 'congress' })
useHead({ title: '線上法規排版' })

type Mode = 'fields' | 'yaml'

const DRAFT_KEY = 'govcloud:statute-typesetting-draft'

const EXAMPLE_SOURCE = `---
titleFull: 國立臺北大學學生自治會範例自治條例
titleShort: 範例自治條例
modifiedType: 修正
modifiedDate: 2025-11-18
status: active
history:
  - 113年11月19日三峽校區學生議會第25屆第3次常會通過，11月20日會長公布，制定全文3條。
  - 114年11月18日三峽校區學生議會第26屆第3次常會通過，11月29日會長公布，修正第2條條文。
---

第一章 總則
第1條（目的）
　為示範線上法規排版之格式，特制定本條例。
第2條
　本條例用詞，定義如下：
一、項：以一個全形空白開頭之段落。
二、款：以「一、」開頭之段落，其下得分目：
（一）目：以「（一）」開頭之段落。
（二）目之括號應使用全形。
　前項以外之用詞，依本會法規之規定。
第二章 附則
第3條
　本條例自公布日施行。
`

// ----------------------------------------------------------------
// 狀態
// ----------------------------------------------------------------

/** 目前生效的輸入模式 */
const mode = ref<Mode>('fields')

const statuteId = ref('')

const emptyForm = () => ({
  titleFull: '',
  titleShort: '',
  modifiedType: '修正',
  modifiedDate: '',
  status: 'active',
  historyText: '',
  content: ''
})
const form = reactive(emptyForm())

/** 原始檔中不認得的欄位，分欄位模式不顯示，但下載時原樣寫回 */
const extra = ref<Record<string, unknown>>({})

const yamlText = ref('')

/** 使用者離開過的欄位，才以紅框標示錯誤，避免一進頁面就滿版錯誤 */
const touched = reactive(new Set<string>())

/** 頁面操作結果（live region） */
const statusMessage = ref('')

/** 從瀏覽器還原草稿的時間 */
const restoredAt = ref<string | null>(null)

const contentRef = ref<HTMLTextAreaElement | null>(null)
const yamlRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// ----------------------------------------------------------------
// 解析與檢查
// ----------------------------------------------------------------

/** 沿革文字框：每行一筆；貼上 YAML 清單時，自動去掉行首的「- 」 */
const historyFromText = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/^\s*-\s+/, '').trim())
    .filter(Boolean)

const formMeta = computed<StatuteMeta>(() => ({
  titleFull: form.titleFull.trim(),
  titleShort: form.titleShort.trim(),
  modifiedType: form.modifiedType.trim(),
  modifiedDate: form.modifiedDate.trim(),
  status: form.status,
  history: historyFromText(form.historyText)
}))

const current = computed(() => {
  if (mode.value === 'yaml') {
    const parsed = parseStatuteSource(yamlText.value)
    return {
      meta: parsed.meta,
      content: parsed.content,
      issues: parsed.issues as TypesettingIssue[],
      yamlError: parsed.yamlError
    }
  }
  return {
    meta: formMeta.value,
    content: form.content,
    issues: [
      ...validateStatuteMeta(formMeta.value),
      ...lintStatuteContent(form.content)
    ] as TypesettingIssue[],
    yamlError: false
  }
})

const idIssues = computed<TypesettingIssue[]>(() => {
  const id = statuteId.value.trim()
  if (!id) {
    return [
      {
        level: 'warning',
        field: 'statuteId',
        message: '尚未填寫法規代碼。下載的檔名與 RPage「負責單位」都需要它。'
      }
    ]
  }
  if (!/^\d{4}$/.test(id)) {
    return [
      {
        level: 'error',
        field: 'statuteId',
        message: '法規代碼須為四位數字，例如 1101。'
      }
    ]
  }
  if (!resolveStatuteAuthority(id)) {
    return [
      {
        level: 'warning',
        field: 'statuteId',
        message: `法規代碼第一碼「${id[0]}」沒有對應的主管機關，RPage「負責單位」需自行填寫。`
      }
    ]
  }
  return []
})

const issues = computed(() => [...idIssues.value, ...current.value.issues])
const errorCount = computed(
  () => issues.value.filter((i) => i.level === 'error').length
)

const isEmpty = computed(() =>
  mode.value === 'yaml'
    ? yamlText.value.trim() === ''
    : !form.titleFull &&
      !form.titleShort &&
      !form.modifiedDate &&
      !form.historyText.trim() &&
      !form.content.trim()
)

/**
 * 預覽用的資料。YAML 語法錯誤時無法解析，保留上一次的結果，
 * 避免使用者打字到一半時預覽整個消失。
 */
const view = shallowRef<StatuteView | null>(null)
watchEffect(() => {
  if (current.value.yamlError) return
  view.value = buildStatuteView(current.value.meta, current.value.content)
})

const previewHtml = computed(() =>
  view.value && !isEmpty.value ? buildRpageDetailHtml(view.value) : ''
)

const blockedReason = computed(() => {
  if (isEmpty.value) return '尚未輸入內容。'
  if (errorCount.value > 0)
    return `目前有 ${errorCount.value} 個錯誤，請先依「檢查結果」修正。`
  return ''
})

/** 分欄位模式下，某欄位的錯誤（離開過該欄位才顯示） */
const fieldError = (field: StatuteMetaKey | 'content' | 'statuteId') => {
  if (!touched.has(field)) return undefined
  return issues.value.find((i) => i.field === field && i.level === 'error')
    ?.message
}

/** 產生 aria-invalid 與 aria-describedby */
const fieldAttrs = (
  field: StatuteMetaKey | 'content' | 'statuteId',
  id: string,
  hasHelp = true
) => {
  const error = fieldError(field)
  const describedby = [hasHelp ? `${id}-help` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return {
    id,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': describedby || undefined
  }
}

const extraKeys = computed(() => Object.keys(extra.value))

// ----------------------------------------------------------------
// 模式切換
// ----------------------------------------------------------------

/** 目前內容的原始檔文字 */
const currentSourceText = () =>
  mode.value === 'yaml'
    ? yamlText.value
    : stringifyStatuteSource({
        meta: formMeta.value,
        content: form.content,
        extra: extra.value
      })

const applyToForm = (source: StatuteSource) => {
  Object.assign(form, {
    titleFull: source.meta.titleFull,
    titleShort: source.meta.titleShort,
    modifiedType: source.meta.modifiedType,
    modifiedDate: source.meta.modifiedDate,
    status: source.meta.status,
    historyText: source.meta.history.join('\n'),
    content: source.content.trim()
  })
  extra.value = source.extra
}

const switchMode = (next: Mode): boolean => {
  if (next === 'yaml') {
    yamlText.value = currentSourceText()
    mode.value = 'yaml'
    statusMessage.value = '已切換為 YAML 輸入，欄位內容已轉成 YAML。'
    return true
  }

  if (yamlText.value.trim() === '') {
    Object.assign(form, emptyForm())
    extra.value = {}
  } else {
    const parsed = parseStatuteSource(yamlText.value)
    if (parsed.yamlError) {
      const line = parsed.issues[0]?.line
      statusMessage.value = `YAML 有語法錯誤${line ? `（第 ${line} 行）` : ''}，無法轉換成欄位，請先修正後再切換。`
      return false
    }
    applyToForm(parsed)
  }
  mode.value = 'fields'
  statusMessage.value = '已切換為分欄位輸入，YAML 內容已填入各欄位。'
  return true
}

const onModeChange = (next: Mode, event: Event) => {
  if (next === mode.value || switchMode(next))
    return // 切換失敗時把單選按鈕改回目前的模式。
    // mode 的值沒有變，Vue 不會重新設定 checked，因此直接修改 DOM。
  ;(event.target as HTMLInputElement).checked = false
  const currentRadio = document.querySelector<HTMLInputElement>(
    `input[name="ts-mode"][value="${mode.value}"]`
  )
  if (currentRadio) currentRadio.checked = true
}

// ----------------------------------------------------------------
// 檔案操作
// ----------------------------------------------------------------

const download = () => {
  const id = statuteId.value.trim()
  const safeTitle = form.titleShort.replace(/[\\/:*?"<>|]/g, '').trim()
  const filename = /^\d{4}$/.test(id)
    ? `${id}.txt`
    : `${(mode.value === 'fields' && safeTitle) || '自治法規'}.txt`

  const blob = new Blob([currentSourceText()], {
    type: 'text/plain;charset=utf-8'
  })
  saveAs(blob, filename)

  const warning =
    errorCount.value > 0
      ? `注意：目前仍有 ${errorCount.value} 個錯誤，修正前請勿上傳，以免同步失敗。`
      : '請上傳到 Google Drive「學生自治會法規系統」中貴單位的資料夾，取代舊檔。'
  statusMessage.value = `已下載「${filename}」。${warning}`
}

const confirmReplace = (action: string) =>
  isEmpty.value || window.confirm(`${action}會取代目前輸入的內容，確定嗎？`)

const chooseFile = () => fileInputRef.value?.click()

const onFileChosen = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 讓使用者可以再次選擇同一個檔案
  if (!file || !confirmReplace('匯入檔案')) return

  const text = normalizeNewlines(await file.text())
  const idMatch = file.name.match(/^(\d{4})\.(txt|md)$/i)
  if (idMatch) statuteId.value = idMatch[1]!

  const parsed = parseStatuteSource(text)
  if (mode.value === 'yaml' || parsed.yamlError) {
    yamlText.value = text
    mode.value = 'yaml'
  } else {
    applyToForm(parsed)
  }

  statusMessage.value = parsed.yamlError
    ? `已匯入「${file.name}」，但 YAML 有語法錯誤，已切換為 YAML 輸入，請依檢查結果修正。`
    : `已匯入「${file.name}」。`
}

const loadExample = () => {
  if (!confirmReplace('載入範例')) return
  const parsed = parseStatuteSource(EXAMPLE_SOURCE)
  if (mode.value === 'yaml') yamlText.value = EXAMPLE_SOURCE
  else applyToForm(parsed)
  statusMessage.value = '已載入範例。'
}

const clearAll = () => {
  if (!isEmpty.value && !window.confirm('確定要清除所有輸入的內容嗎？')) return
  Object.assign(form, emptyForm())
  extra.value = {}
  yamlText.value = ''
  statuteId.value = ''
  touched.clear()
  restoredAt.value = null
  statusMessage.value = '已清除內容。'
}

// ----------------------------------------------------------------
// 編輯輔助
// ----------------------------------------------------------------

/** 在游標處插入全形空白（項的行首標記），輸入法不易打出時使用 */
const insertFullWidthSpace = (target: 'content' | 'yaml') => {
  const el = target === 'content' ? contentRef.value : yamlRef.value
  if (!el) return
  el.setRangeText('　', el.selectionStart, el.selectionEnd, 'end')
  if (target === 'content') form.content = el.value
  else yamlText.value = el.value
  el.focus()
}

/** 選取文字框中的第 line 行，並捲動到該處 */
const selectLine = (el: HTMLTextAreaElement, line: number) => {
  const lines = el.value.split('\n')
  const index = Math.min(Math.max(line, 1), lines.length) - 1
  const start = lines.slice(0, index).reduce((sum, l) => sum + l.length + 1, 0)
  el.focus()
  el.setSelectionRange(start, start + (lines[index]?.length ?? 0))
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
  el.scrollTop = Math.max(0, (index - 2) * lineHeight)
}

const FIELD_INPUT_IDS: Partial<Record<string, string>> = {
  statuteId: 'ts-statute-id',
  titleFull: 'ts-title-full',
  titleShort: 'ts-title-short',
  modifiedType: 'ts-modified-type',
  modifiedDate: 'ts-modified-date',
  status: 'ts-status',
  history: 'ts-history'
}

/** 檢查結果的「移至此處」 */
const locateIssue = (issue: TypesettingIssue) => {
  if (issue.field === 'statuteId') {
    document.getElementById('ts-statute-id')?.focus()
    return
  }
  if (mode.value === 'yaml') {
    if (!yamlRef.value) return
    if (issue.line) selectLine(yamlRef.value, issue.line)
    else yamlRef.value.focus()
    return
  }
  if (issue.field === 'content' && contentRef.value) {
    if (issue.line) selectLine(contentRef.value, issue.line)
    else contentRef.value.focus()
    return
  }
  const id = issue.field && FIELD_INPUT_IDS[issue.field]
  if (id) document.getElementById(id)?.focus()
}

// ----------------------------------------------------------------
// 草稿暫存：存在瀏覽器的 localStorage，只有這台電腦看得到
// ----------------------------------------------------------------

interface Draft {
  mode: Mode
  statuteId: string
  form: ReturnType<typeof emptyForm>
  extra: Record<string, unknown>
  yamlText: string
  savedAt: number
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

const saveDraft = () => {
  try {
    if (isEmpty.value && !statuteId.value) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const draft: Draft = {
      mode: mode.value,
      statuteId: statuteId.value,
      form: { ...form },
      extra: extra.value,
      yamlText: yamlText.value,
      savedAt: Date.now()
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // 無痕模式或儲存空間已滿時無法暫存，不影響編輯
  }
}

watch([mode, statuteId, form, yamlText, extra], () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveDraft, 400)
})

onMounted(() => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const draft = JSON.parse(raw) as Draft
    Object.assign(form, emptyForm(), draft.form)
    extra.value = draft.extra ?? {}
    yamlText.value = draft.yamlText ?? ''
    statuteId.value = draft.statuteId ?? ''
    mode.value = draft.mode === 'yaml' ? 'yaml' : 'fields'
    restoredAt.value = new Date(draft.savedAt).toLocaleString('zh-TW', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    // 草稿損毀或無法讀取時，從空白開始
  }
})

onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  saveDraft()
})

const discardDraft = () => {
  Object.assign(form, emptyForm())
  extra.value = {}
  yamlText.value = ''
  statuteId.value = ''
  touched.clear()
  restoredAt.value = null
  statusMessage.value = '已捨棄草稿。'
}
</script>

<template>
  <div class="typesetting">
    <header>
      <hgroup>
        <h1>線上法規排版</h1>
        <p>
          輸入法規的基本資料與內文，即時檢查格式並預覽會網上的樣子。完成後可下載
          .txt 原始檔備份到 Google Drive，並依 RPage
          欄位複製上架。內容只在您的瀏覽器處理，不會上傳到伺服器。
        </p>
      </hgroup>
    </header>

    <div v-if="restoredAt" class="draft-notice">
      <p>
        已還原您在 {{ restoredAt }} 未完成的草稿（只儲存在這台電腦的瀏覽器）。
      </p>
      <button type="button" class="secondary outline" @click="discardDraft">
        捨棄草稿，重新開始
      </button>
    </div>

    <!-- ── 工具列 ─────────────────────────────────────────── -->
    <section class="ts-toolbar" aria-label="法規代碼、輸入模式與檔案操作">
      <div class="ts-toolbar-fields">
        <div class="ts-id">
          <label for="ts-statute-id">法規代碼</label>
          <input
            v-model.trim="statuteId"
            v-bind="fieldAttrs('statuteId', 'ts-statute-id')"
            type="text"
            inputmode="numeric"
            maxlength="4"
            placeholder="例如 1101"
            autocomplete="off"
            @blur="touched.add('statuteId')"
          />
          <small id="ts-statute-id-help">即 Drive 上的檔名，四位數字。</small>
          <small
            v-if="fieldError('statuteId')"
            id="ts-statute-id-error"
            class="field-error"
            >{{ fieldError('statuteId') }}</small
          >
        </div>

        <fieldset class="ts-mode">
          <legend>輸入模式</legend>
          <div class="segmented">
            <label>
              <input
                type="radio"
                name="ts-mode"
                value="fields"
                :checked="mode === 'fields'"
                @change="onModeChange('fields', $event)"
              />
              <span>分欄位輸入</span>
            </label>
            <label>
              <input
                type="radio"
                name="ts-mode"
                value="yaml"
                :checked="mode === 'yaml'"
                @change="onModeChange('yaml', $event)"
              />
              <span>YAML 輸入</span>
            </label>
          </div>
        </fieldset>
      </div>

      <div class="ts-actions">
        <button type="button" class="secondary outline" @click="chooseFile">
          <FileUp :size="18" aria-hidden="true" />
          匯入 .txt 檔
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          class="visually-hidden"
          tabindex="-1"
          aria-hidden="true"
          @change="onFileChosen"
        />
        <button type="button" :disabled="isEmpty" @click="download">
          <Download :size="18" aria-hidden="true" />
          下載 .txt 檔
        </button>
        <button type="button" class="secondary outline" @click="loadExample">
          <FileText :size="18" aria-hidden="true" />
          載入範例
        </button>
        <button type="button" class="secondary outline" @click="clearAll">
          <Eraser :size="18" aria-hidden="true" />
          清除
        </button>
      </div>

      <!-- 操作結果以 live region 通知螢幕報讀軟體（WCAG 4.1.3） -->
      <p role="status" class="ts-status">{{ statusMessage }}</p>
    </section>

    <div class="ts-layout">
      <!-- ── 輸入 ───────────────────────────────────────── -->
      <section class="ts-input" aria-labelledby="ts-input-title">
        <h2 id="ts-input-title">
          {{ mode === 'fields' ? '分欄位輸入' : 'YAML 輸入' }}
        </h2>

        <form v-if="mode === 'fields'" novalidate @submit.prevent>
          <label for="ts-title-full">法規全稱</label>
          <input
            v-model="form.titleFull"
            v-bind="fieldAttrs('titleFull', 'ts-title-full')"
            type="text"
            autocomplete="off"
            @blur="touched.add('titleFull')"
          />
          <small id="ts-title-full-help"
            >法規標準法規定之全銜，請勿省略「國立臺北大學學生自治會」前綴。</small
          >
          <small
            v-if="fieldError('titleFull')"
            id="ts-title-full-error"
            class="field-error"
            >{{ fieldError('titleFull') }}</small
          >

          <div class="grid">
            <div>
              <label for="ts-title-short">法規簡稱</label>
              <input
                v-model="form.titleShort"
                v-bind="fieldAttrs('titleShort', 'ts-title-short')"
                type="text"
                autocomplete="off"
                @blur="touched.add('titleShort')"
              />
              <small id="ts-title-short-help"
                >不含會名前綴；校區單行法規建議冠上校區。會作為 RPage
                資訊標題。</small
              >
              <small
                v-if="fieldError('titleShort')"
                id="ts-title-short-error"
                class="field-error"
                >{{ fieldError('titleShort') }}</small
              >
            </div>
            <div>
              <label for="ts-modified-type">異動類別</label>
              <input
                v-model="form.modifiedType"
                v-bind="fieldAttrs('modifiedType', 'ts-modified-type')"
                type="text"
                list="ts-modified-types"
                autocomplete="off"
                @blur="touched.add('modifiedType')"
              />
              <datalist id="ts-modified-types">
                <option
                  v-for="t in STATUTE_MODIFIED_TYPES"
                  :key="t"
                  :value="t"
                />
              </datalist>
              <small id="ts-modified-type-help"
                >{{ STATUTE_MODIFIED_TYPES.join('、') }}，會顯示為「{{
                  form.modifiedType || '○○'
                }}日期」。</small
              >
              <small
                v-if="fieldError('modifiedType')"
                id="ts-modified-type-error"
                class="field-error"
                >{{ fieldError('modifiedType') }}</small
              >
            </div>
          </div>

          <div class="grid">
            <div>
              <label for="ts-modified-date">最近異動日期</label>
              <input
                v-model="form.modifiedDate"
                v-bind="fieldAttrs('modifiedDate', 'ts-modified-date')"
                type="date"
                @blur="touched.add('modifiedDate')"
              />
              <small id="ts-modified-date-help"
                >公布或發布日期。會作為 RPage 發布日期。</small
              >
              <small
                v-if="fieldError('modifiedDate')"
                id="ts-modified-date-error"
                class="field-error"
                >{{ fieldError('modifiedDate') }}</small
              >
            </div>
            <div>
              <label for="ts-status">施行狀態</label>
              <select
                v-model="form.status"
                v-bind="fieldAttrs('status', 'ts-status', false)"
                @blur="touched.add('status')"
              >
                <option value="active">施行中（active）</option>
                <option value="abandoned">已廢止（abandoned）</option>
              </select>
              <small
                v-if="fieldError('status')"
                id="ts-status-error"
                class="field-error"
                >{{ fieldError('status') }}</small
              >
            </div>
          </div>

          <label for="ts-history">沿革</label>
          <textarea
            v-model="form.historyText"
            v-bind="fieldAttrs('history', 'ts-history')"
            rows="5"
            @blur="touched.add('history')"
          ></textarea>
          <small id="ts-history-help"
            >每次異動寫一行，依時間先後排列，不需加「-
            」。例：114年11月18日三峽校區學生議會第26屆第3次常會通過，11月29日會長公布，修正第1、10條條文。</small
          >

          <div class="label-row">
            <label for="ts-content">內文</label>
            <button
              type="button"
              class="secondary outline compact"
              @click="insertFullWidthSpace('content')"
            >
              插入全形空白
            </button>
          </div>
          <textarea
            ref="contentRef"
            v-model="form.content"
            v-bind="fieldAttrs('content', 'ts-content')"
            class="ts-content-input"
            rows="20"
            spellcheck="false"
            @blur="touched.add('content')"
          ></textarea>
          <small id="ts-content-help"
            >章節、條號不縮排；每一項以一個全形空白開頭；款、目以「一、」「（一）」開頭且不縮排。詳見下方格式說明。</small
          >
          <small
            v-if="fieldError('content')"
            id="ts-content-error"
            class="field-error"
            >{{ fieldError('content') }}</small
          >

          <p v-if="extraKeys.length" class="extra-note">
            此檔案另有 {{ extraKeys.length }} 個欄位（{{
              extraKeys.join('、')
            }}）不在表單中，會原樣保留在下載的檔案裡。
          </p>
        </form>

        <template v-else>
          <div class="label-row">
            <label for="ts-yaml">法規原始檔（YAML front matter＋內文）</label>
            <button
              type="button"
              class="secondary outline compact"
              @click="insertFullWidthSpace('yaml')"
            >
              插入全形空白
            </button>
          </div>
          <textarea
            id="ts-yaml"
            ref="yamlRef"
            v-model="yamlText"
            class="ts-yaml-input"
            rows="28"
            spellcheck="false"
            aria-describedby="ts-yaml-help"
          ></textarea>
          <small id="ts-yaml-help"
            >與 Google Drive 上的法規 .txt
            檔格式相同：以兩行「---」包住基本資料，之後接內文。</small
          >
        </template>

        <details class="ts-guide">
          <summary>格式說明</summary>
          <h3>基本資料（YAML）</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">欄位</th>
                <th scope="col">說明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>titleFull</code></td>
                <td>法規全稱，勿省略「國立臺北大學學生自治會」前綴。</td>
              </tr>
              <tr>
                <td><code>titleShort</code></td>
                <td>法規簡稱，不含會名前綴。</td>
              </tr>
              <tr>
                <td><code>modifiedType</code></td>
                <td>{{ STATUTE_MODIFIED_TYPES.join('、') }}。</td>
              </tr>
              <tr>
                <td><code>modifiedDate</code></td>
                <td>YYYY-MM-DD，例如 2025-07-30。</td>
              </tr>
              <tr>
                <td><code>status</code></td>
                <td>施行中填 active；已廢止填 abandoned。</td>
              </tr>
              <tr>
                <td><code>history</code></td>
                <td>
                  每筆沿革一行，以「-
                  」（短線加半形空白）開頭。文字中若有冒號，請用全形「：」。
                </td>
              </tr>
            </tbody>
          </table>
          <h3>內文</h3>
          <ul>
            <li>
              章節標題、條號（含條旨）、每一項、每一款、每一目各自獨立一行。
            </li>
            <li>
              <strong>編章節</strong>：寫「第一章
              總則」，序號與標題以一個空白隔開，不縮排。
            </li>
            <li>
              <strong>條號</strong
              >：寫「第1條」，條旨以全形括號括註，例如「第1條（目的）」，不縮排。
            </li>
            <li>
              <strong>項</strong>（及不分項的條文）：行首加一個全形空白「　」。
            </li>
            <li>
              <strong>款、目</strong
              >：以「一、」「（一）」開頭，不縮排；目的括號為全形。
            </li>
          </ul>
        </details>
      </section>

      <!-- ── 檢查與預覽 ─────────────────────────────────── -->
      <section
        class="ts-preview"
        aria-labelledby="ts-preview-title"
        tabindex="0"
      >
        <h2 id="ts-preview-title">檢查與預覽</h2>

        <h3 class="ts-subheading">檢查結果</h3>
        <StatuteIssueList :issues="issues" @locate="locateIssue" />

        <h3 class="ts-subheading">會網預覽</h3>
        <p v-if="current.yamlError" class="preview-stale">
          YAML 有語法錯誤，預覽暫停更新，顯示的是上一次可解析的內容。
        </p>
        <article v-if="previewHtml" class="ts-preview-doc">
          <header>
            <small>資訊標題</small>
            <p class="ts-preview-title">{{ view?.titleShort }}</p>
          </header>
          <!-- 與貼到 RPage 的 HTML 完全相同，樣式由 statutes-format.css 提供 -->
          <div class="ts-preview-body" v-html="previewHtml"></div>
        </article>
        <p v-else class="preview-empty">輸入內容後，這裡會顯示會網上的樣子。</p>
      </section>
    </div>

    <RpageCopyPanel
      class="ts-rpage"
      :view="isEmpty ? null : view"
      :statute-id="statuteId"
      :blocked-reason="blockedReason || undefined"
    />
  </div>
</template>

<style scoped>
.typesetting {
  max-width: 120rem;
}

.draft-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  margin-bottom: var(--pico-spacing);
  border-left: 0.25rem solid var(--pico-primary-focus);
  background: var(--pico-card-sectioning-background-color);
}

.draft-notice p,
.draft-notice button {
  margin-bottom: 0;
}

/* ── 工具列 ─────────────────────────────────────────── */
.ts-toolbar {
  padding: var(--pico-spacing);
  margin-bottom: calc(var(--pico-spacing) * 1.5);
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
}

.ts-toolbar-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0 2rem;
}

.ts-id {
  flex: 0 1 14rem;
}

.ts-mode {
  margin-bottom: var(--pico-spacing);
}

.ts-mode legend {
  margin-bottom: calc(var(--pico-spacing) * 0.375);
}

/* 分段按鈕：外觀是一組按鈕，語意仍是單選按鈕，方向鍵即可切換 */
.segmented {
  display: inline-flex;
  border: 1px solid var(--pico-form-element-border-color);
  border-radius: var(--pico-border-radius);
  overflow: hidden;
}

.segmented label {
  position: relative;
  margin: 0;
}

.segmented input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
}

.segmented span {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem; /* 點擊範圍 ≥ 44px（WCAG 2.5.5） */
  padding: 0 1.25rem;
  cursor: pointer;
}

.segmented label + label span {
  border-left: 1px solid var(--pico-form-element-border-color);
}

.segmented input:checked + span {
  background: var(--pico-primary-background);
  color: var(--pico-primary-inverse);
  font-weight: bold;
}

.segmented input:focus-visible + span {
  outline: 0.1875rem solid var(--pico-primary-focus);
  outline-offset: -0.1875rem;
}

.ts-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ts-actions button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  width: auto;
  margin-bottom: 0;
}

.ts-status {
  margin: var(--pico-spacing) 0 0;
}

.ts-status:empty {
  margin: 0;
}

/* ── 兩欄版面：寬螢幕時左右並排，預覽固定在畫面中 ──── */
.ts-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: calc(var(--pico-spacing) * 2);
  align-items: start;
}

@media (min-width: 1280px) {
  .ts-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .ts-preview {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }
}

.ts-input h2,
.ts-preview h2 {
  font-size: 1.375rem;
}

.ts-subheading {
  margin-top: var(--pico-spacing);
  font-size: 1.0625rem;
}

.ts-input small {
  display: block;
  margin-top: -0.5rem;
  margin-bottom: var(--pico-spacing);
  color: var(--pico-muted-color);
}

.ts-input small.field-error,
.ts-id small.field-error {
  margin-top: calc(var(--pico-spacing) * -0.75);
  color: var(--pico-del-color);
}

.ts-id small {
  display: block;
  margin-top: -0.5rem;
  margin-bottom: var(--pico-spacing);
  color: var(--pico-muted-color);
}

.label-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: calc(var(--pico-spacing) * 0.375);
}

.label-row label {
  margin-bottom: 0;
}

button.compact {
  width: auto;
  min-height: 2.75rem;
  margin-bottom: 0;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.ts-content-input,
.ts-yaml-input {
  resize: vertical;
  line-height: 1.6;
}

.ts-yaml-input {
  font-family: var(--pico-font-family-monospace);
  font-size: 0.875rem;
}

.extra-note {
  color: var(--pico-muted-color);
  font-size: 0.9375rem;
}

.ts-guide {
  margin-top: var(--pico-spacing);
}

.ts-guide h3 {
  font-size: 1rem;
  margin-top: var(--pico-spacing);
}

/* ── 預覽 ─────────────────────────────────────────── */
.ts-preview:focus-visible {
  outline: 0.1875rem solid var(--pico-primary-focus);
  outline-offset: 0.25rem;
}

.ts-preview-doc header small {
  color: var(--pico-muted-color);
}

.ts-preview-title {
  margin-bottom: 0;
  font-size: 1.25rem;
  font-weight: bold;
}

/* 預覽中的 h2 是貼到 RPage 的內容，字級縮小以免與頁面標題混淆 */
.ts-preview-body :deep(h2) {
  font-size: 1.125rem;
  margin-top: calc(var(--pico-spacing) * 1.5);
}

.preview-stale {
  padding: 0.5rem 0.75rem;
  border-left: 0.25rem solid var(--pico-del-color);
}

.preview-empty {
  color: var(--pico-muted-color);
}

.ts-rpage {
  margin-top: calc(var(--pico-spacing) * 2.5);
  padding-top: calc(var(--pico-spacing) * 1.5);
  border-top: 1px solid var(--pico-muted-border-color);
}
</style>
