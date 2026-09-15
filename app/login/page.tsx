'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      toast.error('Gagal masuk', { description: error.message })
      return
    }
    toast.success('Berhasil masuk')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white">
          <FileText className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Masuk ke Surat Cerdas</h1>
          <p className="mt-1 text-sm text-zinc-500">Khusus Tata Usaha & Kepala Sekolah.</p>
        </div>
      </div>

      <form onSubmit={submit} className="ui-card space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@sekolah.sch.id"
            className="ui-input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Kata sandi</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="ui-input"
          />
        </label>
        <button type="submit" disabled={loading} className="ui-btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}
