import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Preflight response para requisições do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { provider, endpoint, method = 'POST', payload } = body

    let url = ''
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    // Detectar se é uma chamada de relatórios/custos (geralmente exige Admin Key)
    const isAdminRoute = endpoint.includes('organization') || endpoint.includes('organizations')

    if (provider === 'openai') {
      url = `https://api.openai.com/v1${endpoint}`
      // Para chamadas administrativas, tentar usar a OPENAI_ADMIN_KEY (se configurada), senão usar a normal
      const apiKey = isAdminRoute ? (Deno.env.get('OPENAI_ADMIN_KEY') || Deno.env.get('OPENAI_API_KEY')) : Deno.env.get('OPENAI_API_KEY')
      headers.set('Authorization', `Bearer ${apiKey}`)
    } else if (provider === 'anthropic') {
      url = `https://api.anthropic.com/v1${endpoint}`
      // Anthropic exige Admin Key para relatórios de organização
      const apiKey = isAdminRoute ? (Deno.env.get('ANTHROPIC_ADMIN_KEY') || Deno.env.get('ANTHROPIC_API_KEY')) : Deno.env.get('ANTHROPIC_API_KEY')
      headers.set('x-api-key', apiKey!)
      headers.set('anthropic-version', '2023-06-01')
    } else {
      throw new Error('Provedor inválido. Especifique openai ou anthropic.')
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    // Se houver body (payload) e não for um GET/HEAD, enviamos o body
    if (method !== 'GET' && method !== 'HEAD' && payload) {
      fetchOptions.body = JSON.stringify(payload)
    }

    const res = await fetch(url, fetchOptions)
    
    // Suporte a STREAMING (SSE - Server-Sent Events)
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream')) {
      // Repassa o body diretamente (fluxo contínuo) para o frontend Vue
      return new Response(res.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        status: res.status,
      })
    }

    // Tratamento para requisições normais sem streaming
    const resText = await res.text()
    let data
    try {
      data = JSON.parse(resText)
    } catch(e) {
      data = { text: resText } // Devolve como texto caso dê erro no parse
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.status,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
