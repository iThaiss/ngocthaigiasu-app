import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()

  // Fetch all rows in batches (Supabase default limit is 1000)
  const BATCH = 1000
  let allRows: { topic: string | null; subtopic: string | null; is_published: boolean }[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('topic, subtopic, is_published')
      .range(offset, offset + BATCH - 1)
    if (error) return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    if (!data || data.length === 0) break
    allRows = allRows.concat(data as typeof allRows)
    if (data.length < BATCH) break
    offset += BATCH
  }

  type TopicAgg = {
    pending: number
    published: number
    total: number
    subtopicMap: Map<string | null, { pending: number; published: number; total: number }>
  }

  const topicMap = new Map<string | null, TopicAgg>()

  for (const row of allRows) {
    const topic = row.topic ?? null
    const subtopic = row.subtopic ?? null
    const isPending = !row.is_published

    if (!topicMap.has(topic)) {
      topicMap.set(topic, { pending: 0, published: 0, total: 0, subtopicMap: new Map() })
    }
    const topicData = topicMap.get(topic)!
    topicData.total++
    if (isPending) topicData.pending++
    else topicData.published++

    if (!topicData.subtopicMap.has(subtopic)) {
      topicData.subtopicMap.set(subtopic, { pending: 0, published: 0, total: 0 })
    }
    const subData = topicData.subtopicMap.get(subtopic)!
    subData.total++
    if (isPending) subData.pending++
    else subData.published++
  }

  const topics = Array.from(topicMap.entries())
    .map(([topic, { pending, published, total, subtopicMap }]) => ({
      topic,
      pending,
      published,
      total,
      subtopics: Array.from(subtopicMap.entries())
        .map(([subtopic, stats]) => ({ subtopic, ...stats }))
        .sort((a, b) => b.pending - a.pending),
    }))
    .sort((a, b) => {
      if (a.topic === null) return 1
      if (b.topic === null) return -1
      return b.pending - a.pending
    })

  const allTopics = topics
    .filter((t) => t.topic !== null)
    .map((t) => t.topic as string)

  const subtopicsByTopic: Record<string, string[]> = {}
  for (const t of topics) {
    if (t.topic) {
      subtopicsByTopic[t.topic] = t.subtopics
        .filter((s) => s.subtopic !== null)
        .map((s) => s.subtopic as string)
    }
  }

  return NextResponse.json({ topics, allTopics, subtopicsByTopic })
}
