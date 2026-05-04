<script setup>
import { ref, reactive, onMounted } from 'vue'
import PageHeader from '../components/common/PageHeader.vue'
import { 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  SparklesIcon,
  TicketIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

import { chatCompletion } from '@/services/openai.service'
import { fetchTicket, closeTicket, fetchClosureHistory } from '@/services/chamados.service'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

// Estados da UI
const status = ref('idle') // idle, searching, found, not_found, closing, success, error
const errorMessage = ref('')
const searchTicketId = ref('')

// Dados do Chamado
const ticket = ref(null)

// Formulário de Fechamento
const form = reactive({
  descricao: '',
  resolucao: '',
  sendWhatsapp: true,
  updateSupabase: true,
  generateAISummary: false
})

// Histórico
const history = ref([])

onMounted(async () => {
  history.value = await fetchClosureHistory()
})

// Funções
async function searchTicket() {
  if (!searchTicketId.value.trim()) return
  
  status.value = 'searching'
  errorMessage.value = ''
  ticket.value = null
  
  try {
    const data = await fetchTicket(searchTicketId.value)
    
    if (data.error) throw new Error(data.message)
    
    ticket.value = {
      id: data.id,
      number: data.id,
      solicitante: data.requesterName || 'N/A',
      assunto: data.subject || 'Sem assunto',
      descricao: data.description || 'Sem descrição',
      estado: data.stateName || 'N/A',
      grupo: data.groupName || 'N/A',
      responsável: data.specialistName || 'N/A',
      servico: data.serviceName || 'N/A',
      dataAbertura: data.creationDate ? new Date(data.creationDate).toLocaleString() : 'N/A'
    }
    status.value = 'found'
  } catch (err) {
    status.value = 'not_found'
    errorMessage.value = err.message || 'Chamado não encontrado na Aranda.'
  }
}

async function generateAI() {
  if (!ticket.value || form.generateAISummary) return
  
  form.generateAISummary = true
  
  try {
    const prompt = `
      Você é um assistente técnico de TI. Com base nos dados do chamado abaixo, gere um texto profissional para a "Descrição do Ocorrido" (focada no problema técnico identificado) e para a "Solução Aplicada" (o que foi feito para resolver).
      
      Chamado: #${ticket.value.number}
      Assunto: ${ticket.value.assunto}
      Descrição Original: ${ticket.value.descricao}
      Solicitante: ${ticket.value.solicitante}
      
      Responda APENAS um JSON no seguinte formato:
      {
        "descricao": "texto técnico aqui",
        "resolucao": "texto da solução aqui"
      }
    `
    
    const response = await chatCompletion([
      { role: 'system', content: 'Você é um especialista em suporte de TI e encerramento de chamados.' },
      { role: 'user', content: prompt }
    ])
    
    if (response.error) throw new Error(response.message)
    
    const content = response.choices[0].message.content
    const data = JSON.parse(content.replace(/```json|```/g, ''))
    
    form.descricao = data.descricao
    form.resolucao = data.resolucao
  } catch (err) {
    console.error('Erro ao gerar resumo com IA:', err)
    alert('Erro ao consultar a IA. Tente preencher manualmente.')
  } finally {
    form.generateAISummary = false
  }
}

async function handleCloseTicket() {
  if (form.descricao.length < 20 || form.resolucao.length < 20) {
    alert('Descrição e Solução devem ter no mínimo 20 caracteres.')
    return
  }

  if (!confirm('Deseja realmente encerrar este chamado?')) return

  status.value = 'closing'
  
  try {
    const payload = {
      ticketNumber: ticket.value.number,
      descricao: form.descricao,
      resolucao: form.resolucao,
      closedBy: authStore.user?.email || 'Sistema',
      sendWhatsapp: form.sendWhatsapp,
      updateSupabase: form.updateSupabase
    }

    const result = await closeTicket(payload)
    
    if (result.error) throw new Error(result.message)

    status.value = 'success'
    
    // Recarregar histórico
    history.value = await fetchClosureHistory()
    
  } catch (err) {
    status.value = 'error'
    errorMessage.value = err.message || 'Erro ao fechar chamado. Verifique os logs.'
  }
}

function resetForm() {
  status.value = 'idle'
  searchTicketId.value = ''
  ticket.value = null
  form.descricao = ''
  form.resolucao = ''
}

</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <PageHeader 
      title="🛠️ Fechamento Inteligente" 
      subtitle="Encerramento de chamados Aranda com integração WhatsApp e Supabase."
    />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
      
      <!-- Coluna Esquerda: Busca e Dados -->
      <div class="lg:col-span-5 space-y-6">
        
        <!-- Card de Busca -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Buscar Chamado Aranda</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input 
                v-model="searchTicketId"
                @keyup.enter="searchTicket"
                type="text" 
                placeholder="Ex: 123456" 
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <TicketIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
            </div>
            <button 
              @click="searchTicket"
              :disabled="status === 'searching'"
              class="bg-blue-600 text-white px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              <ArrowPathIcon v-if="status === 'searching'" class="w-5 h-5 animate-spin" />
              <MagnifyingGlassIcon v-else class="w-5 h-5" />
              <span class="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        <!-- Card de Dados do Chamado -->
        <div v-if="ticket" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <div class="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
            <h3 class="font-bold text-blue-900 flex items-center gap-2">
              <DocumentTextIcon class="w-5 h-5" />
              Dados do Chamado #{{ ticket.number }}
            </h3>
            <span class="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">
              {{ ticket.estado }}
            </span>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Solicitante</p>
                <p class="font-medium text-gray-700 truncate">{{ ticket.solicitante }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Abertura</p>
                <p class="font-medium text-gray-700">{{ ticket.dataAbertura }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Assunto</p>
                <p class="font-medium text-gray-700">{{ ticket.assunto }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Grupo</p>
                <p class="font-medium text-gray-700 text-xs">{{ ticket.grupo }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Responsável</p>
                <p class="font-medium text-gray-700">{{ ticket.responsável }}</p>
              </div>
            </div>
            <div class="pt-4 border-t border-gray-50">
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-2">Descrição Original</p>
              <p class="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                "{{ ticket.descricao }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Mensagens de Erro/Busca -->
        <div v-if="status === 'not_found' || status === 'error'" class="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 animate-shake">
          <ExclamationCircleIcon class="w-6 h-6 shrink-0" />
          <p class="text-sm font-medium">{{ errorMessage }}</p>
        </div>

      </div>

      <!-- Coluna Direita: Formulário de Fechamento -->
      <div class="lg:col-span-7">
        
        <div :class="['bg-white rounded-2xl border border-gray-100 shadow-sm p-8 transition-all', !ticket ? 'opacity-50 pointer-events-none grayscale' : '']">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CheckCircleIcon class="w-6 h-6 text-green-500" />
              Formulário de Encerramento
            </h3>
            <button 
              v-if="ticket"
              @click="generateAI"
              :disabled="form.generateAISummary"
              class="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <SparklesIcon :class="['w-4 h-4', form.generateAISummary ? 'animate-pulse' : '']" />
              {{ form.generateAISummary ? 'Gerando...' : 'Sugerir com IA' }}
            </button>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição do Ocorrido (Técnico)</label>
              <textarea 
                v-model="form.descricao"
                rows="3"
                placeholder="Descreva detalhadamente o que foi identificado..."
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              ></textarea>
              <p class="mt-1 text-[10px] text-gray-400 font-medium">Mínimo 20 caracteres. Restante: {{ Math.max(0, 20 - form.descricao.length) }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Solução Aplicada</label>
              <textarea 
                v-model="form.resolucao"
                rows="3"
                placeholder="Descreva o que foi feito para resolver..."
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              ></textarea>
              <p class="mt-1 text-[10px] text-gray-400 font-medium">Mínimo 20 caracteres. Restante: {{ Math.max(0, 20 - form.resolucao.length) }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <input type="checkbox" v-model="form.sendWhatsapp" class="w-5 h-5 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500" />
                <div>
                  <p class="text-xs font-bold text-gray-700">Notificar WhatsApp</p>
                  <p class="text-[10px] text-gray-400">Envia resumo para o solicitante</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <input type="checkbox" v-model="form.updateSupabase" class="w-5 h-5 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500" />
                <div>
                  <p class="text-xs font-bold text-gray-700">Atualizar Supabase</p>
                  <p class="text-[10px] text-gray-400">Sincroniza status do chamado</p>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-gray-100 flex gap-4">
              <button 
                @click="handleCloseTicket"
                :disabled="status === 'closing' || form.descricao.length < 20 || form.resolucao.length < 20"
                class="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none"
              >
                <ArrowPathIcon v-if="status === 'closing'" class="w-5 h-5 animate-spin" />
                <CheckCircleIcon v-else class="w-5 h-5" />
                Finalizar e Encerrar
              </button>
              <button 
                @click="resetForm"
                class="px-6 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <!-- Card de Sucesso -->
        <div v-if="status === 'success'" class="mt-6 bg-green-50 border border-green-100 rounded-2xl p-6 text-green-800 animate-bounce-short">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon class="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h4 class="font-bold">Chamado Encerrado com Sucesso!</h4>
              <p class="text-sm opacity-90">As atualizações na Aranda, Supabase e WhatsApp foram concluídas.</p>
            </div>
            <button @click="resetForm" class="ml-auto text-xs font-bold uppercase tracking-widest bg-white/50 px-4 py-2 rounded-lg">Novo Fechamento</button>
          </div>
        </div>

      </div>

    </div>

    <!-- Tabela de Histórico -->
    <div class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ClockIcon class="w-6 h-6 text-blue-500" />
          Histórico Recente
        </h3>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Chamado</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Data Encerramento</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Analista</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="item in history" :key="item.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4 font-bold text-blue-600">#{{ item.ticketNumber }}</td>
              <td class="px-6 py-4 text-gray-600">{{ item.closedAt }}</td>
              <td class="px-6 py-4 text-gray-600 font-medium">{{ item.closedBy }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {{ item.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button class="text-blue-500 hover:text-blue-700 font-bold text-xs">Ver Detalhes</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.animate-shake {
  animation: shake 0.3s ease-in-out;
}

@keyframes bounce-short {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.animate-bounce-short {
  animation: bounce-short 0.5s ease-in-out;
}
</style>
