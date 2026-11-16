// app/composables/useVisibleNavigation.ts
// 依 session 內的權限（由伺服器依白名單計算）過濾導覽選單，
// 隱藏使用者無權使用的項目；沒有任何可用項目的分類也一併隱藏。

import { siteNavigation } from '../../config/navigation'
import { hasPermission } from '../../shared/utils/permissions'

export const useVisibleNavigation = () => {
  const { user } = useUserSession()

  return computed(() =>
    siteNavigation
      .map((section) => ({
        ...section,
        children: section.children.filter(
          (item) =>
            !item.permission || hasPermission(user.value, item.permission)
        )
      }))
      .filter((section) => section.children.length > 0)
  )
}
