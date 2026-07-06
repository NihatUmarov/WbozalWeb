<template>
  <MainLayout>
    <div class="flex flex-col gap-16 p-16">
      <div class="card flex flex-wrap items-center justify-between gap-12 p-16">
        <h2 class="text-xl font-bold text-primary m-0">Карточки товаров (МультиШК)</h2>
        <div class="flex items-center gap-12">
          <button class="btn btn-secondary flex items-center gap-8">
            <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
            <span>Выгрузить в Excel</span>
          </button>
        </div>
      </div>

      <div class="card no-padding overflow-hidden">
        <SharedProductTable :items="cards" :loading="loading" :extra-columns="extraCols">
          <template #cell(actions)="{ item }">
            <div class="flex justify-center">
              <button
                class="btn btn-secondary btn-xs border-dark"
                @click="openEditor((item as any).idName)"
              >
                🏷️ Этикетка
              </button>
            </div>
          </template>
        </SharedProductTable>
      </div>
    </div>

    <NamesLabelEditor v-model:is-open="isEditorOpen" :id-name="selectedIdName" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import SharedProductTable from '@/components/ui/SharedProductTable.vue'
import NamesLabelEditor from '@/components/ui/NamesLabelEditor.vue'
import { catalogService, type CatalogItem } from '@/api/catalogService'
import { useAsync } from '@/composables/useAsync'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

const extraCols: TableColumn<CatalogItem>[] = [
  {
    key: 'actions' as keyof CatalogItem,
    label: 'Действия',
    width: '110px',
  },
]
const cards = ref<CatalogItem[]>([])
const { loading, run } = useAsync()
const isEditorOpen = ref(false)
const selectedIdName = ref(0)

const openEditor = (idName: number) => {
  selectedIdName.value = idName
  isEditorOpen.value = true
}

onMounted(() =>
  run(async () => {
    cards.value = await catalogService.getCards()
  }),
)
</script>
