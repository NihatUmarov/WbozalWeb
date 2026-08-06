import * as XLSX from 'xlsx'

/**
 * Экспортирует массив объектов в Excel файл
 * @param data Данные для экспорта
 * @param fileName Имя файла (без расширения)
 * @param sheetName Имя листа
 */
export function exportToExcel(data: Record<string, unknown>[], fileName: string = 'export', sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) return

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Генерируем и скачиваем файл
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
