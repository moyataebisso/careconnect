import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type AdminAuth = {
  userId: string
  role: string
}

// Returns admin info if the caller has a session AND a row in admin_users with a truthy role.
// Returns null otherwise. Caller decides the response shape.
export async function requireAdmin(): Promise<AdminAuth | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !adminUser?.role) return null
  return { userId: user.id, role: adminUser.role }
}
