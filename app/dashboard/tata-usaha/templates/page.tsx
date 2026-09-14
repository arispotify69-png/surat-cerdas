'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

interface Template {
  id: string
  nama: string
  created_at: string
}

export default function TemplatesPage() {
  const [list, setList] = useState<Template[]>([])
  const [nama, setNama] = useState('')
  const [konten, setKonten] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchList = async () => {
    const res = await fetch('/api/templates')
    const j = await res.json()
    if (j.data) setList(j.data)
  }
  useEffect(() => {
    fetchList()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim() || !konten.trim()) {
      toast.error('Nama dan konten template wajib diisi')
      return
    }
    setBusy(true)
    try {
      let parsed: unknown = konten
      try {
        parsed = JSON.parse(konten)
      } catch {
        parsed = { teks: konten }
      }
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: nama.trim(), konten: parsed }),
      })
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error ?? 'Gagal menyimpan template')
      } else {
        toast.success('Template tersimpan — dipakai sebagai few-shot AI')
        setNama('')
        setKonten('')
        fetchList()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dashboard/tata-usaha"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="mt-2 text-xl font-bold">Template Format Surat (Few-Shot AI)</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tempel contoh surat resmi sekolah. Gemini mempelajari gaya bahasa & struktur dari sini.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-lg border bg-white p-4">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama template, mis. Undangan Resmi"
          className="min-h-[44px] w-full rounded-md border px-3 text-sm"
        />
        <textarea
          value={konten}
          onChange={(e) => setKonten(e.target.value)}
          rows={8}
          placeholder="Tempel teks contoh surat di sini (atau JSON struktur kop)"
          className="w-full rounded-md border px-3 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {busy ? 'Menyimpan...' : 'Simpan Template'}
        </button>
      </form>
      <ul className="mt-6 space-y-2">
        {list.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
            <span className="font-medium">{t.nama}</span>
            <span className="text-xs text-zinc-400">{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
          </li>
        ))}
        {!list.length && (
          <li className="rounded-lg border p-6 text-center text-sm text-zinc-500">
            Belum ada template. Tambahkan minimal 1 agar draf AI mengikuti format sekolah.
          </li>
        )}
      </ul>
    </main>
  )
}
