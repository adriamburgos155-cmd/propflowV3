'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
export function useAuth() {
  const [user, setUser]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])
  const signIn  = useCallback(async (email: string, password: string) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error }, [])
  const signUp  = useCallback(async (email: string, password: string) => { const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error }, [])
  const signOut = useCallback(async () => { await supabase.auth.signOut() }, [])
  return { user, loading, signIn, signUp, signOut }
}
