'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react'

interface SuratMasuk {
  id: string
  no_surat_masuk: string
  tanggal: string
  pengirim: string
  perihal: string
  ringkasan: string
  file_scan_path: string
  created_at: string
}

export default function SuratMasukPage() {
  const [list, setList] = useState<SuratMasuk[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchList = async () => {
    try {
      const res = await fetch('/api/surat-masuk')
      const json = await res.json()
      if (json.data) setList(json.data)
    } catch {
      toast.error('Gagal mengambil daftar surat masuk')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    toast.info('Mengunggah dan mengekstraksi metadata via Gemini 3.7 Flash Vision...')

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        const res = await fetch('/api/surat-masuk/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        })
        const json = await res.json()
        if (res.ok) {
          toast.success('Surat masuk berhasil diekstraksi!')
          fetchList()
        } else {
          toast.error(json.error || 'Gagal memproses OCR')
        }
      } catch {
        toast.error('Terjadi kesalahan saat memproses OCR')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tata-usaha"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border text-zinc-600 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Surat Masuk & OCR</h1>
            <p className="text-sm text-zinc-500">Ekstraksi berkas scan fisik otomatis dengan AI Gemini</p>
          </div>
        </div>

        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Memproses OCR...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Unggah Scan Surat
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-lg border bg-white p-4" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-zinc-500">
          Belum ada arsip surat masuk. Unggah berkas scan untuk memulai ekstraksi OCR.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-zinc-900">{item.perihal}</h3>
                  <p className="text-xs text-zinc-500">
                    No: {item.no_surat_masuk} · Pengirim: {item.pengirim} · Tanggal: {item.tanggal}
                  </p>
                </div>
                <Link
                  href={`/surat/baru?scanRef=${item.id}&perihal=${encodeURIComponent('Balasan: ' + item.perihal)}`}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <FileText className="h-3.5 w-3.5" /> Buat Balasan
                </Link>
              </div>
              {item.ringkasan && (
                <p className="mt-3 text-sm text-zinc-600 bg-zinc-50 p-3 rounded">
                  <span className="font-medium text-zinc-700">Ringkasan OCR:</span> {item.ringkasan}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
