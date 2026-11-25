import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import ProtectedRoute from './pages/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { DemoProvider } from './contexts/DemoContext'
import { PreviewProvider } from './contexts/PreviewContext'

const lazyPages = {
  LoginPage: lazy(() => import('./pages/LoginPage')),
  HomeRedirect: lazy(() => import('./pages/HomeRedirect')),
  DashboardRoute: lazy(() => import('./pages/DashboardRoute')),
  DashboardPage: lazy(() => import('./pages/DashboardPage')),
  ProfilePage: lazy(() => import('./pages/ProfilePage')),
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PreviewProvider>
        <DemoProvider>
          <AuthProvider>
            <Suspense fallback={<div role="status" aria-live="polite">Memuat halaman...</div>}>
              <Routes>
                <Route path="/" element={<lazyPages.HomeRedirect />} />
                <Route path="/login" element={<lazyPages.LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<lazyPages.DashboardPage />} />
                  <Route path="/dashboard/overview" element={<lazyPages.DashboardPage initialSection="Dashboard" />} />
                  <Route path="/dashboard/products" element={<lazyPages.DashboardPage initialSection="Produk" />} />
                  <Route
                    path="/dashboard/product-form"
                    element={<lazyPages.DashboardPage initialSection="Produk" initialProductFormOpen />}
                  />
                  <Route path="/dashboard/categories" element={<lazyPages.DashboardPage initialSection="Kategori" />} />
                  <Route path="/dashboard/reports" element={<lazyPages.DashboardPage initialSection="Laporan Omzet" />} />
                  <Route path="/dashboard/profile" element={<lazyPages.DashboardPage initialSection="Profil Warung" />} />
                  <Route path="/dashboard/omzet" element={<lazyPages.DashboardRoute />} />
                  <Route path="/overview" element={<lazyPages.DashboardPage initialSection="Dashboard" />} />
                  <Route path="/products" element={<lazyPages.DashboardPage initialSection="Produk" />} />
                  <Route
                    path="/product-form"
                    element={<lazyPages.DashboardPage initialSection="Produk" initialProductFormOpen />}
                  />
                  <Route path="/categories" element={<lazyPages.DashboardPage initialSection="Kategori" />} />
                  <Route path="/transactions" element={<lazyPages.DashboardPage initialSection="Transaksi Kasir" />} />
                  <Route path="/reports" element={<lazyPages.DashboardPage initialSection="Laporan Omzet" />} />
                  <Route path="/profile" element={<lazyPages.ProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </DemoProvider>
      </PreviewProvider>
    </BrowserRouter>
  </StrictMode>,
)
