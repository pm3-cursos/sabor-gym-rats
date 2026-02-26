'use client'

import { useEffect, useRef, useState } from 'react'

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || target === 0) {
      if (target === 0) setCount(0)
      return
    }
    started.current = true
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target, duration])

  return count
}

interface Props {
  total: number
  champions: number
  totalLives: number
}

export default function HomeStatsClient({ total, champions, totalLives }: Props) {
  const animTotal = useCountUp(total)
  const animChampions = useCountUp(champions)
  const animLives = useCountUp(totalLives)

  return (
    <div className="flex justify-center gap-8 mt-6 text-center">
      <div>
        <div className="text-2xl font-bold text-violet-400 tabular-nums">{animTotal}</div>
        <div className="text-xs text-gray-400 mt-1 tracking-wide">👥 Participantes</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-emerald-400 tabular-nums">{animChampions}</div>
        <div className="text-xs text-gray-400 mt-1 tracking-wide">🏁 Completaram</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-amber-400 tabular-nums">{animLives}</div>
        <div className="text-xs text-gray-400 mt-1 tracking-wide">🎓 Aulas</div>
      </div>
    </div>
  )
}
