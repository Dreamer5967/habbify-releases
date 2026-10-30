/**
 * AI Service for Groq Cloud API integrations across Habbify.
 * Provides resilient multi-model fallback, reasoning tag stripping,
 * and JSON-mode compatibility.
 */

export const GROQ_SUPPORTED_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Meta Llama 3.3 70B (Recommended & Fast)' },
  { id: 'llama3-70b-8192', label: 'Meta Llama 3 70B (High Stability)' },
  { id: 'llama3-8b-8192', label: 'Meta Llama 3 8B (Ultra Low Latency)' },
  { id: 'openai/gpt-oss-120b', label: 'OpenAI GPT-OSS 120B (High Reasoning)' },
  { id: 'openai/gpt-oss-20b', label: 'OpenAI GPT-OSS 20B (Fast Reasoning)' },
  { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B' },
  { id: 'llama-3.1-8b-instant', label: 'Meta Llama 3.1 8B Instant' },
]

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'

const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.1-8b-instant',
]

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
 * in case a model is decommissioned, rate-limited, or unavailable for the user's key.
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

  // Build ordered list of candidate models to try
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

      // Only set reasoning_format for OpenAI GPT-OSS when not using json_object mode,
      // because Groq returns HTTP 400 if both reasoning_format and json_object response_format are set together
      if (modelToTry.startsWith('openai/gpt-oss') && (!response_format || response_format.type !== 'json_object')) {
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
        const errType = errorJson?.error?.type || ''
        const errCode = errorJson?.error?.code || ''

        // If the API key itself is explicitly invalid, stop early
        const isInvalidKey =
          response.status === 401 &&
          (errMsg.toLowerCase().includes('invalid api key') ||
           errCode === 'invalid_api_key' ||
           errType === 'invalid_request_error')

        if (isInvalidKey) {
          throw new Error('Invalid Groq API key. Please check your key in Settings.')
        }

        // Retryable error: model decommissioned, not found, unsupported parameter, 400/404/422/500
        const isRetryable =
          response.status === 400 ||
          response.status === 403 ||
          response.status === 404 ||
          response.status === 422 ||
          response.status >= 500 ||
          errMsg.toLowerCase().includes('does not exist') ||
          errMsg.toLowerCase().includes('do not have access') ||
          errMsg.toLowerCase().includes('decommissioned') ||
          errMsg.toLowerCase().includes('model_not_found') ||
          errMsg.toLowerCase().includes('not supported') ||
          errMsg.toLowerCase().includes('unsupported') ||
          errMsg.toLowerCase().includes('reasoning_format')

        if (isRetryable && i < candidates.length - 1) {
          console.warn(`[Groq AI] Model "${modelToTry}" failed (${errMsg}). Trying next candidate: "${candidates[i + 1]}"...`)
          lastError = new Error(errMsg)
          continue
        }

        throw new Error(errMsg)
      }

      const data = await response.json()

      // Remember verified working model
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WORKING_MODEL_STORAGE_KEY, modelToTry)
      }

      // Clean think tags from assistant message if reasoning leaked through
      if (data?.choices?.[0]?.message?.content) {
        data.choices[0].message.content = stripThinkingTags(data.choices[0].message.content)
      }

      return data
    } catch (err: any) {
      lastError = err

      // Check if this error is an invalid key
      if (err?.message?.toLowerCase().includes('invalid groq api key')) {
        throw err
      }

      const isRetryable =
        err?.message?.toLowerCase().includes('does not exist') ||
        err?.message?.toLowerCase().includes('do not have access') ||
        err?.message?.toLowerCase().includes('decommissioned') ||
        err?.message?.toLowerCase().includes('model_not_found') ||
        err?.message?.toLowerCase().includes('not supported') ||
        err?.message?.toLowerCase().includes('unsupported') ||
        err?.message?.toLowerCase().includes('http 400') ||
        err?.message?.toLowerCase().includes('http 404') ||
        err?.message?.toLowerCase().includes('http 422') ||
        err?.message?.toLowerCase().includes('http 50')

      if (isRetryable && i < candidates.length - 1) {
        console.warn(`[Groq AI] Model "${modelToTry}" error (${err.message}). Retrying with "${candidates[i + 1]}"...`)
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('Failed to communicate with Groq AI.')
}
