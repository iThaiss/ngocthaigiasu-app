'use client'

import { Trophy, Medal, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  score: number
  time_spent_seconds: number
  submitted_at: string
  is_me: boolean
}

interface MyRank {
  rank: number
  score: number
  time_spent_seconds: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  my_rank: MyRank | null
  max_score: number
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />
  return <span className="text-xs text-muted-foreground font-mono w-4 text-center">{rank}</span>
}

export default function Leaderboard({ entries, my_rank, max_score }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Bảng xếp hạng
        </CardTitle>
        <p className="text-xs text-muted-foreground">Top 20 · chỉ tính lần thi đầu tiên</p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Chưa có học sinh nào làm bài</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
              entry.is_me ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent'
            }`}
          >
            <div className="flex items-center justify-center w-5 shrink-0">
              <RankIcon rank={entry.rank} />
            </div>
            <span className="flex-1 font-medium truncate">
              {entry.name}
              {entry.is_me && <Badge variant="outline" className="ml-2 text-[10px] py-0">Bạn</Badge>}
            </span>
            <span className="font-bold text-primary">{entry.score}/{max_score}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(entry.time_spent_seconds)}
            </span>
          </div>
        ))}

        {/* Vị trí của mình nếu ngoài top 20 */}
        {my_rank && !entries.find((e) => e.is_me) && (
          <>
            <div className="text-center text-xs text-muted-foreground py-1">···</div>
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-primary/10 border border-primary/30">
              <span className="flex items-center justify-center w-5 shrink-0 text-xs font-mono text-muted-foreground">
                {my_rank.rank}
              </span>
              <span className="flex-1 font-medium">
                Bạn <Badge variant="outline" className="ml-2 text-[10px] py-0">Bạn</Badge>
              </span>
              <span className="font-bold text-primary">{my_rank.score}/{max_score}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(my_rank.time_spent_seconds)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
