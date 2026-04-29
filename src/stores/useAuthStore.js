import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (authError) throw authError
      user.value = data.user
      router.push('/')
    } catch (e) {
      error.value = 'E-mail ou senha incorretos.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    router.push('/login')
  }

  async function fetchUser() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null
    return user.value
  }

  return { user, loading, error, login, logout, fetchUser }
})
