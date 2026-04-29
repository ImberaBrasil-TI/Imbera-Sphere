<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')

async function handleLogin() {
  await authStore.login(email.value, password.value)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="p-8 bg-gray-900 text-center">
        <h2 class="text-3xl font-bold text-blue-400">Imbera Sphere</h2>
        <p class="text-gray-400 mt-2 text-sm uppercase tracking-widest font-semibold">Acesso Restrito</p>
      </div>

      <div class="p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <EnvelopeIcon class="w-5 h-5" />
              </span>
              <input 
                v-model="email"
                type="email" 
                required
                placeholder="seu.nome@imbera.com"
                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <LockClosedIcon class="w-5 h-5" />
              </span>
              <input 
                v-model="password"
                type="password" 
                required
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div v-if="authStore.error" class="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium text-center">
            {{ authStore.error }}
          </div>

          <button 
            type="submit"
            :disabled="authStore.loading"
            class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            <span v-if="authStore.loading">Autenticando...</span>
            <span v-else>Entrar na Plataforma</span>
          </button>
        </form>

        <p class="mt-8 text-center text-xs text-gray-400">
          Problemas com o acesso? Entre em contato com o suporte de TI.
        </p>
      </div>
    </div>
  </div>
</template>
