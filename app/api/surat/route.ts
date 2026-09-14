import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

export async function GET(req: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let q = supabase
    .from('surat_keluar')
    .select('id,no_surat,perihal,status,is_public,pdf_path,created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const no_surat = typeof b.no_surat === 'string' ? b.no_surat.trim() : ''
    const perihal = typeof b.perihal === 'string' ? b.perihal.trim() : ''
    const isi_ringkas = typeof b.isi_ringkas === 'string' ? b.isi_ringkas.trim() : ''
    if (!no_surat || !perihal || !isi_ringkas)
      return NextResponse.json({ error: 'no_surat, perihal, isi_ringkas wajib diisi' }, { status: 400 })
    if (no_surat.length > 100 || perihal.length > 255)
      return NextResponse.json({ error: 'no_surat/perihal terlalu panjang' }, { status: 400 })

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('surat_keluar')
      .insert({
        no_surat,
        perihal,
        isi_ringkas,
        draf_text: typeof b.draf_text === 'string' ? b.draf_text : null,
        isi_lengkap: typeof b.isi_lengkap === 'string' ? b.isi_lengkap : null,
        is_public: b.is_public === true,
        ttd_type: b.ttd_type === 'upload' ? 'upload' : 'canvas',
        scan_masuk_ref: typeof b.scan_masuk_ref === 'string' && isUuid(b.scan_masuk_ref) ? b.scan_masuk_ref : null,
        dibuat_oleh: user.id,
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e) {
    console.error('surat POST:', e)
    return NextResponse.json({ error: 'Gagal membuat surat' }, { status: 500 })
  }
}
