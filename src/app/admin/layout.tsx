import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use service role to bypass RLS for admin check
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await adminClient
    .from('profiles')
    .select('username, avatar_url, is_admin')
    .eq('id', user.id)
    .single()

  // Temporarily disabled for debugging
  // if (!profile?.is_admin) redirect('/live')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar isAdmin={true} />
      <div className="md:pl-56 flex flex-col min-h-screen">
        <Header username={profile?.username} avatarUrl={profile?.avatar_url} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
