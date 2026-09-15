import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge, formatTanggal } from '@/components/StatusBadge'
import { CheckCircle2 } from 'lucide-react'

export default async function DashboardKepsek() {
  const supabase = createClient()
  const { data: surat } = await supabase
    .from('surat_keluar')
    .select('id,no_surat,perihal,status,created_at')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold tracking-tight">Antrian Persetujuan</h1>
      <p className="mt-1 text-sm text-zinc-500">Tinjau, tanda tangani, dan setujui surat keluar.</p>

      {!surat?.length ? (
        <div className="ui-card mt-5 flex flex-col items-center gap-2 p-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-sm text-zinc-500">Tidak ada surat menunggu persetujuan.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {surat.map(
            (s: { id: string; no_surat: string; perihal: string; status: string; created_at: string }) => (
              <li key={s.id} className="ui-card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.perihal}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {s.no_surat} · {formatTanggal(s.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={s.status} />
                  <Link href={`/review/${s.id}`} className="ui-btn-primary">
                    Review
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
