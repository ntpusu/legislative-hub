<!-- app/pages/bylaws/sync.vue -->
<script setup lang="ts">
const config = useRuntimeConfig()
const { repo, workflowNameBylaws } = config.public.legiDataSource
definePageMeta({ layout: 'congress' })

useHead({
  title: '同步法規'
})

const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMsg = ref('')

async function trigger() {
  status.value = 'loading'
  errorMsg.value = ''
  try {
    await $fetch('/api/trigger/bylaws', { method: 'POST' })
    status.value = 'success'
  } catch (e: any) {
    status.value = 'error'
    errorMsg.value = e?.data?.message ?? '未知錯誤'
  }
}
</script>

<template>
  <main>
    <h1>法規同步</h1>
    <p>前次同步時間（簡稱清單更新時間）：【功能待補】。</p>
    <p>
      系統每日凌晨2時，從 Google Drive 同步到 LegiHub (這裡)
      一次，如果您剛上傳檔案、需要立刻使用，請點選下方按鈕以手動同步。
    </p>

    <button
      :disabled="status === 'loading'"
      :aria-busy="status === 'loading'"
      @click="trigger"
    >
      {{ status === 'loading' ? '同步中…' : '立即同步' }}
    </button>

    <p v-if="status === 'success'">
      ✅ 已成功觸發，工作流正在執行中（成功觸發不代表 workflow
      已執行完畢，甚至未必執行成功，執行情形請到
      <a
        :href="`https://github.com/${repo}/actions/workflows/${workflowNameBylaws}`"
        target="_blank"
        >GitHub Actions</a
      >
      頁面查看）。
    </p>
    <p v-if="status === 'error'">
      ❌ 執行工作流發生錯誤，請將下列訊息回報給會網維護小組：<br />{{
        errorMsg
      }}
    </p>
  </main>
</template>
