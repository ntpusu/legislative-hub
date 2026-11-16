// shared/types/auth.d.ts
// 置於 shared/types 下，Nuxt 才會同時將其納入 app 與 server 的型別檢查
import type { Permission } from '../utils/permissions'
import type { Role } from '../../server/utils/whitelist'

/** 寫入 session cookie 的欄位：只存身分識別所需的最小資訊 */
interface StoredUser {
  email: string
  googleName: string
}

/**
 * 由 server/plugins/identity.ts 於取得 session 時依白名單計算後附上的欄位，
 * 不寫入 cookie。前端只讀不寫。
 */
interface ResolvedUser {
  shortName?: string
  roles?: Role[]
  permissions?: Permission[]
  isAdmin?: boolean
}

declare module '#auth-utils' {
  interface User extends StoredUser, ResolvedUser {}

  interface UserSession {
    // 如果有額外的 session 欄位，可以在此擴充
  }
}

declare module 'nuxt-auth-utils' {
  interface User extends StoredUser, ResolvedUser {}
}

// 頁面以 definePageMeta({ permission: '...' }) 宣告自己屬於哪項功能，
// 由 app/middleware/auth.global.ts 依 session 內的權限判斷能否進入
declare module '#app' {
  interface PageMeta {
    permission?: Permission
  }
}

export {}
