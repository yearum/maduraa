import {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { Product } from '../data/products'
import { initialProducts, productCategories } from '../data/products'
import type { StoreProfile } from '../data/demoStoreProfile'
import { initialStoreProfile } from '../data/demoStoreProfile'
import type { SaleTransaction } from '../data/sales'
import { initialDemoSales } from '../data/sales'
import { isPrototypeMode } from '../authMode'
import { getDataAdapter } from '../services/dataAdapters'
import {
  DemoContext,
  type DemoSession,
  type DemoStoreState,
  type DemoStoreValue,
} from './demoContextValue'

type DemoAction =
  | { type: 'hydrate'; data: DemoSession | null; error?: string }
  | { type: 'replace'; data: DemoSession }
  | { type: 'logout' }
  | { type: 'error'; error: string | null }

function createPrototypeData(userName: string, userEmail: string): DemoSession {
  return {
    userName,
    userEmail,
    storeProfile: {
      ...initialStoreProfile,
      ownerName: userName,
      email: userEmail,
      phone: '',
    },
    products: initialProducts.map((product) => ({ ...product })),
    categories: productCategories.filter((category) => category !== 'Semua'),
    cart: {},
    sales: initialDemoSales.map((sale) => ({
      ...sale,
      items: [...sale.items],
      productLines: sale.productLines.map((line) => ({ ...line })),
    })),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.sku === 'string' &&
    typeof value.cost === 'number' &&
    typeof value.price === 'number' &&
    typeof value.stock === 'number' &&
    typeof value.unit === 'string'
  )
}

function isSale(value: unknown): value is SaleTransaction {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    typeof value.time === 'string' &&
    Array.isArray(value.items) &&
    value.items.every((item) => typeof item === 'string') &&
    Array.isArray(value.productLines) &&
    value.productLines.every(
      (line) =>
        isRecord(line) &&
        typeof line.productId === 'number' &&
        typeof line.quantity === 'number',
    ) &&
    typeof value.total === 'number' &&
    typeof value.profit === 'number' &&
    value.payment === 'Tunai' &&
    value.status === 'Selesai' &&
    typeof value.cashier === 'string'
  )
}

function isStoreProfile(value: unknown): value is StoreProfile {
  return (
    isRecord(value) &&
    typeof value.ownerName === 'string' &&
    typeof value.email === 'string' &&
    typeof value.phone === 'string' &&
    typeof value.pin === 'string' &&
    typeof value.storeName === 'string' &&
    typeof value.operatingHours === 'string' &&
    typeof value.address === 'string' &&
    typeof value.receiptFooter === 'string'
  )
}

function isPrototypeData(value: unknown): value is DemoSession {
  return (
    isRecord(value) &&
    typeof value.userName === 'string' &&
    typeof value.userEmail === 'string' &&
    isStoreProfile(value.storeProfile) &&
    Array.isArray(value.products) &&
    value.products.every(isProduct) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isRecord(value.cart) &&
    Object.values(value.cart).every(
      (quantity) => typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0,
    ) &&
    Array.isArray(value.sales) &&
    value.sales.every(isSale)
  )
}

function reducer(state: DemoStoreState, action: DemoAction): DemoStoreState {
  switch (action.type) {
    case 'hydrate':
      return {
        data: action.data,
        loading: false,
        error: action.error ?? null,
      }
    case 'replace':
      return { data: action.data, loading: false, error: null }
    case 'logout':
      return { data: null, loading: false, error: null }
    case 'error':
      return { ...state, error: action.error }
  }
}

function persistPrototypeData(data: DemoSession | null): void {
  try {
    getDataAdapter().writeSession(data)
  } catch (error) {
    throw new Error('Data sesi sementara gagal disimpan.', { cause: error })
  }
}

function makeTransactionId(dateStamp: string): string {
  const suffix =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 10)
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `TRX-${dateStamp}-${suffix}`
}

type DemoProviderProps = {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const enabled = isPrototypeMode()
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    loading: enabled,
    error: null,
  })
  const dataRef = useRef<DemoSession | null>(null)

  const commitData = useCallback(
    (data: DemoSession | null) => {
      if (!enabled) throw new Error('Prototype hanya tersedia saat development.')
      persistPrototypeData(data)
      dataRef.current = data
      dispatch(data ? { type: 'replace', data } : { type: 'logout' })
    },
    [enabled],
  )

  useEffect(() => {
    if (!enabled) {
      dataRef.current = null
      dispatch({ type: 'hydrate', data: null })
      return
    }

    try {
      const parsed = getDataAdapter().readSession()
      if (parsed === null) {
        dataRef.current = null
        dispatch({ type: 'hydrate', data: null })
        return
      }

      if (!isPrototypeData(parsed)) {
        dataRef.current = null
        dispatch({
          type: 'hydrate',
          data: null,
          error: 'Data sesi sementara tidak valid. Silakan masuk kembali.',
        })
        return
      }

      dataRef.current = parsed
      dispatch({ type: 'hydrate', data: parsed })
    } catch {
      dataRef.current = null
      dispatch({
        type: 'hydrate',
        data: null,
        error: 'Data sesi sementara tidak dapat dibaca dari tab ini.',
      })
    }
  }, [enabled])

  const value = useMemo<DemoStoreValue>(
    () => ({
      ...state,
      enabled,
      startSession: (name, email) => {
        if (!enabled) throw new Error('Prototype hanya tersedia saat development.')
        const data = createPrototypeData(
          name.trim() || 'Pemilik Warung',
          email.trim().toLowerCase(),
        )
        try {
          commitData(data)
        } catch (cause) {
          const message = 'Sesi sementara tidak dapat disimpan di tab ini. Periksa pengaturan browser.'
          dispatch({ type: 'error', error: message })
          throw new Error(message, { cause })
        }
      },
      updateProducts: (products) => {
        const currentData = dataRef.current
        if (!currentData) return
        const cart = Object.fromEntries(
          Object.entries(currentData.cart).flatMap(([id, quantity]) => {
            const product = products.find((item) => item.id === Number(id))
            return product && product.stock > 0 && product.posEnabled !== false
              ? [[Number(id), Math.min(quantity, product.stock)]]
              : []
          }),
        )
        const data = { ...currentData, products, cart }
        try {
          commitData(data)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Produk gagal disimpan.',
          })
          throw error
        }
      },
      updateCategories: (categories) => {
        const currentData = dataRef.current
        if (!currentData) return
        const data = { ...currentData, categories }
        try {
          commitData(data)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Kategori gagal disimpan.',
          })
          throw error
        }
      },
      updateSales: (sales) => {
        const currentData = dataRef.current
        if (!currentData) return
        const data = { ...currentData, sales }
        try {
          commitData(data)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Riwayat transaksi gagal disimpan.',
          })
          throw error
        }
      },
      updateProfile: (storeProfile, syncUserName = false) => {
        const currentData = dataRef.current
        if (!currentData) return
        const data = {
          ...currentData,
          storeProfile,
          userName: syncUserName
            ? storeProfile.ownerName.trim() || 'Pemilik Warung'
            : currentData.userName,
        }
        try {
          commitData(data)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Profil gagal disimpan.',
          })
          throw error
        }
      },
      updateCart: (cart) => {
        const currentData = dataRef.current
        if (!currentData) return
        const nextCart =
          typeof cart === 'function' ? cart(currentData.cart) : cart
        const data = { ...currentData, cart: nextCart }
        try {
          commitData(data)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Keranjang gagal disimpan.',
          })
          throw error
        }
      },
      checkout: (discount, cashReceived) => {
        const data = dataRef.current
        if (!data) throw new Error('Sesi sementara tidak aktif. Silakan masuk kembali.')

        const entries = Object.entries(data.cart)
        if (entries.length === 0) throw new Error('Keranjang masih kosong.')

        const lines = entries.map(([id, quantity]) => {
          const product = data.products.find((item) => item.id === Number(id))
          if (!Number.isInteger(quantity) || quantity <= 0 || !product) {
            throw new Error('Isi keranjang tidak valid. Periksa kembali barang yang dipilih.')
          }
          if (product.stock < quantity) {
            throw new Error(`Stok ${product.name} tidak mencukupi.`)
          }
          return { product, quantity }
        })

        const subtotal = lines.reduce(
          (amount, line) => amount + line.product.price * line.quantity,
          0,
        )
        if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
          throw new Error('Nilai diskon tidak valid.')
        }
        const total = subtotal - discount
        if (!Number.isFinite(cashReceived) || cashReceived < total) {
          throw new Error('Uang yang diterima belum mencukupi.')
        }

        const now = new Date()
        const date = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-')
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const transaction: SaleTransaction = {
          id: makeTransactionId(date.replaceAll('-', '')),
          date,
          time,
          createdAt: now.toISOString(),
          items: lines.map(
            ({ product, quantity }) => `${product.name} (${quantity}x)`,
          ),
          productLines: lines.map(({ product, quantity }) => ({
            productId: product.id,
            productName: product.name,
            productCategory: product.category,
            quantity,
            unitPrice: product.price,
            unitCost: product.cost,
            unit: product.unit,
          })),
          total,
          discount,
          cashReceived,
          profit: Math.max(
            0,
            lines.reduce(
              (amount, line) =>
                amount + (line.product.price - line.product.cost) * line.quantity,
              0,
            ) - discount,
          ),
          payment: 'Tunai',
          status: 'Selesai',
          cashier: data.userName,
        }
        const quantities = new Map(
          lines.map(({ product, quantity }) => [product.id, quantity]),
        )
        const nextData = {
          ...data,
          products: data.products.map((product) => ({
            ...product,
            stock: product.stock - (quantities.get(product.id) ?? 0),
          })),
          cart: {},
          sales: [transaction, ...data.sales],
        }

        try {
          commitData(nextData)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Transaksi gagal disimpan.',
          })
          throw error
        }
        return transaction
      },
      reset: () => {
        const currentData = dataRef.current
        if (!currentData) return
        const data = createPrototypeData(currentData.userName, currentData.userEmail)
        try {
          commitData(data)
        } catch (error) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'Demo gagal direset.',
          })
          throw error
        }
      },
      logout: () => {
        try {
          commitData(null)
        } catch (cause) {
          const message = 'Data sesi sementara tidak dapat dihapus dari tab ini.'
          dispatch({ type: 'error', error: message })
          throw new Error(message, { cause })
        }
      },
      clearError: () => dispatch({ type: 'error', error: null }),
    }),
    [commitData, enabled, state],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
