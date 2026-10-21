import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardRoute from './pages/DashboardRoute'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './pages/ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/overview" element={<DashboardPage initialSection="Dashboard" />} />
          <Route path="/dashboard/products" element={<DashboardPage initialSection="Produk" />} />
          <Route
            path="/dashboard/product-form"
            element={<DashboardPage initialSection="Produk" initialProductFormOpen />}
          />
          <Route path="/dashboard/categories" element={<DashboardPage initialSection="Kategori" />} />
          <Route path="/dashboard/reports" element={<DashboardPage initialSection="Laporan Omzet" />} />
          <Route path="/dashboard/profile" element={<DashboardPage initialSection="Profil Warung" />} />
          <Route path="/dashboard/omzet" element={<DashboardRoute />} />
          <Route path="/overview" element={<DashboardPage initialSection="Dashboard" />} />
          <Route path="/products" element={<DashboardPage initialSection="Produk" />} />
          <Route
            path="/product-form"
            element={<DashboardPage initialSection="Produk" initialProductFormOpen />}
          />
          <Route path="/categories" element={<DashboardPage initialSection="Kategori" />} />
          <Route path="/reports" element={<DashboardPage initialSection="Laporan Omzet" />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
