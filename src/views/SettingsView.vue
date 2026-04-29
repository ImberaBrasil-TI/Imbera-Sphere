<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { 
  LanguageIcon, 
  PaintBrushIcon, 
  UserCircleIcon,
  FaceSmileIcon,
  ComputerDesktopIcon
} from '@heroicons/vue/24/outline'

const settings = useSettingsStore()

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Español' },
]

const themes = [
  { id: 'light', name: 'Claro', icon: FaceSmileIcon },
  { id: 'dark', name: 'Escuro', icon: ComputerDesktopIcon },
]

const iconSets = [
  { id: 'heroicons', name: 'Heroicons (Outline)' },
  { id: 'heroicons-solid', name: 'Heroicons (Solid)' },
]
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
    <PageHeader 
      title="⚙️ Configurações do Usuário" 
      subtitle="Personalize sua experiência na Imbera Sphere."
    />

    <div class="mt-8 space-y-6">
      <!-- Profile Section -->
      <section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div class="flex items-center gap-4 mb-6">
          <UserCircleIcon class="w-6 h-6 text-blue-500" />
          <h2 class="text-lg font-bold text-gray-800">Perfil</h2>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">URL da Foto de Perfil</label>
            <input 
              v-model="settings.profilePicture"
              type="text" 
              placeholder="https://exemplo.com/foto.jpg"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div v-if="settings.profilePicture" class="flex items-center gap-4">
            <img :src="settings.profilePicture" class="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
            <p class="text-xs text-gray-500">Prévia da sua foto de perfil.</p>
          </div>
        </div>
      </section>

      <!-- Appearance Section -->
      <section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div class="flex items-center gap-4 mb-6">
          <PaintBrushIcon class="w-6 h-6 text-purple-500" />
          <h2 class="text-lg font-bold text-gray-800">Aparência</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tema do Sistema</label>
            <div class="flex gap-2">
              <button 
                v-for="t in themes" 
                :key="t.id"
                @click="settings.theme = t.id"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all',
                  settings.theme === t.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                ]"
              >
                <component :is="t.icon" class="w-5 h-5" />
                {{ t.name }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Conjunto de Ícones</label>
            <select 
              v-model="settings.iconSet"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none"
            >
              <option v-for="set in iconSets" :key="set.id" :value="set.id">
                {{ set.name }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Localization Section -->
      <section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div class="flex items-center gap-4 mb-6">
          <LanguageIcon class="w-6 h-6 text-green-500" />
          <h2 class="text-lg font-bold text-gray-800">Localização</h2>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Idioma Preferencial</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              v-for="lang in languages" 
              :key="lang.code"
              @click="settings.language = lang.code"
              :class="[
                'px-4 py-3 rounded-xl border text-sm transition-all text-center',
                settings.language === lang.code ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
            >
              {{ lang.name }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <div class="mt-8 flex justify-end">
      <p class="text-xs text-gray-400 italic">As configurações são salvas automaticamente em seu navegador.</p>
    </div>
  </div>
</template>
