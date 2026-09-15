import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Signed URL publik untuk PDF surat yang sudah approved + is_public.
// Tanpa auth: hanya boleh baca surat publik, bucket tetap private.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id))
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

  const svc = createServiceClient()
  const { data: surat } = await svc
    .from('surat_keluar')
    .select('pdf_path,is_public,status')
    .eq('id', params.id)
    .single()

  if (!surat || !surat.pdf_path || !surat.is_public || !['approved', 'published'].includes(surat.status))
    return NextResponse.json({ error: 'Surat tidak tersedia' }, { status: 404 })

  const { data, error } = await svc.storage.from('pdf').createSignedUrl(surat.pdf_path, 300)
  if (error || !data) return NextResponse.json({ error: 'Gagal membuat tautan' }, { status: 500 })
  return NextResponse.redirect(data.signedUrl)
}
