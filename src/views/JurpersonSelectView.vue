<template>
  <MainLayout>
    <div class="flex justify-center min-h-screen py-40 px-4">
      <div class="w-full max-w-xl flex flex-col gap-20">
        <header class="text-center flex flex-col gap-4">
          <h1>Выбор организации</h1>
          <p class="text-sm text-muted">
            Выберите рабочее пространство или добавьте новое для управления складом
          </p>
        </header>

        <div v-if="isStateLoading" class="card flex flex-col items-center justify-center gap-12">
          <div class="table-spinner"></div>
          <p class="text-sm text-muted">Загрузка списка организаций...</p>
        </div>

        <div v-else class="flex flex-col gap-20">
          <div class="flex justify-center">
            <button
              class="btn"
              :class="showCreateForm ? 'btn-secondary' : 'btn-primary'"
              @click="toggleCreateForm"
            >
              {{ showCreateForm ? 'Отменить создание' : 'Добавить новую организацию' }}
            </button>
          </div>

          <Transition name="fade-slide">
            <div v-if="showCreateForm" class="card flex flex-col gap-20">
              <h3>Новая организация</h3>

              <div class="w-full flex flex-col gap-12">
                <div class="input-group">
                  <label class="input-label">ИНН организации</label>
                  <input
                    v-model="newOrg.inn"
                    type="text"
                    placeholder="Введите от 10 до 16 символов (буквы или цифры)"
                    class="input"
                    @input="handleInnInput"
                  />
                </div>
                <div v-if="!isDataFetched" class="flex justify-end">
                  <button
                    class="btn btn-primary"
                    :disabled="loading || !isValidInn"
                    @click="handleSuggestByInn"
                  >
                    <span v-if="loading" class="btn-spinner"></span>
                    <span v-else>Далее</span>
                  </button>
                </div>
              </div>

              <Transition name="fade-slide">
                <div v-if="isDataFetched" class="flex flex-col gap-16">
                  <div class="input-group">
                    <label class="input-label">Сокращенное наименование (для списков)*</label>
                    <input
                      v-model="newOrg.jurpersonName"
                      type="text"
                      placeholder="ИП Иванов И.И. или ООО 'КОМПАНИЯ'"
                      class="input"
                    />
                  </div>
                  <div class="input-group">
                    <label class="input-label">Полное наименование организации*</label>
                    <input
                      v-model="newOrg.jurpersonFullName"
                      type="text"
                      placeholder="Индивидуальный предприниматель Иванов Иван Иванович"
                      class="input"
                    />
                  </div>
                  <div class="w-full">
                    <button
                      class="btn btn-primary w-full"
                      :disabled="isCreating"
                      @click="handleCreateJurperson"
                    >
                      <span v-if="isCreating" class="btn-spinner"></span>
                      <span v-else>Создать организацию</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </Transition>

          <div v-if="jurpersons.length > 0" class="flex flex-col gap-12">
            <h2 class="text-xs font-bold uppercase tracking-wider text-muted px-4">
              Ваши организации
            </h2>

            <div class="flex flex-col gap-12">
              <div
                v-for="jp in jurpersons"
                :key="jp.idJurperson"
                class="card org-card flex items-center justify-between gap-12"
                :class="{ 'org-card--active': selectedId === jp.idJurperson }"
                @click="handleSelectJurperson(jp.idJurperson)"
              >
                <div class="flex flex-col gap-4 text-left truncate">
                  <h4 class="text-sm font-semibold truncate">{{ jp.jurpersonName }}</h4>
                  <span class="text-xs text-muted font-mono">
                    {{ jp.inn ? `ИНН: ${jp.inn}` : 'ИНН не указан' }}
                  </span>
                </div>

                <div v-if="selectedId === jp.idJurperson" class="shrink-0">
                  <span class="badge badge--success">Активна</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="jurpersons.length === 0 && !showCreateForm"
            class="card text-center py-32 flex flex-col items-center gap-4"
          >
            <p class="text-sm font-bold">У вас нет доступных организаций</p>
            <p class="text-xs text-muted">
              Добавьте первую организацию по кнопке выше, чтобы начать работу.
            </p>
          </div>

          <footer class="flex justify-center mt-12">
            <button class="logout-link-text" @click="handleLogout">Выйти из аккаунта</button>
          </footer>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJurpersons } from '@/composables/useJurpersons'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { jurpersonService } from '@/api/jurpersonService'
import MainLayout from '@/components/ui/MainLayout.vue'

const router = useRouter()
const toast = useToast()
const showCreateForm = ref<boolean>(false)
const isDataFetched = ref<boolean>(false)

const { jurpersons, selectedId, isStateLoading, load, select } = useJurpersons(undefined)
const { loading, run } = useAsync()
const { loading: isCreating, run: runCreate } = useAsync()

const newOrg = ref({ inn: '', jurpersonName: '', jurpersonFullName: '' })

const isValidInn = computed<boolean>(() => {
  const len = newOrg.value.inn.trim().length
  return len >= 10 && len <= 20
})

const toggleCreateForm = (): void => {
  showCreateForm.value = !showCreateForm.value
  if (!showCreateForm.value) resetCreateForm()
}

const resetCreateForm = (): void => {
  newOrg.value = { inn: '', jurpersonName: '', jurpersonFullName: '' }
  isDataFetched.value = false
}

const handleInnInput = (): void => {
  if (isDataFetched.value) resetCreateForm()
}

const handleSuggestByInn = (): void => {
  if (!isValidInn.value) return
  run(
    async () => {
      const data = await jurpersonService.suggestByInn(newOrg.value.inn.trim())
      newOrg.value.jurpersonName = data.jurpersonName || ''
      newOrg.value.jurpersonFullName = data.jurpersonFullName || ''
      isDataFetched.value = true

      if (!newOrg.value.jurpersonName && !newOrg.value.jurpersonFullName) {
        toast.warning('Организация не найдена. Заполните поля вручную')
      } else {
        toast.success('Данные по ИНН успешно найдены!')
      }
    },
    { toast },
  )
}

const handleCreateJurperson = (): void => {
  if (!newOrg.value.jurpersonName.trim() || !newOrg.value.jurpersonFullName.trim()) {
    return toast.error('Заполните обязательные поля наименований')
  }

  runCreate(
    async () => {
      const res = await jurpersonService.createJurperson({
        inn: newOrg.value.inn.trim(),
        jurpersonName: newOrg.value.jurpersonName.trim(),
        jurpersonFullName: newOrg.value.jurpersonFullName.trim(),
      })
      toast.success(res.message || 'Организация успешно создана!')
      resetCreateForm()
      showCreateForm.value = false
      await load()
    },
    { toast },
  )
}

const handleSelectJurperson = async (id: number): Promise<void> => {
  const success = await select(id)
  if (success) {
    toast.success('Организация успешно выбрана!')
    setTimeout(() => router.push('/'), 500)
  }
}

const handleLogout = (): void => {
  localStorage.clear()
  window.location.href = '/login'
}

onMounted(load)
</script>
