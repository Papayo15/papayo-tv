import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/live')

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
