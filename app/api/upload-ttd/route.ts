import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Body: { dataUrl: "data:image/png;base64,...", filename?: string }
export async function POST(req: Request) {
  try {
    const { dataUrl, filename } = await req.json()
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,'))
      return NextResponse.json({ error: 'Hanya PNG base64 didukung' }, { status: 400 })

    const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
    if (buf.length > 2_000_000)
      return NextResponse.json({ error: 'Ukuran TTD maks 2MB' }, { status: 400 })
    // validasi magic bytes PNG
    if (!(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47))
      return NextResponse.json({ error: 'File bukan PNG valid' }, { status: 400 })

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const safe = typeof filename === 'string' ? filename.replace(/[^a-zA-Z0-9._-]/g, '') : ''
    const path = `ttd_${user.id}_${Date.now()}${safe ? `_${safe}` : ''}.png`
    const svc = createServiceClient()
    const { error } = await svc.storage.from('ttd').upload(path, buf, { contentType: 'image/png' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ path }, { status: 201 })
  } catch (e) {
    console.error('upload-ttd:', e)
    return NextResponse.json({ error: 'Gagal mengunggah TTD' }, { status: 500 })
  }
}
