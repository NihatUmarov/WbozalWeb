import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import StockDocumentsView from '../views/StockDocumentsView.vue' // Импортируем новый экран

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
