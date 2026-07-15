import { ref, type Ref } from 'vue'
import * as XLSX from 'xlsx'
import { useToast } from '@/composables/useToast'

// --- Описание интерфейсов (если нет файла types/products, они будут жить тут) ---
export interface UnifiedProductItem {
  idName: number
  cName: string | null
  cArt: string | null
  size: string | null
  irQuant: number
  iBronTask: number
  defectQuant: number
  barcodes: string[]
  isDefect?: boolean
  primaryImageURL?: string | null
}

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

  const calculateAvailableToShip = (item: UnifiedProductItem) => {
    return Math.max(0, (item.irQuant ?? 0) - (item.iBronTask ?? 0))
  }

  const handleExcelImport = async (
    event: Event,
    currentAddedItems: LocalPosition[],
  ): Promise<LocalPosition[] | null> => {
    const target = event.target as HTMLInputElement
    const files = target.files

    // Сразу отсекаем null/empty и гарантируем TS, что файлы существуют
    if (!files || !files.length) return null
    const file = files[0]

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const rawRows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(worksheet, {
            header: 1,
          })

          if (!rawRows.length) {
            toast.error('Файл пуст')
            return resolve(null)
          }

          const errors: ImportErrorRecord[] = []
          let validCount = 0
          const localAdded = [...currentAddedItems]

          // Пропускаем шапку, если она есть
          let startIdx = 0
          const firstCell = String(rawRows[0][0] || '').toLowerCase()
          if (
            firstCell.includes('штрих') ||
            firstCell.includes('шк') ||
            firstCell.includes('barcode')
          ) {
            startIdx = 1
          }

          for (let i = startIdx; i < rawRows.length; i++) {
            const row = rawRows[i]
            if (!row || (!row[0] && !row[1])) continue

            const rawBarcode = String(row[0] || '').trim()
            const rawQty = parseInt(String(row[1] || '0').trim(), 10)

            if (!rawBarcode) {
              errors.push({ barcode: 'Пусто', qty: row[1] || 0, message: 'Нет штрихкода' })
              continue
            }
            if (isNaN(rawQty) || rawQty <= 0) {
              errors.push({
                barcode: rawBarcode,
                qty: row[1] || 0,
                message: 'Некорректное количество',
              })
              continue
            }

            // Поиск совпадения в каталоге с явной типизацией 'c' и 'b'
            const card = availableCards.value.find((c: UnifiedProductItem) =>
              c.barcodes?.map((b: string) => String(b).trim()).includes(rawBarcode),
            )

            if (!card) {
              errors.push({
                barcode: rawBarcode,
                qty: rawQty,
                message: filterDefect.value
                  ? 'Штрихкод не найден среди бракованного товара'
                  : 'Штрихкод не найден среди активного товара',
              })
              continue
            }

            // Валидация остатков для ORD
            if (modelType === 'ORD') {
              const availableStock = calculateAvailableToShip(card)
              const alreadyAdded = localAdded
                .filter((item) => item.idName === card.idName && item.barcode === rawBarcode)
                .reduce((sum, item) => sum + item.qty, 0)

              if (alreadyAdded + rawQty > availableStock) {
                errors.push({
                  barcode: rawBarcode,
                  qty: rawQty,
                  message: `Превышен остаток. Доступно: ${availableStock} шт.`,
                })
                continue
              }
            }

            // Добавляем или обновляем количество
            const existing = localAdded.find(
              (item) =>
                item.idName === card.idName &&
                item.barcode === rawBarcode &&
                (modelType !== 'ORD' || item.isDefect === card.isDefect),
            )

            if (existing) {
              existing.qty += rawQty
            } else {
              localAdded.push({
                idName: card.idName,
                barcode: rawBarcode,
                qty: rawQty,
                name: card.cName || 'Без названия',
                cArt: card.cArt || '—',
                size: card.size || '—', // <-- ДОБАВЬТЕ ЭТУ СТРОКУ
                isDefect: modelType === 'ORD' ? card.isDefect : false,
                primaryImageURL: card.primaryImageURL,
              })
            }
            validCount++
          }

          importErrors.value = errors

          if (validCount > 0) {
            if (errors.length > 0) {
              toast.warning(`Импортировано частично: ${validCount}`)
            } else {
              toast.success(`Файл импортирован! Успешных позиций: ${validCount}`)
            }
            resolve(localAdded)
          } else {
            toast.error('Не удалось импортировать ни одной позиции')
            resolve(null)
          }
        } catch {
          toast.error('Ошибка структуры Excel файла')
          resolve(null)
        } finally {
          target.value = ''
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  return {
    importErrors,
    handleExcelImport,
  }
}
