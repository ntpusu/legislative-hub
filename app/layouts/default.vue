<!-- app/layouts/default.vue -->
<template>
  <div
    class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <header class="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div>
            <NuxtLink
              to="/"
              class="text-xl font-bold text-gray-800 dark:text-gray-100 no-underline"
            >
              NTPU 學生自治雲
            </NuxtLink>
          </div>

          <div class="flex-shrink-0">
            <button
              @click="toggleMode"
              class="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              aria-label="切換亮色或暗色背景"
            >
              <template v-if="colorMode.value === 'dark'">
                <Icon name="heroicons:sun-20-solid" class="w-6 h-6" />
              </template>
              <template v-else>
                <Icon name="heroicons:moon-20-solid" class="w-6 h-6" />
              </template>
            </button>
          </div>
        </div>
      </nav>
    </header>

    <main class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
// 亮暗色模式的邏輯
const colorMode = useColorMode()

// 允許在 'system', 'light', 'dark' 之間循環
function toggleMode() {
  // 檢查目前的 "實際" 狀態
  // 如果是 'dark'，就強制切換到 'light'，反之亦然。
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<style>
@tailwind base;

/* 再次明確移除 body 的邊界 */
body {
  margin: 0;
}
</style>
