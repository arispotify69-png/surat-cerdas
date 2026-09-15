// Self-check: PDF render + TTD injection + signed URL, tanpa auth (service role).
// Jalankan: node --env-file=.env.local scripts/verify-pdf.mjs
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'
import assert from 'node:assert/strict'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
assert(url && key, 'NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY wajib ada')

const svc = createClient(url, key, { auth: { persistSession: false } })

// 1x1 PNG transparan (signature dummy)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

const doc = await PDFDocument.create()
const font = await doc.embedFont(StandardFonts.TimesRoman)
const page = doc.addPage([595, 842])
page.drawText('VERIFIKASI PDF-LIB', { x: 56, y: 780, size: 13, font, color: rgb(0, 0, 0) })
const png = await doc.embedPng(PNG)
page.drawImage(png, { x: 400, y: 600, width: 140, height: 140 })
const bytes = await doc.save()
assert(bytes.length > 1000, 'PDF byte output terlalu kecil')

const ttdPath = `verify_ttd_${Date.now()}.png`
const pdfPath = `verify_surat_${Date.now()}.pdf`

const upTtd = await svc.storage.from('ttd').upload(ttdPath, PNG, { contentType: 'image/png' })
assert(!upTtd.error, `upload ttd gagal: ${upTtd.error?.message}`)

const upPdf = await svc.storage.from('pdf').upload(pdfPath, bytes, { contentType: 'application/pdf' })
assert(!upPdf.error, `upload pdf gagal: ${upPdf.error?.message}`)

const signed = await svc.storage.from('pdf').createSignedUrl(pdfPath, 300)
assert(!signed.error && signed.data?.signedUrl, `signed url gagal: ${signed.error?.message}`)

const res = await fetch(signed.data.signedUrl)
assert.equal(res.status, 200, `signed URL harus 200, dapat ${res.status}`)
const ctype = res.headers.get('content-type') ?? ''
assert(ctype.includes('pdf'), `content-type harus pdf, dapat ${ctype}`)

const magic = bytes.subarray(0, 5).toString('latin1')
assert.equal(magic, '%PDF-', 'header PDF magic bytes salah')

console.log('PASS pdf-lib render:', bytes.length, 'bytes, header', magic)
console.log('PASS ttd upload ->', ttdPath)
console.log('PASS pdf upload ->', pdfPath)
console.log('PASS signed URL 200, content-type', ctype)
console.log(JSON.stringify({ pdfPath, ttdPath }))
