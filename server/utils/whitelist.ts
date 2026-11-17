// server/utils/whitelist.ts
// 帳號、角色與功能權限的唯一定義處。
// - 新增或移除可登入的帳號、調整帳號的角色：修改 ACCOUNTS。
// - 調整某項功能開放給哪些角色：修改 PERMISSION_ROLES。
// - 管理員帳號不寫在本檔，而是以環境變數 NUXT_ADMINS 設定（避免公開管理員的 email）。
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
  'sync:statutes': ALL_ROLES,
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

/** 以環境變數 NUXT_ADMINS 設定的管理員 */
export interface AdminEntry {
  email: string
  /** 顯示於介面、並註記於 legislative-data 同步紀錄的暱稱 */
  nickname: string
}

/**
 * 解析 NUXT_ADMINS 的設定值。
 * 格式為 JSON 陣列：[{"email":"a@example.com","nickname":"阿珍"}]。
 * Nuxt 會自動將 JSON 字串轉為陣列，但仍保留字串的處理以防萬一。
 * 設定有誤時一律視為沒有管理員（fail closed），並於 log 記錄，但不記錄 email。
 */
export function parseAdmins(raw: unknown): AdminEntry[] {
  let value = raw

  if (typeof value === 'string') {
    if (!value.trim()) return []
    try {
      value = JSON.parse(value)
    } catch {
      console.error(
        '[whitelist] NUXT_ADMINS 不是有效的 JSON，已忽略所有管理員設定。'
      )
      return []
    }
  }

  if (value == null) return []
  if (!Array.isArray(value)) {
    console.error(
      '[whitelist] NUXT_ADMINS 應為 JSON 陣列，已忽略所有管理員設定。'
    )
    return []
  }

  const admins: AdminEntry[] = []
  value.forEach((item, index) => {
    const email =
      typeof item?.email === 'string' ? normalizeEmail(item.email) : ''
    const nickname =
      typeof item?.nickname === 'string' ? item.nickname.trim() : ''

    if (!email.includes('@') || !nickname) {
      console.error(
        `[whitelist] NUXT_ADMINS 第 ${index + 1} 筆缺少 email 或 nickname，已略過。`
      )
      return
    }
    admins.push({ email, nickname })
  })
  return admins
}

/**
 * 依 email 計算使用者身分；既非白名單帳號、亦非管理員則回傳 null。
 * 管理員具有所有功能權限，單位簡稱顯示為「管理員（暱稱）」。
 */
export function resolveIdentity(
  email: string,
  admins: readonly AdminEntry[] = []
): Identity | null {
  const normalized = normalizeEmail(email)
  const account = ACCOUNTS.find((item) => item.email === normalized)
  const admin = admins.find((item) => item.email === normalized)

  if (admin) {
    return {
      shortName: `管理員（${admin.nickname}）`,
      roles: account ? [...account.roles] : [],
      permissions: [...PERMISSIONS],
      isAdmin: true
    }
  }

  if (!account) return null

  return {
    shortName: account.shortName,
    roles: [...account.roles],
    permissions: permissionsOf(account.roles),
    isAdmin: false
  }
}
