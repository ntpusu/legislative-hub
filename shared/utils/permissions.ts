// shared/utils/permissions.ts
// 本檔只定義「有哪些功能權限」，供前後端共用型別。
// 哪些角色可以使用哪些功能，僅定義於 server/utils/whitelist.ts；
// 前端只能讀取伺服器依白名單計算後放進 session 的結果，不得自行判斷。

export const PERMISSIONS = [
  'sync:statutes', // 手動同步自治法規
  'sync:representatives' // 手動同步學生代表名冊
] as const

export type Permission = (typeof PERMISSIONS)[number]

/** 檢查使用者是否具有某項功能權限（使用者物件來自 session） */
export const hasPermission = (
  user: { permissions?: readonly string[] } | null | undefined,
  permission: Permission
): boolean => Boolean(user?.permissions?.includes(permission))
