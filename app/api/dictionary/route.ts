import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/dictionary?word=example
// 1. Check local dictionary_entries cache first
// 2. Fallback to dictionaryapi.dev
// 3. Cache result in DB for future lookups

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const word = searchParams.get('word')?.trim().toLowerCase()

  if (!word || word.length < 1 || word.length > 60) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }

  // Only single or compound words (no long phrases)
  if (word.split(/\s+/).length > 3) {
    return NextResponse.json({ error: 'Too many words — max 3' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Check local cache
  const { data: cached } = await supabase
    .from('dictionary_entries')
    .select('*')
    .eq('word', word)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({ entry: cached, source: 'cache' })
  }

  // 2. Fetch from dictionaryapi.dev
  try {
    const apiRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { next: { revalidate: 86400 } } // cache 24h at edge
    )

    if (!apiRes.ok) {
      // Word not found in external API
      return NextResponse.json({ entry: null, source: 'not_found' })
    }

    const apiData = await apiRes.json()
    const entry = apiData[0]

    if (!entry) return NextResponse.json({ entry: null, source: 'not_found' })

    // Normalize
    const phonetics = entry.phonetics ?? []
    const phonetic = entry.phonetic ?? phonetics.find((p: Record<string, string>) => p.text)?.text ?? ''
    const audioUrl = phonetics.find((p: Record<string, string>) => p.audio)?.audio ?? ''

    const definitions: Array<{ pos: string; definition: string; example?: string }> = []
    const synonyms: string[] = []
    const antonyms: string[] = []

    for (const meaning of entry.meanings ?? []) {
      for (const def of meaning.definitions ?? []) {
        definitions.push({
          pos: meaning.partOfSpeech ?? '',
          definition: def.definition ?? '',
          example: def.example,
        })
        synonyms.push(...(def.synonyms ?? []))
        antonyms.push(...(def.antonyms ?? []))
      }
    }

    const normalized = {
      word,
      phonetic,
      audio_url: audioUrl,
      definitions: definitions.slice(0, 6),
      synonyms: [...new Set(synonyms)].slice(0, 8),
      antonyms: [...new Set(antonyms)].slice(0, 8),
    }

    // 3. Cache in DB (fire and forget — don't await)
    supabase
      .from('dictionary_entries')
      .upsert(normalized, { onConflict: 'word' })
      .then(() => {})

    return NextResponse.json({ entry: normalized, source: 'api' })
  } catch {
    return NextResponse.json({ entry: null, source: 'error' })
  }
}
