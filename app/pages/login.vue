<script setup lang="ts">
import { ShieldCheck, AlertTriangle } from 'lucide-vue-next'
const config = useRuntimeConfig().public

definePageMeta({
  layout: 'congress'
})
useHead({
  title: '登入'
})

const isLoggingIn = ref(false)

const handleGoogleLogin = () => {
  isLoggingIn.value = true
  // 延遲一下讓使用者看到 loading 效果再跳轉
  setTimeout(() => {
    window.location.href = '/api/auth/google'
  }, 500)
}
</script>

<template>
  <main class="container">
    <div class="login-card-wrapper">
      <article>
        <header>
          <div class="icon-container">
            <ShieldCheck :size="64" />
          </div>
          <hgroup>
            <h1>自治機關登入</h1>
            <p>{{ config.name }} 僅限國立臺北大學學生自治會各機關使用</p>
          </hgroup>
        </header>

        <form @submit.prevent="handleGoogleLogin">
          <p>請使用貴機關官方信箱（Google 帳號）進行身份驗證。</p>

          <button type="submit" :aria-busy="isLoggingIn" class="contrast">
            <template v-if="!isLoggingIn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 48 48"
                style="vertical-align: middle; margin-right: 8px"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              使用 Google 帳號登入
            </template>
            <template v-else>正在前往 Google 驗證...</template>
          </button>
        </form>

        <footer>
          <div class="warning-box">
            <AlertTriangle :size="20" />
            <small>
              1. 非授權帳號將無法通過驗證。若官方信箱有異動，請聯絡網管小組。<br />2.
              <mark>議事文件草擬</mark
              >系統僅限「學生議會（三峽校區）」登入使用，其他機關點選後將被直接導回首頁。
            </small>
          </div>
        </footer>
      </article>
    </div>
  </main>
</template>

<style scoped>
.login-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
}

article {
  width: 100%;
  max-width: 480px;
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: var(--pico-spacing);
  color: var(--pico-primary);
}

.warning-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
}

hgroup p {
  font-size: 0.9rem;
}

button.contrast {
  width: 100%;
}
</style>
