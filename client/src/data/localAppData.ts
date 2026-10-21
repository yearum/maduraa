import type { Product } from './products'
import type { SaleTransaction } from './sales'

function storageKey(identity: string, collection: string) {
  return `maduraa.account.${encodeURIComponent(identity)}.${collection}`
}

function readCollection<T>(
  identity: string,
  collection: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  let serialized: string | null
  try {
    serialized = window.localStorage.getItem(storageKey(identity, collection))
  } catch (error) {
    console.error(`Gagal membaca data ${collection} dari browser:`, error)
    return fallback
  }
  if (serialized === null) return fallback

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (isValid(parsed)) return parsed
  } catch (error) {
    console.error(`Data ${collection} tidak dapat dibaca:`, error)
  }
  console.error(`Data ${collection} tersimpan tidak valid; data awal digunakan.`)
  return fallback
}

function writeCollection<T>(identity: string, collection: string, value: T) {
  try {
    window.localStorage.setItem(
      storageKey(identity, collection),
      JSON.stringify(value),
    )
  } catch (error) {
    console.error(`Gagal menyimpan data ${collection} ke browser:`, error)
    throw new Error(
      `Perubahan ${collection} gagal disimpan di browser.`,
      { cause: error },
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProductList(value: unknown): value is Product[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'number' &&
        typeof item.name === 'string' &&
        typeof item.category === 'string' &&
        typeof item.sku === 'string' &&
        typeof item.cost === 'number' &&
        typeof item.price === 'number' &&
        typeof item.stock === 'number' &&
        typeof item.unit === 'string',
    )
  )
}

function isCategoryList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isSaleList(value: unknown): value is SaleTransaction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.date === 'string' &&
        typeof item.time === 'string' &&
        Array.isArray(item.items) &&
        item.items.every((entry) => typeof entry === 'string') &&
        Array.isArray(item.productLines) &&
        item.productLines.every(
          (line) =>
            isRecord(line) &&
            typeof line.productId === 'number' &&
            typeof line.quantity === 'number',
        ) &&
        typeof item.total === 'number' &&
        typeof item.profit === 'number' &&
        item.payment === 'Tunai' &&
        item.status === 'Selesai' &&
        typeof item.cashier === 'string',
    )
  )
}

export function loadProducts(identity: string, fallback: Product[]) {
  return readCollection(identity, 'products', fallback, isProductList)
}

export function saveProducts(identity: string, products: Product[]) {
  writeCollection(identity, 'products', products)
}

export function loadCategories(identity: string, fallback: string[]) {
  return readCollection(identity, 'categories', fallback, isCategoryList)
}

export function saveCategories(identity: string, categories: string[]) {
  writeCollection(identity, 'categories', categories)
}

export function loadSales(identity: string, fallback: SaleTransaction[]) {
  return readCollection(identity, 'sales', fallback, isSaleList)
}

export function saveSales(identity: string, sales: SaleTransaction[]) {
  writeCollection(identity, 'sales', sales)
}
