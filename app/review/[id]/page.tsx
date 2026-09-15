import { createClient } from '@/lib/supabase/server'
import TtdCanvas from '@/components/TtdCanvas'
import { StatusBadge, formatTanggal } from '@/components/StatusBadge'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: surat, error } = await supabase.from('surat_keluar').select('*').eq('id', params.id).single()

  if (error || !surat) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500">
        Surat tidak ditemukan.
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Link>

      <header className="ui-card mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-balance">{surat.perihal}</h1>
            <p className="mt-1 text-xs text-zinc-500">
              {surat.no_surat} · {formatTanggal(surat.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={surat.status} />
            {surat.pdf_path && (
              <a href={`/api/surat/${surat.id}/pdf`} className="ui-btn-ghost px-3">
                <Download className="h-4 w-4" /> PDF
              </a>
            )}
          </div>
        </div>
      </header>

      <article
        className="prose prose-sm mt-5 max-w-none rounded-xl border bg-white p-5 leading-relaxed shadow-sm sm:prose-base dark:bg-zinc-900 dark:prose-invert"
        dangerouslySetInnerHTML={{
          __html: String(surat.isi_lengkap || surat.draf_text || '<p class="text-zinc-400">(belum ada isi)</p>'),
        }}
      />

      {surat.status === 'pending_approval' ? (
        <div className="mt-5">
          <TtdCanvas suratId={surat.id} ttdStoredPath={surat.ttd_path} />
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed p-4 text-center text-sm text-zinc-500">
          Tanda tangan hanya tersedia saat status <strong>Menunggu Persetujuan</strong>. Status saat ini:{' '}
          <StatusBadge status={surat.status} />
        </p>
      )}
    </main>
  )
}
