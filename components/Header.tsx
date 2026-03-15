import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import LogoutButton from './LogoutButton';

export default async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.paamonim.org/wp-content/uploads/2022/05/Group-49.png"
          alt="פעמונים"
          className="h-10 object-contain"
        />
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
