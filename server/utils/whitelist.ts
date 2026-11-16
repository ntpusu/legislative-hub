// server/utils/whitelist.ts
// 帳號、角色與功能權限的唯一定義處。
// - 新增或移除可登入的帳號、調整帳號的角色：修改 ACCOUNTS。
// - 調整某項功能開放給哪些角色：修改 PERMISSION_ROLES。
// 前端只能讀取依本檔計算後放進 session 的結果，不得另行定義白名單。
// 詳細說明見 docs/access-control.md。

import { PERMISSIONS, type Permission } from '~~/shared/utils/permissions'

const ROLE_IDS = [
  'sx-union', // 學生會（三峽校區）
  'sx-congress', // 學生議會（三峽校區）
  'tp-union', // 學生會（臺北校區）
  'tp-congress', // 學生議會（臺北校區）
  'court', // 學生法院
  'secretariat', // 總會秘書處
  'webmaster' // 網管小組
] as const

export type Role = (typeof ROLE_IDS)[number]

interface Account {
  email: string
  /** 顯示於介面、並註記於 legislative-data 同步紀錄的單位簡稱 */
  shortName: string
  roles: readonly Role[]
}

// 在此列出所有准許登入的帳號（email 一律小寫）
const ACCOUNTS: readonly Account[] = [
  {
    email: 'ntpusu@gm.ntpu.edu.tw',
    shortName: '學生會(三峽)',
    roles: ['sx-union']
  },
  {
    email: 'ntpuscs@gmail.com',
    shortName: '學生議會(三峽)',
    roles: ['sx-congress']
  },
  { email: 'ntpucourt@gmail.com', shortName: '學生法院', roles: ['court'] },
  {
    email: 'ntpustudents2@gm.ntpu.edu.tw',
    shortName: '學生會(臺北)',
    roles: ['tp-union']
  },
  {
    email: 'ntpussct@gmail.com',
    shortName: '學生議會(臺北)',
    roles: ['tp-congress']
  },
  {
    email: 'ntpush92613815@gmail.com',
    shortName: '秘書處(總會)',
    roles: ['secretariat']
  },
  {
    email: 'ntpusuwebsite@gmail.com',
    shortName: '網管帳號',
    roles: ['webmaster']
  }
]

const ALL_ROLES: readonly Role[] = ROLE_IDS

// 各項功能開放給哪些角色使用
const PERMISSION_ROLES: Record<Permission, readonly Role[]> = {
  drafting: ['sx-congress'],
  'sync:bills': ['sx-congress'],
  'sync:committee-reports': ['sx-congress'],
  'sync:bylaws': ALL_ROLES,
  'sync:representatives': ALL_ROLES
}

/** 伺服器依白名單計算出的使用者身分 */
export interface Identity {
  shortName: string
  roles: Role[]
  permissions: Permission[]
  isAdmin: boolean
}

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase()

const permissionsOf = (roles: readonly Role[]): Permission[] =>
  PERMISSIONS.filter((permission) =>
    PERMISSION_ROLES[permission].some((role) => roles.includes(role))
  )

/**
 * 依 email 計算使用者身分；不在白名單中則回傳 null。
 */
export function resolveIdentity(email: string): Identity | null {
  const normalized = normalizeEmail(email)
  const account = ACCOUNTS.find((item) => item.email === normalized)
  if (!account) return null

  return {
    shortName: account.shortName,
    roles: [...account.roles],
    permissions: permissionsOf(account.roles),
    isAdmin: false
  }
}
