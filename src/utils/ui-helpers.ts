export type StatusVariant = 'success' | 'info' | 'error' | 'warning' | 'neutral'

export const getStatusVariant = (status: string | null | undefined): StatusVariant => {
  const l = (status || '').toLowerCase()
  if (l.includes('архив') || l.includes('отменен')) return 'neutral'
  if (
    l.includes('работе') ||
    l.includes('готов') ||
    l.includes('стандартная') ||
    l.includes('принят')
  )
    return 'success'
  if (l.includes('брак') || l.includes('ошибка')) return 'error'
  if (l.includes('ожидает') || l.includes('частично')) return 'warning'
  return 'info'
}
