import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar isAdmin={profile?.is_admin} />
      <div className="md:pl-56 flex flex-col min-h-screen">
        <Header username={profile?.username} avatarUrl={profile?.avatar_url} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
