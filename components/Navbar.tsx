'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { FileText, LogOut, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const link =
    'inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <FileText className="h-4 w-4" />
          </span>
          Surat Cerdas
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/" className={link}>
            Surat Publik
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={link}>
                Dashboard
              </Link>
              <button onClick={logout} className="ui-btn-ghost">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </>
          ) : (
            <Link href="/login" className="ui-btn-primary">
              Masuk
            </Link>
          )}
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
          className="ui-btn-ghost px-3 sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-zinc-200 bg-white px-4 py-2 sm:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <Link href="/" onClick={() => setOpen(false)} className={`${link} w-full`}>
            Surat Publik
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className={`${link} w-full`}>
                Dashboard
              </Link>
              <button onClick={logout} className={`${link} w-full text-red-600`}>
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className={`${link} w-full`}>
              Masuk
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
