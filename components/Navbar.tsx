'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-bold tracking-tight text-zinc-900">
          Surat Cerdas
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="min-h-[44px] inline-flex items-center px-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            Publik
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="min-h-[44px] inline-flex items-center px-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="min-h-[44px] inline-flex items-center rounded-md border px-3 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Keluar
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="min-h-[44px] inline-flex items-center rounded-md bg-zinc-900 px-4 text-sm text-white hover:bg-zinc-800"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
