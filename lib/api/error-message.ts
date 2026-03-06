type ApiErrorBody = {
  message?: unknown
  details?: unknown
  errors?: Record<string, unknown>
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request could not be processed.',
  401: 'Your session is not authorized. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested record was not found.',
  409: 'This request conflicts with existing data.',
  413: 'The submitted content is too large.',
  422: 'Some fields have invalid values.',
  429: 'Too many requests were sent. Please try again shortly.',
  500: 'The server ran into an issue while processing your request.',
  502: 'The server is temporarily unavailable.',
  503: 'The service is temporarily unavailable.',
  504: 'The server took too long to respond.',
}

const toTextList = (value: unknown): string[] => {
  if (typeof value === 'string' && value.trim().length > 0) return [value.trim()]
  if (!Array.isArray(value)) return []

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

const extractValidationMessages = (errors: unknown): string[] => {
  if (!errors || typeof errors !== 'object') return []

  return Object.values(errors as Record<string, unknown>)
    .flatMap((entry) => toTextList(entry))
}

const readApiErrorBody = async (response: Response): Promise<ApiErrorBody | null> => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const body = await readApiErrorBody(response)
  const validationMessages = extractValidationMessages(body?.errors)

  if (validationMessages.length > 0) {
    return validationMessages.join(' ')
  }

  if (typeof body?.message === 'string' && body.message.trim().length > 0) {
    const message = body.message.trim()
    if (typeof body?.details === 'string' && body.details.trim().length > 0) {
      return `${message}: ${body.details.trim()}`
    }
    return message
  }

  return STATUS_MESSAGES[response.status] || fallback
}

export const ensureOkResponse = async (response: Response, fallback: string): Promise<void> => {
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, fallback))
  }
}
