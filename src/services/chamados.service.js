import { supabase } from '@/services/supabase'

/**
 * Busca dados de um chamado na Aranda via Edge Function.
 */
export async function fetchTicket(ticketNumber) {
  try {
    const { data, error } = await supabase.functions.invoke('chamados', {
      body: {
        action: 'get-ticket',
        ticketNumber: ticketNumber.trim()
      }
    })

    if (error) throw new Error(await getFunctionErrorMessage(error))
    if (data?.error) throw new Error(data.message || data.error.message || 'Erro ao buscar chamado')

    return data
  } catch (error) {
    console.error('Erro ao buscar chamado:', error)
    return { error: true, message: error.message }
  }
}

/**
 * Executa o fluxo de fechamento de chamado.
 */
export async function closeTicket(payload) {
  try {
    const { data, error } = await supabase.functions.invoke('chamados', {
      body: {
        action: 'close-ticket',
        ...payload
      }
    })

    if (error) throw new Error(await getFunctionErrorMessage(error))
    if (data?.error) throw new Error(data.message || data.error.message || 'Erro ao fechar chamado')

    return data
  } catch (error) {
    console.error('Erro ao fechar chamado:', error)
    return { error: true, message: error.message }
  }
}

/**
 * Busca historico de fechamentos.
 */
export async function fetchClosureHistory() {
  try {
    const { data, error } = await supabase
      .from('ticket_closure_logs')
      .select('*')
      .order('closed_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return data.map((item) => ({
      id: item.id,
      ticketNumber: item.ticket_number,
      closedAt: item.closed_at ? new Date(item.closed_at).toLocaleString() : '',
      closedBy: item.closed_by,
      status: item.status,
      descricao: item.descricao,
      resolucao: item.resolucao,
      source: item.source
    }))
  } catch (error) {
    console.error('Erro ao buscar historico:', error)
    return []
  }
}

async function getFunctionErrorMessage(error) {
  try {
    const context = error.context
    if (context?.json) {
      const body = await context.json()
      return body?.message || body?.error?.message || error.message
    }
  } catch (_error) {
    // Keep the original SDK message if the response body cannot be parsed.
  }

  return error.message
}
