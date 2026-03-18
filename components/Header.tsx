import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import LogoutButton from './LogoutButton';

export default async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded hover:bg-gray-100">
        בית
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        )}
        <div className="text-xs text-gray-400 font-medium tracking-wide">Castro Lab</div>
      </div>
    </header>
  );
}
