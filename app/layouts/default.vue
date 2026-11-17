<!-- app/layouts/default.vue -->
<template>
  <div>
    <header class="container">
      <nav>
        <ul>
          <li>
            <NuxtLink to="/" class="contrast">
              <strong>{{ config.shortName }}</strong>
            </NuxtLink>
          </li>
        </ul>
        <ul>
          <li>
            <!-- 主題偏好只有客戶端知道，於客戶端渲染以避免 hydration mismatch -->
            <ClientOnly>
              <button
                class="outline contrast"
                aria-label="切換亮色或暗色背景"
                @click="toggleMode"
              >
                <Sun v-if="colorMode.value === 'dark'" :size="20" />
                <Moon v-else :size="20" />
              </button>
            </ClientOnly>
          </li>
        </ul>
      </nav>
    </header>

    <main class="container">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'

const config = useRuntimeConfig().public

// 亮暗色模式的邏輯
const colorMode = useColorMode()

// 檢查目前的「實際」狀態：
// 如果是 'dark'，就強制切換到 'light'，反之亦然。
function toggleMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<!-- 非 scoped 好讓 Blades 樣式全域生效 -->
<style>
@import '@/assets/css/main.css';
</style>
