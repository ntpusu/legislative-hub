# 帳號、角色與權限

GovCloud 以 Google 帳號登入，可登入的帳號、各帳號的角色、各項功能開放給哪些角色，**只定義於 [`server/utils/whitelist.ts`](../server/utils/whitelist.ts)**。前端不另外維護白名單，只讀取伺服器計算後放進 session 的結果。

## 名詞

- **帳號**：准許登入的 Google 帳號，附有單位簡稱（`shortName`）與一或多個角色。單位簡稱會顯示在側欄，也會註記在 legislative-data 的同步紀錄中。
- **角色**：例如 `sx-congress`（學生議會（三峽校區））、`court`（學生法院）、`secretariat`（總會秘書處）。這些是學生自治會下的各機關，與系統本身的組織名稱（定義於 [`config/site.config.ts`](../config/site.config.ts) 的 `orgName`）不同。
- **功能權限**：例如 `drafting`（議事文件草擬）、`sync:bills`（手動同步議案）。功能清單定義於 [`shared/utils/permissions.ts`](../shared/utils/permissions.ts)，該檔只列出有哪些功能，不寫哪些角色可以用。

## 常見維護作業

| 要做的事 | 修改位置 |
| --- | --- |
| 新增、移除可登入的帳號，或調整帳號的角色 | `whitelist.ts` 的 `ACCOUNTS` |
| 調整某項功能開放給哪些角色 | `whitelist.ts` 的 `PERMISSION_ROLES` |
| 新增一項功能權限 | `permissions.ts` 的 `PERMISSIONS`，再於 `PERMISSION_ROLES` 指定角色 |
| 讓頁面只限特定功能權限進入 | 頁面的 `definePageMeta({ permission: '...' })` |
| 讓 API 只限特定功能權限使用 | API 內呼叫 `requirePermission(event, '...')` |

## 管理員

管理員具有所有功能權限，即使不在白名單中也能登入。為避免公開管理員的 email，管理員**不寫在 `whitelist.ts`**，而是以環境變數 `NUXT_ADMINS` 設定（部署於 Cloudflare Pages 時，於專案設定的環境變數中填寫）：

```
NUXT_ADMINS=[{"email":"admin1@example.com","nickname":"阿珍"},{"email":"admin2@example.com","nickname":"小明"}]
```

- 格式為 JSON 陣列，每筆需有 `email` 與 `nickname`。格式錯誤時，系統一律視為沒有管理員，並於 log 記錄錯誤（不記錄 email）。
- 管理員的單位簡稱顯示為「管理員（暱稱）」。觸發同步時，legislative-data 的同步紀錄會註記「由「管理員（阿珍）」透過「NTPUSU Governance Cloud」的 API 觸發」。**暱稱會出現在公開的 commit 紀錄中，email 則不會。**
- 修改環境變數後，需重新部署才會生效。

## 運作方式

1. 使用者以 Google 帳號登入。`server/api/auth/google.get.ts` 確認信箱已經 Google 驗證、且在白名單中，session cookie 只寫入 email 與 Google 名稱。
2. 每次取得 session（SSR 首次載入頁面、前端重新取得 session）時，`server/plugins/identity.ts` 依白名單重新計算單位簡稱、角色與權限並附上，但不寫回 cookie。帳號被移出白名單時，session 會被清除，視同登出。
3. 前端的 `app/middleware/auth.global.ts` 比對頁面宣告的 `permission` 與 session 中的權限；沒有權限則導回首頁並顯示提示。
4. API 端點不採信 session 內的權限欄位，而是以 session 中的 email 重新查詢白名單（`server/utils/access.ts`），因此白名單調整後立即生效。
