import { createClient } from '@/lib/supabase/server'
import { Search, FileText, Download } from 'lucide-react'
import { formatTanggal } from '@/components/StatusBadge'

export const revalidate = 60

export async function generateMetadata() {
  return {
    title: 'Surat Cerdas — Surat Keluar Resmi Sekolah',
    description: 'Cari, baca, dan unduh surat resmi sekolah yang dipublikasikan.',
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = createClient()
  const q = (searchParams.q ?? '').trim().slice(0, 80)
  let query = supabase
    .from('surat_keluar')
    .select('id,no_surat,perihal,pdf_path,created_at')
    .eq('is_public', true)
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false })
    .limit(50)
  // sanitasi: buang karakter yang merusak sintaks filter PostgREST
  if (q) query = query.or(`perihal.ilike.%${q.replace(/[,()\\]/g, ' ')}%,no_surat.ilike.%${q.replace(/[,()\\]/g, ' ')}%`)

  const { data: surat } = await query

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-balance">Surat Keluar Sekolah</h1>
        <p className="mt-1 text-sm text-indigo-100">
          Cari, baca, dan unduh surat resmi yang telah dipublikasikan.
        </p>
        <form className="mt-4 flex gap-2" action="/">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari perihal atau nomor surat..."
              aria-label="Cari surat"
              className="min-h-[44px] w-full rounded-lg border-0 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </label>
          <button
            type="submit"
            className="min-h-[44px] shrink-0 rounded-lg bg-white/15 px-4 text-sm font-medium backdrop-blur hover:bg-white/25"
          >
            Cari
          </button>
        </form>
      </div>

      {!surat?.length ? (
        <div className="ui-card mt-6 flex flex-col items-center gap-2 p-10 text-center">
          <FileText className="h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            {q ? `Tidak ada surat cocok dengan "${q}".` : 'Belum ada surat publik.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {surat.map(
            (s: { id: string; perihal: string; no_surat: string; pdf_path: string | null; created_at: string }) => (
              <li
                key={s.id}
                className="ui-card flex items-start justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.perihal}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {s.no_surat} · {formatTanggal(s.created_at)}
                  </p>
                </div>
                {s.pdf_path && (
                  <a
                    href={`/api/surat/${s.id}/pdf`}
                    className="ui-btn-ghost shrink-0"
                    aria-label={`Unduh PDF ${s.perihal}`}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </a>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </main>
  )
}
