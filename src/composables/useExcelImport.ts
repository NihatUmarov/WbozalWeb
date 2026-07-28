import { ref, type Ref } from 'vue'
import * as XLSX from 'xlsx'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/api/types'

export type UnifiedProductItem = Product

export interface LocalPosition {
  idName: number
  barcode: string
  qty: number
  name: string
  cArt: string
  size: string | null
  isDefect?: boolean
  primaryImageURL?: string | null
  expirationDate?: string | null
}

export interface ImportErrorRecord {
  barcode: string
  qty: string | number
  message: string
}

export function useExcelImport(
  availableCards: Ref<UnifiedProductItem[]>,
  modelType: 'FBO' | 'ORD',
  filterDefect: Ref<boolean>,
) {
  const toast = useToast()
  const importErrors = ref<ImportErrorRecord[]>([])

  const handleExcelImport = async (event: Event, current: LocalPosition[]): Promise<LocalPosition[] | null> => {
    const target = event.target as HTMLInputElement
    if (!target.files?.length) return null
    const file = target.files[0]

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 })
          if (!rows.length) { toast.error('Файл пуст'); return resolve(null) }

          const errors: ImportErrorRecord[] = []; const local = [...current]
          const startIdx = String(rows[0][0] || '').toLowerCase().search(/штрих|шк|barcode/) !== -1 ? 1 : 0

          for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i]; if (!row || !row[0]) continue
            const bc = String(row[0]).trim(); const qty = parseInt(String(row[1] || '0').trim(), 10)
            if (isNaN(qty) || qty <= 0) { errors.push({ barcode: bc, qty: row[1] || 0, message: 'Некорректное кол-во' }); continue }

            const card = availableCards.value.find(c => c.barcodes?.includes(bc))
            if (!card) { errors.push({ barcode: bc, qty, message: 'Штрихкод не найден' }); continue }

            if (modelType === 'ORD') {
              const avail = Math.max(0, (card.irQuant || 0) - (card.iBronTask || 0))
              const added = local.filter(l => l.idName === card.idName && l.barcode === bc).reduce((s, l) => s + l.qty, 0)
              if (added + qty > avail) { errors.push({ barcode: bc, qty, message: `Превышен остаток (${avail} шт.)` }); continue }
            }

            const existing = local.find(l => l.idName === card.idName && l.barcode === bc && (modelType !== 'ORD' || l.isDefect === card.isDefect))
            if (existing) existing.qty += qty
            else local.push({ idName: card.idName, barcode: bc, qty, name: card.cName || 'Без названия', cArt: card.cArt || '—', size: card.size || '—', isDefect: modelType === 'ORD' ? card.isDefect : false, primaryImageURL: card.primaryImageURL })
          }
          importErrors.value = errors
          if (local.length > current.length || errors.length > 0) {
            errors.length ? toast.warning('Импортировано частично') : toast.success('Файл импортирован!')
            resolve(local)
          } else { toast.error('Не удалось импортировать позиции'); resolve(null) }
        } catch { toast.error('Ошибка структуры файла'); resolve(null) }
        finally { target.value = '' }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  return { importErrors, handleExcelImport }
}
