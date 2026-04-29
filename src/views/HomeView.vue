<script setup>
import PageHeader from '../components/common/PageHeader.vue'
import { 
  TagIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  CurrencyDollarIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

const modules = [
  { 
    name: 'Etiquetas', 
    description: 'Sistema de geração de etiquetas patrimoniais e de ativos.',
    href: '/etiquetas', 
    icon: TagIcon,
    color: 'bg-blue-500',
    hover: 'hover:border-blue-500'
  },
  { 
    name: 'Tokens', 
    description: 'Monitoramento em tempo real do uso de APIs OpenAI e Anthropic.',
    href: '/tokens', 
    icon: ChartBarIcon,
    color: 'bg-indigo-500',
    hover: 'hover:border-indigo-500'
  },
  { 
    name: 'Chat IA', 
    description: 'Assistente inteligente alimentado pela nossa base de conhecimento.',
    href: '/chat', 
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-purple-500',
    hover: 'hover:border-purple-500'
  },
  { 
    name: 'Gastos', 
    description: 'Controle financeiro e projeção de custos com inteligência artificial.',
    href: '/gastos', 
    icon: CurrencyDollarIcon,
    color: 'bg-emerald-500',
    hover: 'hover:border-emerald-500'
  },
]
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <PageHeader 
      title="Bem-vindo à Imbera Sphere" 
      subtitle="Sua central unificada para ferramentas e monitoramento de tecnologia."
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <router-link 
        v-for="item in modules" 
        :key="item.name" 
        :to="item.href"
        class="group relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        :class="item.hover"
      >
        <div class="flex items-start justify-between">
          <div :class="[item.color, 'p-3 rounded-xl text-white shadow-lg']">
            <component :is="item.icon" class="w-8 h-8" />
          </div>
          <ArrowRightIcon class="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors" />
        </div>
        
        <div class="mt-6">
          <h3 class="text-xl font-bold text-gray-900">{{ item.name }}</h3>
          <p class="mt-2 text-gray-500 leading-relaxed">
            {{ item.description }}
          </p>
        </div>

        <div class="mt-6 flex items-center text-sm font-medium" :class="item.color.replace('bg-', 'text-')">
          Acessar módulo
          <ArrowRightIcon class="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </router-link>
    </div>

    <!-- Quick Stats Section Placeholder -->
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-900 rounded-2xl p-6 text-white overflow-hidden relative">
        <div class="relative z-10">
          <p class="text-gray-400 text-sm font-medium">Status do Sistema</p>
          <p class="text-2xl font-bold mt-1 text-green-400">Operacional</p>
        </div>
        <div class="absolute -right-4 -bottom-4 opacity-10">
          <ChartBarIcon class="w-24 h-24" />
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-6 border shadow-sm">
        <p class="text-gray-500 text-sm font-medium">Tokens Hoje (OpenAI)</p>
        <p class="text-2xl font-bold mt-1 text-gray-900">12.5k <span class="text-xs font-normal text-gray-400">/ 50k</span></p>
      </div>

      <div class="bg-white rounded-2xl p-6 border shadow-sm">
        <p class="text-gray-500 text-sm font-medium">Custo Estimado (Mês)</p>
        <p class="text-2xl font-bold mt-1 text-gray-900">$42.30</p>
      </div>
    </div>
  </div>
</template>
