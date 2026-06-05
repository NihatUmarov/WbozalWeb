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
          class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
        >
          {{ item.cArt || '—' }}
        </span>
      </template>

      <template #cell(cName)="{ item }">
        <div class="flex flex-col min-w-0">
          <span
            class="text-sm font-semibold text-primary truncate max-w-md"
            :title="String(item.cName || '')"
          >
            {{ item.cName || 'Без названия' }}
          </span>
          <span class="text-xs text-muted font-mono mt-4">ID: {{ item.idName }}</span>
        </div>
      </template>

      <template #cell(barcodes)="{ item }">
        <div v-if="item.barcodes?.length" class="flex flex-wrap gap-4 max-w-xs">
          <span
            v-for="(bc, i) in item.barcodes"
            :key="i"
            class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
          >
            {{ bc }}
          </span>
        </div>
        <span v-else class="text-muted text-xs font-medium font-mono">—</span>
      </template>

      <template #cell(irQuant)="{ item }">
        <span
          v-if="item.irQuant > 0"
          class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
        >
          {{ item.irQuant }} шт.
        </span>
        <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
      </template>

      <template #cell(iBronTask)="{ item }">
        <span
          v-if="item.iBronTask > 0"
          class="text-xs font-semibold text-warning bg-warning-subtle border-warning px-6 py-4 rounded-6 tabular-nums"
        >
          {{ item.iBronTask }} шт.
        </span>
        <span v-else class="text-muted text-xs font-medium tabular-nums">—</span>
      </template>

      <template #cell(defectQuant)="{ item }">
        <span
          v-if="item.defectQuant > 0"
          class="text-xs font-bold text-error bg-error-subtle border-error px-6 py-4 rounded-6 tabular-nums"
        >
          {{ item.defectQuant }} шт.
        </span>
        <span v-else class="text-muted text-xs font-medium tabular-nums">0 шт.</span>
      </template>
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
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

<style scoped>
/* Внутри .avatar-box (примерно 119 строка) */
.avatar-box {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-8);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  flex-shrink: 0; /* ИСПРАВЛЕНО: было shrink-0: 0 */
}
.border-dark {
  border: 1px solid var(--color-border-dark);
}
.border-success {
  border: 1px solid rgba(34, 197, 94, 0.1);
}
.border-warning {
  border: 1px solid rgba(245, 158, 11, 0.1);
}
.border-error {
  border: 1px solid rgba(239, 68, 68, 0.1);
}
.mt-4 {
  margin-top: var(--spacing-4);
}
.max-w-xs {
  max-width: 20rem;
}
.px-6 {
  padding-left: var(--spacing-6);
  padding-right: var(--spacing-6);
}
.py-4 {
  padding-top: var(--spacing-4);
  padding-bottom: var(--spacing-4);
}
.px-8 {
  padding-left: var(--spacing-8);
  padding-right: var(--spacing-8);
}
</style>
