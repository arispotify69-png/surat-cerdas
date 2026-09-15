import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge, formatTanggal } from '@/components/StatusBadge'
import { FileText, FilePlus2, ScanLine, BookOpen } from 'lucide-react'

export default async function DashboardTU() {
  const supabase = createClient()
  const { data: surat } = await supabase
    .from('surat_keluar')
    .select('id,no_surat,perihal,status,is_public,created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const stats = (surat ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {})

  const actions = [
    { href: '/surat/baru', label: 'Buat Surat', icon: FilePlus2 },
    { href: '/surat/masuk', label: 'Surat Masuk (OCR)', icon: ScanLine },
    { href: '/dashboard/tata-usaha/templates', label: 'Template AI', icon: BookOpen },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-bold tracking-tight">Dashboard Tata Usaha</h1>
      <p className="mt-1 text-sm text-zinc-500">Kelola surat keluar, surat masuk, dan format AI.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: 'draft', l: 'Draf' },
          { k: 'pending_approval', l: 'Menunggu' },
          { k: 'approved', l: 'Disetujui' },
          { k: 'rejected', l: 'Ditolak' },
        ].map((s) => (
          <div key={s.k} className="ui-card">
            <p className="text-2xl font-bold tabular-nums">{stats[s.k] ?? 0}</p>
            <p className="text-xs text-zinc-500">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="ui-card flex items-center gap-3 hover:border-indigo-300">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <a.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-zinc-500">Surat Terbaru</h2>
      {!surat?.length ? (
        <div className="ui-card mt-3 flex flex-col items-center gap-2 p-10 text-center">
          <FileText className="h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">Belum ada surat. Mulai dengan membuat surat baru.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {surat.map(
            (s: {
              id: string
              no_surat: string
              perihal: string
              status: string
              is_public: boolean
              created_at: string
            }) => (
              <li key={s.id} className="ui-card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.perihal}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>{s.no_surat}</span>
                    <span>· {formatTanggal(s.created_at)}</span>
                    {s.is_public && <span>· publik</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={s.status} />
                  <Link href={`/review/${s.id}`} className="ui-btn-ghost px-3">
                    Buka
                  </Link>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </main>
  )
}
