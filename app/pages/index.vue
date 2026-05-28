<script setup lang="ts">
import { siteNavigation } from '../../config/navigation'
const config = useRuntimeConfig().public

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

        <ul>
          <li
            v-for="item in section.children"
            :key="item.name"
            style="margin-bottom: 0.5rem"
          >
            <NuxtLink :to="item.href" class="secondary">
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>
