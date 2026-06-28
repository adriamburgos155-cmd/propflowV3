'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Firm, Account, Trade, Evaluation, Payout, AiReport } from '@/lib/types'

export function useData(userId: string | undefined) {
  const [firms,       setFirms]       = useState<Firm[]>([])
  const [accounts,    setAccounts]    = useState<Account[]>([])
  const [trades,      setTrades]      = useState<Trade[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [payouts,     setPayouts]     = useState<Payout[]>([])
  const [reports,     setReports]     = useState<AiReport[]>([])
  const [loaded,      setLoaded]      = useState(false)
  const db = createClient()

  const load = useCallback(async () => {
    if (!userId) return
    setLoaded(false)
    const [f, a, t, e, p, r] = await Promise.all([
      db.from('firms').select('*').eq('user_id', userId).order('name'),
      db.from('accounts').select('*, firm:firms(name)').eq('user_id', userId).order('created_at'),
      db.from('trades').select('*').eq('user_id', userId).order('trade_date', { ascending: false }).limit(500),
      db.from('evaluations').select('*, firm:firms(name), account:accounts(name,size)').eq('user_id', userId).order('purchase_date', { ascending: false }),
      db.from('payouts').select('*, firm:firms(name), account:accounts(name,size)').eq('user_id', userId).order('created_at', { ascending: false }),
      db.from('ai_reports').select('*').eq('user_id', userId).order('report_date', { ascending: false }).limit(10),
    ])
    setFirms(f.data || [])
    setAccounts(a.data || [])
    setTrades(t.data || [])
    setEvaluations(e.data || [])
    setPayouts(p.data || [])
    setReports(r.data || [])
    setLoaded(true)
  }, [userId])

  useEffect(() => { load() }, [load])

  // ── FIRMS ──────────────────────────────────────────
  const addFirm = async (firm: Partial<Firm>) => {
    const { data, error } = await db.from('firms').insert({ ...firm, user_id: userId }).select().single()
    if (error) throw error
    setFirms(prev => [...prev, data])
    return data
  }
  const deleteFirm = async (id: number) => {
    await db.from('firms').delete().eq('id', id).eq('user_id', userId)
    setFirms(prev => prev.filter(f => f.id !== id))
  }

  // ── ACCOUNTS ───────────────────────────────────────
  const addAccount = async (acc: Partial<Account>) => {
    const { data, error } = await db.from('accounts').insert({ ...acc, user_id: userId }).select('*, firm:firms(name)').single()
    if (error) throw error
    setAccounts(prev => [...prev, data])
    return data
  }
  const updateAccount = async (id: number, updates: Partial<Account>) => {
    const { error } = await db.from('accounts').update(updates).eq('id', id).eq('user_id', userId)
    if (error) throw error
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }
  const deleteAccount = async (id: number) => {
    await db.from('accounts').delete().eq('id', id).eq('user_id', userId)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  // ── EVALUATIONS ────────────────────────────────────
  const addEvaluation = async (ev: Partial<Evaluation>) => {
    const { data, error } = await db.from('evaluations').insert({ ...ev, user_id: userId }).select('*, firm:firms(name), account:accounts(name,size)').single()
    if (error) throw error
    setEvaluations(prev => [data, ...prev])
    return data
  }
  const updateEvaluation = async (id: number, updates: Partial<Evaluation>) => {
    await db.from('evaluations').update(updates).eq('id', id)
    setEvaluations(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  // ── PAYOUTS ────────────────────────────────────────
  const addPayout = async (p: Partial<Payout>) => {
    const { data, error } = await db.from('payouts').insert({ ...p, user_id: userId }).select('*, firm:firms(name), account:accounts(name,size)').single()
    if (error) throw error
    setPayouts(prev => [data, ...prev])
    return data
  }
  const updatePayout = async (id: number, updates: Partial<Payout>) => {
    await db.from('payouts').update(updates).eq('id', id)
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  // ── TRADES ─────────────────────────────────────────
  const addTrade = async (trade: Partial<Trade>) => {
    const { data, error } = await db.from('trades').insert({ ...trade, user_id: userId }).select().single()
    if (error) throw error
    setTrades(prev => [data, ...prev])
    return data
  }
  const deleteTrade = async (id: number) => {
    await db.from('trades').delete().eq('id', id).eq('user_id', userId)
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  // ── CSV IMPORT ─────────────────────────────────────
  const importTrades = async (rows: Partial<Trade>[]) => {
    const withUser = rows.map(r => ({ ...r, user_id: userId, imported_from: 'csv' }))
    const { data, error } = await db.from('trades').insert(withUser).select()
    if (error) throw error
    setTrades(prev => [...(data || []), ...prev])
    return data?.length || 0
  }

  return {
    firms, accounts, trades, evaluations, payouts, reports, loaded,
    addFirm, deleteFirm,
    addAccount, updateAccount, deleteAccount,
    addEvaluation, updateEvaluation,
    addPayout, updatePayout,
    addTrade, deleteTrade, importTrades,
    reload: load,
  }
}
