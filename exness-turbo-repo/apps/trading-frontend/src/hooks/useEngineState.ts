import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { EngineState } from '@/types'

export function useEngineState() {
  const [state, setState] = useState<EngineState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchState = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getEngineState()
      setState(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch engine state')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchState()
    // Poll every 2 seconds
    const interval = setInterval(fetchState, 2000)
    return () => clearInterval(interval)
  }, [])

  return { state, loading, error, refetch: fetchState }
}
