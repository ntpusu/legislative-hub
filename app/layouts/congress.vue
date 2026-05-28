<script setup lang="ts">
import {
  Gavel,
  FileText,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown
} from 'lucide-vue-next'
import { siteNavigation } from '../../config/navigation'

const { user, clear } = useUserSession()
const config = useRuntimeConfig().public
const colorMode = useColorMode()
const router = useRouter()

const isMobileMenuOpen = ref(false)

// ----------------------------------------------------------------
// 登出確認 Dialog 狀態
// ----------------------------------------------------------------
const logoutDialogRef = ref<HTMLDialogElement | null>(null)

/** 點選登出按鈕：開啟確認彈窗 */
const openLogoutDialog = () => {
  logoutDialogRef.value?.showModal()
}

/** 彈窗：取消登出 */
const cancelLogout = () => {
  logoutDialogRef.value?.close()
}

/** 彈窗：確認登出 */
const confirmLogout = async () => {
  logoutDialogRef.value?.close()
  await clear() // 清除 session
  showToast('您已經登出')
  await router.push('/login')
}

// ----------------------------------------------------------------
// Toast 通知（共用：登出成功 + 無權限警告）
// ----------------------------------------------------------------

// 與 auth.global.ts 共享同一個 useState key
const toastMessage = useState<string | null>('toast-message', () => null)
const toastVisible = ref(false)
const toastTimer = ref<ReturnType<typeof setTimeout> | null>(null)

/** 顯示一則 toast，3 秒後自動消失 */
const showToast = (message: string) => {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer.value) clearTimeout(toastTimer.value)
  toastTimer.value = setTimeout(() => {
    toastVisible.value = false
    toastMessage.value = null
  }, 3000)
}

// 當 middleware 在路由跳轉後設定了 toastMessage，這裡負責接收並顯示
watch(toastMessage, (msg) => {
  if (msg) showToast(msg)
})

// 元件卸載時清除 timer 避免記憶體洩漏
onUnmounted(() => {
  if (toastTimer.value) clearTimeout(toastTimer.value)
})

// ----------------------------------------------------------------

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="app-layout">
    <!-- ── Toast 通知 ─────────────────────────────────────── -->
    <Transition name="toast">
      <div
        v-if="toastVisible && toastMessage"
        class="toast-notification"
        role="alert"
        aria-live="assertive"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- ── 登出確認 Dialog ────────────────────────────────── -->
    <dialog ref="logoutDialogRef">
      <article>
        <header>
          <strong>確認登出</strong>
        </header>
        <p>您確定要登出系統嗎？</p>
        <footer>
          <button class="secondary outline" @click="cancelLogout">取消</button>
          <button @click="confirmLogout">
            <LogOut :size="14" class="mr-2" />
            是，登出
          </button>
        </footer>
      </article>
    </dialog>

    <!-- ── 手機版頂部 Header ───────────────────────────────── -->
    <header class="mobile-header container-fluid">
      <nav>
        <ul>
          <li>
            <button class="outline contrast" @click="isMobileMenuOpen = true">
              <Menu :size="20" />
            </button>
          </li>
          <li>
            <strong>{{ config.name }}</strong>
          </li>
        </ul>
      </nav>
    </header>

    <div class="layout-wrapper container-fluid">
      <aside :class="{ open: isMobileMenuOpen }" class="sidebar">
        <nav>
          <ul>
            <li class="sidebar-header">
              <div class="flex items-center justify-between w-full">
                <span class="font-bold text-xl">{{ config.shortName }}</span>
                <button
                  class="md:hidden outline secondary"
                  @click="isMobileMenuOpen = false"
                >
                  <X :size="16" />
                </button>
              </div>
            </li>

            <li v-if="user" class="user-info">
              <details class="dropdown">
                <summary class="secondary outline">
                  <User :size="16" class="inline mr-2" />
                  {{ user.shortName || '使用者簡稱未定義' }}
                </summary>
                <ul dir="rtl">
                  <li>
                    <!-- 改為呼叫 openLogoutDialog，不直接 clear -->
                    <a href="#" @click.prevent="openLogoutDialog">
                      <LogOut :size="14" class="mr-2" />
                      登出
                    </a>
                  </li>
                </ul>
              </details>
            </li>

            <hr />

            <li v-for="item in siteNavigation" :key="item.name">
              <details>
                <summary>
                  <component :is="item.icon" :size="18" class="inline mr-2" />
                  {{ item.name }}
                </summary>
                <ul>
                  <li v-for="sub in item.children" :key="sub.name">
                    <NuxtLink
                      :to="sub.href"
                      @click="isMobileMenuOpen = false"
                      >{{ sub.name }}</NuxtLink
                    >
                  </li>
                </ul>
              </details>
            </li>
          </ul>

          <ul class="sidebar-footer">
            <li>
              <button @click="toggleTheme" class="outline contrast w-full">
                <Sun v-if="colorMode.value === 'dark'" :size="18" />
                <Moon v-else :size="18" />
                <span class="ml-2">{{
                  colorMode.value === 'dark' ? '亮色模式' : '暗色模式'
                }}</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="content">
        <slot />

        <footer class="main-footer">
          <hr />
          <p>
            <small>
              © 2026 {{ config.copyright }}<br />
              <span class="text-xs opacity-70"
                >{{ config.name }} - 立法自動化．議事資訊化</span
              >
              <br />
              <span class="text-xs opacity-70">
                <a :href="`${config.repoUrl}`" target="_blank">Open Source</a>
              </span>
            </small>
          </p>
        </footer>
      </main>
    </div>
  </div>
</template>

<!-- 非 scoped 好讓 Pico 樣式全域生效 -->
<style>
@import '@/assets/css/main.css';
</style>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  padding-top: 0;
}

.sidebar {
  width: 280px;
  border-right: 1px solid var(--pico-muted-border-color);
  padding: 1rem;
  background: var(--pico-background-color);
  transition: transform 0.3s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
}

.content {
  flex: 1;
  padding: 2rem;
  min-width: 0;
}

.sidebar-header {
  padding-bottom: 1rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
}

.mobile-header {
  border-bottom: 1px solid var(--pico-muted-border-color);
  background: var(--pico-background-color);
}

/* ── 手機版頂部 Header：螢幕寬度 ≥ 992px 時隱藏 ──── */
.mobile-header {
  display: block;
}

@media (min-width: 992px) {
  .mobile-header {
    display: none;
  }
}

/* ── 側邊欄 RWD ─────────────────────────────────── */
@media (max-width: 991.98px) {
  .sidebar {
    position: fixed;
    left: 0;
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.1);
  }

  .content {
    padding: 1rem;
  }
}

.user-info summary {
  font-size: 0.9rem;
}

.main-footer {
  margin-top: 4rem;
  text-align: center;
}

/* ── Toast 通知樣式 ──────────────────────────────────── */
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: var(--pico-color);
  color: var(--pico-background-color);
  padding: 0.75rem 1.5rem;
  border-radius: var(--pico-border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  font-size: 0.95rem;
  white-space: nowrap;
  pointer-events: none;
}

/* Toast 進入/離開動畫 */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}
</style>
