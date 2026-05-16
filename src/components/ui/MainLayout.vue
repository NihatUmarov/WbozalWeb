<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-logo" @click="router.push('/')">WBOZAL.RU</div>

      <!-- Док теперь будет четко посередине flex-контейнера -->
      <div class="header-center">
        <TheDock />
      </div>

      <div class="header-right">
        <div class="brand-dropdown" ref="dropdownRef">
          <div
            class="dropdown-trigger"
            :class="{ 'not-selected': !selectedBrandId, 'is-open': isDropdownOpen }"
            @click="toggleDropdown"
          >
            <span class="folder-icon">💼</span>
            <span class="trigger-text">{{ currentBrandName }}</span>
            <span class="arrow-icon" :class="{ rotate: isDropdownOpen }">▾</span>
          </div>

          <div class="dropdown-menu" :class="{ 'is-visible': isDropdownOpen }">
            <div class="search-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск по названию или ID..."
                class="dropdown-search"
                @click.stop
              />
            </div>

            <div class="dropdown-list">
              <div
                v-for="brand in filteredBrands"
                :key="brand.idBrand"
                class="dropdown-item"
                :class="{ active: brand.idBrand === selectedBrandId }"
                @click="handleBrandSelect(brand.idBrand)"
              >
                <div class="brand-info-block">
                  <span class="brand-name">{{ brand.brandName }}</span>
                  <span class="brand-id">ID: {{ brand.idBrand }}</span>
                </div>
                <span v-if="brand.idBrand === selectedBrandId" class="check-mark">✓</span>
              </div>

              <div v-if="filteredBrands.length === 0" class="no-results">Ничего не найдено</div>
            </div>
          </div>
        </div>

        <div class="user-menu">
          <button class="logout-btn" @click="handleLogoutAction">Выход</button>
        </div>
      </div>
    </header>

    <!-- Основной контент с верхним паддингом, чтобы не залезал под фиксированную шапку -->
    <main class="content">
      <slot />
    </main>

    <TheToast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { brandService } from '@/api/brandService'
import type { BrandShort, GetBrandsResponse } from '@/api/types'
import TheToast from '@/components/ui/TheToast.vue'
import TheDock from '@/components/ui/MacDock.vue'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const brands = ref<BrandShort[]>([])
const selectedBrandId = ref<number | null>(null)
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

const currentBrandName = computed(() => {
  const active = brands.value.find((b) => b.idBrand === selectedBrandId.value)
  return active ? active.brandName : 'Выберите бренд'
})

const filteredBrands = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return brands.value

  return brands.value.filter((b) => {
    const name = b.brandName ? b.brandName.toLowerCase() : ''
    const id = b.idBrand ? b.idBrand.toString() : ''
    return name.includes(query) || id.includes(query)
  })
})

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  try {
    const data: GetBrandsResponse = await brandService.getBrands()
    brands.value = data.brands

    if (data.selectedBrandId) {
      selectedBrandId.value = data.selectedBrandId
      localStorage.setItem('selected_brand_id', data.selectedBrandId.toString())
    } else {
      selectedBrandId.value = null
      localStorage.removeItem('selected_brand_id')
      toastRef.value?.show('Пожалуйста, выберите рабочий бренд в шапке', 'warning')
    }
  } catch (err) {
    console.error(err)
    toastRef.value?.show('Не удалось загрузить список брендов', 'error')
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleBrandSelect = async (idBrand: number) => {
  if (idBrand === selectedBrandId.value) return
  try {
    await brandService.selectBrand(idBrand)
    localStorage.setItem('selected_brand_id', idBrand.toString())
    selectedBrandId.value = idBrand
    isDropdownOpen.value = false
    toastRef.value?.show('Бренд успешно изменен! Перезагрузка...', 'success')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch {
    toastRef.value?.show('Не удалось переключить бренд', 'error')
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

/* Шапка теперь ВСЕГДА сверху экрана */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  z-index: 1000;
  height: 70px;
  box-sizing: border-box;
}

/* Флекс-контейнеры для жесткого позиционирования */
.header-logo {
  font-weight: 800;
  color: #0f172a;
  font-size: 20px;
  letter-spacing: -0.5px;
  cursor: pointer;
  flex: 1; /* Давит влево */
}

.header-center {
  display: flex;
  justify-content: center;
  flex: 2; /* Занимает центр */
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  justify-content: flex-end; /* Давит вправо */
}

/* Изменили padding-top, чтобы контент начинался ПОД шапкой */
.content {
  padding: 110px 40px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Остальные стили дропдауна и кнопок остаются без изменений... */
.brand-dropdown {
  position: relative;
  user-select: none;
}
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dropdown-trigger:hover,
.dropdown-trigger.is-open {
  background: #e2e8f0;
  border-color: #cbd5e1;
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
  width: 300px;
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
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.dropdown-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s;
}
.dropdown-search:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: white;
}
.dropdown-list {
  max-height: 260px;
  overflow-y: auto;
}
.dropdown-item {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}
.dropdown-item:hover {
  background: #f8fafc;
  border-left-color: #cbd5e1;
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
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}
.dropdown-item.active .brand-name {
  color: #6366f1;
  font-weight: 600;
}
.brand-id {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
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
  font-size: 14px;
}
.no-results {
  padding: 24px 16px;
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
  font-size: 14px;
  transition: color 0.2s;
  padding: 6px 12px;
  border-radius: 6px;
}
.logout-btn:hover {
  color: #ef4444;
  background: #fef2f2;
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

@media (max-width: 900px) {
  .header {
    padding: 14px 20px;
  }
  .header-center {
    order: 3;
    flex: none;
  }
  .header-right {
    flex: 1;
  }
}
</style>
