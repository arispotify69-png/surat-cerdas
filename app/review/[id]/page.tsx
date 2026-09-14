import { createClient } from '@/lib/supabase/server'
import TtdCanvas from '@/components/TtdCanvas'

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: surat, error } = await supabase.from('surat_keluar').select('*').eq('id', params.id).single()
  if (error || !surat) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500">Surat tidak ditemukan.</main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold">{surat.perihal}</h1>
      <p className="mt-1 text-xs text-zinc-500">
        {surat.no_surat} · {surat.status}
        {surat.pdf_path ? (
          <>
            {' · '}
            <a href={`/api/generate-pdf/${surat.id}`} className="underline">
              PDF: {surat.pdf_path}
            </a>
          </>
        ) : null}
      </p>
      <article
        className="prose prose-sm mt-6 max-w-none rounded-lg border bg-white p-4 sm:prose-base"
        dangerouslySetInnerHTML={{ __html: String(surat.isi_lengkap || surat.draf_text || '<p>(belum ada isi)</p>') }}
      />
      {surat.status === 'pending_approval' ? (
        <div className="mt-6">
          <TtdCanvas suratId={surat.id} ttdStoredPath={surat.ttd_path} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">Status saat ini: {surat.status}. TTD hanya tersedia saat pending_approval.</p>
      )}
    </main>
  )
}
