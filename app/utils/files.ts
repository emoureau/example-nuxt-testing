export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function formatBytes(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

export function checkImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return `${file.name} is not a supported image`
  if (file.size > MAX_UPLOAD_BYTES)
    return `${file.name} is larger than ${formatBytes(MAX_UPLOAD_BYTES)}`
  return null
}

export function parseTags(input: string): string[] {
  return [...new Set(input.split(',').map(t => t.trim().toLowerCase()).filter(Boolean))]
}
