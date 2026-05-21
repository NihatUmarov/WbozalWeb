import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import StockDocumentsView from '../views/StockDocumentsView.vue'
import RemainsList from '../views/RemainsList.vue'
import CardsView from '../views/CardsView.vue' // <-- 1. ИМПОРТИРУЕМ НАШ ЭКРАН КАРТОЧЕК

const routes = [
  {
    path: '/',
    redirect: '/profile',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/documents',
    name: 'StockDocuments',
    component: StockDocumentsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/remains',
    name: 'RemainsList',
    component: RemainsList,
    meta: { requiresAuth: true },
  },
  {
    path: '/cards', // <-- 2. ДОБАВЛЯЕМ ПУТЬ ДЛЯ КАРТОЧЕК
    name: 'CardsList',
    component: CardsView,
    meta: { requiresAuth: true }, // Закрываем от неавторизованных
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('access_token')

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/profile')
  } else {
    next()
  }
})

export default router
