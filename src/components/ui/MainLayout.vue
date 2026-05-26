<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-logo" @click="router.push('/')">WBOZAL.RU</div>

      <div class="header-center">
        <TheDock />
      </div>

      <div class="header-right">
        <div class="brand-dropdown" ref="dropdownRef">
          <div
            class="dropdown-trigger"
            :class="{ 'not-selected': !selectedJurpersonId, 'is-open': isDropdownOpen }"
            @click="toggleDropdown"
          >
            <span class="folder-icon">💼</span>
            <span class="trigger-text">{{ currentJurpersonName }}</span>
            <span class="arrow-icon" :class="{ rotate: isDropdownOpen }">▾</span>
          </div>

          <div class="dropdown-menu" :class="{ 'is-visible': isDropdownOpen }">
            <div class="search-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск организации..."
                class="dropdown-search"
                @click.stop
              />
            </div>

            <div class="dropdown-list">
              <div
                v-for="jurperson in filteredJurpersons"
                :key="jurperson.idJurperson"
                :class="[
                  'dropdown-item',
                  { active: jurperson.idJurperson === selectedJurpersonId },
                ]"
                @click="handleJurpersonSelect(jurperson.idJurperson)"
              >
                <div class="brand-info-block">
                  <span class="brand-name">{{ jurperson.jurpersonName }}</span>
                  <span class="brand-id">ID: {{ jurperson.idJurperson }}</span>
                </div>
                <span v-if="jurperson.idJurperson === selectedJurpersonId" class="check-mark"
                  >✓</span
                >
              </div>

              <div v-if="filteredJurpersons.length === 0" class="no-results">Ничего не найдено</div>
            </div>
          </div>
        </div>

        <div class="user-menu">
          <button class="logout-btn" @click="handleLogoutAction" title="Выйти из аккаунта">
            <!-- Иконка вместо текста для разгрузки UI на мобильных -->
            <span class="logout-text">Выход</span>
            <span class="logout-icon">🚪</span>
          </button>
        </div>
      </div>
    </header>

    <main class="content">
      <slot />
    </main>

    <TheToast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { jurpersonService } from '@/api/jurpersonService'
import { authService } from '@/api/authService'

import type { JurpersonShort, GetJurpersonsResponse } from '@/api/types'
import TheToast from '@/components/ui/TheToast.vue'
import TheDock from '@/components/ui/MacDock.vue'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const jurpersons = ref<JurpersonShort[]>([])
const selectedJurpersonId = ref<number | null>(null)
const searchQuery = ref('')
const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

const currentJurpersonName = computed(() => {
  const active = jurpersons.value.find((j) => j.idJurperson === selectedJurpersonId.value)
  return active ? active.jurpersonName : 'Выберите организацию'
})

const filteredJurpersons = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return jurpersons.value

  return jurpersons.value.filter((j) => {
    const name = j.jurpersonName ? j.jurpersonName.toLowerCase() : ''
    const id = j.idJurperson ? j.idJurperson.toString() : ''
    return name.includes(query) || id.includes(query)
  })
})

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  try {
    const data: GetJurpersonsResponse = await jurpersonService.getJurpersons()
    jurpersons.value = data.jurpersons

    if (data.activeId) {
      selectedJurpersonId.value = data.activeId
      localStorage.setItem('selected_jurperson_id', data.activeId.toString())
    } else {
      selectedJurpersonId.value = null
      localStorage.removeItem('selected_jurperson_id')
      toastRef.value?.show('Пожалуйста, выберите организацию в шапке', 'warning')
    }
  } catch (err) {
    console.error(err)
    toastRef.value?.show('Не удалось загрузить список организаций', 'error')
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Наша новая рабочая логика переключения через jid на /api/auth/switch_profile
const handleJurpersonSelect = async (idJurperson: number) => {
  if (idJurperson === selectedJurpersonId.value) return
  try {
    await authService.switchProfile(idJurperson)

    localStorage.setItem('selected_jurperson_id', idJurperson.toString())
    selectedJurpersonId.value = idJurperson
    isDropdownOpen.value = false

    toastRef.value?.show('Организация успешно изменена! Перезагрузка...', 'success')

    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    console.error(error)
    toastRef.value?.show('Не удалось переключить организацию', 'error')
  }
}

const handleLogoutAction = () => {
  localStorage.clear()
  window.location.href = '/login'
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: #f8fafc;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  z-index: 1000;
  height: 70px;
  box-sizing: border-box;
}

.header-logo {
  font-weight: 800;
  color: #0f172a;
  font-size: 20px;
  letter-spacing: -0.5px;
  cursor: pointer;
  flex: 1; /* Даем одинаковый вес с правой частью, чтобы центр был ИДЕАЛЬНО по центру */
  display: flex;
  align-items: center;
}

/* МАГИЯ ВЫРАВНИВАНИЯ ДОКА ПО ЦЕНТРУ ЭКРАНА */
.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 auto;
  height: 100%;
  overflow: visible;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: flex-end;
}

.content {
  padding: 110px 24px 40px;
  width: 90%;
  max-width: 1800px;
  margin: 0 auto;
}

.brand-dropdown {
  position: relative;
  user-select: none;
}
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}
.trigger-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.dropdown-trigger:hover,
.dropdown-trigger.is-open {
  background: #e2e8f0;
  color: #0f172a;
}
.dropdown-trigger.not-selected {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
  animation: pulse 2s infinite;
}
.arrow-icon {
  font-size: 11px;
  color: #64748b;
  transition: transform 0.2s ease;
}
.arrow-icon.rotate {
  transform: rotate(180deg);
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 280px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.08);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.dropdown-menu.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.search-wrapper {
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.dropdown-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
}
.dropdown-search:focus {
  border-color: #6366f1;
  background: white;
}
.dropdown-list {
  max-height: 240px;
  overflow-y: auto;
}
.dropdown-item {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.dropdown-item:hover {
  background: #f8fafc;
}
.dropdown-item.active {
  background: #f5f3ff;
  border-left-color: #6366f1;
}
.brand-info-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}
.dropdown-item.active .brand-name {
  color: #6366f1;
  font-weight: 600;
}
.brand-id {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
  width: fit-content;
}
.dropdown-item.active .brand-id {
  background: #e0e7ff;
  color: #4f46e5;
}
.check-mark {
  color: #6366f1;
  font-weight: bold;
}
.no-results {
  padding: 20px 14px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.logout-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.logout-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}
.logout-icon {
  display: none;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 1050px) {
  .header {
    padding: 0 16px; /* Уменьшили боковые поля, выиграли 48px пространства */
    gap: 12px;
  }

  .header-logo {
    display: none;
  }

  .header-center {
    flex: 1;
    justify-content: flex-start;
  }
}

@media (max-width: 650px) {
  .header {
    padding: 0 10px; /* Максимально прижимаем к краям экрана на смартфонах */
    gap: 8px; /* Минимальные зазоры между доком и брендом */
  }

  .header-right {
    gap: 8px;
  }

  .trigger-text {
    max-width: 75px; /* Защита: название бренда Lula Lula аккуратно превратится в Lula Lu... но не перенесется вниз */
  }

  .logout-text {
    display: none;
  }

  .logout-icon {
    display: block;
    font-size: 16px;
  }

  .logout-btn {
    padding: 6px;
  }
}
</style>
