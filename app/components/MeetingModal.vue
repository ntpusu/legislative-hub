<!-- components/MeetingModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="dialog">
      <dialog
        v-if="modelValue"
        ref="dialogRef"
        aria-labelledby="meeting-dialog-title"
        @click="closeOnBackdrop"
        @close="closeModal"
      >
        <article>
          <header>
            <button aria-label="關閉" rel="prev" @click="closeModal"></button>
            <h2 id="meeting-dialog-title" class="dialog-title">
              {{ meeting.name }}
            </h2>
          </header>

          <!-- 基本資訊 -->
          <section>
            <h3 class="section-title">基本資訊</h3>
            <p v-if="meeting.department">
              <strong>承辦單位：</strong>
              <a
                v-if="meeting.departmentLink"
                :href="meeting.departmentLink"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ meeting.department }}<NewTabHint />
              </a>
              <span v-else>{{ meeting.department }}</span>
            </p>
            <p v-if="meeting.totalSeats">
              <strong>本會法定可推派席次：</strong>
              {{ meeting.totalSeats }}
            </p>
            <p v-if="meeting.link">
              <strong>會議資料：</strong>
              <a
                v-if="meeting.link !== 'non-public'"
                :href="meeting.link"
                target="_blank"
                rel="noopener noreferrer"
              >
                查看會議資料<NewTabHint />
              </a>
              <span v-else style="color: var(--pico-muted-color)">非公開</span>
            </p>
          </section>

          <!-- 推派方式 -->
          <section v-if="hasNominationInfo">
            <h3 class="section-title">推派方式</h3>
            <p v-if="meeting.regulationArticle">
              <strong>依據：</strong>本會學代推派辦法{{
                meeting.regulationArticle
              }}
            </p>
            <p v-if="meeting.seatDistribution">
              <strong>席次分配：</strong>{{ meeting.seatDistribution }}
            </p>
            <div
              v-if="meeting.sanxiaRegulation || meeting.sanxiaMethod"
              style="margin-bottom: 0.5rem"
            >
              <strong>三峽校區：</strong>
              <div style="margin-left: 1rem">
                <div v-if="meeting.sanxiaRegulation">
                  依據：三峽學代推派條例{{ meeting.sanxiaRegulation }}
                </div>
                <div v-if="meeting.sanxiaMethod">
                  推派方式：{{ meeting.sanxiaMethod }}
                </div>
              </div>
            </div>
            <div
              v-if="meeting.taipeiRegulation || meeting.taipeiMethod"
              style="margin-bottom: 0.5rem"
            >
              <strong>臺北校區：</strong>
              <div style="margin-left: 1rem">
                <div v-if="meeting.taipeiRegulation">
                  依據：臺北學代推派條例{{ meeting.taipeiRegulation }}
                </div>
                <div v-if="meeting.taipeiMethod">
                  推派方式：{{ meeting.taipeiMethod }}
                </div>
              </div>
            </div>
            <p v-if="meeting.otherMethod">
              <strong>其他推派方式：</strong>{{ meeting.otherMethod }}
            </p>
          </section>

          <!-- 學生代表名冊 -->
          <section>
            <h3 class="section-title">學生代表</h3>
            <div v-if="meeting.assignedReps.length > 0" class="overflow-auto">
              <table class="striped">
                <thead>
                  <tr>
                    <th scope="col">姓名</th>
                    <th scope="col">職稱</th>
                    <th scope="col">系級</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rep in meeting.assignedReps" :key="rep.id">
                    <td>{{ rep.name }}</td>
                    <td>{{ rep.title || '-' }}</td>
                    <td>{{ rep.department || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else style="color: var(--pico-muted-color)">
              目前尚無學生代表資料
            </p>
          </section>

          <!-- 備註 -->
          <section v-if="meeting.note">
            <h3 class="section-title">備註</h3>
            <p style="white-space: pre-wrap">{{ meeting.note }}</p>
          </section>

          <footer>
            <button class="secondary" @click="closeModal">關閉</button>
          </footer>
        </article>
      </dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MeetingWithReps } from '~/composables/useStudentRepresentatives'

const props = defineProps<{
  modelValue: boolean
  meeting: MeetingWithReps
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
// 開啟彈窗前的焦點元素（通常是「查看」按鈕），關閉後將焦點還原
let lastFocused: HTMLElement | null = null

const hasNominationInfo = computed(() => {
  return !!(
    props.meeting.regulationArticle ||
    props.meeting.seatDistribution ||
    props.meeting.sanxiaRegulation ||
    props.meeting.sanxiaMethod ||
    props.meeting.taipeiRegulation ||
    props.meeting.taipeiMethod ||
    props.meeting.otherMethod
  )
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const closeOnBackdrop = (e: MouseEvent) => {
  if (e.target === dialogRef.value) {
    closeModal()
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      lastFocused = document.activeElement as HTMLElement | null
      dialogRef.value?.showModal()
    } else {
      dialogRef.value?.close()
      // dialog 隨 v-if 移除後，瀏覽器無法自行還原焦點，需手動處理
      nextTick(() => lastFocused?.focus())
    }
  }
)

// dialog 透過 v-if 掛載後才取得元素，此時再以 showModal() 開啟
watch(dialogRef, (el) => {
  if (el && props.modelValue) {
    lastFocused ??= document.activeElement as HTMLElement | null
    el.showModal()
  }
})
</script>

<style scoped>
/* Blades 的 <dialog> 本身即為全螢幕遮罩，不另外設定 ::backdrop，以免疊加兩層背景 */
dialog::backdrop {
  background: transparent;
}

/* 區塊標題：語意上為 h3，字級維持原本 h5 的大小 */
.section-title {
  font-size: 1.125rem;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
