'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'

interface VMCardProps {
  userName: string | null | undefined
}

export default function VMCard({ userName }: VMCardProps) {
  const [running, setRunning] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [screenshotTs, setScreenshotTs] = useState(Date.now())

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/vm/status')
      const data = await res.json()
      setRunning(data.running)
    } catch {
      // silently ignore, keep last known state
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  async function handleStart() {
    setLoading(true)
    await fetch('/api/vm/start', { method: 'POST' })
    await fetchStatus()
    setScreenshotTs(Date.now())
    setLoading(false)
  }

  async function handleStop() {
    setLoading(true)
    await fetch('/api/vm/stop', { method: 'POST' })
    await fetchStatus()
    setLoading(false)
  }

  async function handleKill() {
    if (!confirm('Force shutdown will cut power to the VM. Continue?')) return
    setLoading(true)
    await fetch('/api/vm/kill', { method: 'POST' })
    await fetchStatus()
    setLoading(false)
  }

  const statusColor = running === null ? 'bg-zinc-300' : running ? 'bg-green-400' : 'bg-zinc-300'
  const statusText = running === null ? 'Checking…' : running ? 'Running' : 'Stopped'

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

            <div className="flex gap-2">
              {running === false && (
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 transition"
                >
                  Start
                </button>
              )}
              {running === true && (
                <>
                  <button
                    onClick={handleStop}
                    disabled={loading}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition"
                  >
                    Stop
                  </button>
                  <button
                    onClick={handleKill}
                    disabled={loading}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 transition"
                  >
                    Force Stop
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Screenshot */}
        {running && (
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
