<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import PageHeader from '../components/common/PageHeader.vue'
import { 
  PlusIcon, 
  TrashIcon, 
  PrinterIcon, 
  SquaresPlusIcon,
  Cog6ToothIcon,
  UserIcon,
  DocumentDuplicateIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const activeTab = ref('single')
const etiquetas = ref(Array(18).fill(null))

const formData = reactive({
  name: '',
  password: '',
  usuario: '',
  position: 0
})

const settings = reactive({
  bitlocker: '34144850',
  warning: '⚠️ Altere sua senha após o primeiro acesso'
})

const bulkData = ref('')

function switchTab(tab) {
  activeTab.value = tab
}

function updateNextPosition() {
  for (let i = 0; i < 18; i++) {
    if (!etiquetas.value[i]) {
      formData.position = i
      return
    }
  }
}

function addEtiqueta() {
  if (!formData.name.trim() || !formData.password.trim() || !formData.usuario.trim()) {
    alert('Preencha todos os campos!')
    return
  }
  etiquetas.value[formData.position] = { name: formData.name, password: formData.password, usuario: formData.usuario }
  formData.name = ''; formData.password = ''; formData.usuario = ''
  updateNextPosition()
}

function removeEtiqueta(pos) {
  etiquetas.value[pos] = null
  updateNextPosition()
}

function processBulk() {
  if (!bulkData.value.trim()) return
  const lines = bulkData.value.trim().split('\n')
  let currentPos = 0
  while (currentPos < 18 && etiquetas.value[currentPos]) currentPos++
  lines.forEach(line => {
    if (currentPos >= 18) return
    const parts = line.split(';')
    if (parts.length >= 3) {
      etiquetas.value[currentPos] = { name: parts[0].trim(), password: parts[1].trim(), usuario: parts[2].trim() }
      while (currentPos < 18 && etiquetas.value[currentPos]) currentPos++
    }
  })
  bulkData.value = ''; activeTab.value = 'single'
}

function selectPosition(pos) { formData.position = pos }
function clearAll() { if (confirm('Limpar todas as etiquetas?')) { etiquetas.value = Array(18).fill(null); formData.position = 0 } }
function printSheet() { window.print() }

onMounted(() => { updateNextPosition() })
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto no-print">
    <PageHeader title="🏷️ Gerador de Etiquetas" subtitle="Layout Pimaco (105 x 33mm) para 18 etiquetas por folha A4." />
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div class="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button @click="switchTab('single')" :class="['flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all', activeTab === 'single' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"><UserIcon class="w-4 h-4" /> Individual</button>
            <button @click="switchTab('bulk')" :class="['flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all', activeTab === 'bulk' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"><SquaresPlusIcon class="w-4 h-4" /> Massa</button>
            <button @click="switchTab('settings')" :class="['flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all', activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"><Cog6ToothIcon class="w-4 h-4" /> Config</button>
          </div>
          <div v-if="activeTab === 'single'" class="space-y-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label><input v-model="formData.name" @keyup.enter="addEtiqueta" type="text" placeholder="Ex: João da Silva" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usuário</label><input v-model="formData.usuario" @keyup.enter="addEtiqueta" type="text" placeholder="Ex: joao.silva" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Senha</label><input v-model="formData.password" @keyup.enter="addEtiqueta" type="text" placeholder="Ex: Senha@123" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Posição na Folha</label><select v-model="formData.position" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"><option v-for="i in 18" :key="i-1" :value="i-1">Posição {{ i }}</option></select></div>
            <div class="mt-6 pt-6 border-t border-gray-100"><label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Prévia (Escala 65%)</label><div class="bg-gray-900 p-4 rounded-xl flex justify-center overflow-hidden"><div class="live-preview-label shadow-2xl"><div class="etiqueta-content"><div><strong>Nome:</strong> {{ formData.name || 'Nome do Usuário' }}</div><div><strong>Bitlocker:</strong> {{ settings.bitlocker }}</div><div><strong>Usuário:</strong> {{ formData.usuario || 'usuario.exemplo' }}</div><div><strong>Senha:</strong> {{ formData.password || '••••••••' }}</div><div class="warning-text">{{ settings.warning }}</div></div></div></div></div>
            <button @click="addEtiqueta" class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-6"><PlusIcon class="w-5 h-5" /> Adicionar à Folha</button>
          </div>
          <div v-if="activeTab === 'bulk'" class="space-y-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dados (Nome;Senha;Usuário)</label><textarea v-model="bulkData" rows="8" placeholder="João Silva;Senha123;joao.silva&#10;Maria Souza;Pass456;maria.souza" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"></textarea></div>
            <button @click="processBulk" class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"><DocumentDuplicateIcon class="w-5 h-5" /> Processar Dados</button>
          </div>
          <div v-if="activeTab === 'settings'" class="space-y-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bitlocker Padrão</label><input v-model="settings.bitlocker" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Aviso de Segurança</label><input v-model="settings.warning" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <button @click="printSheet" class="bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"><PrinterIcon class="w-5 h-5" /> Imprimir</button>
          <button @click="clearAll" class="bg-white text-red-600 border border-red-100 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm"><TrashIcon class="w-5 h-5" /> Limpar Tudo</button>
        </div>
      </div>
      <div class="lg:col-span-8">
        <div class="a4-container bg-gray-200 rounded-3xl p-10 flex justify-center overflow-x-auto shadow-inner border-4 border-gray-300">
          <div class="a4-sheet shadow-2xl relative">
            <div v-for="(data, index) in etiquetas" :key="index" @click="selectPosition(index)" :class="['etiqueta transition-all duration-200', data ? 'filled group' : 'empty', formData.position === index ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/30' : '']">
              <div class="etiqueta-number">{{ index + 1 }}</div>
              <div v-if="data" class="etiqueta-content">
                <button @click.stop="removeEtiqueta(index)" class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md opacity-0 hover:bg-red-600 group-hover:opacity-100 transition-opacity btn-remove"><XMarkIcon class="w-3 h-3" /></button>
                <div><strong>Nome:</strong> {{ data.name }}</div>
                <div><strong>Bitlocker:</strong> {{ settings.bitlocker }}</div>
                <div><strong>Usuário:</strong> {{ data.usuario }}</div>
                <div><strong>Senha:</strong> {{ data.password }}</div>
                <div class="warning-text">{{ settings.warning }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="print-only hidden">
    <div class="a4-sheet">
      <div v-for="(data, index) in etiquetas" :key="index" class="etiqueta">
        <div v-if="data" class="etiqueta-content">
          <div><strong>Nome:</strong> {{ data.name }}</div>
          <div><strong>Bitlocker:</strong> {{ settings.bitlocker }}</div>
          <div><strong>Usuário:</strong> {{ data.usuario }}</div>
          <div><strong>Senha:</strong> {{ data.password }}</div>
          <div class="warning-text">{{ settings.warning }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.a4-sheet { width: 210mm; height: 297mm; background: white; display: grid; grid-template-columns: repeat(2, 105mm); grid-template-rows: repeat(9, 33mm); gap: 0; padding: 0; }
.etiqueta { width: 105mm; height: 33mm; padding: 2.5mm 5mm; display: flex; flex-direction: column; justify-content: center; position: relative; background: #fff; cursor: pointer; border: 1px dashed #e2e8f0; color: black; }
.etiqueta.empty:hover { background: #f8fafc; border-color: #3b82f6; z-index: 10; }
.etiqueta.filled { background: white; border: 1px dashed #e2e8f0; }
.etiqueta-number { position: absolute; top: 4px; left: 6px; font-size: 8px; color: #cbd5e1; font-weight: 800; }
.etiqueta-content { font-size: 13px; line-height: 1.35; text-align: left; }
.etiqueta-content strong { color: #000; font-weight: 700; }
.warning-text { font-size: 10.5px; color: #222; margin-top: 3px; font-weight: 700; border-top: 0.5px solid #ccc; padding-top: 2px; }
.live-preview-label { background: white; color: black; padding: 3mm 5mm; width: 105mm; height: 33mm; border: 1px solid #ddd; display: flex; flex-direction: column; justify-content: center; transform: scale(0.65); transform-origin: top left; }
.a4-container { min-width: 230mm; }
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  @page { size: A4; margin: 0; }
  body { margin: 0; padding: 0; background: white; }
  .a4-sheet { box-shadow: none !important; border: none !important; page-break-after: always; }
  .etiqueta { border: none !important; break-inside: avoid; }
}
</style>
