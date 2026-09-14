import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowed = ['draft', 'pending_approval', 'approved', 'rejected', 'published'] as const

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('surat_keluar').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const b = await req.json()
    const patch: Record<string, unknown> = {}
    if (typeof b.isi_lengkap === 'string') patch.isi_lengkap = b.isi_lengkap
    if (typeof b.draf_text === 'string') patch.draf_text = b.draf_text
    if (typeof b.is_public === 'boolean') patch.is_public = b.is_public
    if (typeof b.ttd_path === 'string') patch.ttd_path = b.ttd_path
    if (b.ttd_type === 'canvas' || b.ttd_type === 'upload') patch.ttd_type = b.ttd_type
    if (typeof b.status === 'string' && (allowed as readonly string[]).includes(b.status))
      patch.status = b.status
    if (typeof b.catatan === 'string' && b.catatan.trim()) {
      // disimpan pemanggil via approval_logs; abaikan di tabel surat
    }
    if (!Object.keys(patch).length)
      return NextResponse.json({ error: 'Tidak ada field valid' }, { status: 400 })

    const supabase = createClient()
    const { error } = await supabase.from('surat_keluar').update(patch).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('surat PATCH:', e)
    return NextResponse.json({ error: 'Gagal memperbarui surat' }, { status: 500 })
  }
}
