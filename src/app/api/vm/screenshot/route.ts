import { auth } from '../../../../../auth'

export async function GET() {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const res = await fetch(`${process.env.AGENT_URL}/macvm/screenshot`, {
    headers: { 'x-agent-secret': process.env.AGENT_SECRET! },
  })

  if (!res.ok) return new Response('Failed to capture screenshot', { status: 502 })

  const buffer = await res.arrayBuffer()
  return new Response(buffer, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' },
  })
}
