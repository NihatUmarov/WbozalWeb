import * as XLSX from 'xlsx'
import { useToast } from '@/composables/useToast'

export function useExcelReader() {
  const toast = useToast()

  const readExcel = async (file: File): Promise<(string | number)[][] | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 })

          if (!rawRows.length) {
            toast.error('Файл пуст')
            return resolve(null)
          }
          resolve(rawRows)
        } catch (err) {
          toast.error('Ошибка чтения Excel')
          resolve(null)
        }
      }
      reader.onerror = () => {
        toast.error('Ошибка при чтении файла')
        resolve(null)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  return { readExcel }
}
