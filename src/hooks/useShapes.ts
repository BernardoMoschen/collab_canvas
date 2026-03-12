import { useState, useEffect } from 'react'
import { getRoom, yMapToShape } from '../lib/room'
import type { Shape } from '../types'

export function useShapes(): Shape[] {
  const { shapes } = getRoom()
  const [list, setList] = useState<Shape[]>(() =>
    shapes.toArray().map(yMapToShape)
  )

  useEffect(() => {
    const handler = () => setList(shapes.toArray().map(yMapToShape))
    shapes.observe(handler)
    // also observe deep changes (sticky content edits)
    shapes.observeDeep(handler)
    return () => {
      shapes.unobserve(handler)
      shapes.unobserveDeep(handler)
    }
  }, [shapes])

  return list
}
