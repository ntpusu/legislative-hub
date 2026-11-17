<script setup lang="ts">
import { useStatute, type StatuteData } from '~/composables/useStatute'

definePageMeta({
  layout: 'congress'
})

const route = useRoute()
const id = route.params.id as string
const paddedId = id.padStart(4, '0')

const { data: rawData, pending, error } = await useStatute(id)

const statute = computed(() => rawData.value as StatuteData | null)

useHead({
  title: () => (statute.value ? `${statute.value.titleShort}` : '載入中...')
})
</script>

<template>
  <div>
    <article v-if="pending" aria-busy="true">載入中...</article>

    <article v-else-if="error">
      <header>
        <strong>讀取失敗</strong>
      </header>
      <p>有問題請將以下錯誤訊息回報給會網維護小組：</p>
      <pre><code>{{ error.message }}</code></pre>
    </article>

    <article v-else-if="statute">
      <header>
        <hgroup>
          <h1>{{ statute.titleFull }}</h1>
          <p>
            法規代碼 {{ paddedId }}｜{{ statute.modifiedType }}日期：{{
              statute.modifiedDate
            }}
            <strong v-if="statute.status === 'abandoned'" class="abandoned"
              >(廢止)</strong
            >
          </p>
        </hgroup>
      </header>

      <section>
        <div v-html="statute.fullText"></div>
      </section>

      <footer>
        <details open>
          <summary>法規沿革</summary>
          <ol>
            <li
              v-for="(item, index) in statute.history"
              :key="index"
              v-html="item"
            ></li>
          </ol>
        </details>
      </footer>
    </article>

    <RpageCopyPanel v-if="statute" :view="statute" :statute-id="paddedId" />
  </div>
</template>

<style scoped>
/* 法規內容與標頭之間的間距 */
section {
  margin-top: 2rem;
}

.abandoned {
  color: var(--pico-del-color);
  margin-left: 0.5rem;
}
</style>
