<!-- app/components/NewTabHint.vue -->
<!--
  放在 target="_blank" 的連結文字後方，提示此連結會另開新分頁（WCAG 3.2.5）：
  畫面上顯示外部連結圖示，螢幕報讀軟體則讀出「（另開新分頁）」。
-->
<template>
  <span class="new-tab-hint">
    <ExternalLink :size="14" />
    <span class="visually-hidden">（另開新分頁）</span>
  </span>
</template>

<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
</script>

<style scoped>
.new-tab-hint {
  margin-inline-start: 0.25em;
  white-space: nowrap;
}

.new-tab-hint svg {
  vertical-align: -0.125em;
}
</style>
