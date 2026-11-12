import { createContext } from 'react'
import type { Product } from '../data/products'
import type { StoreProfile } from '../data/demoStoreProfile'
import type { SaleTransaction } from '../data/sales'

export type DemoSession = {
  userName: string
  userEmail: string
  storeProfile: StoreProfile
  products: Product[]
  categories: string[]
  cart: Record<number, number>
  sales: SaleTransaction[]
}

export type DemoStoreState = {
  data: DemoSession | null
  loading: boolean
  error: string | null
}

export type DemoStoreValue = DemoStoreState & {
  enabled: boolean
  startSession: (name: string, email: string) => void
  updateProducts: (products: Product[]) => void
  updateCategories: (categories: string[]) => void
  updateSales: (sales: SaleTransaction[]) => void
  updateProfile: (profile: StoreProfile, syncUserName?: boolean) => void
  updateCart: (
    cart:
      | Record<number, number>
      | ((current: Record<number, number>) => Record<number, number>),
  ) => void
  checkout: (discount: number, cashReceived: number) => SaleTransaction
  reset: () => void
  logout: () => void
  clearError: () => void
}

export const DemoContext = createContext<DemoStoreValue | undefined>(undefined)
