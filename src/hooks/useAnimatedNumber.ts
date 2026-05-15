import { useState, useEffect, useRef } from 'react'

export function useAnimatedNumber(target: number, duration = 400): number {
  const [value, setValue] = useState(target)
  const prevRef = useRef(target)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    const to = typeof target === 'number' ? target : 0
    if (from === to) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (to - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
      else prevRef.current = to
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}
