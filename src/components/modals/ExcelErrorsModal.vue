<template>
  <BaseModal :is-open="isOpen" maxWidth="lg" @update:is-open="close">
    <template #header>
      <h3 class="m-0 text-lg font-bold text-error">⚠️ Ошибки валидации Excel</h3>
    </template>

    <div class="import-errors-container max-h-[400px] overflow-y-auto">
      <table class="minimal-table error-table-view w-full">
        <thead>
          <tr class="text-left border-b text-muted text-sm">
            <th class="pb-12">Штрихкод</th>
            <th class="pb-12">Кол-во</th>
            <th class="pb-12">Причина отклонения</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(err, idx) in errors" :key="idx" class="border-b last:border-none">
            <td class="py-12">
              <span class="font-mono text-sm bg-secondary px-10 py-4 rounded-6 border border-dark">
                {{ err.barcode || 'Пустой' }}
              </span>
            </td>
            <td class="py-12 tabular-nums font-bold text-sm">{{ err.qty }} шт.</td>
            <td class="py-12 text-error font-medium text-sm">{{ err.message }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button type="button" class="btn btn-secondary" @click="close">Понятно</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/UnifiedUI.vue'
import type { ImportErrorRecord } from '@/composables/useExcelImport'

defineProps<{ isOpen: boolean; errors: ImportErrorRecord[] }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()
const close = () => emit('update:isOpen', false)
</script>
