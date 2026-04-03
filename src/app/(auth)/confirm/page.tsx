'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login?error=Invalid+or+expired+invite+link')
        return
      }

      const res = await fetch(`${window.location.origin}/api/auth/post-confirm`, {  // 👈 full URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        router.replace('/login?error=Something+went+wrong')
        return
      }

      const { redirect } = await res.json()
      router.replace(redirect)
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Setting up your account...</p>
      </div>
    </div>
  )
}
