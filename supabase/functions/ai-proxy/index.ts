import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, anthropic-version, anthropic-beta',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    // Em Supabase, o pathname começa com o nome da função
    let path = url.pathname.replace(/^\/ai-proxy/, '')
    if (!path.startsWith('/')) path = '/' + path

    let provider: 'openai' | 'anthropic' | '' = ''
    let endpoint = ''
    let method = req.method
    let body: any = null
    let isLegacy = false

    const parts = path.split('/').filter(Boolean)

    // 1. Detecção de Roteamento
    if (parts[0] === 'openai' || parts[0] === 'v1') {
      provider = 'openai'
      // Se começou com v1, mantemos o v1 no endpoint, se começou com openai, removemos o prefixo
      endpoint = parts[0] === 'v1' ? path : '/' + parts.slice(1).join('/')
    } else if (parts[0] === 'anthropic') {
      provider = 'anthropic'
      endpoint = '/' + parts.slice(1).join('/')
    } else if (path === '/' || path === '') {
      // Tentar detecção Legada (provider/endpoint no corpo)
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json') && (method === 'POST' || method === 'PUT')) {
        try {
          const clonedReq = req.clone()
          const json = await clonedReq.json()
          if (json.provider && json.endpoint) {
            provider = json.provider
            endpoint = json.endpoint
            method = json.method || method
            body = json.payload ? JSON.stringify(json.payload) : null
            isLegacy = true
          }
        } catch (_e) {
          // Não é um JSON legado válido
        }
      }
    }

    if (!provider) {
      // Se não identificou provedor e é a raiz, retorna info
      if (path === '/' || path === '') {
        return new Response(JSON.stringify({
          status: 'online',
          message: 'AI Proxy is active',
          usage: {
            path_based: '/ai-proxy/openai/v1/... ou /ai-proxy/anthropic/v1/...',
            legacy: 'POST /ai-proxy com {provider, endpoint, payload}'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`Não foi possível identificar o provedor para o caminho: ${path}`)
    }

    // 2. Preparação da Requisição para o Provedor
    const targetHeaders = new Headers()
    
    // Adicionar query params se existirem
    if (url.search && !endpoint.includes('?')) {
      endpoint += url.search
    }

    // Identificar se é uma rota administrativa/uso/custos
    const isAdminRoute = 
      endpoint.includes('/organization') || 
      endpoint.includes('/organizations') || 
      endpoint.includes('/usage') || 
      endpoint.includes('/costs') ||
      endpoint.includes('/admin/')

    if (provider === 'openai') {
      const apiKey = isAdminRoute 
        ? (Deno.env.get('OPENAI_ADMIN_KEY') || Deno.env.get('OPENAI_API_KEY'))
        : Deno.env.get('OPENAI_API_KEY')
      
      if (!apiKey) throw new Error('OPENAI_API_KEY não configurada no ambiente')
      
      targetHeaders.set('Authorization', `Bearer ${apiKey}`)
      
      const targetUrl = `https://api.openai.com${endpoint.startsWith('/v1') ? endpoint : '/v1' + endpoint}`

      if (!isLegacy && method !== 'GET' && method !== 'HEAD') {
        body = req.body
      }
      
      // Repassar Content-Type se não for multipart
      const reqContentType = req.headers.get('content-type')
      if (reqContentType && !reqContentType.includes('multipart/form-data')) {
        targetHeaders.set('Content-Type', reqContentType)
      }

      const response = await fetch(targetUrl, { method, headers: targetHeaders, body })
      return handleResponse(response)

    } else if (provider === 'anthropic') {
      const apiKey = isAdminRoute 
        ? (Deno.env.get('ANTHROPIC_ADMIN_KEY') || Deno.env.get('ANTHROPIC_API_KEY'))
        : Deno.env.get('ANTHROPIC_API_KEY')
      
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada no ambiente')

      targetHeaders.set('x-api-key', apiKey)
      targetHeaders.set('anthropic-version', req.headers.get('anthropic-version') || '2023-06-01')
      
      const anthropicBeta = req.headers.get('anthropic-beta')
      if (anthropicBeta) {
        targetHeaders.set('anthropic-beta', anthropicBeta)
      }

      const targetUrl = `https://api.anthropic.com${endpoint.startsWith('/v1') ? endpoint : '/v1' + endpoint}`

      if (!isLegacy && method !== 'GET' && method !== 'HEAD') {
        body = req.body
      }
      
      targetHeaders.set('Content-Type', req.headers.get('content-type') || 'application/json')

      const response = await fetch(targetUrl, { method, headers: targetHeaders, body })
      return handleResponse(response)
    }

    throw new Error(`Provedor ${provider} não suportado`)

  } catch (error: any) {
    console.error(`[AI Proxy Error] ${error.message}`)
    return new Response(JSON.stringify({
      error: {
        message: error.message,
        type: 'proxy_error'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleResponse(res: Response) {
  const responseHeaders = new Headers(corsHeaders)
  
  // Encaminhar headers relevantes da resposta
  const forwardHeaders = ['content-type', 'cache-control', 'openai-beta', 'anthropic-version', 'x-request-id']
  forwardHeaders.forEach(h => {
    const value = res.headers.get(h)
    if (value) responseHeaders.set(h, value)
  })

  // Suporte a Streaming (SSE)
  if (res.headers.get('content-type')?.includes('text/event-stream')) {
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    })
  }

  // Respostas Normais
  const data = await res.arrayBuffer()
  return new Response(data, {
    status: res.status,
    headers: responseHeaders,
  })
}
