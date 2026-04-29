// src/config/pricing.js
// Preços em USD por 1 MILHÃO de tokens (Abril 2026)
export const PRICING = {
  openai: {
    'gpt-4o':          { input: 2.50,  output: 10.00 },
    'gpt-4o-mini':     { input: 0.15,  output: 0.60  },
    'gpt-4.1-2025-04-14': { input: 2.50,  output: 10.00 }, // From HTML
    'gpt-4-turbo':     { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo':   { input: 0.50,  output: 1.50  },
  },
  anthropic: {
    'claude-3-5-sonnet-20240620':   { input: 3.00,  output: 15.00 },
    'claude-sonnet-4-6-20251001':   { input: 3.00,  output: 15.00 }, // From HTML
    'claude-opus-4-20250514':       { input: 15.00, output: 75.00 },
    'claude-sonnet-4-20250514':     { input: 3.00,  output: 15.00 },
    'claude-haiku-4-5-20251001':    { input: 0.80,  output: 4.00  },
  },
}

/**
 * Calcula o custo em USD
 * @param {string} provider - 'openai' | 'anthropic'
 * @param {string} model - ID do modelo
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number} custo em USD
 */
export function calculateCost(provider, model, inputTokens, outputTokens) {
  const providerPricing = PRICING[provider]
  if (!providerPricing) return 0
  
  // Try exact match first
  let prices = providerPricing[model]
  
  // If not found, try to find a base model match (e.g. gpt-4o-2024-08-06 -> gpt-4o)
  if (!prices) {
    const baseModel = Object.keys(providerPricing).find(key => model.startsWith(key))
    if (baseModel) prices = providerPricing[baseModel]
  }

  if (!prices) return 0
  
  const inputCost  = (inputTokens  / 1_000_000) * prices.input
  const outputCost = (outputTokens / 1_000_000) * prices.output
  return inputCost + outputCost
}

export const USD_TO_BRL = 5.10 // Atualizar conforme necessário

/**
 * Converte valor USD para string formatada em BRL
 * @param {number} usdValue 
 * @returns {string}
 */
export function toBRL(usdValue) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(usdValue * USD_TO_BRL)
}
