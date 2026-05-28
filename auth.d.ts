// auth.d.ts
declare module '#auth-utils' {
  interface User {
    email: string
    googleName: string
    shortName: string
  }

  interface UserSession {
    // 如果有額外的 session 欄位，可以在此擴充
  }
}

declare module 'nuxt-auth-utils' {
  interface User {
    email: string
    googleName: string
    shortName: string
  }
}

export {}
