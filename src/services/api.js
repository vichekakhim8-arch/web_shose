// Single entry point for all data access in the app.
// - If VITE_API_URL is set → real REST backend (server/index.js or compatible)
// - Otherwise            → browser localStorage adapter (device-local persistence)
import { httpAdapter } from './httpAdapter.js'
import { localAdapter } from './localAdapter.js'

export const api = import.meta.env.VITE_API_URL ? httpAdapter : localAdapter
export const backendMode = api.mode // 'api' | 'local'
