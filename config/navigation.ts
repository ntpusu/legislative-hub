import { Gavel, FileText, Speech } from 'lucide-vue-next'
import type { Permission } from '../shared/utils/permissions'

// permission：進入該頁面所需的功能權限（與頁面 definePageMeta 的 permission 一致）。
// 未設定者，所有已登入的帳號都看得到。實際的權限判斷仍以頁面與 API 為準，
// 此處只用來隱藏使用者無權使用的選單項目。
interface NavigationItem {
  name: string
  href: string
  permission?: Permission
}

export const siteNavigation: {
  name: string
  icon: typeof Gavel
  children: NavigationItem[]
}[] = [
  {
    name: '自治法規系統',
    icon: Gavel,
    children: [
      {
        name: '同步自治法規',
        href: '/statutes/sync',
        permission: 'sync:statutes'
      },
      { name: '取得各式檔案', href: '/statutes' }
    ]
  },
  {
    name: '議事文件草擬',
    icon: FileText,
    children: [
      {
        name: '同步議案',
        href: '/drafting/sync-bills',
        permission: 'sync:bills'
      },
      {
        name: '同步委員會報告',
        href: '/drafting/sync-reports',
        permission: 'sync:committee-reports'
      },
      { name: '草擬議程', href: '/drafting/agenda', permission: 'drafting' },
      {
        name: '草擬會議紀錄',
        href: '/drafting/minutes',
        permission: 'drafting'
      }
    ]
  },
  {
    name: '參與校務',
    icon: Speech,
    children: [
      { name: '同步學代名冊', href: '/student-representatives' }
      // { name: "學權儀表板", href: "/participating/agenda-for-rights" },
    ]
  }
]
