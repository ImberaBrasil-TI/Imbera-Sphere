import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const language = ref(localStorage.getItem('user_language') || 'pt-BR')
  const theme = ref(localStorage.getItem('user_theme') || 'dark')
  const profilePicture = ref(localStorage.getItem('user_avatar') || '')
  const iconSet = ref(localStorage.getItem('user_icon_set') || 'heroicons')
  const isSidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')

  watch(language, (val) => localStorage.setItem('user_language', val))
  watch(theme, (val) => {
    localStorage.setItem('user_theme', val)
    applyTheme(val)
  })
  watch(profilePicture, (val) => localStorage.setItem('user_avatar', val))
  watch(iconSet, (val) => localStorage.setItem('user_icon_set', val))
  watch(isSidebarCollapsed, (val) => localStorage.setItem('sidebar_collapsed', val))

  function applyTheme(t) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Initialize theme
  applyTheme(theme.value)

  return {
    language,
    theme,
    profilePicture,
    iconSet,
    isSidebarCollapsed
  }
})
