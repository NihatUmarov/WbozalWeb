import * as XLSX from 'xlsx'
import type { StockDocumentDetailItem } from '@/api/InvoiceService'

export class ExcelDocumentExporter {
  /**
   * @param items Массив позиций документа из API
   * @param documentId ID накладной для названия файла и листа
   * @param modelType Тип модели (FBO, ORD или DEF) для кастомизации колонок
   */
  public static exportDetails(
    items: StockDocumentDetailItem[],
    documentId: number,
    modelType: 'FBO' | 'ORD' | 'DEF', // <- Расширили тип здесь
  ): void {
    if (!items || items.length === 0) {
      throw new Error('Нет данных для экспорта')
    }

    // Формируем плоский массив объектов с понятными русскими заголовками колонок
    const dataToExport = items.map((item) => {
      const row: Record<string, string | number> = {
        'ID товара': item.idName,
        Артикул: item.cArt || '—',
        'Наименование товара': item.cName || 'Без названия',
        Штрихкод: item.barcode || '—',
        'План (Кол-во)': item.qty,
        'Факт (Принято)': item.qtyFact,
      }

      // Добавляем колонку "Брак" только если это приход (FBO)
      if (modelType === 'FBO') {
        row['Брак'] = item.qtyDefect ?? 0
      }

      return row
    })

    // Создаем лист и книгу XLSX
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, `Накладная №${documentId}`)

    // Автоматический расчет ширины колонок по содержимому
    const objectKeys = Object.keys(dataToExport[0])
    worksheet['!cols'] = objectKeys.map((key) => {
      const maxColumnLength = Math.max(
        key.length,
        ...dataToExport.map((row) => String(row[key] ?? '').length),
      )
      return { wch: maxColumnLength + 3 } // добавляем небольшой паддинг для красоты
    })

    // Запускаем скачивание файла в браузере
    const fileName = `Накладная_#${documentId}_Спецификация.xlsx`
    XLSX.writeFile(workbook, fileName)
  }
}
