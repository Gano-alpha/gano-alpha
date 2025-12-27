import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'signals.json')
    const raw = await fs.promises.readFile(filePath, 'utf-8')
    const json = JSON.parse(raw)
    const signals = Array.isArray(json?.signals) ? json.signals : []
    return NextResponse.json({ signals, generated_at: json?.generated_at ?? null })
  } catch (err) {
    console.error('Failed to read signals.json', err)
    return NextResponse.json({ signals: [], error: 'unavailable' }, { status: 200 })
  }
}
