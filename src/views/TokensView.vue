<script setup>
import { computed } from 'vue'
import PageHeader from '../components/common/PageHeader.vue'
import { useUsageStore } from '@/stores/useUsageStore'
import { toBRL } from '@/config/pricing'

const usageStore = useUsageStore()

const totalTokens = computed(() => {
  return usageStore.usageLog.reduce((total, item) => total + item.input_tokens + item.output_tokens, 0)
})

const openaiTokens = computed(() => {
  return usageStore.getUsageByProvider('openai').reduce((total, item) => total + item.input_tokens + item.output_tokens, 0)
})

const anthropicTokens = computed(() => {
  return usageStore.getUsageByProvider('anthropic').reduce((total, item) => total + item.input_tokens + item.output_tokens, 0)
})

const recentHistory = computed(() => {
  return [...usageStore.usageLog].reverse().slice(0, 10)
})

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('pt-BR')
}
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <PageHeader 
      title="📊 Monitoramento de Tokens" 
      subtitle="Acompanhe o consumo das APIs de IA em tempo real."
    />
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Acumulado</h4>
        <p class="text-3xl font-extrabold text-gray-900 mt-2">{{ totalTokens.toLocaleString() }}</p>
        <div class="mt-4 flex items-center text-sm text-blue-600">
          Monitoramento ativo via UsageStore
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">OpenAI</h4>
        <p class="text-3xl font-extrabold text-gray-900 mt-2">{{ openaiTokens.toLocaleString() }}</p>
        <div class="w-full bg-gray-100 rounded-full h-2 mt-6">
          <div class="bg-blue-600 h-2 rounded-full" :style="{ width: totalTokens > 0 ? (openaiTokens / totalTokens * 100) + '%' : '0%' }"></div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Anthropic</h4>
        <p class="text-3xl font-extrabold text-gray-900 mt-2">{{ anthropicTokens.toLocaleString() }}</p>
        <div class="w-full bg-gray-100 rounded-full h-2 mt-6">
          <div class="bg-orange-500 h-2 rounded-full" :style="{ width: totalTokens > 0 ? (anthropicTokens / totalTokens * 100) + '%' : '0%' }"></div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
        <h3 class="font-bold text-gray-900">Histórico Recente</h3>
        <button @click="usageStore.clearLogs" class="text-sm text-red-600 font-medium hover:underline">Limpar Logs</button>
      </div>
      <div class="p-0">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th class="px-6 py-3">Data/Hora</th>
              <th class="px-6 py-3">Modelo</th>
              <th class="px-6 py-3 text-right">Tokens (I/O)</th>
              <th class="px-6 py-3 text-right">Custo Est.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="recentHistory.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-400 italic">Nenhum uso registrado ainda.</td>
            </tr>
            <tr v-for="item in recentHistory" :key="item.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4 text-gray-600">{{ formatDate(item.timestamp) }}</td>
              <td class="px-6 py-4">
                <span 
                  :class="[
                    'px-2 py-1 rounded-md text-xs font-bold uppercase',
                    item.provider === 'openai' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  ]"
                >
                  {{ item.model }}
                </span>
              </td>
              <td class="px-6 py-4 text-right font-mono text-gray-500">
                {{ item.input_tokens }} / {{ item.output_tokens }}
              </td>
              <td class="px-6 py-4 text-right font-medium text-gray-900">
                ${{ item.cost_usd.toFixed(4) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
