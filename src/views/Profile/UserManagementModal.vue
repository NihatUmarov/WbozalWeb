<template>
  <BaseBottomSheet :is-open="isOpen" max-width="6xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <h2 class="m-0 text-2xl font-bold text-primary">Управление сотрудниками</h2>
      </div>
    </template>

    <div class="flex flex-col gap-32 py-12">
      <section v-if="permissions.admin" class="flex flex-col gap-16">
        <div class="flex items-end gap-20 w-full">
          <div class="input-group">
            <label class="input-label">Email сотрудника</label>
            <input v-model="newEmail" type="email" placeholder="name@company.ru" class="input" />
          </div>
          <button type="button" class="btn btn-primary" @click="addRecordToList">
            + Добавить в таблицу
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold text-primary m-0">Настройка прав доступа</h3>
          <span v-if="permissions.admin" class="text-sm text-muted">
            * Изменения вступят в силу только после нажатия кнопки «Сохранить»
          </span>
        </div>

        <BaseTable
          :items="localUsers"
          :columns="columns"
          :loading="isLoading"
          max-height="400px"
          empty-text="Список пуст. Добавьте сотрудников выше."
        >
          <template #cell(remains)="{ item }">
            <input
              v-model="item.remains"
              type="checkbox"
              class="checkbox-custom"
              :disabled="!permissions.admin"
            />
          </template>

          <template #cell(invoice)="{ item }">
            <input
              v-model="item.invoice"
              type="checkbox"
              class="checkbox-custom"
              :disabled="!permissions.admin"
            />
          </template>

          <template #cell(cards)="{ item }">
            <input
              v-model="item.cards"
              type="checkbox"
              class="checkbox-custom"
              :disabled="!permissions.admin"
            />
          </template>

          <template #cell(profile)="{ item }">
            <input
              v-model="item.profile"
              type="checkbox"
              class="checkbox-custom"
              :disabled="!permissions.admin"
            />
          </template>

          <template #cell(actions)="{ item }">
            <button
              v-if="permissions.admin"
              type="button"
              class="btn btn-danger-soft btn-xs"
              @click="removeRecordFromList(localUsers.indexOf(item))"
            >
              Убрать
            </button>
            <span v-else class="text-xs text-muted">Нет прав</span>
          </template>
        </BaseTable>
      </section>
    </div>

    <template #footer>
      <div v-if="permissions.admin" class="flex justify-center w-full">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="isSaving"
          @click="handleSaveChanges"
        >
          <span
            v-if="isSaving"
            class="table-spinner"
            style="width: 14px; height: 14px; margin-right: 8px"
          ></span>
          <span>Сохранить изменения</span>
        </button>
      </div>
    </template>
  </BaseBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseBottomSheet from '@/components/ui/UnifiedUI.vue'
import BaseTable, { type TableColumn } from '@/components/ui/BaseTable.vue'
import { adminService, type UserBatchItem } from '@/api/adminService'
import { useToast } from '@/composables/useToast'
const permissions = computed(() => adminService.permissions.value)
const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const toast = useToast()

const isLoading = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const localUsers = ref<UserBatchItem[]>([])
const newEmail = ref<string>('')

const columns: TableColumn<UserBatchItem & { actions?: unknown }>[] = [
  { key: 'email', label: 'Email пользователя', minWidth: '180px' },
  { key: 'remains', label: 'Остатки', width: '90px' },
  { key: 'invoice', label: 'Счета', width: '90px' },
  { key: 'cards', label: 'Карточки', width: '90px' },
  { key: 'profile', label: 'Профиль', width: '90px' },
  { key: 'actions', label: 'Действие', width: '100px' },
]

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      newEmail.value = ''
      loadUsersFromServer()
    }
  },
)

const loadUsersFromServer = async (): Promise<void> => {
  isLoading.value = true
  try {
    localUsers.value = await adminService.getJurpersonUsers()
  } catch {
    toast.show('Не удалось загрузить матрицу доступов', 'error')
  } finally {
    isLoading.value = false
  }
}

const addRecordToList = (): void => {
  const emailTrimmed = newEmail.value.trim()

  if (!emailTrimmed || !emailTrimmed.includes('@')) {
    toast.show('Введите корректный Email адрес!', 'error')
    return
  }

  const exists = localUsers.value.some((u) => u.email.toLowerCase() === emailTrimmed.toLowerCase())
  if (exists) {
    toast.show('Этот пользователь уже есть в списке!', 'warning')
    return
  }

  localUsers.value.push({
    id: 0,
    email: emailTrimmed,
    remains: true,
    invoice: false,
    cards: true,
    profile: false,
  })

  newEmail.value = ''
  toast.show('Пользователь добавлен в таблицу', 'info')
}

const removeRecordFromList = (index: number): void => {
  if (index !== -1) {
    localUsers.value.splice(index, 1)
  }
}

const handleSaveChanges = async (): Promise<void> => {
  isSaving.value = true
  try {
    const res = await adminService.syncUsers(localUsers.value)
    toast.show(res.message || 'Все изменения сохранены!', 'success')
    close()
  } catch {
    toast.show('Не удалось сохранить изменения', 'error')
  } finally {
    isSaving.value = false
  }
}

const close = (): void => emit('update:isOpen', false)
</script>
