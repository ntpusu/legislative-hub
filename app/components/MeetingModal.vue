<!-- components/MeetingModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="dialog">
      <dialog
        v-if="modelValue"
        ref="dialogRef"
        style="width: min(680px, calc(100vw - 2rem)); padding: 0"
        @click="closeOnBackdrop"
        @keydown.escape="closeModal"
      >
        <article style="margin: 0">
          <header
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <strong>{{ meeting.name }}</strong>
            <button
              aria-label="關閉"
              class="outline contrast"
              style="padding: 0.25rem 0.5rem"
              @click="closeModal"
            >
              ✕
            </button>
          </header>

          <!-- 基本資訊 -->
          <section style="margin-bottom: 1.5rem">
            <hgroup>
              <h5>基本資訊</h5>
              <p v-if="meeting.department">
                <strong>承辦單位：</strong>
                <a
                  v-if="meeting.departmentLink"
                  :href="meeting.departmentLink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ meeting.department }}
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
                  查看會議資料
                </a>
                <span v-else style="color: var(--pico-muted-color)"
                  >非公開</span
                >
              </p>
            </hgroup>
          </section>

          <!-- 推派方式 -->
          <section v-if="hasNominationInfo" style="margin-bottom: 1.5rem">
            <hgroup>
              <h5>推派方式</h5>
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
            </hgroup>
          </section>

          <!-- 學生代表名冊 -->
          <section style="margin-bottom: 1.5rem">
            <hgroup>
              <h5>學生代表</h5>
            </hgroup>
            <div
              v-if="meeting.assignedReps.length > 0"
              style="overflow-x: auto"
            >
              <table role="grid">
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
            <hgroup>
              <h6>備註</h6>
              <p style="white-space: pre-wrap">
                {{ meeting.note }}
              </p>
            </hgroup>
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
      dialogRef.value?.showModal()
    } else {
      dialogRef.value?.close()
    }
  }
)

watch(dialogRef, (el) => {
  if (el) {
    if (props.modelValue) {
      el.showModal()
    }
    el.addEventListener('close', closeModal)
    onUnmounted(() => el.removeEventListener('close', closeModal))
  }
})
</script>

<style scoped>
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
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
