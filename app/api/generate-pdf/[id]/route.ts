import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const stripHtml = (html: string) =>
  html
    .replace(/<(br|p|div|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

// POST: render PDF final pasca-approval. Body: { ttd_path?: string }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // hanya kepala sekolah (role 2)
    const { data: role } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .single()
    if (role?.role_id !== 2) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: surat, error: sErr } = await supabase
      .from('surat_keluar')
      .select('*')
      .eq('id', params.id)
      .single()
    if (sErr || !surat) return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 })
    if (surat.status !== 'pending_approval')
      return NextResponse.json({ error: 'Hanya surat pending_approval bisa dirender' }, { status: 409 })

    const svc = createServiceClient()
    const { ttd_path } = (await req.json().catch(() => ({}))) as { ttd_path?: string }

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.TimesRoman)
    const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)
    let page = doc.addPage([595, 842]) // A4
    const margin = 56
    let y = 800
    const draw = (text: string, opts?: { bold?: boolean; size?: number; gap?: number }) => {
      const size = opts?.size ?? 12
      const f = opts?.bold ? fontBold : font
      for (const para of text.split('\n')) {
        const words = para.split(' ').filter(Boolean)
        let line = ''
        const lines: string[] = []
        for (const w of words) {
          const t = line ? `${line} ${w}` : w
          if (f.widthOfTextAtSize(t, size) > 595 - margin * 2) {
            lines.push(line)
            line = w
          } else line = t
        }
        if (line) lines.push(line)
        if (!lines.length) lines.push('')
        for (const l of lines) {
          if (y < 80) {
            page = doc.addPage([595, 842])
            y = 800
          }
          page.drawText(l, { x: margin, y, size, font: f, color: rgb(0, 0, 0) })
          y -= size + 4
        }
        y -= opts?.gap ?? 6
      }
    }

    draw(String(surat.no_surat ?? ''), { bold: true, size: 13 })
    draw(`Perihal: ${surat.perihal}`, { bold: true, gap: 12 })
    draw(stripHtml(String(surat.isi_lengkap || surat.draf_text || '')))

    const sigPath = typeof ttd_path === 'string' && ttd_path ? ttd_path : surat.ttd_path
    if (sigPath) {
      const { data: img } = await svc.storage.from('ttd').download(sigPath)
      if (img) {
        const png = await doc.embedPng(await img.arrayBuffer())
        const w = 140
        const h = (png.height / png.width) * w
        if (y < h + 60) {
          page = doc.addPage([595, 842])
          y = 800
        }
        y -= 10
        page.drawImage(png, { x: 595 - margin - w, y: y - h, width: w, height: h })
        y -= h + 6
        draw('Kepala Sekolah,', { size: 11 })
      }
    }

    const pdfBytes = await doc.save()
    const pdfPath = `surat_${surat.id}.pdf`
    const { error: upErr } = await svc.storage.from('pdf').upload(pdfPath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    await svc
      .from('surat_keluar')
      .update({
        pdf_path: pdfPath,
        status: 'approved',
        ttd_path: sigPath ?? surat.ttd_path,
        disetujui_oleh: user.id,
      })
      .eq('id', surat.id)
    await svc.from('approval_logs').insert({ surat_id: surat.id, approver_id: user.id, tindakan: 'approve' })

    return NextResponse.json({ pdf_path: pdfPath })
  } catch (e) {
    console.error('generate-pdf:', e)
    return NextResponse.json({ error: 'Gagal merender PDF' }, { status: 500 })
  }
}
