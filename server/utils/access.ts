// server/utils/access.ts
// API 端點的身分與權限檢查。
// 一律以 session 中的 email 重新查詢白名單，不採信 session 內的權限欄位，
// 如此帳號被移出白名單或角色調整後，API 會立即生效，不必等待 session 過期。

import type { H3Event } from 'h3'
import type { Permission } from '~~/shared/utils/permissions'
import {
  parseAdmins,
  resolveIdentity,
  type AdminEntry,
  type Identity
} from './whitelist'

/**
 * 取得以環境變數 NUXT_ADMINS 設定的管理員。
 * 須帶入 event，Cloudflare 執行期注入的環境變數才會套用到 runtimeConfig。
 */
export function getAdmins(event: H3Event): AdminEntry[] {
  return parseAdmins(useRuntimeConfig(event).admins)
}

/** 要求已登入且仍在白名單中，回傳使用者身分 */
export async function requireIdentity(event: H3Event): Promise<Identity> {
  const { user } = await requireUserSession(event)
  const identity = resolveIdentity(user.email, getAdmins(event))

  if (!identity) {
    throw createError({
      statusCode: 403,
      message: '您的帳號未經授權，如有疑問請洽網管小組。'
    })
  }
  return identity
}

/** 檢查身分是否具有指定功能權限，否則拋出 403 */
export function assertPermission(
  identity: Identity,
  permission: Permission
): void {
  if (!identity.permissions.includes(permission)) {
    throw createError({
      statusCode: 403,
      message: '您的帳號沒有使用此功能的權限。'
    })
  }
}

/** 要求已登入且具有指定功能權限，回傳使用者身分 */
export async function requirePermission(
  event: H3Event,
  permission: Permission
): Promise<Identity> {
  const identity = await requireIdentity(event)
  assertPermission(identity, permission)
  return identity
}
