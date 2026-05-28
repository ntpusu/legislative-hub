<!-- app/pages/drafting/sync-bills.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'congress' })
useHead({
  title: '同步議案'
})
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMsg = ref('')

async function trigger() {
  status.value = 'loading'
  errorMsg.value = ''
  try {
    await $fetch('/api/trigger/bills', { method: 'POST' })
    status.value = 'success'
  } catch (e: any) {
    status.value = 'error'
    errorMsg.value = e?.data?.message ?? '未知錯誤'
  }
}

const config = useRuntimeConfig()
const { repo, workflowNameBills } = config.public.legiDataSource
</script>

<template>
  <main>
    <h1>議案同步</h1>
    <p>前次同步時間：【功能待補】。</p>
    <p>
      系統每日凌晨2時30分，從 Google Sheets 同步到 LegiHub (這裡)
      一次。如果秘書處剛維護議案資料、需要立刻使用，請點選下方按鈕以手動同步。
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
        :href="`https://github.com/${repo}/actions/workflows/${workflowNameBills}`"
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
