<script setup>
import PageHeader from '../components/common/PageHeader.vue'
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'

const vectorApiUrl = import.meta.env.VITE_VECTOR_API_URL || 'http://localhost:8000'
const input = ref('')
const loading = ref(false)
const messages = ref([
  { id: 1, role: 'assistant', text: 'Olá! Sou o assistente da Imbera Sphere. Como posso te ajudar hoje com processos ou dúvidas internas?' }
])

async function sendMessage() {
  if (!input.value.trim() || loading.value) return
  
  const userText = input.value
  messages.value.push({ id: Date.now(), role: 'user', text: userText })
  input.value = ''
  loading.value = true

  try {
    // Exemplo de chamada ao backend configurado no .env
    console.log(`Enviando para: ${vectorApiUrl}/chat`)
    // const res = await fetch(`${vectorApiUrl}/chat`, { ... })
    
    // Simulação de resposta enquanto o backend não está pronto
    setTimeout(() => {
      messages.value.push({ 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: `Recebi sua dúvida sobre "${userText}". O backend em ${vectorApiUrl} será consultado assim que estiver ativo.` 
      })
      loading.value = false
    }, 1000)
    
  } catch (error) {
    messages.value.push({ id: Date.now() + 1, role: 'assistant', text: 'Erro ao conectar com o serviço de IA.' })
    loading.value = false
  }
}
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
    <PageHeader 
      title="💬 Chat com IA de Vetores" 
      subtitle="Consulte processos e documentações internas da IMBERA."
    />
    
    <div class="flex-1 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden flex flex-col mt-4">
      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          :class="[
            'flex',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div 
            :class="[
              'max-w-[70%] px-5 py-3 rounded-2xl shadow-sm leading-relaxed',
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            ]"
          >
            {{ msg.text }}
          </div>
        </div>
        <div v-if="loading" class="flex justify-start">
          <div class="bg-white border border-gray-100 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm text-gray-400 italic text-sm">
            Digitando...
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="p-4 bg-white border-t border-gray-100">
        <form @submit.prevent="sendMessage" class="relative flex items-center">
          <input 
            v-model="input"
            type="text" 
            placeholder="Pergunte sobre política de senhas, VPN, Teams..."
            class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-16"
          />
          <button 
            type="submit"
            :disabled="loading"
            class="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50"
          >
            <PaperAirplaneIcon class="w-6 h-6" />
          </button>
        </form>
        <p class="text-[10px] text-gray-400 mt-3 text-center uppercase tracking-widest font-bold">
          API: {{ vectorApiUrl }}
        </p>
      </div>
    </div>
  </div>
</template>
