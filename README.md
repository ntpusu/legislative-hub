# NTPUSU Governance Cloud

## 專案介紹

NTPUSU Governance Cloud (GovCloud) 是[臺北大學學生自治會](https://github.com/ntpusu)內部用來維護法規等公開資料的專案。

## 使用說明

自治法規的維護流程、原始檔格式、線上法規排版，以及如何貼到會網（RPage），請完全參閱 [docs/statutes-maintenance.md](docs/statutes-maintenance.md)。

其他文件：

- [帳號、角色與權限](docs/access-control.md)
- [自治法規 API](docs/api/statutes.md)

> 系統名稱、組織名稱與相關文案集中定義於 [`config/site.config.ts`](config/site.config.ts)，程式與文件中一律引用之，避免日後更名時需要四處修改。
>
> 當前以 **statutes** 指涉自治法規，包含本會組織章程與自治法令兩種類型（組織章程第 61 條參照）。因此程式、路徑與 API 一律使用 `statutes`，不再使用 `regulation`／`bylaw` 等同義詞。

## 🗂️ 未來規劃

* [ ] 加入法規之歷史版本功能

本專案仍在發展，歡迎有興趣的同學參與開發、測試與討論：

* 透過 issue 提出建議與問題
* 編寫元件、樣式或改善法規格式轉換功能

亦歡迎各學生自治組織參考。

## 版本沿革

v1.0：112 學年度會網開始建置、113 學年度正式上線以來，法規的詮釋資料 (metadata) 與全文內容分開維護，前者完全使用會網，後者則需要使用我們的[第 1 版工具](https://github.com/ntpusu/ntpusu-regulation-typesetting)處理。

v2.0：113 學年度第 2 學期，工作團隊開始嘗試統合二者。

v2.1：使用 Nuxt 3 撰寫並提供原始碼複製。

v2.2：因應資訊人員量能不足，將各單位維護功能改為使用 Google Drive ，系統則自動同步。加上列印功能、作為子網頁嵌入功能，完善複製原始碼功能。

v2.3：使得會網可透過 API 介接，與本系統同步。

v3.0：本系統加入身分驗證功能，完全內部化；全面改用 Pico CSS 樣式框架。

v3.1：資料之儲存、維護，獨立建置 [NTPU Legislative Database](https://github.com/ntpusu/legislative-data) 儲存庫，本專案僅負責前後端邏輯。

v3.2：加入了手動觸發資料更新工作流的功能。

v4.0.0：配合三峽校區學生議會啟用[三代議事服務系統](https://github.com/ntpuscs/Parliamentspage)，本專案更名「NTPUSU Governance Cloud（GovCloud）」並移去該會議案、委員會報告之同步觸發功能，服務範圍集中於學生自治會共用之內容。

v4.0.1: 因 Pico CSS 樣式停止更新，改用 [blades](https://github.com/anyblades/blades) 替代。

v4.1.0：會網改用 RPage CMS，移除 WordPress 與 Sync Plugin 相關說明，改為依 RPage 欄位複製上架資料；整併[第 1 版工具](https://github.com/ntpusu/ntpusu-regulation-typesetting)為「線上法規排版」子系統，該工具停止維護。
