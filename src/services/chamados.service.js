import { supabase } from '@/services/supabase'

/**
 * Busca dados de um chamado na Aranda (via Proxy/Edge Function)
 */
export async function fetchTicket(ticketNumber) {
  try {
    const { data, error } = await supabase.functions.invoke('chamados', {
      body: {
        action: 'get-ticket',
        ticketNumber: ticketNumber.replace(/\D/g, '')
      }
    })
    
    if (error) throw error
    if (data?.error) throw new Error(data.error.message || 'Erro ao buscar chamado')
    
    return data
  } catch (error) {
    console.error('Erro ao buscar chamado:', error)
    return { error: true, message: error.message }
  }
}

/**
 * Executa o fluxo de fechamento de chamado
 */
export async function closeTicket(payload) {
  try {
    const { data, error } = await supabase.functions.invoke('chamados', {
      body: {
        action: 'close-ticket',
        ...payload
      }
    })
    
    if (error) throw error
    if (data?.error) throw new Error(data.error.message || 'Erro ao fechar chamado')
    
    return data
  } catch (error) {
    console.error('Erro ao fechar chamado:', error)
    return { error: true, message: error.message }
  }
}

/**
 * Busca histórico de fechamentos
 */
export async function fetchClosureHistory() {
  try {
    const { data, error } = await supabase
      .from('ticket_closure_logs')
      .select('*')
      .order('closed_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return []
  }
}
