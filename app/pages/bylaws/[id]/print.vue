<template>
  <div class="print-page-wrapper">
    <!-- 1. 讀取與錯誤狀態處理 -->
    <div v-if="pending" class="loading-state">
      <p>正在準備列印文件...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h3>無法讀取法規</h3>
      <p>{{ error.message }}</p>
    </div>

    <!-- 2. 資料載入成功後顯示內容 -->
    <div v-else-if="regulation">
      <div class="print-header">
        <p class="print-timestamp">{{ printTimestamp }}</p>
        <button @click="doPrint" class="print-button">列印本頁</button>
      </div>

      <h1 class="regulation-title-print">
        {{ regulation.titleFull }}
        <span v-if="regulation.status === 'abandoned'" style="color: red"
          >(廢止)</span
        >
      </h1>

      <p class="regulation-date-print">
        {{ regulation.modifiedDate
        }}{{ regulation.modifiedType }}版本<br /><span
          style="font-size: smaller"
          >（完整修正歷程詳條文末）</span
        >
      </p>

      <div v-if="regulation.fullText" v-html="regulation.fullText"></div>

      <hr class="history-separator" />
      <p class="history-title">沿革</p>
      <ol>
        <li
          v-for="(item, index) in regulation.history"
          :key="index"
          v-html="item"
        ></li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegulation, type RegulationData } from '~/composables/useRegulation'

definePageMeta({
  layout: 'minimal'
})

const route = useRoute()
const id = route.params.id as string // 強制轉型 string 避免型別錯誤
const printTimestamp = ref('')

// --- 改用 Composable (支援 SSR) ---
const { data: rawData, pending, error } = await useRegulation(id)
const regulation = computed(() => rawData.value as RegulationData | null)

// 用於觸發瀏覽器列印 (僅在 Client 端執行)
function doPrint() {
  window.print()
}

onMounted(() => {
  // 只有在瀏覽器端才計算當下時間
  const now = new Date()
  const y = now.getFullYear()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const h = now.getHours().toString().padStart(2, '0')
  const min = now.getMinutes().toString().padStart(2, '0')
  printTimestamp.value = `臺北大學學生議會法規系統 ${y}/${m}/${d} ${h}:${min} 列印`
})

useHead({
  // 使用 computed getter 確保 title 隨資料更新
  title: () =>
    regulation.value
      ? `列印「${regulation.value.titleShort}」 - 臺北大學學生議會法規系統`
      : '載入中 - 臺北大學學生議會法規系統'
})
</script>

<style scoped>
/* * * ===================================
 * 一般列印設定
 * ===================================
 */
@page {
  size: A4;
  margin: 2cm; /* 或是依當屆學生自治會需求調整，例如 1.5cm */
}

.print-page-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box; /* 確保 padding 不會撐開總寬度 */

  font-family: 'Times New Roman', '標楷體', 'DFKai-SB', serif;
  font-size: 12pt;
  line-height: 16pt;

  /* ↓↓↓ 強制長字串斷行 ↓↓↓ */
  word-break: break-word;
  overflow-wrap: break-word;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
  font-family: sans-serif;
}
.error-state {
  color: red;
}

/* 標題 */
.history-title,
:deep(div.zhangJie),
:deep(p.law-division),
:deep(p.law-chapter),
:deep(p.law-section),
:deep(p.law-hxiang),
:deep(p.law-hsubsection),
:deep(p.law-hitem) {
  font-size: 14pt;
  line-height: 20pt;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 1em;
}

/* "沿革" 前的分隔線 */
.history-separator {
  margin-top: 2em; /* 讓分隔線與法規內文有足夠間距 */
  border: none;
  border-top: 1px solid #000; /* 一條細黑線 */
}

/* --- 網頁頂部說明 --- */
.print-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 10pt;
  line-height: normal;
}

.print-timestamp {
  font-size: 9pt;
  color: #555;
  margin: 0;
}

.print-button {
  padding: 5px 10px;
  font-size: 9pt;
  cursor: pointer;
}

.regulation-title-print {
  text-align: center;
  font-weight: bold;
  font-size: 16pt;
  margin-top: 1rem;
  margin-bottom: 0.2rem;
  line-height: 25pt;
}

/* 需求 3: 日期置右 */
.regulation-date-print {
  text-align: right;
  margin-top: 1rem;
  margin-bottom: 2rem;
  font-size: 11pt;
}

/* --- 覆蓋線上法規資料庫的樣式，採用正式排版 --- */

:deep(p.xiang:not(:only-of-type)::before) {
  display: none;
  content: none;
}

/* 需求 1: 條號不與內文間有額外間距 */
:deep(p.law-art-num) {
  font-weight: bold;
  page-break-after: avoid;
  margin-bottom: 0; /* 移除條號下方的間距 */
}

/* 需求 1 (續): 緊接在條號後的第一項，移除頂端間距 */
:deep(p.law-art-num + p.xiang) {
  margin-top: 0;
}

/* 項(xiang)不冠數字，空兩格書寫" */
:deep(p.xiang) {
  margin-left: 0; /* 覆蓋法規資料庫之樣式 */
  text-indent: 2em; /* 第一行縮排 2em */
  margin-top: 5px;
  margin-bottom: 5px;
}

/* 款左方空三字元（比項次再多一字元，以清楚辨識），且凸排兩字元 */
:deep(p.kuan) {
  margin-left: 5em;
  text-indent: -2em;
  margin-top: 5px;
  margin-bottom: 5px;
}

:deep(p.mu) {
  margin-left: 7em;
  text-indent: -3em;
  margin-top: 5px;
  margin-bottom: 5px;
}

@media print {
  /* 隱藏不需要的 UI */
  .print-header,
  .print-button,
  .loading-state,
  .error-state {
    display: none !important;
  }

  /* 容器自適應紙張 */
  .print-page-wrapper {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* 針對 v-html 內容：只打破死板寬度與長字串，絕對不影響空白與間距 */
  :deep(.print-page-wrapper *) {
    max-width: 100% !important;
    word-break: break-all !important;
    overflow-wrap: break-word !important;
  }

  /* 強制保留原本設定的「緊湊間距」，避免被其他樣式覆蓋 */
  :deep(p.law-art-num) {
    page-break-after: avoid;
    margin-bottom: 0 !important;
  }

  :deep(p.law-art-num + p.xiang) {
    margin-top: 0 !important;
  }

  /* 避免段落跨頁被切斷 */
  :deep(p) {
    page-break-inside: avoid;
  }
}
</style>
