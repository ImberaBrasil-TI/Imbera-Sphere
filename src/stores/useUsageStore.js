import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { calculateCost } from '@/config/pricing'

export const useUsageStore = defineStore('usage', () => {
  const usageLog = ref(JSON.parse(localStorage.getItem('system_usage_log') || '[]'))

  const totalCostUSD = computed(() => {
    return usageLog.value.reduce((total, item) => total + item.cost_usd, 0)
  })

  function trackUsage(provider, model, inputTokens, outputTokens) {
    try {
      const cost = calculateCost(provider, model, inputTokens, outputTokens)
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        provider,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost
      }
      
      usageLog.value.push(entry)
      localStorage.setItem('system_usage_log', JSON.stringify(usageLog.value))
    } catch (error) {
      console.error('Error tracking usage:', error)
    }
  }

  function getUsageByProvider(provider) {
    return usageLog.value.filter(item => item.provider === provider)
  }

  function clearLogs() {
    usageLog.value = []
    localStorage.removeItem('system_usage_log')
  }

  return {
    usageLog,
    totalCostUSD,
    trackUsage,
    getUsageByProvider,
    clearLogs
  }
})
