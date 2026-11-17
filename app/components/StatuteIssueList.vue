<!-- app/components/StatuteIssueList.vue -->
<!-- 法規原始檔的檢查結果。可定位的問題以按鈕呈現，點選後由父元件把焦點移到該欄位或該行 -->
<script lang="ts">
import type { StatuteIssue } from '~~/shared/utils/statuteSource'

/** 頁面層級的問題，多了「法規代碼」欄位 */
export type TypesettingIssue = Omit<StatuteIssue, 'field'> & {
  field?: StatuteIssue['field'] | 'statuteId'
}
</script>

<script setup lang="ts">
import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-vue-next'

const props = defineProps<{ issues: TypesettingIssue[] }>()
const emit = defineEmits<{ locate: [issue: TypesettingIssue] }>()

const FIELD_LABELS: Record<NonNullable<TypesettingIssue['field']>, string> = {
  statuteId: '法規代碼',
  titleFull: '法規全稱',
  titleShort: '法規簡稱',
  modifiedType: '異動類別',
  modifiedDate: '最近異動日期',
  status: '施行狀態',
  history: '沿革',
  content: '內文',
  frontMatter: '基本資料'
}

const errorCount = computed(
  () => props.issues.filter((i) => i.level === 'error').length
)
const warningCount = computed(() => props.issues.length - errorCount.value)

/** 錯誤排在提醒前面，同級者維持原順序 */
const sortedIssues = computed(() =>
  [...props.issues].sort(
    (a, b) => Number(a.level !== 'error') - Number(b.level !== 'error')
  )
)

const locateText = (issue: TypesettingIssue) => {
  if (issue.line) return `第 ${issue.line} 行`
  return issue.field ? FIELD_LABELS[issue.field] : ''
}
</script>

<template>
  <div class="issue-summary">
    <p v-if="issues.length === 0" class="issue-ok">
      <CircleCheck :size="18" aria-hidden="true" />
      沒有發現問題。
    </p>

    <template v-else>
      <p class="issue-count">
        <strong>{{ errorCount }} 個錯誤</strong>、{{ warningCount }} 個提醒
        <small>（錯誤須修正後才能複製到 RPage；提醒僅供參考）</small>
      </p>
      <ul class="issue-list">
        <li
          v-for="(issue, index) in sortedIssues"
          :key="index"
          :class="`issue-${issue.level}`"
        >
          <span class="issue-badge">
            <CircleAlert
              v-if="issue.level === 'error'"
              :size="16"
              aria-hidden="true"
            />
            <TriangleAlert v-else :size="16" aria-hidden="true" />
            {{ issue.level === 'error' ? '錯誤' : '提醒' }}
          </span>
          <span class="issue-body">
            <button
              v-if="locateText(issue)"
              type="button"
              class="link-button issue-locate"
              @click="emit('locate', issue)"
            >
              {{ locateText(issue)
              }}<span class="visually-hidden">（移至此處）</span></button
            >：{{ issue.message }}
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.issue-ok {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--pico-ins-color);
}

.issue-count small {
  color: var(--pico-muted-color);
}

.issue-list {
  padding-left: 0;
  list-style: none;
}

.issue-list li {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-left: 0.25rem solid var(--issue-color);
  margin-bottom: 0.375rem;
  list-style: none;
}

.issue-error {
  --issue-color: var(--pico-del-color);
}

.issue-warning {
  --issue-color: var(--pico-primary-focus);
}

/* 以文字（錯誤／提醒）與圖示區分等級，不單靠顏色（WCAG 1.4.1） */
.issue-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  font-weight: bold;
  font-size: 0.875rem;
  color: var(--pico-color);
}

.issue-badge svg {
  align-self: center;
}

.issue-error .issue-badge svg {
  color: var(--pico-del-color);
}

.issue-body {
  font-size: 0.9375rem;
}

/* 行內的定位按鈕：上下延伸點擊範圍至 44px，不影響行高（WCAG 2.5.5） */
.issue-locate {
  position: relative;
}

.issue-locate::after {
  content: '';
  position: absolute;
  inset: -0.75rem -0.25rem;
}
</style>
