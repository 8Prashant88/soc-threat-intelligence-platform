/**
 * useInterval - run a callback on a fixed interval without re-subscribing on
 * every render. Pass `delay = null` to pause. Used to power the live,
 * auto-refreshing dashboard / logs / alerts views.
 */

import { useEffect, useRef } from "react"

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
