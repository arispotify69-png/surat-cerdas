import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('surat_templates')
    .select('id,nama,created_at,updated_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const nama = typeof b.nama === 'string' ? b.nama.trim() : ''
    if (!nama) return NextResponse.json({ error: 'nama template wajib diisi' }, { status: 400 })
    if (!b.konten) return NextResponse.json({ error: 'konten template wajib diisi' }, { status: 400 })
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase
      .from('surat_templates')
      .insert({ nama, konten: b.konten, dibuat_oleh: user.id })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e) {
    console.error('templates POST:', e)
    return NextResponse.json({ error: 'Gagal menyimpan template' }, { status: 500 })
  }
}
