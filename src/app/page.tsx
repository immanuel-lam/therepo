import { auth } from '../../auth'
import { redirect } from 'next/navigation'
import VMCard from './vm-card'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/login')

  return <VMCard userName={session.user?.name} />
}
