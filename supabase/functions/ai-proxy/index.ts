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

    if (provider === 'openai') {
      url = `https://api.openai.com/v1${endpoint}`
      headers.set('Authorization', `Bearer ${Deno.env.get('OPENAI_API_KEY')}`)
    } else if (provider === 'anthropic') {
      url = `https://api.anthropic.com/v1${endpoint}`
      headers.set('x-api-key', Deno.env.get('ANTHROPIC_API_KEY')!)
      headers.set('anthropic-version', '2023-06-01')
    } else {
      throw new Error('Provedor inválido. Especifique openai ou anthropic.')
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    if (method !== 'GET' && method !== 'HEAD' && payload) {
      fetchOptions.body = JSON.stringify(payload)
    }

    const res = await fetch(url, fetchOptions)
    
    // Tratamento para não estourar caso a resposta não seja JSON válido
    const resText = await res.text()
    let data
    try {
      data = JSON.parse(resText)
    } catch(e) {
      data = { text: resText }
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
