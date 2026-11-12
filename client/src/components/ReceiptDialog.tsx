import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import type { StoreProfile } from '../data/demoStoreProfile'
import { formatRupiah } from '../data/products'
import type { SaleTransaction } from '../data/sales'
import './ReceiptDialog.css'

type ReceiptDialogProps = {
  sale: SaleTransaction
  storeProfile: StoreProfile
  onClose: () => void
}

function formatReceiptDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function ReceiptDialog({ sale, storeProfile, onClose }: ReceiptDialogProps) {
  useEffect(() => {
    document.body.classList.add('receipt-print-active')
    return () => document.body.classList.remove('receipt-print-active')
  }, [])

  return (
    <div
      className="receipt-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="receipt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="receipt-dialog-header">
          <h2 id="receipt-dialog-title">Struk Transaksi</h2>
          <button type="button" aria-label="Tutup struk" onClick={onClose}>
            <X size={17} />
          </button>
        </header>

        <article className="receipt-print-root">
          <header className="receipt-print-heading">
            <strong>{storeProfile.storeName}</strong>
            {storeProfile.address && <span>{storeProfile.address}</span>}
            {storeProfile.phone && <span>WhatsApp: {storeProfile.phone}</span>}
            {storeProfile.operatingHours && (
              <span>{storeProfile.operatingHours}</span>
            )}
          </header>

          <div className="receipt-print-meta">
            <span>No: {sale.id}</span>
            <span>{formatReceiptDate(sale.date)} · {sale.time}</span>
            <span>Kasir: {sale.cashier}</span>
          </div>

          <hr />
          <div className="receipt-print-items">
            {sale.productLines.map((line, index) => {
              const productName =
                line.productName ?? sale.items[index] ?? 'Produk'

              if (line.unitPrice === undefined) {
                return (
                  <div
                    className="receipt-print-item"
                    key={`${line.productId}-${index}`}
                  >
                    <span>{productName}</span>
                  </div>
                )
              }

              const lineTotal = line.unitPrice * line.quantity

              return (
                <div
                  className="receipt-print-item"
                  key={`${line.productId}-${index}`}
                >
                  <span>{productName}</span>
                  <div>
                    <span>
                      {line.quantity} × {formatRupiah(line.unitPrice)}
                    </span>
                    <span>{formatRupiah(lineTotal)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <hr />
          {sale.discount ? (
            <div className="receipt-print-total">
              <span>Subtotal</span>
              <span>
                {formatRupiah(sale.total + sale.discount)}
              </span>
              <span>Diskon</span>
              <span>-{formatRupiah(sale.discount)}</span>
            </div>
          ) : null}
          <div className="receipt-print-total receipt-print-grand-total">
            <strong>TOTAL</strong>
            <strong>{formatRupiah(sale.total)}</strong>
          </div>
          {sale.cashReceived !== undefined && (
            <div className="receipt-print-total">
              <span>Tunai</span>
              <span>{formatRupiah(sale.cashReceived)}</span>
              <span>Kembalian</span>
              <span>{formatRupiah(Math.max(0, sale.cashReceived - sale.total))}</span>
            </div>
          )}
          <div className="receipt-print-thanks">
            <span>Pembayaran: {sale.payment}</span>
            <span>{storeProfile.receiptFooter}</span>
          </div>
        </article>

        <footer className="receipt-dialog-actions">
          <button
            className="receipt-print-button"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Cetak Struk
          </button>
        </footer>
      </section>
    </div>
  )
}

export default ReceiptDialog
