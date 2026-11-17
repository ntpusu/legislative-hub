<!-- app/components/RpageCopyPanel.vue -->
<!-- 依會網（RPage）「編輯資訊」頁面的欄位，逐一列出要貼上的值，並提供複製按鈕 -->
<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import type { StatuteView } from '~~/shared/utils/statuteSource'
import {
  buildRpageFields,
  todayIso,
  type RpageField
} from '~~/shared/utils/rpage'

const props = defineProps<{
  view: StatuteView | null
  /** 四碼法規代碼，用於判讀負責單位 */
  statuteId: string
  /** 有值時停用複製按鈕，並顯示原因（例如資料有錯誤） */
  blockedReason?: string
}>()

// 「今天」只在瀏覽器取得，避免伺服器與瀏覽器的渲染結果不一致
const today = ref('')
onMounted(() => {
  today.value = todayIso()
})

const fields = computed(() =>
  props.view ? buildRpageFields(props.view, props.statuteId, today.value) : []
)

const copiedKey = ref<RpageField['key'] | null>(null)
const statusMessage = ref('')
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copy(field: RpageField) {
  if (!field.value || props.blockedReason) return
  try {
    await navigator.clipboard.writeText(field.value)
    copiedKey.value = field.key
    statusMessage.value = `已複製「${field.label}」，請到 RPage 對應欄位貼上。`
    // 按鈕上的「已複製」只是視覺回饋，完整訊息保留在下方的狀態列
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copiedKey.value = null), 2500)
  } catch {
    // 瀏覽器不允許寫入剪貼簿時，改為選取內容讓使用者自行複製
    const el = document.getElementById(`rpage-${field.key}`) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    el?.focus()
    el?.select()
    statusMessage.value = `無法自動複製「${field.label}」，已選取內容，請按 Ctrl+C 複製。`
  }
}

onUnmounted(() => clearTimeout(resetTimer))
</script>

<template>
  <section class="rpage-panel" aria-labelledby="rpage-panel-title">
    <h2 id="rpage-panel-title">貼到 RPage 會網</h2>
    <p>
      登入 RPage
      後台，開啟這部法規的「編輯資訊」頁面（新法規請先新增一則資訊），依下列欄位逐一複製、貼上。
    </p>

    <p v-if="blockedReason" class="rpage-blocked">
      <strong>暫時不能複製：</strong>{{ blockedReason }}
    </p>

    <p v-if="!view">尚無可複製的資料。</p>

    <ol v-else class="rpage-fields">
      <li v-for="field in fields" :key="field.key" class="rpage-field">
        <label :for="`rpage-${field.key}`" class="rpage-label">
          {{ field.label }}
        </label>
        <div class="rpage-control">
          <textarea
            v-if="field.multiline"
            :id="`rpage-${field.key}`"
            :value="field.value"
            :aria-describedby="`rpage-${field.key}-hint`"
            class="rpage-code"
            rows="8"
            readonly
            spellcheck="false"
          ></textarea>
          <input
            v-else
            :id="`rpage-${field.key}`"
            :value="field.value"
            :aria-describedby="`rpage-${field.key}-hint`"
            :placeholder="field.value ? undefined : '（無資料）'"
            type="text"
            readonly
          />
          <button
            type="button"
            class="outline rpage-copy"
            :disabled="!field.value || Boolean(blockedReason)"
            @click="copy(field)"
          >
            <Check
              v-if="copiedKey === field.key"
              :size="16"
              aria-hidden="true"
            />
            <Copy v-else :size="16" aria-hidden="true" />
            {{ copiedKey === field.key ? '已複製' : '複製'
            }}<span class="visually-hidden">「{{ field.label }}」</span>
          </button>
        </div>
        <small :id="`rpage-${field.key}-hint`">{{ field.hint }}</small>
      </li>
    </ol>

    <!-- 複製結果以 live region 通知螢幕報讀軟體（WCAG 4.1.3） -->
    <p role="status" class="rpage-status">{{ statusMessage }}</p>
  </section>
</template>

<style scoped>
.rpage-fields {
  counter-reset: rpage-step;
  list-style: none;
  padding-left: 0;
}

.rpage-field {
  counter-increment: rpage-step;
  margin-bottom: var(--pico-spacing);
}

/* 以序號標示貼上的順序 */
.rpage-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
}

.rpage-label::before {
  content: counter(rpage-step);
  display: inline-grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--pico-primary-background);
  color: var(--pico-primary-inverse);
  font-size: 0.875rem;
}

.rpage-control {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.rpage-control :is(input, textarea) {
  flex: 1;
  margin-bottom: 0;
}

.rpage-code {
  font-family: var(--pico-font-family-monospace);
  font-size: 0.8125rem;
  resize: vertical;
}

.rpage-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  width: auto;
  min-height: 2.75rem; /* 點擊範圍 ≥ 44px（WCAG 2.5.5） */
  margin-bottom: 0;
}

.rpage-field small {
  display: block;
  margin-top: 0.25rem;
  color: var(--pico-muted-color);
}

.rpage-blocked {
  padding: 0.75rem 1rem;
  border-left: 0.25rem solid var(--pico-del-color);
  background: var(--pico-card-sectioning-background-color);
}

/* 空白時不佔版面，但仍保留在無障礙樹中，之後填入的訊息才會被朗讀 */
.rpage-status:empty {
  margin: 0;
}

@media (max-width: 575.98px) {
  .rpage-control {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
