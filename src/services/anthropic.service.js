import { supabase } from '@/services/supabase'
import { useUsageStore } from '@/stores/useUsageStore'

/**
 * Messages API (Claude)
 */
export async function createMessage(messages, model = 'claude-3-5-sonnet-20240620') {
  const usageStore = useUsageStore()
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'anthropic',
        endpoint: '/messages',
        method: 'POST',
        payload: {
          model,
          max_tokens: 1024,
          messages
        }
      }
    })
    
    if (error) throw error
    if (data?.type === 'error' || data?.error) {
      throw new Error(data.error?.message || 'Erro na API da Anthropic')
    }

    if (data.usage) {
      usageStore.trackUsage('anthropic', model, data.usage.input_tokens, data.usage.output_tokens)
    }
    return data
  } catch (error) {
    console.error('Erro na Anthropic API (Proxy):', error)
    return { error: true, message: error.message }
  }
}

/**
 * Count Tokens (Anthropic specific)
 */
export async function countTokens(messages, model = 'claude-3-5-sonnet-20240620') {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'anthropic',
        endpoint: '/messages/count_tokens',
        method: 'POST',
        payload: { model, messages }
      }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao contar tokens Anthropic:', error)
    throw error
  }
}

/**
 * Fetch Usage (Admin)
 */
export async function fetchAnthropicUsage(date) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'anthropic',
        endpoint: `/organizations/usage_report/messages?date=${date}`,
        method: 'GET'
      }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar uso Anthropic:', error)
    throw error
  }
}

export function logAnthropicUsage(model, inputTokens, outputTokens) {
  const usageStore = useUsageStore()
  usageStore.trackUsage('anthropic', model, inputTokens, outputTokens)
}
