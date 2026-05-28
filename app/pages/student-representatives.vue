<!-- app/pages/student-representatives.vue -->
<template>
  <main>
    <header>
      <hgroup>
        <h1>同步學生代表名冊</h1>
        <p>
          最近一次同步時間：{{
            data?.lastUpdated ? formatDate(data.lastUpdated) : '載入中...'
          }}
        </p>
      </hgroup>
    </header>

    <article>
      <h3 style="font-size: 1.5rem">手動同步</h3>
      <p>
        系統每天早上6點會從 Google Sheets 同步到 LegiHub (這裡)
        一次。如果您剛更新試算表、需要立即對外展示，也可點選下方按鈕，手動同步。
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
          :href="`https://github.com/${repo}/actions/workflows/${workflowNameReps}`"
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
    </article>

    <section style="margin-top: 3em">
      <hgroup>
        <h3>預覽學生代表名冊</h3>
        <p>以下呈現的內容與對外網站相同。</p>
      </hgroup>
    </section>

    <!-- 載入狀態 -->
    <article v-if="loading" style="text-align: center">
      <progress indeterminate></progress>
      <p>正在載入資料...</p>
    </article>

    <!-- 錯誤狀態 -->
    <article v-else-if="error" style="border-color: var(--pico-del-color)">
      <header style="color: var(--pico-del-color); font-weight: bold">
        載入資料時發生錯誤，請稍後再試。
      </header>
    </article>

    <!-- 正常載入 -->
    <template v-else>
      <article v-if="getMeetingsWithReps.length === 0">
        目前尚無會議資料
      </article>

      <div
        class="grid"
        v-else
        style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        "
      >
        <article v-for="meeting in getMeetingsWithReps" :key="meeting.id">
          <header>
            <strong>{{ meeting.name }}</strong>
          </header>
          <p>
            <span v-if="meeting.totalSeats">
              法定可推派 {{ meeting.totalSeats }} 席
            </span>

            <br v-if="meeting.totalSeats" />
            <span
              v-if="
                meeting.assignedReps.length > 0 &&
                meeting.assignedReps.length === Number(meeting.totalSeats)
              "
              style="color: var(--pico-ins-color)"
            >
              已有 {{ meeting.assignedReps.length }} 席資料
            </span>
            <span
              v-else-if="meeting.assignedReps.length > 0"
              style="color: var(--pico-del-color)"
            >
              僅有 {{ meeting.assignedReps.length }} 席資料
            </span>
            <span
              v-else-if="meeting.assignedReps.length === 0"
              style="color: var(--pico-del-color)"
            >
              未推派代表
            </span>
            <span
              v-else-if="!meeting.assignedReps.length"
              style="color: var(--pico-del-color)"
            >
              無推派資料
            </span>
          </p>
          <button
            class="outline secondary"
            @click="openModal(meeting)"
            @keypress.enter="openModal(meeting)"
            @keypress.space.prevent="openModal(meeting)"
          >
            查看
          </button>
        </article>
      </div>
    </template>

    <!-- 會議詳情彈窗 -->
    <MeetingModal
      v-if="selectedMeeting"
      v-model="showModal"
      :meeting="selectedMeeting"
    />
  </main>
</template>

<script setup lang="ts">
import type { MeetingWithReps } from '~/composables/useStudentRepresentatives'

definePageMeta({
  layout: 'congress'
})

useHead({
  title: '學生代表名冊',
  meta: [
    {
      name: 'description',
      content: '國立臺北大學學生自治會推派至各項校務會議的學生代表名冊'
    }
  ]
})

const config = useRuntimeConfig()
const { repo, workflowNameReps } = config.public.legiDataSource

const { data, loading, error, fetchData, getMeetingsWithReps } =
  useStudentRepresentatives()

const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMsg = ref('')

async function trigger() {
  status.value = 'loading'
  errorMsg.value = ''
  try {
    await $fetch('/api/trigger/representatives', { method: 'POST' })
    status.value = 'success'
  } catch (e: any) {
    status.value = 'error'
    errorMsg.value = e?.data?.message ?? '未知錯誤'
  }
}

const showModal = ref(false)
const selectedMeeting = ref<MeetingWithReps | null>(null)

const openModal = (meeting: MeetingWithReps) => {
  selectedMeeting.value = meeting
  showModal.value = true
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei'
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.meeting-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.meeting-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.meeting-card:focus {
  outline: 2px solid var(--pico-primary);
  outline-offset: 2px;
}

.meeting-card:active {
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .meeting-card {
    transition: none;
  }

  .meeting-card:hover {
    transform: none;
  }
}
</style>
