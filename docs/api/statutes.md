# 自治法規系統 API 文件

> **statutes** 為自治法規之英譯，包含本會組織章程與自治法令（組織章程第 61 條參照）。本專案原本使用的 `regulation`／`bylaw` 已在路徑與程式碼中統一為 `statutes`；本專案不對外提供 API，此變動不影響任何外部使用者。

## statutes/list

路徑： `https://cloud.ntpusu.org/api/statutes/list` ，無請求參數

回應格式：法規清單 array，各元素為一個 array 代表法規，第一個子元素是法規代碼（四碼正整數），第二個子元素是法規簡稱（含有非 ASCII 字元的字串），例如

```json
[
  [1101, "三峽校區學生會組織法"],
  [1102, "三峽校區學生代表推派條例"],
  [6001, "組織章程"],
  [6003, "自治資訊公開法"],
]
```

依本會暫定法規編號格式，代碼第一碼代表主管機關，API 不回傳主管機關資訊，請自行依以下邏輯判讀：

- `1`：三峽校區學生會
- `2`：三峽校區學生議會
- `3`：學生法院
- `4`：臺北校區
- `5`：臺北校區
- `6`：總會

## statutes/single/:id

呼叫範例： `https://cloud.ntpusu.org/api/statutes/single/6001`

回傳範例：

```json
{
  "titleFull": "國立臺北大學學生自治會組織章程",
  "titleShort": "組織章程",
  "modifiedType": "修正",
  "modifiedDate": "2024年1月12日",
  "modifiedDateIso": "2024-01-12",
  "status": "active",
  "history": [
    "111年5月23日三峽校區學生議會第22屆下學期第4次臨時會通過、5月25日臺北校區學生議會第5屆下學期第5次臨時會通過。",
    "112年11月5日總會第2屆第1次總會會議通過、11月6日總會長公布（總令字第1121106001號令），修正第13、16、22、30、36、42、47、68、83條條文，並刪除第29條條文。"
  ],
  "fullText": "<div class=\"statute-content\">\n\t\t國立臺北大學學生自治會受全體學生之託付，依據學生自治之精神，為保障學生權益、增進會員福祉、落實資源分配正義、完善學生自治體系，制定本章程，頒行全校，永矢咸遵。\n\t<div class=\"zhangJie\">\n\t\t<p class=\"law-chapter\">第一章 總則</p>\n\t</div>\n\t<div class=\"law-article\">\n\t\t<div class=\"jfpc\"><p class=\"law-art-num\">第1條</p></div>\n\t\t<p class=\"xiang\">國立臺北大學學生自治會（以下簡稱本會），係依「大學法」第三十三條第二項、「國立臺北大學組織規程」第三十九條設置，制定「國立臺北大學學生自治會組織章程」(以下簡稱本章程)。</p>\n\t</div>\n\t<div class=\"law-article\">\n\t\t<div class=\"jfpc\"><p class=\"law-art-num\">第85條</p></div>\n\t\t<p class=\"xiang\">本章程規定事項，有另定實施程序之必要者，以法律定之。</p>\n\t</div>\n\t<!--end single article-->\n</div> <!-- end statute content --> \n"
}
```

欄位說明：

- `modifiedDate`：中文日期（月、日不補零）；原始資料缺漏時為「(原始資料未註記最近異動日期)」。
- `modifiedDateIso`：`YYYY-MM-DD`，供 RPage「發布日期」欄位使用；原始資料缺漏或格式有誤時為空字串。
- `history`：一律為字串陣列，原始資料缺漏時為空陣列。項目可能含有 HTML（例如發文字號的連結）。
- `fullText`：依〈法規排版格式〉排版後的 HTML，class 名稱與會網（RPage）的 `regulation-format.css` 一致。

原始檔的 YAML 基本資料有語法錯誤時，回應 HTTP 422；找不到原始檔時，回應 HTTP 404。

解析與排版邏輯位於 `shared/utils/statuteSource.ts` 與 `shared/utils/statuteFormat.ts`，與「線上法規排版」頁面共用。
