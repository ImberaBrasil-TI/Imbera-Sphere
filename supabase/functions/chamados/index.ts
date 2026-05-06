import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ARANDA_BASE_URL = 'https://aeritek.arandasoft.com/ASMSAPI/api/v9'

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

    throw new Error(`Acao ${action} nao suportada`)
  } catch (error: any) {
    return errorResponse(error.message)
  }
})

async function handleGetTicket(ticketNumber: string | number) {
  const arandaToken = Deno.env.get('ARANDA_TOKEN')

  if (!arandaToken) {
    if (Deno.env.get('ARANDA_SIMULATION_MODE') === 'true') {
      return jsonResponse({
        id: ticketNumber,
        requesterName: 'Usuario Simulado',
        subject: 'Problema de Acesso (Simulado)',
        description: 'Esta e uma descricao vinda do modo de simulacao da Edge Function.',
        stateName: 'Em Atendimento',
        groupName: 'TI - Suporte',
        specialistName: 'Analista Teste',
        serviceName: 'Sistemas',
        creationDate: new Date().toISOString()
      })
    }

    return errorResponse('ARANDA_TOKEN nao configurado na Edge Function chamados.')
  }

  const result = await getTicketByInput(ticketNumber, arandaToken)

  if (!result.ok) {
    return errorResponse(result.message, result.data)
  }

  return jsonResponse(normalizeTicket(result.data))
}

async function handleCloseTicket(payload: any, supabase: any) {
  const { ticketNumber, descricao, resolucao, closedBy, sendWhatsapp, updateSupabase } = payload
  const arandaToken = Deno.env.get('ARANDA_TOKEN')

  if (!arandaToken) {
    throw new Error('ARANDA_TOKEN nao configurado na Edge Function chamados.')
  }

  const currentTicket = await getTicketByInput(ticketNumber, arandaToken)
  if (!currentTicket.ok) {
    throw new Error(currentTicket.message)
  }

  const ticket = currentTicket.data ?? {}
  if (isClosedState(ticket.stateName)) {
    throw new Error(`Chamado ${ticketNumber} ja esta ${ticket.stateName}.`)
  }

  const basePayload = {
    id: Number(ticket.id ?? ticketNumber),
    itemType: ticket.itemType ?? 4,
    itemVersion: ticket.itemVersion ?? 1,
    modelId: ticket.modelId ?? 18,
    consoleType: 'specialist',
    listAdditionalField: ticket.listAdditionalField ?? []
  }

  const commentary = [
    `Descricao: ${descricao}`,
    `Resolucao: ${resolucao}`,
    `Solicitante: ${ticket.requesterName ?? ticket.applicantName ?? 'N/A'}`,
    `Aberto em: ${ticket.creationDate ?? 'N/A'}`
  ].join('\n')

  const firstPayload = {
    ...basePayload,
    stateId: 214,
    commentary
  }

  const arandaItemId = String(ticket.id ?? ticketNumber)

  const firstUpdate = await arandaRequest(`/item/${arandaItemId}`, arandaToken, {
    method: 'PUT',
    body: firstPayload
  })
  if (!firstUpdate.ok) {
    throw new Error(firstUpdate.message)
  }

  const refreshedTicket = await arandaRequest(`/item/${arandaItemId}`, arandaToken)
  const finalPayload = {
    ...basePayload,
    itemVersion: refreshedTicket.data?.itemVersion ?? basePayload.itemVersion,
    stateId: 217,
    commentary: resolucao,
    description: `${descricao}\n\n${resolucao}`
  }

  const finalUpdate = await arandaRequest(`/item/${arandaItemId}`, arandaToken, {
    method: 'PUT',
    body: finalPayload
  })
  if (!finalUpdate.ok) {
    throw new Error(finalUpdate.message)
  }

  let supabaseStatus = 'Ignorado'
  if (updateSupabase) {
    const { error: updateError } = await supabase
      .from('chamados')
      .update({ status: 'CERRADO' })
      .eq('numero_aranda', ticketNumber)

    supabaseStatus = updateError ? `Erro: ${updateError.message}` : 'Sucesso'
  }

  const whatsappStatus = await maybeSendWhatsapp(ticketNumber, resolucao, sendWhatsapp, supabase)

  const { error: logError } = await supabase
    .from('ticket_closure_logs')
    .insert({
      ticket_number: ticketNumber,
      descricao,
      resolucao,
      closed_by: closedBy,
      status: 'Sucesso',
      source: 'imbera-sphere',
      aranda_status: 'Sucesso',
      supabase_status: supabaseStatus,
      whatsapp_status: whatsappStatus,
      payload_aranda: { firstPayload, finalPayload },
      response_aranda: { firstUpdate: firstUpdate.data, finalUpdate: finalUpdate.data }
    })

  if (logError) console.error('Erro ao salvar log:', logError)

  return jsonResponse({
    success: true,
    arandaStatus: 'Sucesso',
    supabaseStatus,
    whatsappStatus
  })
}

async function maybeSendWhatsapp(ticketNumber: string, resolucao: string, sendWhatsapp: boolean, supabase: any) {
  if (!sendWhatsapp) return 'Ignorado'

  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')

  if (!evolutionUrl || !evolutionKey) {
    return 'EVOLUTION_API_URL ou EVOLUTION_API_KEY nao configurado'
  }

  const { data: ticketData } = await supabase
    .from('chamados')
    .select('group_jid')
    .eq('numero_aranda', ticketNumber)
    .single()

  if (!ticketData?.group_jid) return 'Sem group_jid'

  const message = [
    '*Chamado Encerrado!*',
    '',
    `*Numero do Chamado:* ${ticketNumber}`,
    '',
    'Seu chamado foi encerrado com sucesso pela equipe de TI.',
    '',
    '*Resumo da solucao:*',
    resolucao,
    '',
    '_Suporte TI - Imbera Brasil_'
  ].join('\n')

  const response = await fetch(`${evolutionUrl}/message/sendText/imbera`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
    body: JSON.stringify({
      number: ticketData.group_jid,
      text: message
    })
  })

  return response.ok ? 'Sucesso' : `Erro WhatsApp (${response.status})`
}

async function getTicketByInput(ticketInput: string | number, token: string) {
  const normalizedInput = String(ticketInput).trim()

  if (/^\d+$/.test(normalizedInput)) {
    return await arandaRequest(`/item/${normalizedInput}`, token)
  }

  const searchResult = await searchTicketByIdByProject(normalizedInput, token)
  if (!searchResult.ok) return searchResult

  const ticket = searchResult.data
  if (!ticket?.id) {
    return {
      ok: false,
      status: 404,
      data: searchResult.data,
      message: `Chamado ${normalizedInput} nao encontrado pelo idByProject.`
    }
  }

  return await arandaRequest(`/item/${ticket.id}`, token)
}

async function searchTicketByIdByProject(idByProject: string, token: string) {
  const projectId = Number(Deno.env.get('ARANDA_PROJECT_ID') ?? '2')
  const criteriaVariants = [
    [{
      fieldName: 'idByProject',
      fieldValue: 'idByProject',
      operatorName: 'Equals',
      operatorValue: '=',
      value: idByProject,
      valueName: idByProject,
      type: 1
    }],
    {
      fieldName: 'idByProject',
      fieldValue: 'idByProject',
      operatorName: 'Equals',
      operatorValue: '=',
      value: idByProject,
      valueName: idByProject,
      type: 1
    },
    [{
      fieldName: 'idByProject',
      fieldValue: 'idByProject',
      operatorName: 'Contains',
      operatorValue: 'contains',
      value: idByProject,
      valueName: idByProject,
      type: 1
    }],
    {
      fieldName: 'idByProject',
      fieldValue: 'idByProject',
      operatorName: 'Contains',
      operatorValue: 'contains',
      value: idByProject,
      valueName: idByProject,
      type: 1
    },
    [{
      fieldName: 'idByProject',
      fieldValue: idByProject,
      operatorName: 'Equals',
      operatorValue: '=',
      value: idByProject,
      valueName: idByProject,
      type: 1
    }],
    {
      fieldName: 'IdByProject',
      fieldValue: 'IdByProject',
      operatorName: 'Equals',
      operatorValue: '=',
      value: idByProject,
      valueName: idByProject,
      type: 1
    }
  ]

  for (const criteria of criteriaVariants) {
    const result = await searchTicketByCriteria(criteria, token, projectId)
    const exactMatch = findExactIdByProject(result.data?.content, idByProject)

    if (result.ok && exactMatch) {
      return { ...result, data: exactMatch }
    }
  }

  const textResult = await searchTicketByText(idByProject, token, projectId, idByProject)
  if (textResult.ok) return textResult

  const sequence = idByProject.match(/(\d+)$/)?.[1]
  if (sequence) {
    return await searchTicketByText(sequence, token, projectId, idByProject)
  }

  return textResult
}

async function searchTicketByCriteria(criteria: any, token: string, projectId: number) {
  return await arandaRequest('/item/search', token, {
    method: 'POST',
    body: {
      criteria,
      level: 0,
      orderField: 'openedDate',
      orderType: 'desc',
      pageIndex: 0,
      pageSize: 100,
      projects: [{ project: projectId }],
      repository: 3,
      types: [{ itemType: 4 }]
    }
  })
}

async function searchTicketByText(searchText: string, token: string, projectId: number, expectedIdByProject = searchText) {
  const result = await arandaRequest('/item/search', token, {
    method: 'POST',
    body: {
      criteria: [],
      filterText: searchText,
      level: 0,
      orderField: 'openedDate',
      orderType: 'desc',
      pageIndex: 0,
      pageSize: 100,
      projects: [{ project: projectId }],
      repository: 3,
      types: [{ itemType: 4 }]
    }
  })

  const exactMatch = findExactIdByProject(result.data?.content, expectedIdByProject)

  if (result.ok && exactMatch) {
    return { ...result, data: exactMatch }
  }

  return {
    ok: false,
    status: 404,
    data: {
      totalItems: result.data?.totalItems,
      totalPage: result.data?.totalPage
    },
    message: `Chamado ${expectedIdByProject} nao encontrado pelo idByProject.`
  }
}

function findExactIdByProject(content: any, idByProject: string) {
  if (!Array.isArray(content)) return null
  return content.find((item: any) =>
    String(item.idByProject ?? '').trim().toLowerCase() === idByProject.trim().toLowerCase()
  ) ?? null
}

async function arandaRequest(path: string, token: string, options: { method?: string; body?: any } = {}) {
  const response = await fetch(`${ARANDA_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: getArandaHeaders(token),
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const text = await response.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch (_error) {
    data = text
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    message: response.ok
      ? 'OK'
      : (data?.message || data?.Message || `Erro na API Aranda (${response.status})`)
  }
}

function getAuthorizationHeader(token: string) {
  const trimmedToken = token.trim()
  return /^(bearer|basic)\s+/i.test(trimmedToken)
    ? trimmedToken
    : `Bearer ${trimmedToken}`
}

function getArandaHeaders(token: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Authorization': getAuthorizationHeader(token)
  }

  const tenantAlias = Deno.env.get('ARANDA_TENANT_ALIAS')
  if (tenantAlias) {
    headers['x-aranda-tenant-alias'] = tenantAlias
  }

  return headers
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function normalizeTicket(ticket: any) {
  return {
    ...ticket,
    requesterName: ticket.requesterName ?? ticket.applicantName ?? ticket.clientName,
    stateName: ticket.stateName ?? ticket.state?.name,
    groupName: ticket.groupName ?? ticket.responsibleGroupName,
    specialistName: ticket.specialistName ?? ticket.responsibleName,
    serviceName: ticket.serviceName ?? ticket.service?.name,
    creationDate: ticket.creationDate ?? ticket.openedDate ?? ticket.createdDate
  }
}

function isClosedState(stateName: string | undefined) {
  if (!stateName) return false
  return ['cerrado', 'cerrada', 'fechado', 'fechada', 'closed'].includes(stateName.trim().toLowerCase())
}

function errorResponse(message: string, details: any = null) {
  return jsonResponse({
    error: {
      message,
      details
    },
    message
  })
}
