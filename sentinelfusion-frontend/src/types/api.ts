export interface ApiMeta {
  timestamp: string
  version: string
}

export interface ApiResponse<T> {
  data: T
  meta?: ApiMeta
}

export type ApiErrorType = 'network' | 'auth' | 'not-found' | 'server' | 'unknown'

export const API_ERROR_MESSAGES: Record<ApiErrorType, string> = {
  network: 'Unable to connect to server. Check your connection.',
  auth: 'Authentication failed. Please log in again.',
  'not-found': 'Data not found.',
  server: 'Server error. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
}

export class ApiError extends Error {
  readonly type: ApiErrorType
  readonly status: number | null

  constructor(type: ApiErrorType, status: number | null = null, message?: string, cause?: unknown) {
    super(message ?? API_ERROR_MESSAGES[type], cause === undefined ? undefined : { cause })
    this.name = 'ApiError'
    this.type = type
    this.status = status
  }

  static fromStatus(status: number): ApiError {
    if (status === 401 || status === 403) return new ApiError('auth', status)
    if (status === 404) return new ApiError('not-found', status)
    if (status >= 500) return new ApiError('server', status)
    return new ApiError('unknown', status)
  }
}
