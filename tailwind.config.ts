export default {
  // @nuxtjs/color-mode 會在 <html> 加上 dark class（classSuffix: ''），
  // 以 class 策略讓 dark: 變體跟隨網站的主題切換，而非作業系統設定
  darkMode: 'class',
  corePlugins: {
    preflight: false
  }
}
