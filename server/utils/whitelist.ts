// 在此列出所有准許登入的帳號
export const allowedEmails = [
  { email: 'ntpusu@gm.ntpu.edu.tw', shortName: '學生會(三峽)' },
  { email: 'ntpuscs@gmail.com', shortName: '學生議會(三峽)' },
  { email: 'ntpucourt@gmail.com', shortName: '學生法院' },
  { email: 'ntpustudents2@gm.ntpu.edu.tw', shortName: '學生會(臺北)' },
  { email: 'ntpussct@gmail.com', shortName: '學生議會(臺北)' },
  { email: 'ntpush92613815@gmail.com', shortName: '秘書處(總會)' },
  { email: 'ntpusuwebsite@gmail.com', shortName: '網管帳號' }
]

// 輔助函式：根據 email 取得簡稱
export const getShortName = (email: string) => {
  return (
    allowedEmails.find((item) => item.email === email)?.shortName || '未知單位'
  )
}
