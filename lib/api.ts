/**
 * Get the correct API URL based on configuration or current hostname
 * This allows the app to work from any IP address or localhost
 * 
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (if set)
 * 2. Dynamic detection based on current hostname
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  // If NEXT_PUBLIC_API_URL is set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  const hostname = window.location.hostname
  
  // For localhost or 127.0.0.1, use localhost:8000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000'
  }

  // For any other IP/hostname, use the same hostname with port 8000
  return `http://${hostname}:8000`
}
