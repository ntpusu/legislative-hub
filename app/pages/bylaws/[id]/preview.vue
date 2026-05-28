<script setup lang="ts">
import { useRegulation } from '~/composables/useRegulation'

// 1. 宣告介面 (Interface)，明確告訴 TypeScript 這包資料有哪些欄位
interface RegulationData {
  titleFull: string
  titleShort?: string
  status?: string
  modifiedType?: string
  modifiedDate?: string
  fullText: string
  history?: string[]
}

definePageMeta({
  layout: 'congress'
})

const route = useRoute()
const id = route.params.id as string

// 2. 呼叫 composable，先將拿到的資料暫名為 rawData
const { data: rawData, pending, error } = await useRegulation(id)

// 3. 建立一個具備強型別的 computed 變數 regulation
// 透過 "as RegulationData" 告訴 TypeScript：「相信我，它就是長這個樣子」
const regulation = computed(() => rawData.value as RegulationData | null)

useHead({
  title: () =>
    regulation.value ? `${regulation.value.titleShort}` : '載入中...'
})
</script>

<template>
  <main>
    <article v-if="pending" aria-busy="true">載入中...</article>

    <article v-else-if="error">
      <header>
        <strong>讀取失敗</strong>
      </header>
      <p>有問題請將以下錯誤訊息回報給會網維護小組：</p>
      <pre><code>{{ error.message }}</code></pre>
    </article>

    <article v-else-if="regulation">
      <header>
        <hgroup>
          <h1>{{ regulation.titleFull }}</h1>
          <p>
            {{ regulation.modifiedType }}日期：{{ regulation.modifiedDate }}
            <ins v-if="regulation.status === 'abandoned'">(廢止)</ins>
          </p>
        </hgroup>
      </header>

      <section>
        <div v-html="regulation.fullText"></div>
      </section>

      <footer>
        <details open>
          <summary>法規沿革</summary>
          <ol>
            <li
              v-for="(item, index) in regulation.history"
              :key="index"
              v-html="item"
            ></li>
          </ol>
        </details>
      </footer>
    </article>
  </main>
</template>

<style scoped>
/* 確保法規內容在 Pico CSS 下有正確的間距 */
section {
  margin-top: 2rem;
}

ins {
  color: var(--pico-del-color);
  text-decoration: none;
  font-weight: bold;
  margin-left: 0.5rem;
}
</style>
