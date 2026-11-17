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

const { user, clear } = useUserSession()
const siteNavigation = useVisibleNavigation()
const config = useRuntimeConfig().public
const colorMode = useColorMode()
const router = useRouter()
const currentYear = new Date().getFullYear()

const route = useRoute()

// ----------------------------------------------------------------
// 行動版側欄（螢幕寬度 < 992px 時為抽屜式）
// ----------------------------------------------------------------
const isMobileMenuOpen = ref(false)
const menuButtonRef = ref<HTMLButtonElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)

/** 開啟側欄，並將焦點移到側欄內的關閉按鈕 */
const openMobileMenu = async () => {
  isMobileMenuOpen.value = true
  await nextTick()
  closeButtonRef.value?.focus()
}

/**
 * 關閉側欄。預設將焦點還給選單按鈕；
 * 若是點選連結換頁而關閉，焦點交由換頁處理，不必還原。
 */
const closeMobileMenu = async (restoreFocus = true) => {
  if (!isMobileMenuOpen.value) return
  isMobileMenuOpen.value = false
  if (!restoreFocus) return
  // 須等 DOM 更新、頁首解除 inert 後才能聚焦
  await nextTick()
  menuButtonRef.value?.focus()
}

// 視窗放大到桌面版寬度時，抽屜狀態已無意義，一併關閉以解除 inert
let desktopQuery: MediaQueryList | null = null
const onDesktopQueryChange = (e: MediaQueryListEvent) => {
  if (e.matches) closeMobileMenu(false)
}
onMounted(() => {
  desktopQuery = window.matchMedia('(min-width: 992px)')
  desktopQuery.addEventListener('change', onDesktopQueryChange)
})
onUnmounted(() => {
  desktopQuery?.removeEventListener('change', onDesktopQueryChange)
})

/** 側欄中包含目前頁面的分類預設展開，讓使用者知道自己位於何處（WCAG 2.4.8） */
const isCurrentSection = (item: { children: { href: string }[] }) =>
  item.children.some((sub) => sub.href === route.path)

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

/**
 * 顯示一則 toast。
 * 不設定自動消失：限時顯示的訊息可能來不及閱讀（WCAG 2.2.1、2.2.3），
 * 改由使用者自行關閉。
 */
const showToast = (message: string) => {
  toastMessage.value = message
  toastVisible.value = true
}

/** 關閉 toast */
const dismissToast = () => {
  toastVisible.value = false
  toastMessage.value = null
}

// 當 middleware 在路由跳轉後設定了 toastMessage，這裡負責接收並顯示
watch(toastMessage, (msg) => {
  if (msg) showToast(msg)
})

// 直接開啟無權限的網址時，訊息是在伺服器端設定並帶到客戶端，
// 不會觸發上面的 watch，因此掛載時再檢查一次
onMounted(() => {
  if (toastMessage.value) showToast(toastMessage.value)
})

// ----------------------------------------------------------------

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="app-layout">
    <a class="skip-link" href="#main-content">跳至主要內容</a>

    <!-- ── Toast 通知 ─────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toastVisible && toastMessage" class="toast-notification">
        <!-- 只有訊息本身放在 alert 內，避免螢幕報讀軟體連同按鈕名稱一起朗讀 -->
        <p role="alert">{{ toastMessage }}</p>
        <button class="toast-close" aria-label="關閉通知" @click="dismissToast">
          <X :size="18" />
        </button>
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
            <span class="icon-text">
              <LogOut :size="14" />
              是，登出
            </span>
          </button>
        </footer>
      </article>
    </dialog>

    <!-- ── 手機版頂部 Header ───────────────────────────────── -->
    <header class="mobile-header container-fluid" :inert="isMobileMenuOpen">
      <div class="mobile-bar">
        <button
          ref="menuButtonRef"
          class="outline contrast"
          aria-label="開啟選單"
          aria-controls="site-sidebar"
          :aria-expanded="isMobileMenuOpen"
          @click="openMobileMenu"
        >
          <Menu :size="20" />
        </button>
        <strong>{{ config.name }}</strong>
      </div>
    </header>

    <div class="layout-wrapper container-fluid">
      <!-- 側欄開啟時的半透明遮罩，點選即關閉（僅行動版顯示） -->
      <div
        v-if="isMobileMenuOpen"
        class="sidebar-backdrop"
        aria-hidden="true"
        @click="closeMobileMenu()"
      ></div>

      <aside
        id="site-sidebar"
        :class="{ open: isMobileMenuOpen }"
        class="sidebar"
        @keydown.esc="closeMobileMenu()"
      >
        <nav aria-label="主選單">
          <ul>
            <li class="sidebar-header">
              <div class="sidebar-title">
                <strong class="sidebar-brand">{{ config.shortName }}</strong>
                <button
                  ref="closeButtonRef"
                  class="sidebar-close outline secondary"
                  aria-label="關閉選單"
                  @click="closeMobileMenu()"
                >
                  <X :size="16" />
                </button>
              </div>
            </li>

            <li v-if="user" class="user-info">
              <details class="dropdown">
                <summary class="secondary outline">
                  <span class="icon-text">
                    <User :size="16" />
                    {{ user.shortName || '使用者簡稱未定義' }}
                  </span>
                </summary>
                <ul>
                  <li>
                    <!-- 改為呼叫 openLogoutDialog，不直接 clear -->
                    <a href="#" @click.prevent="openLogoutDialog">
                      <span class="icon-text">
                        <LogOut :size="14" />
                        登出
                      </span>
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>

          <hr />

          <ul>
            <li v-for="item in siteNavigation" :key="item.name">
              <details :open="isCurrentSection(item)">
                <summary>
                  <span class="icon-text">
                    <component :is="item.icon" :size="18" />
                    {{ item.name }}
                  </span>
                </summary>
                <ul>
                  <li v-for="sub in item.children" :key="sub.name">
                    <NuxtLink :to="sub.href" @click="closeMobileMenu(false)">{{
                      sub.name
                    }}</NuxtLink>
                  </li>
                </ul>
              </details>
            </li>
          </ul>

          <ul class="sidebar-footer">
            <li>
              <!--
                伺服器端無法得知使用者的主題偏好，colorMode.value 一律為 fallback 值，
                若直接渲染會與客戶端結果不一致（hydration mismatch），故改於客戶端渲染。
                fallback 為等高的隱形佔位，避免載入後版面跳動。
              -->
              <ClientOnly>
                <button
                  @click="toggleTheme"
                  class="theme-toggle outline contrast"
                >
                  <span class="icon-text">
                    <Sun v-if="colorMode.value === 'dark'" :size="18" />
                    <Moon v-else :size="18" />
                    {{ colorMode.value === 'dark' ? '亮色模式' : '暗色模式' }}
                  </span>
                </button>
                <template #fallback>
                  <button
                    class="theme-toggle outline contrast"
                    style="visibility: hidden"
                    tabindex="-1"
                    aria-hidden="true"
                  >
                    &nbsp;
                  </button>
                </template>
              </ClientOnly>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 側欄開啟時，背後的內容不可操作，避免焦點落在被遮住的元素上 -->
      <div class="content" :inert="isMobileMenuOpen">
        <main id="main-content" tabindex="-1">
          <slot />
        </main>

        <footer class="main-footer">
          <hr />
          <p>
            <small>
              © {{ currentYear }} {{ config.copyright }}<br />
              <span class="footer-meta"
                >{{ config.name }} - {{ config.tagline }}</span
              >
              <br />
              <span class="footer-meta">
                <a :href="`${config.repoUrl}`" target="_blank">Open Source</a>
              </span>
            </small>
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<!-- 非 scoped 好讓 Blades 樣式全域生效 -->
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

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sidebar-brand {
  font-size: 1.25rem;
}

/* 圖示與文字並排 */
.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle {
  width: 100%;
}

.footer-meta {
  font-size: 0.75rem;
  color: var(--pico-muted-color);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
}

.mobile-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-block: 0.5rem;
}

/* 略過導覽連結的目標：程式化聚焦時不需要外框 */
#main-content:focus {
  outline: none;
}

/* 目前頁面除了顏色外再以粗體標示，不單靠顏色傳達資訊（WCAG 1.4.1） */
.sidebar a[aria-current='page'] {
  font-weight: bold;
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
  .mobile-header,
  .sidebar-close {
    display: none;
  }
}

/* ── 側邊欄 RWD ─────────────────────────────────── */
@media (max-width: 991.98px) {
  /*
   * 關閉時除了移出畫面，也設為 visibility: hidden，
   * 讓鍵盤與螢幕報讀軟體無法進入看不見的側欄；
   * visibility 延後到移出動畫結束後才切換。
   */
  .sidebar {
    position: fixed;
    left: 0;
    transform: translateX(-100%);
    visibility: hidden;
    transition:
      transform 0.3s ease,
      visibility 0s linear 0.3s;
  }

  .sidebar.open {
    transform: translateX(0);
    visibility: visible;
    transition:
      transform 0.3s ease,
      visibility 0s;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.1);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: var(--pico-modal-overlay-background-color);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* 窄螢幕時可換行，不超出畫面（WCAG 1.4.10） */
  width: max-content;
  max-width: calc(100vw - 2rem);
  background: var(--pico-color);
  color: var(--pico-background-color);
  padding: 0.25rem 0.25rem 0.25rem 1.5rem;
  border-radius: var(--pico-border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  font-size: 0.95rem;
}

/* Blades 會對 <p> 直接設定文字色，需改回繼承 toast 的反白配色 */
.toast-notification p {
  margin: 0;
  color: inherit;
}

/* 關閉按鈕：44px 見方（WCAG 2.5.5），沿用 toast 的反白配色 */
.toast-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
}

.toast-close:focus-visible {
  outline: 2px solid var(--pico-background-color);
  outline-offset: -4px;
  box-shadow: none;
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
