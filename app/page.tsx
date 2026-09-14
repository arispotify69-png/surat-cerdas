import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function Home() {
  const supabase = createClient()
  const { data: surat } = await supabase
    .from('surat_keluar')
    .select('id,no_surat,perihal,pdf_path,created_at')
    .eq('is_public', true)
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Surat Keluar Publik</h1>
      <p className="mt-1 text-sm text-zinc-500">Cari, baca, unduh surat resmi sekolah.</p>
      {!surat?.length ? (
        <div className="mt-8 rounded-lg border p-8 text-center text-sm text-zinc-500">
          Belum ada surat publik.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {surat.map((s: { id: string; perihal: string; no_surat: string; pdf_path: string | null }) => (
            <li key={s.id} className="rounded-lg border p-4">
              <p className="font-medium">{s.perihal}</p>
              <p className="text-xs text-zinc-500">{s.no_surat}</p>
              {s.pdf_path && (
                <a
                  href={s.pdf_path}
                  className="mt-2 inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-4 text-sm text-white"
                >
                  Unduh PDF
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
