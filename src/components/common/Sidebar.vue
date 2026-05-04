<script setup>
import { ref, computed } from 'vue'
import { 
  HomeIcon, 
  TagIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  CurrencyDollarIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  WrenchScrewdriverIcon,
  PresentationChartLineIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

function toggleSidebar() {
  settingsStore.isSidebarCollapsed = !settingsStore.isSidebarCollapsed
}

const groups = [
  {
    name: 'Principal',
    icon: HomeIcon,
    items: [
      { name: 'Home', href: '/', icon: HomeIcon },
      { name: 'Chat IA', href: '/chat', icon: ChatBubbleLeftRightIcon },
    ]
  },
  {
    name: 'Monitoramento',
    icon: PresentationChartLineIcon,
    items: [
      { name: 'Tokens', href: '/tokens', icon: ChartBarIcon },
      { name: 'Gastos', href: '/gastos', icon: CurrencyDollarIcon },
    ]
  },
  {
    name: 'Utilidades',
    icon: WrenchScrewdriverIcon,
    items: [
      { name: 'Etiquetas', href: '/etiquetas', icon: TagIcon },
      { name: 'Fechamento', href: '/fechamento', icon: WrenchScrewdriverIcon },
    ]
  },
  {
    name: 'Configurações',
    icon: Cog6ToothIcon,
    items: [
      { name: 'Ajustes', href: '/settings', icon: Cog6ToothIcon },
    ]
  }
]

const expandedGroups = ref(new Set(['Principal', 'Monitoramento', 'Utilidades', 'Configurações']))

function toggleGroup(groupName) {
  if (settingsStore.isSidebarCollapsed) return
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName)
  } else {
    expandedGroups.value.add(groupName)
  }
}
</script>

<template>
  <div 
    :class="[
      'flex flex-col bg-gray-900 h-screen text-white fixed left-0 top-0 shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-gray-800',
      settingsStore.isSidebarCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Header -->
    <div class="h-20 flex items-center px-6 border-b border-gray-800 shrink-0 overflow-hidden">
      <div v-if="!settingsStore.isSidebarCollapsed" class="text-xl font-bold text-blue-400 whitespace-nowrap">
        Imbera Sphere
      </div>
      <div v-else class="w-full flex justify-center">
        <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
          TI
        </div>
      </div>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 custom-scrollbar">
      <div v-for="group in groups" :key="group.name" class="mb-4">
        <!-- Group Header (Only when not collapsed) -->
        <button 
          v-if="!settingsStore.isSidebarCollapsed"
          @click="toggleGroup(group.name)"
          class="w-full flex items-center justify-between px-6 py-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold hover:text-gray-300 transition-colors"
        >
          <span>{{ group.name }}</span>
          <ChevronDownIcon 
            :class="['w-3 h-3 transition-transform', expandedGroups.has(group.name) ? '' : '-rotate-90']" 
          />
        </button>

        <!-- Group Items -->
        <div v-show="settingsStore.isSidebarCollapsed || expandedGroups.has(group.name)" class="space-y-1 mt-1">
          <router-link 
            v-for="item in group.items" 
            :key="item.name" 
            :to="item.href"
            :title="settingsStore.isSidebarCollapsed ? item.name : ''"
            class="flex items-center gap-3 px-6 py-3 hover:bg-gray-800/50 transition-all group relative"
            active-class="bg-blue-600/10 text-blue-400 border-r-2 border-blue-500"
          >
            <component :is="item.icon" class="w-6 h-6 shrink-0" />
            <span v-if="!settingsStore.isSidebarCollapsed" class="font-medium whitespace-nowrap">{{ item.name }}</span>
            
            <!-- Tooltip for collapsed state -->
            <div v-if="settingsStore.isSidebarCollapsed" class="absolute left-full ml-4 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700">
              {{ item.name }}
            </div>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-800 bg-gray-900/50">
      <!-- User Profile -->
      <div v-if="authStore.user" class="flex items-center gap-3 mb-4 px-2 overflow-hidden">
        <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 overflow-hidden">
          <img v-if="settingsStore.profilePicture" :src="settingsStore.profilePicture" class="w-full h-full object-cover" />
          <span v-else class="font-bold text-blue-400">{{ authStore.user.email?.[0].toUpperCase() }}</span>
        </div>
        <div v-if="!settingsStore.isSidebarCollapsed" class="min-w-0">
          <p class="text-xs font-semibold text-gray-200 truncate">{{ authStore.user.email }}</p>
          <p class="text-[10px] text-gray-500 uppercase tracking-tighter">Membro Platinum</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-1">
        <button 
          @click="toggleSidebar"
          class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
        >
          <component :is="settingsStore.isSidebarCollapsed ? ChevronRightIcon : ChevronLeftIcon" class="w-5 h-5 shrink-0" />
          <span v-if="!settingsStore.isSidebarCollapsed" class="text-sm font-medium">Recolher</span>
        </button>

        <button 
          @click="authStore.logout"
          class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <ArrowLeftOnRectangleIcon class="w-5 h-5 shrink-0" />
          <span v-if="!settingsStore.isSidebarCollapsed" class="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151;
}
</style>
