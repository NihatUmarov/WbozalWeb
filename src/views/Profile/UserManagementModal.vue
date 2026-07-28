<template>
  <BaseModal :is-open="isOpen" variant="sheet" max-width="6xl" @update:is-open="close">
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
            <div class="flex justify-center">
              <input
                v-model="item.remains"
                type="checkbox"
                class="checkbox-custom"
                :disabled="!permissions.admin"
              />
            </div>
          </template>

          <template #cell(invoice)="{ item }">
            <div class="flex justify-center">
              <input
                v-model="item.invoice"
                type="checkbox"
                class="checkbox-custom"
                :disabled="!permissions.admin"
              />
            </div>
          </template>

          <template #cell(cards)="{ item }">
            <div class="flex justify-center">
              <input
                v-model="item.cards"
                type="checkbox"
                class="checkbox-custom"
                :disabled="!permissions.admin"
              />
            </div>
          </template>

          <template #cell(profile)="{ item }">
            <div class="flex justify-center">
              <input
                v-model="item.profile"
                type="checkbox"
                class="checkbox-custom"
                :disabled="!permissions.admin"
              />
            </div>
          </template>

          <template #cell(actions)="{ index }">
            <div class="flex justify-center">
              <button
                v-if="permissions.admin"
                type="button"
                class="btn btn-danger-soft btn-xs"
                @click="removeRecordFromList(index)"
              >
                Убрать
              </button>
              <AppTableCell v-else value="Нет прав" color="muted" size="xs" />
            </div>
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
          <span v-if="isSaving" class="btn-spinner mr-8"></span>
          <span>Сохранить изменения</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import BaseTable, { AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import { adminService, type UserBatchItem } from '@/api/adminService'
import { useToast } from '@/composables/useToast'

const permissions = computed(() => adminService.permissions.value)
const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()

const toast = useToast()
const isLoading = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const localUsers = ref<UserBatchItem[]>([])
const newEmail = ref<string>('')

const columns: TableColumn<UserBatchItem>[] = [
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
    toast.error('Не удалось загрузить матрицу доступов')
  } finally {
    isLoading.value = false
  }
}

const addRecordToList = (): void => {
  const emailTrimmed = newEmail.value.trim()
  if (!emailTrimmed || !emailTrimmed.includes('@')) {
    toast.error('Введите корректный Email адрес!')
    return
  }
  const exists = localUsers.value.some((u) => u.email.toLowerCase() === emailTrimmed.toLowerCase())
  if (exists) {
    toast.warning('Этот пользователь уже есть в списке!')
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
  toast.info('Пользователь добавлен в таблицу')
}

const removeRecordFromList = (index: number): void => {
  if (index !== -1) localUsers.value.splice(index, 1)
}

const handleSaveChanges = async (): Promise<void> => {
  isSaving.value = true
  try {
    const res = await adminService.syncUsers(localUsers.value)
    toast.success(res.message || 'Все изменения сохранены!')
    close()
  } catch {
    toast.error('Не удалось сохранить изменения')
  } finally {
    isSaving.value = false
  }
}

const close = (): void => emit('update:isOpen', false)
</script>
