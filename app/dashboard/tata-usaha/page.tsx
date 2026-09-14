import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardTU() {
  const supabase = createClient()
  const { data: surat } = await supabase
    .from('surat_keluar')
    .select('id,no_surat,perihal,status,is_public,created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold">Dashboard Tata Usaha</h1>
      <Link
        href="/surat/baru"
        className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-4 text-sm text-white"
      >
        + Buat Surat Baru
      </Link>
      {!surat?.length ? (
        <p className="mt-8 rounded-lg border p-8 text-center text-sm text-zinc-500">Belum ada surat.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {surat.map((s: { id: string; no_surat: string; perihal: string; status: string; is_public: boolean }) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">{s.perihal}</p>
                <p className="text-xs text-zinc-500">
                  {s.no_surat} · {s.status}
                  {s.is_public ? ' · publik' : ''}
                </p>
              </div>
              <Link href={`/review/${s.id}`} className="min-h-[44px] items-center rounded-md border px-3 text-sm inline-flex">
                Buka
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
