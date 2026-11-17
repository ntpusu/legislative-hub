<script setup lang="ts">
const config = useRuntimeConfig().public
const siteNavigation = useVisibleNavigation()

definePageMeta({
  layout: 'congress'
})
useHead({
  title: '首頁'
})
</script>

<template>
  <div>
    <h1 style="margin-bottom: 2rem">{{ config.shortName }} 功能導覽</h1>

    <div class="grid">
      <article v-for="section in siteNavigation" :key="section.name">
        <header>
          <h2
            style="
              font-size: 1.25rem;
              margin-bottom: 0;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            "
          >
            <component :is="section.icon" :size="24" />
            {{ section.name }}
          </h2>
        </header>

        <ul class="nav-list">
          <li v-for="item in section.children" :key="item.name">
            <NuxtLink :to="item.href" class="secondary">
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* 連結的點擊範圍高度 ≥ 44px（WCAG 2.5.5） */
.nav-list li {
  margin-bottom: 0;
}

.nav-list a {
  display: inline-block;
  padding-block: 0.625rem;
}
</style>
