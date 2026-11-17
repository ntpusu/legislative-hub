// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

import { siteConfig } from './config/site.config'

export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',
  future: {
    compatibilityVersion: 4
  },
  devtools: {
    enabled: process.env.NODE_ENV === 'development'
  },

  nitro: {
    preset: 'cloudflare-pages'
  },

  app: {
    head: {
      title: siteConfig.name,
      titleTemplate: '%s - ' + siteConfig.shortName,
      htmlAttrs: { lang: 'zh-Hant-TW' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' },
        { name: 'description', content: siteConfig.description }
      ],
      noscript: [{ textContent: 'JavaScript is required' }],
      link: [
        {
          rel: 'apple-touch-icon',
          type: 'image/png',
          sizes: '192x192',
          href: 'https://ntpusu.org/wp-content/uploads/2026/04/duck-logo_removeBg_192px.png'
        },
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/duck-logo_removeBg_ico.ico'
        }
      ]
    }
  },

  modules: [
    '@nuxt/image',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    'nuxt-auth-utils'
  ],

  colorMode: {
    dataValue: 'theme', // blades.css: 對應  [data-theme]
    preference: 'system',
    fallback: 'light' // 當偵測不到時的預設值
  },

  css: ['@/assets/css/statutes-format.css'],

  // 注入全域變數
  runtimeConfig: {
    public: {
      ...siteConfig,
      // 以下定義立法資料儲存在哪裡
      legiDataSource: {
        repo: 'ntpusu/legislative-data',
        branch: 'main',

        // 以下路徑、工作流名稱屬於 NTPU Legislative Database 儲存庫的既有資源，
        // 不在本專案更名範圍內；本專案僅將程式內的鍵名統一為 statutes。
        basePath: 'data/bylaws', // 各自治法規文字檔案之路徑
        listPath: 'data/bylaw-list.json',

        workflowBasePath: '.github/workflows',
        workflowNameStatutes: 'fetch-bylaws.yml',
        workflowNameReps: 'fetch-representatives.yml',
        repsDataPath: 'data/representatives.json'
      }
    },
    githubToken: '', // 請在環境變數設定
    // 管理員帳號（具有所有功能權限），請以環境變數 NUXT_ADMINS 設定，格式為 JSON 陣列：
    // [{"email":"a@example.com","nickname":"阿珍"}]
    // 僅供伺服器端使用，切勿移到 public 底下，以免管理員的 email 外流
    admins: '',
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
        redirectUrl: process.env.NUXT_OAUTH_GOOGLE_REDIRECT_URL
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: ['file-saver', 'docx']
    }
  }
})
