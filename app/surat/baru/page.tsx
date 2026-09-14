'use client'

import { useState } from 'react'
import Editor from '@/components/Editor'

const genDefaultNo = () =>
  `SMK/${String(Date.now()).slice(-6)}/SMKN1/${new Date().getFullYear()}`

export default function BaruPage() {
  const [noSurat, setNoSurat] = useState(genDefaultNo())
  const [perihal, setPerihal] = useState('')
  const [ringkas, setRingkas] = useState('')
  const [html, setHtml] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const genDraft = async () => {
    if (ringkas.trim().length < 10) {
      setMsg('Isi ringkas minimal 10 karakter untuk draf AI.')
      return
    }
    setBusy(true)
    setMsg('Meminta draf AI (Gemini 3.7 Flash)...')
    const res = await fetch('/api/generate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `${perihal}\n\n${ringkas}` }),
    })
    const j = await res.json()
    setBusy(false)
    if (!res.ok) {
      setMsg(j.error ?? 'Gagal draf AI')
      return
    }
    setHtml(j.draft)
    setMsg('Draf AI dimasukkan ke editor — silakan sesuaikan.')
  }

  const submit = async (kind: 'draft' | 'pending') => {
    if (!noSurat.trim() || !perihal.trim() || !ringkas.trim()) {
      setMsg('No surat, perihal, dan isi ringkas wajib diisi.')
      return
    }
    setBusy(true)
    setMsg('')
    const res = await fetch('/api/surat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        no_surat: noSurat.trim(),
        perihal: perihal.trim(),
        isi_ringkas: ringkas.trim(),
        draf_text: html || undefined,
        isi_lengkap: html || undefined,
        is_public: isPublic,
        ttd_type: 'canvas',
      }),
    })
    const j = await res.json()
    if (!res.ok) {
      setMsg(j.error ?? 'Gagal menyimpan surat')
      setBusy(false)
      return
    }
    if (kind === 'pending') {
      await fetch(`/api/surat/${j.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_approval' }),
      })
      // opsional: trigger email jika ada alamat kepsek di env/konfigurasi
      const kp = process.env.NEXT_PUBLIC_KEPSEK_EMAIL // boleh kosong untuk MVP
      if (kp) await fetch('/api/send-review-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surat_id: j.id, email: kp }) })
    }
    setMsg(kind === 'pending' ? 'Surat dikirim ke persetujuan.' : 'Draf tersimpan.')
    setBusy(false)
    if (kind === 'pending') window.location.href = `/review/${j.id}`
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold">Surat Baru</h1>
      <div className="mt-6 space-y-4 rounded-lg border p-4">
        <label className="block">
          <span className="text-sm">Nomor surat</span>
          <input value={noSurat} onChange={(e) => setNoSurat(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-md border px-3" />
        </label>
        <label className="block">
          <span className="text-sm">Perihal</span>
          <input value={perihal} onChange={(e) => setPerihal(e.target.value)} placeholder="Contoh: Undangan rapat wali murid" className="mt-1 min-h-[44px] w-full rounded-md border px-3" />
        </label>
        <label className="block">
          <span className="text-sm">Isi ringkas (untuk draf AI)</span>
          <textarea value={ringkas} onChange={(e) => setRingkas(e.target.value)} rows={3} placeholder="Singkat: tujuan, waktu, tempat, peserta..." className="mt-1 w-full rounded-md border px-3 py-3 text-sm" />
        </label>
        <button onClick={genDraft} disabled={busy} className="min-h-[44px] rounded-md bg-zinc-900 px-4 text-sm text-white disabled:opacity-50">
          Generate Draf AI
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Editor isi surat</p>
        <Editor value={html} onChange={setHtml} />
      </div>

      <label className="mt-4 flex min-h-[44px] items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Tampilkan di dashboard publik setelah disetujui
      </label>

      {msg && <p className="mt-3 text-sm text-zinc-600">{msg}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={() => submit('draft')} disabled={busy} className="min-h-[44px] rounded-md border px-4 text-sm disabled:opacity-50">
          Simpan Draf
        </button>
        <button onClick={() => submit('pending')} disabled={busy} className="min-h-[44px] rounded-md bg-emerald-600 px-4 text-sm text-white disabled:opacity-50">
          Kirim ke Approval
        </button>
      </div>
    </main>
  )
}
