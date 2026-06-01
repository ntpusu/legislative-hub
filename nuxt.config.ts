// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

import { siteConfig } from './config/site.config'

export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',
  future: {
      compatibilityVersion: 4,
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
        { charset: 'utf-8' }
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
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    'nuxt-auth-utils'
  ],

  colorMode: {
    classSuffix: '', // Tailwind: 讓 Tailwind 的 dark: class 直接生效
    dataValue: 'theme', // Pico: 對應 Pico 的 [data-theme]
    preference: 'system',
    fallback: 'light' // 當偵測不到時的預設值
  },

  css: ['@/assets/css/regulation-format.css'],

  // 注入全域變數
  runtimeConfig: {
    public: {
      ...siteConfig,
      // 以下定義立法資料儲存在哪裡
      legiDataSource: {
        repo: 'ntpusu/legislative-data',
        branch: 'main',

        basePath: 'data/bylaws', // 各法規文字檔案之路徑
        listPath: 'data/bylaw-list.json',

        workflowBasePath: '.github/workflows',
        workflowNameReports: 'fetch-committee-reports.yml',
        workflowNameBills: 'fetch-bills.yml',
        workflowNameBylaws: 'fetch-bylaws.yml',
        workflowNameReps: 'fetch-representatives.yml',
        repsDataPath: 'data/representatives.json'
      }
    },
    githubToken: '', // 請在環境變數設定
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
