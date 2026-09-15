import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { dataUrl, filename } = await req.json()
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.includes('base64,')) {
      return NextResponse.json({ error: 'Data gambar base64 tidak valid' }, { status: 400 })
    }

    const mimeMatch = dataUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const base64Data = dataUrl.split('base64,')[1]
    const buf = Buffer.from(base64Data, 'base64')

    // 1. Simpan berkas scan ke Supabase Storage
    const svc = createServiceClient()
    const safeName = (filename || 'scan').replace(/[^a-zA-Z0-9._-]/g, '')
    const storagePath = `scan_${Date.now()}_${safeName}`
    await svc.storage.from('surat_masuk_scan').upload(storagePath, buf, {
      contentType: mimeType,
      upsert: true,
    })

    // 2. OCR & Ekstraksi Metadata via Gemini 3.7 Flash Vision
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const prompt = `Ekstrak informasi dari berkas scan surat masuk ini. 
Kembalikan HANYA format JSON valid tanpa tanda backtick markdown, dengan struktur:
{
  "no_surat_masuk": "string",
  "tanggal": "YYYY-MM-DD",
  "pengirim": "string",
  "perihal": "string",
  "ringkasan": "string"
}
Jika salah satu nilai tidak ditemukan dengan jelas di dokumen, berikan estimasi yang masuk akal atau nilai default.`

    const ev = process.env.GEMINI_MODEL || ''
    const supported = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash']
    const model = supported.includes(ev) ? ev : 'gemini-3.6-flash'
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        prompt,
      ],
    })

    const rawText = response.text || ''
    const cleanJson = rawText.replace(/```json\n?|```/g, '').trim()
    let extracted
    try {
      extracted = JSON.parse(cleanJson)
    } catch {
      extracted = {
        no_surat_masuk: 'UNKNOWN',
        tanggal: new Date().toISOString().split('T')[0],
        pengirim: 'Instansi Terkait',
        perihal: 'Surat Masuk',
        ringkasan: rawText.slice(0, 300),
      }
    }

    // 3. Simpan langsung ke database surat_masuk
    const { data: inserted, error: dbErr } = await svc
      .from('surat_masuk')
      .insert({
        no_surat_masuk: extracted.no_surat_masuk || 'TIDAK TERTERA',
        tanggal: extracted.tanggal || new Date().toISOString().split('T')[0],
        pengirim: extracted.pengirim || 'TIDAK TERTERA',
        perihal: extracted.perihal || 'Surat Masuk Baru',
        ringkasan: extracted.ringkasan || '',
        file_scan_path: storagePath,
        diunggah_oleh: user.id,
      })
      .select('*')
      .single()

    if (dbErr) {
      console.error('Database insert error:', dbErr)
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }

    return NextResponse.json({ data: inserted })
  } catch (e: unknown) {
    console.error('OCR error:', e)
    const msg = e instanceof Error ? e.message : 'Gagal memproses OCR surat masuk'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
