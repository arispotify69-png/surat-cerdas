import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

// Body: { surat_id: string, email: string }
export async function POST(req: Request) {
  try {
    const { surat_id, email } = await req.json()
    if (typeof surat_id !== 'string' || typeof email !== 'string' || !email.includes('@'))
      return NextResponse.json({ error: 'surat_id dan email valid wajib diisi' }, { status: 400 })

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: surat } = await supabase
      .from('surat_keluar')
      .select('id,no_surat,perihal')
      .eq('id', surat_id)
      .single()
    if (!surat) return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 })

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Surat Cerdas <noreply@sekolah.sch.id>',
      to: email,
      subject: `Review surat: ${surat.perihal}`,
      html: `<p>Mohon review surat <strong>${surat.perihal}</strong> (${surat.no_surat}).</p><p><a href="${base}/review/${surat.id}">Buka halaman review</a></p>`,
    })

    await supabase.from('surat_keluar').update({ status: 'pending_approval' }).eq('id', surat_id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('send-review-email:', e)
    return NextResponse.json({ error: 'Gagal mengirim email review' }, { status: 500 })
  }
}
