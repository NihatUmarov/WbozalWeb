<template>
  <BaseModal :is-open="isOpen" maxWidth="5xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <AppBadge variant="info" text="Состав" />
        <h3 class="m-0 text-lg font-bold text-primary">Выбранные позиции документа</h3>
      </div>
    </template>

    <div class="card no-padding overflow-hidden border border-dark w-full max-h-[500px]">
      <table class="minimal-table w-full">
        <thead>
          <tr class="bg-secondary text-left border-b text-muted text-xs">
            <th class="p-8" width="60">Фото</th>
            <th class="p-8">Товар / Артикул</th>
            <th class="p-8" width="160">Штрихкод</th>
            <th class="p-8" width="160" v-if="modelType === 'FBO'">Срок годности</th>
            <th class="p-8" width="120">Количество</th>
            <th class="p-8" width="50"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx" class="border-b last:border-none">
            <td class="p-8">
              <div class="w-[30px] h-[45px] flex items-center justify-center bg-secondary rounded-4 overflow-hidden mx-auto">
                <img v-if="item.primaryImageURL" :src="String(item.primaryImageURL)" class="object-contain w-full h-full" alt="P" />
                <span v-else class="text-[8px] text-muted">No</span>
              </div>
            </td>
            <td class="p-8">
              <div class="flex flex-col min-w-0 gap-2 items-start">
                <span class="text-sm font-semibold text-primary truncate max-w-xs" :title="item.name">{{ item.name }}</span>
                <div class="flex items-center gap-6">
                  <span class="font-mono text-[11px] font-semibold text-primary bg-secondary border border-dark px-6 py-1 rounded-4">{{ item.cArt }}</span>
                  <span v-if="item.isDefect" class="badge badge--error text-[10px] py-0 px-4">Брак</span>
                </div>
              </div>
            </td>
            <td class="p-8">
              <span class="font-mono text-sm text-muted bg-secondary border border-dark px-8 py-2 rounded-4 tracking-wide">{{ item.barcode }}</span>
            </td>
            <td class="p-8" v-if="modelType === 'FBO'">
              <input type="date" v-model="item.expirationDate" class="input text-xs" style="height: 32px; padding: 0 8px; width: 140px" @change="syncExpirationDates(item)" />
            </td>
            <td class="p-8">
              <div class="flex items-center gap-4">
                <input type="number" v-model.number="item.qty" min="1" class="input text-center font-bold text-sm" style="height: 32px; width: 70px; padding: 0 4px" @change="validateQty(item)" />
                <span class="text-[11px] font-semibold text-muted">шт.</span>
              </div>
            </td>
            <td class="p-8 text-center">
              <button class="table-row-delete-btn" title="Удалить позицию" @click="removeItem(idx)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex justify-end"><button type="button" class="btn btn-primary" @click="close">Подтвердить состав</button></div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import { AppBadge } from '@/components/ui/BaseTable.vue'
import { useToast } from '@/composables/useToast'
import type { LocalPosition, UnifiedProductItem } from '@/composables/useExcelImport'

const props = defineProps<{ isOpen: boolean; items: LocalPosition[]; availableCards: UnifiedProductItem[]; modelType: 'FBO' | 'ORD' }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean]; 'update:items': [value: LocalPosition[]] }>()
const toast = useToast(), close = () => emit('update:isOpen', false)

const removeItem = (index: number) => {
  const updated = [...props.items]; updated.splice(index, 1); emit('update:items', updated)
}

const syncExpirationDates = (changedItem: LocalPosition) => {
  props.items.forEach((item) => {
    if (item.barcode === changedItem.barcode && item.expirationDate !== changedItem.expirationDate) {
      item.expirationDate = changedItem.expirationDate
    }
  })
}

const validateQty = (item: LocalPosition) => {
  if (item.qty < 1 || !item.qty) item.qty = 1
  if (props.modelType === 'ORD') {
    const card = props.availableCards.find((c) => c.idName === item.idName && c.isDefect === item.isDefect)
    if (card) {
      const limit = Math.max(0, (card.irQuant ?? 0) - (card.iBronTask ?? 0))
      if (item.qty > limit) { toast.warning(`Доступно только ${limit} шт.`); item.qty = limit }
    }
  }
}

watch(() => props.items, (newItems) => {
  if (!newItems) return
  newItems.forEach((item) => {
    newItems.forEach((target) => {
      if (target.barcode === item.barcode && target.expirationDate !== item.expirationDate) {
        target.expirationDate = item.expirationDate
      }
    })
  })
}, { deep: true })

watch(() => props.items.length, (newLen) => { if (newLen === 0) close() })
</script>
