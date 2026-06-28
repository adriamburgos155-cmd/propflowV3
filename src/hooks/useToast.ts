'use client'
import { useState, useCallback } from 'react'
export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success'|'error' })
  const showToast = useCallback((message: string, type: 'success'|'error' = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])
  return { toast, showToast }
}
