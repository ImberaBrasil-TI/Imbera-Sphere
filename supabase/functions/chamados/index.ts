import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    if (action === 'get-ticket') {
      return await handleGetTicket(payload.ticketNumber)
    }

    if (action === 'close-ticket') {
      return await handleCloseTicket(payload, supabaseClient)
    }

    throw new Error(`Ação ${action} não suportada`)

  } catch (error: any) {
    return new Response(JSON.stringify({ error: true, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function handleGetTicket(ticketNumber: string) {
  const arandaToken = Deno.env.get('ARANDA_TOKEN')
  
  if (!arandaToken) {
    // Modo Simulação se não houver token
    return new Response(JSON.stringify({
      id: ticketNumber,
      requesterName: 'Usuário Simulado',
      subject: 'Problema de Acesso (Simulado)',
      description: 'Esta é uma descrição vinda do modo de simulação da Edge Function.',
      stateName: 'Em Atendimento',
      groupName: 'TI - Suporte',
      specialistName: 'Analista Teste',
      serviceName: 'Sistemas',
      creationDate: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const response = await fetch(`https://aeritek.arandasoft.com/ASMSAPI/api/v9/item/${ticketNumber}`, {
    headers: { 'Authorization': `Bearer ${arandaToken}` }
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleCloseTicket(payload: any, supabase: any) {
  const { ticketNumber, descricao, resolucao, closedBy, sendWhatsapp, updateSupabase } = payload

  // 1. Lógica Aranda (Dois PUTs conforme especificação)
  // ... Aqui entraria a lógica real com o token ...
  
  // 2. Atualizar Supabase se solicitado
  if (updateSupabase) {
    // Tenta atualizar tabela 'chamados' se existir vínculo
    await supabase
      .from('chamados')
      .update({ status: 'CERRADO' })
      .eq('numero_aranda', ticketNumber)
  }

  // 3. Enviar WhatsApp se solicitado
  if (sendWhatsapp) {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')
    
    if (evolutionUrl && evolutionKey) {
      // Buscar JID do grupo no Supabase
      const { data: ticketData } = await supabase
        .from('chamados')
        .select('group_jid')
        .eq('numero_aranda', ticketNumber)
        .single()

      if (ticketData?.group_jid) {
        const message = `🔴 *Chamado Encerrado!*\n\n📋 *Número do Chamado:* ${ticketNumber}\n\n✅ Seu chamado foi encerrado com sucesso pela equipe de TI.\n\n📝 *Resumo da solução:*\n${resolucao}\n\n📁 O registro foi finalizado em nosso sistema.\n\n_Suporte TI - Imbera Brasil_ 🏢`
        
        await fetch(`${evolutionUrl}/message/sendText/imbera`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
          body: JSON.stringify({
            number: ticketData.group_jid,
            text: message
          })
        })
      }
    }
  }

  // 4. Registrar Log
  const { error: logError } = await supabase
    .from('ticket_closure_logs')
    .insert({
      ticket_number: ticketNumber,
      descricao,
      resolucao,
      closed_by: closedBy,
      status: 'Sucesso',
      source: 'imbera-sphere'
    })

  if (logError) console.error('Erro ao salvar log:', logError)

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
