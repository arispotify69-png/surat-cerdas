import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardIndex() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: role } = await supabase.from('user_roles').select('role_id').eq('user_id', user.id).single()
  if (role?.role_id === 2) redirect('/dashboard/kepala-sekolah')
  redirect('/dashboard/tata-usaha')
}
