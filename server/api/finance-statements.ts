/**
 * 財務報表資料結構定義
 */
export interface FinancialStatement {
  id: number
  entity: '三峽校區' | '臺北校區' | '總會' | '學生法院' // 財務主體
  year: number // 會計年度 (e.g., 114)
  semester: 1 | 2 // 會計期間 (1=上學期, 2=下學期)
  type:
    | '法定預算'
    | '法定決算'
    | '法定追加預算'
    | '法定特別預算'
    | '法定追加決算'
    | '法定特別決算'
    | '其它' // 財報類型
  title?: string // 報表標題 (非必填，若有特殊命名需求時使用)
  resourceType: 'link' | 'pdf' // 資源類型
  url?: string // 外部連結 (僅當 resourceType 為 link 時使用)
  fileName?: string // 檔案名稱 (通常對應 id，例如 1.pdf)
  publicateDate?: string // 公布日期
}

export default defineEventHandler(async (event) => {
  // 模擬延遲
  // await new Promise(resolve => setTimeout(resolve, 500));

  const data: FinancialStatement[] = [
    {
      id: 5,
      entity: '臺北校區',
      year: 114,
      semester: 1,
      type: '法定追加預算',
      title: '臺北校區學生會114學年度第一期間追加預算（一追）',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=2370',
      publicateDate: '2025-11-21'
    },
    {
      id: 4,
      entity: '臺北校區',
      year: 114,
      semester: 1,
      type: '法定預算',
      title: '臺北校區學生會114學年度第一期間預算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=2469'
    },
    {
      id: 3,
      entity: '三峽校區',
      year: 114,
      semester: 1,
      type: '法定追加預算',
      title: '三峽校區學生會114學年度第一期間追加預算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=2329'
    },
    {
      id: 2,
      entity: '三峽校區',
      year: 114,
      semester: 1,
      type: '法定預算',
      title: '三峽校區114學年度第1期間法定預算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=2150'
    },
    {
      id: 1,
      entity: '三峽校區',
      year: 114,
      semester: 1,
      type: '法定特別預算',
      title: '三峽校區114學年度第一期間暑期法定預算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=2113'
    },

    {
      id: 202,
      entity: '三峽校區',
      year: 113,
      semester: 2,
      type: '法定決算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=1968'
    },
    {
      id: 2492,
      entity: '學生法院',
      year: 113,
      semester: 2,
      type: '法定決算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=2492'
    },

    {
      id: 301,
      entity: '總會',
      year: 113,
      semester: 1,
      type: '法定預算',
      resourceType: 'link',
      url: 'https://ntpusu.org/?p=1369'
    },

    {
      id: 401,
      entity: '總會',
      year: 112,
      semester: 2,
      type: '法定決算',
      resourceType: 'link',
      url: 'https://drive.google.com/file/d/1YbsVfWJpGbsJl0HkYS_J_C8dZWbqxo9B/view?usp=drive_link'
    }
  ]

  return data
})
