<template>
  <BaseModal :is-open="isOpen" maxWidth="2xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <span class="badge badge--info">Состав</span>
        <h3 class="m-0 text-lg font-bold text-primary">Выбранные позиции документа</h3>
      </div>
    </template>

    <div
      class="card no-padding overflow-hidden border border-dark w-full max-h-[400px] overflow-y-auto"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-secondary text-left border-b text-muted text-xs">
            <th class="p-12">Товар</th>
            <th class="p-12">Штрихкод</th>
            <th class="p-12" width="180">Количество</th>
            <th class="p-12" width="50"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx" class="border-b last:border-none">
            <td class="p-12">
              <div class="flex flex-col min-w-0 gap-4 items-start">
                <span
                  class="text-sm font-semibold text-primary truncate max-w-md"
                  :title="item.name"
                >
                  {{ item.name }}
                </span>
                <div class="flex items-center gap-6">
                  <span
                    class="font-mono text-[10px] font-semibold text-primary bg-secondary border border-dark px-6 py-2 rounded-6"
                  >
                    {{ item.cArt }}
                  </span>
                  <span v-if="item.isDefect" class="badge badge--error text-[10px] py-0 px-4"
                    >Брак</span
                  >
                </div>
              </div>
            </td>
            <td class="p-12">
              <span
                class="font-mono text-xs text-muted bg-secondary border border-dark px-6 py-4 rounded-6 tracking-wide"
              >
                {{ item.barcode }}
              </span>
            </td>
            <td class="p-12">
              <div class="flex items-center gap-8">
                <input
                  type="number"
                  v-model.number="item.qty"
                  min="1"
                  class="custom-table-qty"
                  @change="validateQty(item)"
                />
                <span class="text-xs font-semibold text-muted">шт.</span>
              </div>
            </td>
            <td class="p-12 text-center">
              <button class="table-row-delete-btn" title="Удалить позицию" @click="removeItem(idx)">
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button type="button" class="btn btn-primary" @click="close">Подтвердить состав</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import { useToast } from '@/composables/useToast'
import type { LocalPosition, UnifiedProductItem } from '@/composables/useExcelImport'

const props = defineProps<{
  isOpen: boolean
  items: LocalPosition[]
  availableCards: UnifiedProductItem[]
  modelType: 'FBO' | 'ORD'
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'update:items': [value: LocalPosition[]]
}>()

const toast = useToast()

const close = () => emit('update:isOpen', false)

const removeItem = (index: number) => {
  const updated = [...props.items]
  updated.splice(index, 1)
  emit('update:items', updated)
}

const validateQty = (item: LocalPosition) => {
  if (item.qty < 1 || !item.qty) item.qty = 1

  if (props.modelType === 'ORD') {
    const card = props.availableCards.find(
      (c) => c.idName === item.idName && c.isDefect === item.isDefect,
    )
    if (card) {
      const limit = Math.max(0, (card.irQuant ?? 0) - (card.iBronTask ?? 0))
      if (item.qty > limit) {
        toast.warning(`Доступно только ${limit} шт.`)
        item.qty = limit
      }
    }
  }
}

watch(
  () => props.items.length,
  (newLen) => {
    if (newLen === 0) close()
  },
)
</script>
