import { createClient } from '@/lib/supabase/server'
import { Users, ShieldCheck } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Users className="h-5 w-5 text-purple-400" />
        Usuarios ({users?.length || 0})
      </h1>

      <div className="space-y-2">
        {(users || []).map(user => (
          <div key={user.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {(user.username || user.id).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.username || 'Sin nombre'}</p>
              <p className="text-zinc-500 text-xs">{new Date(user.created_at).toLocaleDateString('es-MX')}</p>
            </div>
            {user.is_admin && (
              <div className="flex items-center gap-1 text-yellow-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-medium">Admin</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
