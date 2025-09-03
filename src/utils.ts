import { TIME_FORMATS } from './constants'

// Utility functions
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now() / 1000
  const diff = now - timestamp
  
  if (diff < 60) return `${Math.floor(diff)} ${TIME_FORMATS.SECONDS_AGO}`
  if (diff < 3600) return `${Math.floor(diff / 60)} ${TIME_FORMATS.MINUTES_AGO}`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${TIME_FORMATS.HOURS_AGO}`
  return `${Math.floor(diff / 86400)} ${TIME_FORMATS.DAYS_AGO}`
}

export const extractDomain = (url: string): string => {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}