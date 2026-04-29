import { supabase } from '@/services/supabase'
import { useUsageStore } from '@/stores/useUsageStore'

export async function chatCompletion(messages, model = 'gpt-4o') {
  const usageStore = useUsageStore()
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'openai',
        endpoint: '/chat/completions',
        method: 'POST',
        payload: {
          model,
          messages
        }
      }
    })
    
    if (error) throw error
    if (data?.error) throw new Error(data.error.message || 'Erro na API da OpenAI')

    if (data.usage) {
      usageStore.trackUsage('openai', data.model, data.usage.prompt_tokens, data.usage.completion_tokens)
    }
    return data
  } catch (error) {
    console.error('Erro na OpenAI API (Proxy):', error)
    return { error: true, message: error.message }
  }
}

export async function fetchOpenAIUsage(date) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'openai',
        endpoint: `/usage?date=${date}`,
        method: 'GET'
      }
    })
    
    if (error) throw error
    if (data?.error) throw new Error(data.error.message || 'Erro ao buscar uso')
      
    return data
  } catch (error) {
    console.error('Erro ao buscar uso OpenAI (Proxy):', error)
    throw error
  }
}
