<script setup>
import { computed } from 'vue'
import PageHeader from '../components/common/PageHeader.vue'
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ScaleIcon 
} from '@heroicons/vue/24/outline'
import { useUsageStore } from '@/stores/useUsageStore'
import { toBRL } from '@/config/pricing'

const usageStore = useUsageStore()

const totalCostUSD = computed(() => usageStore.totalCostUSD)
const totalCostBRL = computed(() => toBRL(totalCostUSD.value))

const openaiCost = computed(() => {
  return usageStore.getUsageByProvider('openai').reduce((total, item) => total + item.cost_usd, 0)
})

const anthropicCost = computed(() => {
  return usageStore.getUsageByProvider('anthropic').reduce((total, item) => total + item.cost_usd, 0)
})

const budget = 500 // USD
const budgetAvailable = computed(() => Math.max(0, budget - totalCostUSD.value))
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <PageHeader 
      title="💰 Monitoramento de Gastos" 
      subtitle="Análise financeira detalhada dos serviços de inteligência artificial."
    />
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
        <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <CurrencyDollarIcon class="w-16 h-16" />
        </div>
        <p class="text-sm font-medium text-gray-500">Gasto Total Acumulado</p>
        <p class="text-3xl font-extrabold text-gray-900 mt-2">${{ totalCostUSD.toFixed(2) }}</p>
        <p class="text-xs text-blue-600 font-bold mt-2">≈ {{ totalCostBRL }}</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-sm font-medium text-gray-500">Média por Requisição</p>
        <p class="text-3xl font-extrabold text-gray-900 mt-2">
          ${{ usageStore.usageLog.length > 0 ? (totalCostUSD / usageStore.usageLog.length).toFixed(4) : '0.00' }}
        </p>
        <p class="text-xs text-gray-400 font-medium mt-2">Calculado em tempo real</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-sm font-medium text-gray-500">Total de Requisições</p>
        <p class="text-3xl font-extrabold text-gray-900 mt-2">{{ usageStore.usageLog.length }}</p>
        <p class="text-xs text-gray-400 font-medium mt-2">Log local persistido</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-sm font-medium text-gray-500">Budget Disponível</p>
        <p class="text-3xl font-extrabold text-green-600 mt-2">${{ budgetAvailable.toFixed(2) }}</p>
        <p class="text-xs text-gray-400 font-medium mt-2">Limite: ${{ budget.toFixed(2) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
        <h3 class="text-xl font-bold mb-4 text-gray-800">Sobre o Monitoramento</h3>
        <p class="text-gray-600 leading-relaxed mb-6">
          O sistema de monitoramento captura o uso de tokens diretamente das respostas das APIs da OpenAI e Anthropic. 
          Os custos são calculados com base na tabela de preços definida em <code class="bg-gray-100 px-1 rounded">pricing.js</code>.
        </p>
        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p class="text-sm text-blue-800 font-medium">
            💡 Dica: Você pode limpar os logs na visualização de Tokens para resetar as estatísticas locais.
          </p>
        </div>
      </div>

      <div class="bg-gray-900 p-8 rounded-3xl shadow-xl text-white">
        <h3 class="text-xl font-bold mb-6 flex items-center">
          <ScaleIcon class="w-6 h-6 mr-2 text-blue-400" />
          Distribuição por Provedor
        </h3>
        <div class="space-y-6">
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-400">OpenAI</span>
              <span class="font-bold">${{ openaiCost.toFixed(2) }} ({{ totalCostUSD > 0 ? (openaiCost / totalCostUSD * 100).toFixed(0) : 0 }}%)</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-3">
              <div class="bg-blue-500 h-3 rounded-full" :style="{ width: totalCostUSD > 0 ? (openaiCost / totalCostUSD * 100) + '%' : '0%' }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-400">Anthropic</span>
              <span class="font-bold">${{ anthropicCost.toFixed(2) }} ({{ totalCostUSD > 0 ? (anthropicCost / totalCostUSD * 100).toFixed(0) : 0 }}%)</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-3">
              <div class="bg-orange-500 h-3 rounded-full" :style="{ width: totalCostUSD > 0 ? (anthropicCost / totalCostUSD * 100) + '%' : '0%' }"></div>
            </div>
          </div>
        </div>

        <div class="mt-12 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
          <p class="text-xs text-gray-400 leading-relaxed">
            * Os valores são baseados na tabela de preços de Abril 2026 e são calculados localmente para garantir privacidade.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
