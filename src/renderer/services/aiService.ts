/**
 * AI Service for Groq Cloud API integrations across Habbify.
 * Provides resilient multi-model fallback, reasoning tag stripping,
 * and JSON-mode compatibility.
 */

export const GROQ_SUPPORTED_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'OpenAI GPT-OSS 120B (Flagship & High Reasoning)' },
  { id: 'openai/gpt-oss-20b', label: 'OpenAI GPT-OSS 20B (Ultra Fast & Low Latency)' },
  { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B' },
]

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b'
const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']

const WORKING_MODEL_STORAGE_KEY = 'habbify_working_groq_model'

/**
 * Removes reasoning <think>...</think> tags if emitted by reasoning models.
 */
export function stripThinkingTags(text: string): string {
  if (!text) return ''
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CallGroqChatOptions {
  messages: GroqMessage[]
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' | 'text' | string; [key: string]: any }
  apiKey: string
  preferredModel?: string
}

/**
 * Calls Groq chat completions API with automatic candidate fallback
 * in case a model is decommissioned or unavailable for the user's key.
 */
export async function callGroqChat({
  messages,
  temperature = 0.7,
  max_tokens,
  response_format,
  apiKey,
  preferredModel,
}: CallGroqChatOptions): Promise<any> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No Groq API Key configured. Please add your API key in Settings.')
  }

  const cleanKey = apiKey.trim()
  const cachedWorkingModel = typeof localStorage !== 'undefined'
    ? localStorage.getItem(WORKING_MODEL_STORAGE_KEY)
    : null

  // Build list of candidate models to try in order
  const candidates: string[] = []
  if (preferredModel && preferredModel.trim()) {
    candidates.push(preferredModel.trim())
  }
  if (cachedWorkingModel && !candidates.includes(cachedWorkingModel)) {
    candidates.push(cachedWorkingModel)
  }
  for (const m of FALLBACK_MODELS) {
    if (!candidates.includes(m)) {
      candidates.push(m)
    }
  }

  let lastError: Error | null = null

  for (let i = 0; i < candidates.length; i++) {
    const modelToTry = candidates[i]
    try {
      const body: Record<string, any> = {
        model: modelToTry,
        messages,
        temperature,
      }

      if (typeof max_tokens === 'number') {
        body.max_tokens = max_tokens
      }

      if (response_format) {
        body.response_format = response_format
      }

      // For OpenAI GPT-OSS reasoning models, explicitly set reasoning_format to 'parsed'
      // so thinking tags don't break JSON mode or pollute output
      if (modelToTry.startsWith('openai/gpt-oss')) {
        body.reasoning_format = 'parsed'
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null)
        const errMsg = errorJson?.error?.message || `HTTP ${response.status} ${response.statusText}`
        const isModelAvailabilityError =
          response.status === 404 ||
          errMsg.toLowerCase().includes('does not exist') ||
          errMsg.toLowerCase().includes('do not have access') ||
          errMsg.toLowerCase().includes('decommissioned') ||
          errMsg.toLowerCase().includes('model_not_found')

        if (isModelAvailabilityError && i < candidates.length - 1) {
          console.warn(`[Groq AI] Model "${modelToTry}" failed (${errMsg}). Trying next candidate: "${candidates[i + 1]}"...`)
          lastError = new Error(errMsg)
          continue
        }

        throw new Error(errMsg)
      }

      const data = await response.json()

      // Remember working model
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WORKING_MODEL_STORAGE_KEY, modelToTry)
      }

      // Clean think tags from assistant message
      if (data?.choices?.[0]?.message?.content) {
        data.choices[0].message.content = stripThinkingTags(data.choices[0].message.content)
      }

      return data
    } catch (err: any) {
      lastError = err
      const isRetryable =
        err?.message?.toLowerCase().includes('does not exist') ||
        err?.message?.toLowerCase().includes('do not have access') ||
        err?.message?.toLowerCase().includes('decommissioned') ||
        err?.message?.toLowerCase().includes('model_not_found')

      if (isRetryable && i < candidates.length - 1) {
        console.warn(`[Groq AI] Model "${modelToTry}" error. Retrying with "${candidates[i + 1]}"...`)
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('Failed to communicate with Groq AI.')
}
