// composables/useStudentRepresentatives.ts
export interface Representative {
  id: string
  name: string
  group: string
  title: string
  department: string
  note: string
}

export interface Meeting {
  id: string
  name: string
  link: string
  department: string
  departmentLink: string
  totalSeats: string
  regulationArticle: string
  seatDistribution: string
  sanxiaRegulation: string
  sanxiaMethod: string
  taipeiRegulation: string
  taipeiMethod: string
  otherMethod: string
  note: string
}

export interface Assignment {
  id: string
  meetingName: string
  representativeName: string
}

export interface StudentRepresentativesData {
  meetings: Meeting[]
  representatives: Representative[]
  assignments: Assignment[]
  lastUpdated: string
}

export interface MeetingWithReps extends Meeting {
  assignedReps: Representative[]
}

export const useStudentRepresentatives = () => {
  const data = ref<StudentRepresentativesData | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  const { repo, branch, repsDataPath } =
    useRuntimeConfig().public.legiDataSource
  const repsUrl = `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${repsDataPath}`

  const fetchData = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch<StudentRepresentativesData>(repsUrl)
      data.value = response
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch student representatives data:', e)
    } finally {
      loading.value = false
    }
  }

  const getMeetingsWithReps = computed((): MeetingWithReps[] => {
    if (!data.value) return []

    return data.value.meetings.map((meeting) => {
      const assignedReps = data
        .value!.assignments.filter((a) => a.meetingName === meeting.name)
        .map((a) => {
          const rep = data.value!.representatives.find(
            (r) => r.name === a.representativeName
          )
          return rep
        })
        .filter((rep): rep is Representative => rep !== undefined)

      return {
        ...meeting,
        assignedReps
      }
    })
  })

  return {
    data,
    loading,
    error,
    fetchData,
    getMeetingsWithReps
  }
}
