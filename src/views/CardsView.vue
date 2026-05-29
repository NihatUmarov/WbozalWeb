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
      <template #cell(cArt)="{ item }"
        ><span class="text-primary font-semibold">{{ item.cArt || '—' }}</span></template
      >
      <template #cell(cName)="{ item }"
        ><div class="truncate" :title="String(item.cName || '')">
          {{ item.cName || 'Без названия' }}
        </div></template
      >
      <template #cell(barcodes)="{ item }">
        <div v-if="item.barcodes?.length" class="flex flex-wrap gap-1.5 max-w-sm">
          <span
            v-for="(bc, i) in item.barcodes"
            :key="i"
            class="bg-secondary text-secondary-dark font-mono text-xs px-2 py-0.5 rounded border border-border"
          >
            {{ bc }}
          </span>
        </div>
        <span v-else class="text-border">—</span>
      </template>
      <template #cell(irQuant)="{ item }"
        ><span :class="item.irQuant > 0 ? 'text-success font-semibold' : 'text-border'"
          >{{ item.irQuant }} шт.</span
        ></template
      >
      <template #cell(iBronTask)="{ item }"
        ><span class="text-warning font-medium">{{
          item.iBronTask > 0 ? `${item.iBronTask} шт.` : '—'
        }}</span></template
      >
      <template #cell(defectQuant)="{ item }"
        ><span
          :class="
            item.defectQuant > 0
              ? 'text-error font-semibold bg-error-subtle rounded px-1.5 py-0.5 text-xs'
              : 'text-border'
          "
          >{{ item.defectQuant > 0 ? `${item.defectQuant} шт.` : '0' }}</span
        ></template
      >
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import { type TableColumn } from '@/components/ui/BaseTable.vue'
import { cardsService } from '@/api/cardsService'
import type { CardItem } from '@/api/types'

const cards = ref<CardItem[]>([])
const loading = ref(false)

const columns: TableColumn<CardItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, width: '150px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '300px' },
  { key: 'barcodes', label: 'Штрихкоды / Attribute1', filterable: true, width: '250px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, width: '120px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, width: '120px' },
  { key: 'defectQuant', label: 'Брак', sortable: true, width: '110px' },
]

const fetchCards = async () => {
  loading.value = true
  try {
    cards.value = await cardsService.getCards()
  } catch (error) {
    console.error('Ошибка при загрузке карточек:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchCards)
</script>
