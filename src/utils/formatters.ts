export const formatDate = (date: string | null | undefined): string => {
  if (!date || date === 'null') return ''
  try {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (e) {
    return String(date)
  }
}

export const formatQuantity = (qty: number | string | null | undefined): string => {
  const val = Number(qty || 0)
  return `${val} шт.`
}
