import { auth } from '../../../../../auth'

export async function POST() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${process.env.AGENT_URL}/macvm/start`, {
    method: 'POST',
    headers: { 'x-agent-secret': process.env.AGENT_SECRET! },
  })
  const data = await res.json()
  return Response.json(data)
}
