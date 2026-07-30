import { useEffect, useState } from 'react'

export type SyncState = 'idle' | 'syncing' | 'local-only' | 'failed'

export function SyncStatus({
  state,
  onRetry,
}: {
  state: SyncState
  onRetry?: () => void
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    if (state !== 'local-only') return
    const timer = window.setTimeout(() => setVisible(false), 4000)
    return () => window.clearTimeout(timer)
  }, [state])

  if (state === 'idle' || !visible) return null

  return (
    <aside className={`sync-status sync-${state}`} role={state === 'failed' ? 'alert' : 'status'}>
      <span>
        {state === 'syncing' && '도감을 안전하게 동기화하고 있어요'}
        {state === 'local-only' && '기기에 안전하게 저장 중'}
        {state === 'failed' && '동기화를 기다리고 있어요'}
      </span>
      {state === 'failed' && onRetry && <button type="button" onClick={onRetry}>다시 시도</button>}
    </aside>
  )
}
