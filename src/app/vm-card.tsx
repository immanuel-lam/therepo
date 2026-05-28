'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'

type VMState = 'running' | 'stopped' | 'suspended' | 'paused' | 'unknown' | null

interface VMCardProps {
  userName: string | null | undefined
}

export default function VMCard({ userName }: VMCardProps) {
  const [state, setState] = useState<VMState>(null)
  const [loading, setLoading] = useState(false)
  const [screenshotTs, setScreenshotTs] = useState(Date.now())

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/vm/status')
      const data = await res.json()
      setState(data.state ?? (data.running ? 'running' : 'stopped'))
    } catch {
      // silently ignore, keep last known state
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  async function action(endpoint: string) {
    setLoading(true)
    await fetch(`/api/vm/${endpoint}`, { method: 'POST' })
    await fetchStatus()
    setLoading(false)
  }

  async function handleStart() {
    await action(state === 'suspended' ? 'resume' : 'start')
    setScreenshotTs(Date.now())
  }

  const statusColor =
    state === 'running' ? 'bg-green-400' :
    state === 'paused' ? 'bg-yellow-400' :
    state === 'suspended' ? 'bg-blue-400' :
    'bg-zinc-300'

  const statusText =
    state === null ? 'Checking…' :
    state === 'running' ? 'Running' :
    state === 'stopped' ? 'Stopped' :
    state === 'suspended' ? 'Suspended' :
    state === 'paused' ? 'Paused' :
    'Unknown'

  const btn = (label: string, endpoint: string, style: string, confirm?: string) => (
    <button
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return
        await action(endpoint)
      }}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 transition ${style}`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900">VM Control</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{userName}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
        {/* VM card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">macvm</h2>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
                <span className="text-sm text-zinc-500">{statusText}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {(state === 'stopped') && btn('Start', 'start', 'bg-zinc-900 text-white hover:bg-zinc-700')}
              {(state === 'suspended') && btn('Resume', 'resume', 'bg-zinc-900 text-white hover:bg-zinc-700')}
              {(state === 'paused') && btn('Resume', 'resume', 'bg-zinc-900 text-white hover:bg-zinc-700')}
              {(state === 'running') && btn('Restart', 'restart', 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50')}
              {(state === 'running') && btn('Suspend', 'suspend', 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50')}
              {(state === 'running') && btn('Pause', 'pause', 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50')}
              {(state === 'running') && btn('Stop', 'stop', 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50')}
              {(state === 'running') && btn('Force Stop', 'kill', 'border border-red-200 text-red-600 hover:bg-red-50', 'Force shutdown will cut power to the VM. Continue?')}
              {(state === 'running') && btn('Reset', 'reset', 'border border-red-200 text-red-600 hover:bg-red-50', 'This will hard reset the VM. Continue?')}
            </div>
          </div>
        </div>

        {/* Screenshot */}
        {state === 'running' && (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Live Preview</span>
              <button
                onClick={() => setScreenshotTs(Date.now())}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition"
              >
                Refresh
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={screenshotTs}
              src={`/api/vm/screenshot?t=${screenshotTs}`}
              alt="VM screenshot"
              className="w-full"
            />
          </div>
        )}
      </main>
    </div>
  )
}
