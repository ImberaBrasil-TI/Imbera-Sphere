<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import Sidebar from './components/common/Sidebar.vue'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const showSidebar = computed(() => !!authStore.user)
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <Sidebar v-if="showSidebar" class="no-print" />
    <main 
      :class="[
        'flex-1 transition-all duration-300 ease-in-out',
        showSidebar ? (settingsStore.isSidebarCollapsed ? 'ml-20' : 'ml-64') : '',
        'print-no-margin'
      ]"
    >
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

@media print {
  .no-print { display: none !important; }
  .print-no-margin { margin: 0 !important; padding: 0 !important; margin-left: 0 !important; }
  body { background: white !important; }
}
</style>
