'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Eraser, Save, CheckCircle2, Loader2, PenLine } from 'lucide-react'

interface Props {
  suratId: string
  ttdStoredPath?: string | null
}

export default function TtdCanvas({ suratId, ttdStoredPath }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [busy, setBusy] = useState(false)
  const [ttdPath, setTtdPath] = useState<string | null>(ttdStoredPath ?? null)
  const [empty, setEmpty] = useState(true)

  const pos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect()
    const t = 'touches' in e && e.touches.length ? e.touches[0] : null
    const cx = t ? t.clientX : (e as React.MouseEvent).clientX
    const cy = t ? t.clientY : (e as React.MouseEvent).clientY
    return { x: ((cx - r.left) / r.width) * canvas.width, y: ((cy - r.top) / r.height) * canvas.height }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const { x, y } = pos(e, c)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawing.current = true
    setEmpty(false)
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const { x, y } = pos(e, c)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stop = () => {
    drawing.current = false
  }

  const clear = () => {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    setTtdPath(null)
  }

  const save = async () => {
    if (empty) {
      toast.error('Tanda tangan masih kosong', { description: 'Gambar tanda tangan terlebih dahulu.' })
      return
    }
    setBusy(true)
    try {
      const url = ref.current!.toDataURL('image/png')
      const up = await fetch('/api/upload-ttd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: url }),
      })
      const uj = await up.json()
      if (!up.ok) throw new Error(uj.error ?? 'Gagal menyimpan TTD')
      setTtdPath(uj.path)
      await fetch(`/api/surat/${suratId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttd_path: uj.path, ttd_type: 'canvas' }),
      })
      toast.success('Tanda tangan tersimpan')
    } catch (e: unknown) {
      toast.error('Gagal menyimpan', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const approve = async () => {
    if (!ttdPath) {
      toast.error('Simpan tanda tangan terlebih dahulu')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/generate-pdf/${suratId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttd_path: ttdPath }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Gagal merender PDF')
      toast.success('Surat disetujui & PDF dibuat')
      setTimeout(() => window.location.reload(), 800)
    } catch (e: unknown) {
      toast.error('Gagal menyetujui', { description: e instanceof Error ? e.message : undefined })
      setBusy(false)
    }
  }

  return (
    <section className="ui-card">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 text-indigo-600" />
        <h2 className="text-sm font-semibold">Tanda Tangan Digital</h2>
        {ttdPath && <span className="ui-badge bg-emerald-100 text-emerald-800">tersimpan</span>}
      </div>

      <canvas
        ref={ref}
        width={700}
        height={220}
        aria-label="Area tanda tangan"
        className="mt-3 h-auto w-full touch-none rounded-xl border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-700"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />
      {empty && !ttdPath && (
        <p className="mt-2 text-center text-xs text-zinc-400">Gambar tanda tangan di area di atas</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={clear} type="button" className="ui-btn-ghost">
          <Eraser className="h-4 w-4" /> Hapus
        </button>
        <button onClick={save} type="button" disabled={busy} className="ui-btn-ghost">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan TTD
        </button>
        <button onClick={approve} type="button" disabled={busy || !ttdPath} className="ui-btn-primary sm:ml-auto">
          <CheckCircle2 className="h-4 w-4" /> Approve &amp; Render PDF
        </button>
      </div>
    </section>
  )
}
