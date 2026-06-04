<template>
  <MainLayout>
    <BaseDataPage
      title="Карточки товаров (МультиШК)"
      :items="cards"
      :columns="columns"
      :loading="loading"
      empty-text="Карточек товаров не найдено"
      empty-icon="📇"
    >
      <template #cell(cArt)="{ item }">
        <span
          class="font-mono text-xs bg-secondary text-primary font-semibold px-2 py-0.5 rounded border border-border"
        >
          {{ item.cArt || '—' }}
        </span>
      </template>

      <template #cell(cName)="{ item }">
        <div class="flex items-center gap-3 py-0.5">
          <div
            class="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted font-bold text-xs uppercase select-none shrink-0"
          >
            {{ item.cName?.trim().slice(0, 2) || 'БН' }}
          </div>
          <div class="flex flex-col min-w-0">
            <span
              class="text-sm font-semibold text-primary truncate max-w-md"
              :title="String(item.cName || '')"
            >
              {{ item.cName || 'Без названия' }}
            </span>
            <span class="text-xs text-muted font-mono tracking-wider mt-0.5"
              >ID: {{ item.idName }}</span
            >
          </div>
        </div>
      </template>

      <template #cell(barcodes)="{ item }">
        <div v-if="item.barcodes?.length" class="flex flex-wrap gap-1 max-w-xs">
          <span
            v-for="(bc, i) in item.barcodes"
            :key="i"
            class="bg-secondary text-secondary font-mono text-xs px-1.5 py-0.5 rounded border border-border/60"
          >
            {{ bc }}
          </span>
        </div>
        <span v-else class="text-border font-mono">—</span>
      </template>

      <template #cell(irQuant)="{ item }">
        <span
          v-if="item.irQuant > 0"
          class="text-success font-bold bg-success-subtle px-2 py-1 rounded text-xs tabular-nums border border-success/10"
        >
          {{ item.irQuant }} шт.
        </span>
        <span v-else class="text-border text-xs font-medium tabular-nums">0 шт.</span>
      </template>

      <template #cell(iBronTask)="{ item }">
        <span
          v-if="item.iBronTask > 0"
          class="text-warning font-semibold bg-warning-subtle px-2 py-1 rounded text-xs tabular-nums border border-warning/10"
        >
          {{ item.iBronTask }} шт.
        </span>
        <span v-else class="text-border text-xs font-medium tabular-nums">—</span>
      </template>

      <template #cell(defectQuant)="{ item }">
        <span
          v-if="item.defectQuant > 0"
          class="text-error font-bold bg-error-subtle rounded px-2 py-1 text-xs tabular-nums border border-error/10"
        >
          {{ item.defectQuant }} шт.
        </span>
        <span v-else class="text-border text-xs font-medium tabular-nums">0</span>
      </template>
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import { type TableColumn } from '@/components/ui/BaseTable.vue'
import { cardsService } from '@/api/cardsService'
import { useAsync } from '@/composables/useAsync'
import type { CardItem } from '@/api/types'

const cards = ref<CardItem[]>([])
const { loading, run } = useAsync()

const columns: TableColumn<CardItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, width: '140px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '320px' },
  { key: 'barcodes', label: 'Штрихкоды', filterable: true, width: '220px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, width: '120px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, width: '120px' },
  { key: 'defectQuant', label: 'Брак', sortable: true, width: '110px' },
]

onMounted(() => {
  run(async () => {
    cards.value = await cardsService.getCards()
  })
})
</script>
