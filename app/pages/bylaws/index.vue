<script setup lang="ts">
import { generateAndDownloadDocx } from '../../../utils/bylawsAmendTableGenerator'
import { copyHtmlSourceToClipboard } from '../../../utils/bylawsHtmlGenerator'

definePageMeta({
  layout: 'congress'
})

useHead({
  title: '法規系統'
})

// -- 狀態管理 --
const selectedFilters = ref(['common', 'sanxia', 'taipei'])
const isModalOpen = ref(false)
const currentLaw = ref<{ id: string; title: string } | null>(null)

// 載入狀態防護
const isGeneratingDocx = ref(false)
const isCopyingHtml = ref(false)

// -- 取得、處理資料 --

// 1. 定義明確的 Tuple 型別，告訴 TypeScript 陣列裡裝的是 [ID, 標題]
type LawTuple = [string | number, string]

// 2. 為 useFetch 加上泛型 <LawTuple[]>
const { data: lawListResponse } = await useFetch<LawTuple[]>(
  '/api/regulation/list'
)
const lawList = computed(() => lawListResponse.value || [])

const categories = [
  { prefix: '1', title: '三峽學生會', filterKey: 'sanxia' },
  { prefix: '2', title: '三峽議會', filterKey: 'sanxia' },
  { prefix: '3', title: '學生法院', filterKey: 'common' },
  { prefix: '4', title: '臺北學生會', filterKey: 'taipei' },
  { prefix: '5', title: '臺北議會', filterKey: 'taipei' },
  { prefix: '6', title: '總會', filterKey: 'common' }
]

// 將法規分配到各個區塊
const categorizedLaws = computed(() => {
  // 3. 確保分類後的資料，裡面存的絕對是純字串的 [string, string][]
  const groups: Record<string, [string, string][]> = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': []
  }

  lawList.value.forEach((item) => {
    // 加上簡單防呆，確保 item 真的存在
    if (!item) return

    const [id, title] = item

    // 使用 String(id) 強制轉型
    const idStr = String(id)
    const titleStr = String(title)
    const prefix = idStr.charAt(0)

    if (groups[prefix]) {
      // 存進去的時候，確保它們已經是乾淨的 string
      groups[prefix].push([idStr, titleStr])
    }
  })

  return groups
})

// -- 互動邏輯 --
const openModal = (id: string, title: string) => {
  currentLaw.value = { id, title }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  setTimeout(() => {
    currentLaw.value = null
  }, 300)
}

const shouldShowCategory = (filterKey: string) =>
  selectedFilters.value.includes(filterKey)
const hasData = (prefix: string) =>
  categorizedLaws.value[prefix] && categorizedLaws.value[prefix].length > 0

// -- 整合獨立 Utils 的按鈕行為 --
const handleDownloadDocx = async () => {
  if (!currentLaw.value) return
  isGeneratingDocx.value = true
  try {
    const response: any = await $fetch(
      `/api/regulation/single/${currentLaw.value.id}`
    )

    // 印出 API 原始回傳內容供除錯參考
    console.log('DOCX - API 原始回傳內容:', response)

    // 嘗試自動解開常見的 API JSON 包裝 (例如 { data: { titleFull: "..." } })
    const regData =
      response.data || response.regulation || response.body || response

    // 防呆：確認解包後的資料真的有需要的欄位
    if (!regData || !regData.titleFull) {
      throw new Error(
        'API 資料結構不符預期，找不到 titleFull 欄位。請開啟 F12 主控台確認實際資料格式'
      )
    }

    await generateAndDownloadDocx(regData)
  } catch (err: any) {
    console.error('產生 Word 文件失敗細節:', err)
    alert(
      `產生文件失敗：${err.message || '未知錯誤'}。詳細資訊請按 F12 查看主控台。`
    )
  } finally {
    isGeneratingDocx.value = false
  }
}

const handleCopyHtml = async () => {
  if (!currentLaw.value) return
  isCopyingHtml.value = true
  try {
    const response: any = await $fetch(
      `/api/regulation/single/${currentLaw.value.id}`
    )

    console.log('HTML - API 原始回傳內容:', response)

    const regData =
      response.data || response.regulation || response.body || response

    if (!regData || !regData.titleFull) {
      throw new Error(
        'API 資料結構不符預期，找不到 titleFull 欄位。請開啟 F12 主控台確認實際資料格式'
      )
    }

    await copyHtmlSourceToClipboard(regData)
  } catch (err: any) {
    console.error('複製 HTML 失敗細節:', err)
    alert(
      `獲取原始碼失敗：${err.message || '未知錯誤'}。詳細資訊請按 F12 查看主控台。`
    )
  } finally {
    isCopyingHtml.value = false
  }
}
</script>

<template>
  <main>
    <header>
      <hgroup>
        <h1>法規系統</h1>
        <p>
          以下依照主管部門列出法規。點擊法規名稱後，可以進一步操作（列印公告版、下載空白對照表
          Word 檔等）。
        </p>
      </hgroup>
    </header>

    <section>
      <fieldset>
        <legend>請勾選要顯示哪些法規：</legend>
        <div class="filter-group">
          <label>
            <input type="checkbox" value="common" v-model="selectedFilters" />
            共通法規
          </label>
          <label>
            <input type="checkbox" value="sanxia" v-model="selectedFilters" />
            三峽校區
          </label>
          <label>
            <input type="checkbox" value="taipei" v-model="selectedFilters" />
            臺北校區
          </label>
        </div>
      </fieldset>
    </section>

    <div class="cards-container">
      <template v-for="cat in categories" :key="cat.prefix">
        <article v-if="shouldShowCategory(cat.filterKey)">
          <header>
            <h2>[{{ cat.prefix }}] {{ cat.title }}</h2>
          </header>

          <ul v-if="hasData(cat.prefix)">
            <li v-for="[id, title] in categorizedLaws[cat.prefix]" :key="id">
              <a href="#" @click.prevent="openModal(id.toString(), title)">
                {{ id.toString().padStart(4, '0') }} - {{ title }}
              </a>
            </li>
          </ul>

          <p v-else><small>此類別尚無資料</small></p>
        </article>
      </template>
    </div>

    <dialog :open="isModalOpen">
      <article>
        <header>
          <button aria-label="Close" rel="prev" @click="closeModal"></button>
          <p>
            <strong>{{ currentLaw?.title }}</strong>
          </p>
        </header>

        <p>法規編號：{{ currentLaw?.id.toString().padStart(4, '0') }}</p>

        <div class="grid">
          <NuxtLink
            :to="`/bylaws/${currentLaw?.id}/print`"
            target="_blank"
            role="button"
            class="outline"
          >
            列印法規
          </NuxtLink>
          <button
            @click="handleDownloadDocx"
            :aria-busy="isGeneratingDocx"
            class="outline"
          >
            {{ isGeneratingDocx ? '處理中...' : '下載空白修正對照表' }}
          </button>
        </div>

        <hr />

        <div class="grid">
          <NuxtLink
            :to="`/bylaws/${currentLaw?.id}/preview`"
            target="_blank"
            role="button"
            class="secondary outline"
          >
            網頁預覽
          </NuxtLink>
          <button
            @click="handleCopyHtml"
            :aria-busy="isCopyingHtml"
            class="secondary outline"
          >
            {{ isCopyingHtml ? '處理中...' : '複製 HTML 原始碼' }}
          </button>
        </div>

        <footer>注意：立法文件請小心保管，注意使用。</footer>
      </article>
    </dialog>
  </main>
</template>

<style scoped>
/* 將篩選器選項改為橫向彈性排列，並修正 label 的點擊範圍與間距 */
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
  cursor: pointer;
}

/* 使用 auto-fill 設定最小寬度 320px，讓卡片在寬度不足時自動換行，不會變得太窄 */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--pico-spacing, 1.5rem);
}
</style>
