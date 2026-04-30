import { supabase } from '@/services/supabase'
import { useUsageStore } from '@/stores/useUsageStore'

/**
 * Chat Completions
 */
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
    console.error('Erro na OpenAI API (Proxy - Chat):', error)
    return { error: true, message: error.message }
  }
}

/**
 * List Models
 */
export async function listModels() {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'openai',
        endpoint: '/models',
        method: 'GET'
      }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar modelos OpenAI:', error)
    throw error
  }
}

/**
 * Create Embeddings
 */
export async function createEmbedding(input, model = 'text-embedding-3-small') {
  const usageStore = useUsageStore()
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'openai',
        endpoint: '/embeddings',
        method: 'POST',
        payload: { model, input }
      }
    })
    if (error) throw error
    if (data.usage) {
      usageStore.trackUsage('openai', model, data.usage.total_tokens, 0)
    }
    return data
  } catch (error) {
    console.error('Erro ao criar embedding:', error)
    throw error
  }
}

/**
 * Create Images (DALL-E)
 */
export async function createImage(prompt, model = 'dall-e-3', n = 1, size = '1024x1024') {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'openai',
        endpoint: '/images/generations',
        method: 'POST',
        payload: { model, prompt, n, size }
      }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao gerar imagem:', error)
    throw error
  }
}

/**
 * Create Transcription (Whisper)
 * Note: For files, we use the path-based routing of the proxy
 */
export async function createTranscription(file, model = 'whisper-1') {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', model)

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy/openai/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'X-Client-Info': `supabase-js-v2`,
        'Authorization-User': session?.access_token ? `Bearer ${session.access_token}` : ''
      },
      body: formData
    })

    const result = await response.json()
    if (result.error) throw new Error(result.error.message)
    return result
  } catch (error) {
    console.error('Erro na transcrição de áudio:', error)
    throw error
  }
}

/**
 * Create Moderation
 */
export async function createModeration(input, model = 'text-moderation-latest') {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider: 'openai',
        endpoint: '/moderations',
        method: 'POST',
        payload: { model, input }
      }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro na moderação:', error)
    throw error
  }
}

/**
 * Fetch Usage (Admin/Organization)
 */
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
