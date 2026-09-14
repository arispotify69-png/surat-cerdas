import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
      <h1 className="text-xl font-bold">Antrian Persetujuan</h1>
      {!surat?.length ? (
        <p className="mt-8 rounded-lg border p-8 text-center text-sm text-zinc-500">Tidak ada surat menunggu.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {surat.map((s: { id: string; no_surat: string; perihal: string }) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">{s.perihal}</p>
                <p className="text-xs text-zinc-500">{s.no_surat}</p>
              </div>
              <Link href={`/review/${s.id}`} className="inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-4 text-sm text-white">
                Review
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
