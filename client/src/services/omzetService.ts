import { getSupabaseClient } from '../lib/supabase'

export interface OmzetRecord {
  id: string
  created_at: string
  total_amount: number
  payment_method: string | null
  user_id: string | null
}

export const getOmzetList = async (): Promise<OmzetRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .select('id, user_id, total_amount, payment_method, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error.message)
    throw error
  }

  return data ?? []
}

export type NewOmzetRecord = Pick<OmzetRecord, 'total_amount'> &
  Partial<Pick<OmzetRecord, 'payment_method' | 'user_id'>>

export const addOmzet = async (
  newRecord: NewOmzetRecord,
): Promise<OmzetRecord> => {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .insert(newRecord)
    .select('id, user_id, total_amount, payment_method, created_at')
    .single()

  if (error) {
    console.error('Error adding transaction:', error.message)
    throw error
  }

  return data
}
