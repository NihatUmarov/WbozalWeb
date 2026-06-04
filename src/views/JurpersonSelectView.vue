<template>
  <MainLayout>
    <div class="flex justify-center min-h-screen bg-background py-10 px-4">
      <div class="w-full max-w-xl flex flex-col">
        <!-- Шапка -->
        <header class="text-center mb-8 flex flex-col gap-1.5">
          <h1 class="text-2xl font-bold tracking-tight text-primary">Выбор организации</h1>
          <p class="text-sm text-muted">
            Выберите рабочее пространство или добавьте новое для управления складом
          </p>
        </header>

        <!-- Загрузка -->
        <div
          v-if="isStateLoading"
          class="flex flex-col items-center justify-center p-8 text-muted gap-3"
        >
          <div
            class="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin"
          ></div>
          <p class="text-sm">Загрузка списка организаций...</p>
        </div>

        <div v-else class="flex flex-col gap-6">
          <div class="flex justify-center">
            <BaseButton
              :variant="showCreateForm ? 'secondary' : 'primary'"
              @click="toggleCreateForm"
            >
              {{ showCreateForm ? 'Отменить создание' : 'Добавить новую организацию' }}
            </BaseButton>
          </div>

          <!-- Форма создания организации -->
          <Transition name="fade-slide">
            <BaseCard v-if="showCreateForm" width="100%" class="border-border shadow-md rounded">
              <div class="flex flex-col gap-5 p-2">
                <h3 class="text-base font-bold text-primary m-0">Новая организация</h3>

                <div class="flex items-end gap-3 w-full">
                  <div class="flex-1">
                    <BaseInput
                      v-model="newOrg.inn"
                      label="ИНН организации"
                      placeholder="Введите 10 или 12 цифр"
                      @input="handleInnInput"
                    />
                  </div>
                  <div v-if="!isDataFetched" class="pb-0.5">
                    <BaseButton
                      :disabled="!isValidInn"
                      :loading="loading"
                      @click="handleSuggestByInn"
                      >Далее</BaseButton
                    >
                  </div>
                </div>

                <Transition name="fade-slide">
                  <div v-if="isDataFetched" class="flex flex-col gap-4">
                    <BaseInput
                      v-model="newOrg.jurpersonName"
                      label="Сокращенное наименование (для списков)*"
                      placeholder="ИП Иванов И.И. или ООО 'КОМПАНИЯ'"
                    />
                    <BaseInput
                      v-model="newOrg.jurpersonFullName"
                      label="Полное наименование организации*"
                      placeholder="Индивидуальный предприниматель Иванов Иван Иванович"
                    />
                    <div class="mt-1">
                      <BaseButton
                        :loading="isCreating"
                        class="w-full"
                        @click="handleCreateJurperson"
                        >Создать организацию</BaseButton
                      >
                    </div>
                  </div>
                </Transition>
              </div>
            </BaseCard>
          </Transition>

          <!-- Список доступных организаций -->
          <div v-if="jurpersons.length > 0" class="flex flex-col gap-3">
            <h2 class="text-xs font-bold uppercase tracking-wider text-muted m-0">
              Ваши организации
            </h2>

            <div class="flex flex-col gap-3">
              <div
                v-for="jp in jurpersons"
                :key="jp.idJurperson"
                class="bg-surface border rounded cursor-pointer transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-sm"
                :class="
                  selectedId === jp.idJurperson
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border'
                "
                @click="handleSelectJurperson(jp.idJurperson)"
              >
                <div class="flex items-center p-4 gap-4">
                  <div class="flex items-center justify-center w-11 h-11 bg-secondary rounded">
                    <Building2
                      class="w-5 h-5 text-secondary"
                      :class="{ 'text-primary': selectedId === jp.idJurperson }"
                    />
                  </div>
                  <div class="flex-1 flex flex-col gap-1">
                    <h4 class="text-sm font-semibold text-primary m-0">{{ jp.jurpersonName }}</h4>
                    <span class="text-xs text-muted">{{
                      jp.inn ? `ИНН: ${jp.inn}` : 'ИНН не указан'
                    }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span
                      v-if="selectedId === jp.idJurperson"
                      class="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full"
                      >Активна</span
                    >
                    <span
                      class="text-lg text-muted opacity-40 transition-all duration-200 group-hover:translate-x-1"
                      >→</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Пустое состояние -->
          <div v-else-if="!showCreateForm" class="text-center py-10 flex flex-col items-center">
            <div class="text-4xl mb-4 opacity-70">🏢</div>
            <p class="text-sm font-bold text-primary mb-1">У вас нет доступных организаций</p>
            <p class="text-xs text-muted m-0">
              Добавьте первую организацию по кнопке выше, чтобы начать работу.
            </p>
          </div>

          <footer class="mt-8 flex justify-center">
            <button
              class="bg-transparent border-none text-muted text-sm font-semibold cursor-pointer py-2 px-4 transition-all hover:text-error"
              @click="handleLogout"
            >
              Выйти из аккаунта
            </button>
          </footer>
        </div>
      </div>
    </div>
    <TheToast ref="toastRef" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Building2 } from 'lucide-vue-next'
import { useJurpersons } from '@/composables/useJurpersons'
import { useAsync } from '@/composables/useAsync'
import { jurpersonService } from '@/api/jurpersonService'

import MainLayout from '@/components/ui/MainLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TheToast from '@/components/ui/TheToast.vue'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const showCreateForm = ref(false)
const isDataFetched = ref(false)

const { jurpersons, selectedId, isStateLoading, load, select } = useJurpersons(toastRef)
const { loading, run } = useAsync()
const { loading: isCreating, run: runCreate } = useAsync()

const newOrg = ref({ inn: '', jurpersonName: '', jurpersonFullName: '' })
const isValidInn = computed(() => [10, 12].includes(newOrg.value.inn.trim().length))

const toggleCreateForm = () => {
  showCreateForm.value = !showCreateForm.value
  if (!showCreateForm.value) resetCreateForm()
}

const resetCreateForm = () => {
  newOrg.value = { inn: '', jurpersonName: '', jurpersonFullName: '' }
  isDataFetched.value = false
}

const handleInnInput = () => {
  if (isDataFetched.value) resetCreateForm()
}

const handleSuggestByInn = () => {
  if (!isValidInn.value) return
  run(
    async () => {
      const data = await jurpersonService.suggestByInn(newOrg.value.inn.trim())
      newOrg.value.jurpersonName = data.jurpersonName || ''
      newOrg.value.jurpersonFullName = data.jurpersonFullName || ''
      isDataFetched.value = true
    },
    { toast: toastRef.value, successMessage: 'Данные по ИНН успешно найдены!' },
  )
}

const handleCreateJurperson = () => {
  if (!newOrg.value.jurpersonName.trim() || !newOrg.value.jurpersonFullName.trim()) {
    return toastRef.value?.show('Заполните обязательные поля наименований', 'error')
  }

  runCreate(
    async () => {
      const res = await jurpersonService.createJurperson({
        inn: newOrg.value.inn.trim(),
        jurpersonName: newOrg.value.jurpersonName.trim(),
        jurpersonFullName: newOrg.value.jurpersonFullName.trim(),
      })
      toastRef.value?.show(res.message || 'Организация успешно создана!', 'success')
      resetCreateForm()
      showCreateForm.value = false
      await load()
    },
    { toast: toastRef.value },
  )
}

const handleSelectJurperson = async (id: number) => {
  const success = await select(id)
  if (success) {
    toastRef.value?.show('Организация успешно выбрана!', 'success')
    setTimeout(() => router.push('/'), 500)
  }
}

const handleLogout = () => {
  localStorage.clear()
  window.location.href = '/login'
}

onMounted(load)
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.animate-spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
