'use client'

import { useRef, useState } from 'react'

interface Props {
  suratId: string
  ttdStoredPath?: string | null
}

// ponytail: minimal canvas-only untuk MVP; tambah opsi upload PNG ketika diperlukan
export default function TtdCanvas({ suratId, ttdStoredPath }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [ttdPath, setTtdPath] = useState<string | null>(ttdStoredPath ?? null)

  const pos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect()
    const t = 'touches' in e && e.touches.length ? e.touches[0] : null
    const x = t ? t.clientX - r.left : (e as React.MouseEvent).clientX - r.left
    const y = t ? t.clientY - r.top : (e as React.MouseEvent).clientY - r.top
    return { x: (x / r.width) * canvas.width, y: (y / r.height) * canvas.height }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const { x, y } = pos(e, c)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDrawing(true)
  }
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    e.preventDefault()
    const c = ref.current!
    const { x, y } = pos(e, c)
    c.getContext('2d')!.lineTo(x, y)
    c.getContext('2d')!.stroke()
  }
  const stop = () => setDrawing(false)
  const clear = () => {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
  }
  const save = async () => {
    const c = ref.current!
    const url = c.toDataURL('image/png')
    // cek kosong (hampir transparan seluruhnya) — sederhana: ukuran data URL
    if (url.length < 3000) {
      setMsg('Tanda tangan kosong, silakan gambar dahulu.')
      return
    }
    setBusy(true)
    setMsg('')
    const up = await fetch('/api/upload-ttd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: url }),
    })
    const uj = await up.json()
    if (!up.ok) {
      setMsg(uj.error ?? 'Gagal menyimpan TTD')
      setBusy(false)
      return
    }
    setTtdPath(uj.path)
    await fetch(`/api/surat/${suratId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttd_path: uj.path, ttd_type: 'canvas' }),
    })
    setMsg('TTD tersimpan.')
    setBusy(false)
  }
  const renderPdf = async () => {
    if (!ttdPath) {
      setMsg('Simpan TTD terlebih dahulu.')
      return
    }
    setBusy(true)
    setMsg('')
    const res = await fetch(`/api/generate-pdf/${suratId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttd_path: ttdPath }),
    })
    const j = await res.json()
    setBusy(false)
    if (!res.ok) {
      setMsg(j.error ?? 'Gagal merender PDF')
      return
    }
    setMsg(`PDF jadi: ${j.pdf_path}. Halaman akan dimuat ulang...`)
    setTimeout(() => window.location.reload(), 900)
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Tanda Tangan Digital</h2>
      {ttdPath && <p className="mt-1 text-xs text-zinc-500">TTD tersimpan: {ttdPath}</p>}
      <canvas
        ref={ref}
        width={700}
        height={220}
        className="mt-3 w-full touch-none rounded-md border bg-white"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />
      {msg && <p className="mt-2 text-sm text-zinc-600">{msg}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={clear} type="button" className="min-h-[44px] rounded-md border px-4 text-sm">
          Hapus
        </button>
        <button
          onClick={save}
          type="button"
          disabled={busy}
          className="min-h-[44px] rounded-md bg-zinc-900 px-4 text-sm text-white disabled:opacity-50"
        >
          Simpan TTD
        </button>
        <button
          onClick={renderPdf}
          type="button"
          disabled={busy || !ttdPath}
          className="min-h-[44px] rounded-md border border-emerald-600 bg-emerald-600 px-4 text-sm text-white disabled:opacity-50"
        >
          Approve & Render PDF
        </button>
      </div>
    </section>
  )
}
