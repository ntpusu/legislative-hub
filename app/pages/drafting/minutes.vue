<template>
  <article>
    <header>
      <h2 style="margin-bottom: 0">草擬會議紀錄</h2>
    </header>
    <p>新版會議紀錄草擬系統尚在開發中。</p>
    <p>在系統整合完成之前，請先透過現行專案進行會議紀錄之草擬：</p>
    <footer>
      <a
        href="https://sxcongress.ntpusu.org/secretariat"
        target="_blank"
        role="button"
        class="secondary"
        >前往現行草擬系統</a
      >
    </footer>
  </article>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'congress' })
useHead({
  title: '草擬會議紀錄'
})
</script>
