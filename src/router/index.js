import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { translate } from '@/i18n/index.js'

// Hash history: the production build is a single static index.html with no
// server-side rewrites. Swap to createWebHistory() behind a rewriting host.
const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue'), meta: { titleKey: 'nav.home' } },
  { path: '/shop', name: 'shop', component: () => import('@/pages/ShopPage.vue'), meta: { titleKey: 'shop.title' } },
  { path: '/product/:slug', name: 'product', component: () => import('@/pages/ProductPage.vue'), meta: { titleKey: 'nav.shop' } },
  { path: '/cart', name: 'cart', component: () => import('@/pages/CartPage.vue'), meta: { titleKey: 'cart.title' } },
  { path: '/wishlist', name: 'wishlist', component: () => import('@/pages/WishlistPage.vue'), meta: { titleKey: 'fav.title' } },
  { path: '/checkout', name: 'checkout', component: () => import('@/pages/CheckoutPage.vue'), meta: { titleKey: 'checkout.title', requiresAuth: true } },
  { path: '/orders/:id', name: 'order', component: () => import('@/pages/ReceiptPage.vue'), meta: { titleKey: 'receipt.title', requiresAuth: true } },
  { path: '/account', name: 'account', component: () => import('@/pages/AccountPage.vue'), meta: { titleKey: 'account.title', requiresAuth: true } },
  { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { titleKey: 'common.signIn', layout: 'auth', guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('@/pages/RegisterPage.vue'), meta: { titleKey: 'common.signUp', layout: 'auth', guestOnly: true } },

  { path: '/admin', name: 'admin', component: () => import('@/pages/admin/AdminOverview.vue'), meta: { titleKey: 'admin.overview', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/products', name: 'admin-products', component: () => import('@/pages/admin/AdminProducts.vue'), meta: { titleKey: 'admin.products', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/orders', name: 'admin-orders', component: () => import('@/pages/admin/AdminOrders.vue'), meta: { titleKey: 'admin.orders', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/customers', name: 'admin-customers', component: () => import('@/pages/admin/AdminCustomers.vue'), meta: { titleKey: 'nav2.customers', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/catalog', name: 'admin-catalog', component: () => import('@/pages/admin/AdminCatalog.vue'), meta: { titleKey: 'nav2.catalog', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/inventory', name: 'admin-inventory', component: () => import('@/pages/admin/AdminInventory.vue'), meta: { titleKey: 'nav2.inventory', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/discounts', name: 'admin-discounts', component: () => import('@/pages/admin/AdminDiscounts.vue'), meta: { titleKey: 'nav2.discounts', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/payments', name: 'admin-payments', component: () => import('@/pages/admin/AdminPayments.vue'), meta: { titleKey: 'nav2.payments', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/shipping', name: 'admin-shipping', component: () => import('@/pages/admin/AdminShipping.vue'), meta: { titleKey: 'nav2.shipping', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/reports', name: 'admin-reports', component: () => import('@/pages/admin/AdminReports.vue'), meta: { titleKey: 'nav2.reports', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/reviews', name: 'admin-reviews', component: () => import('@/pages/admin/AdminReviews.vue'), meta: { titleKey: 'nav2.reviews', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/banners', name: 'admin-banners', component: () => import('@/pages/admin/AdminBanners.vue'), meta: { titleKey: 'nav2.banners', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/staff', name: 'admin-staff', component: () => import('@/pages/admin/AdminStaff.vue'), meta: { titleKey: 'nav2.staff', layout: 'dashboard', requiresAdmin: true } },
  { path: '/admin/settings', name: 'admin-settings', component: () => import('@/pages/admin/AdminSettings.vue'), meta: { titleKey: 'nav2.settings', layout: 'dashboard', requiresAdmin: true } },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue'), meta: { titleKey: 'common.noResults' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if ((to.meta.requiresAuth || to.meta.requiresAdmin) && !auth.isAuthenticated)
    return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && !auth.isAdmin) return { name: 'home' }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: auth.isAdmin ? 'admin' : 'account' }
})

router.afterEach((to) => {
  const locale = document.documentElement.getAttribute('lang') || 'en'
  const title = to.meta.titleKey ? translate(locale, to.meta.titleKey) : ''
  document.title = title ? `${title} · VKS` : 'VKS — Sneaker Store'
})

export default router
