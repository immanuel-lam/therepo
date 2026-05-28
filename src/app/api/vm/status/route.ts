import { auth } from '../../../../../auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${process.env.AGENT_URL}/macvm/status`, {
    headers: { 'x-agent-secret': process.env.AGENT_SECRET! },
  })
  const data = await res.json()
  return Response.json(data)
}
