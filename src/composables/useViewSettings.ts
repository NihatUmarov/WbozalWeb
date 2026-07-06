import { ref, watch } from 'vue'

// Инициализируем флаги. Фото по умолчанию true, остальные — false
const showImage = ref(localStorage.getItem('view_show_image') !== 'false')
const showArt = ref(localStorage.getItem('view_show_art') === 'true')
const showWbArt = ref(localStorage.getItem('view_show_wb_art') === 'true')
const showSize = ref(localStorage.getItem('view_show_size') === 'true')

// Подписываемся на автоматическое сохранение изменений
watch(showImage, (val) => localStorage.setItem('view_show_image', String(val)))
watch(showArt, (val) => localStorage.setItem('view_show_art', String(val)))
watch(showWbArt, (val) => localStorage.setItem('view_show_wb_art', String(val)))
watch(showSize, (val) => localStorage.setItem('view_show_size', String(val)))

export function useViewSettings() {
  return {
    showImage,
    showArt,
    showWbArt,
    showSize,
  }
}
