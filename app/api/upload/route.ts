import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'


export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const uploadDir = path.join(process.cwd(), 'public', 'attachments')
  await fs.mkdir(uploadDir, { recursive: true })
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`
  const filePath = path.join(uploadDir, filename)
  await fs.writeFile(filePath, buffer)
  const url = `/attachments/${filename}`
  return NextResponse.json({ url })
}
