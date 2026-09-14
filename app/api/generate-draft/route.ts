import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt || prompt.length < 10) {
      return NextResponse.json({ error: 'Perihal minimal 10 karakter' }, { status: 400 })
    }

    // Few-shot: ambil maks 3 template sebagai konteks gaya bahasa
    const supabase = createClient()
    const { data: templates } = await supabase
      .from('surat_templates')
      .select('nama,konten')
      .limit(3)

    const shots =
      templates?.map((t) => `Contoh "${t.nama}": ${JSON.stringify(t.konten)}`).join('\n') ?? ''

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const ev = process.env.GEMINI_MODEL || ''
    const supported = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash']
    const model = supported.includes(ev) ? ev : 'gemini-3.7-flash'
    const response = await ai.models.generateContent({
      model,
      contents: [
        'Anda asisten penulis surat resmi sekolah berbahasa Indonesia baku dan sopan. ' +
          'Keluarkan HANYA HTML rapi (tag <p>, <br>, <strong>) tanpa markdown backticks, siap render di WYSIWYG editor.' +
          (shots ? `\nPelajari gaya dari sampel berikut:\n${shots}` : ''),
        `Perihal/ringkasan surat: ${prompt}`,
      ],
    })

    const draft = (response.text || '').replace(/^```html\n?|```$/g, '').trim()
    if (!draft) return NextResponse.json({ error: 'AI tidak menghasilkan draf' }, { status: 502 })
    return NextResponse.json({ draft })
  } catch (e: unknown) {
    console.error('generate-draft:', e)
    const msg = e instanceof Error ? e.message : String(e)
    // jangan bocorkan seluruh stack ke client, cukup snippet diagnosis
    const hint = msg.slice(0, 400)
    return NextResponse.json({ error: 'Gagal membuat draf surat', details: hint }, { status: 500 })
  }
}
