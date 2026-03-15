'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();

      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        // If email confirmation is disabled, Supabase returns a session immediately
        if (data.session) {
          router.push('/');
          router.refresh();
        } else {
          setMessage('נשלח אליך מייל אימות. אשר אותו ואז התחבר.');
        }

      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setMessage('נשלח אליך מייל לאיפוס הסיסמה.');
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        'Invalid login credentials': 'אימייל או סיסמה שגויים.',
        'Email not confirmed': 'האימייל לא אומת עדיין. בדוק את תיבת הדואר.',
        'User already registered': 'המשתמש כבר קיים. התחבר במקום.',
        'Password should be at least 6 characters': 'הסיסמה חייבת להיות לפחות 6 תווים.',
      };
      setError(msg[err.message] ?? err.message ?? 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.paamonim.org/wp-content/uploads/2022/05/Group-49.png"
          alt="פעמונים"
          className="h-10 object-contain"
        />
        <div className="text-xs text-gray-400 font-medium tracking-wide">Castro Lab</div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' && 'כניסה לחשבון'}
              {mode === 'signup' && 'יצירת חשבון'}
              {mode === 'reset' && 'איפוס סיסמה'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">מסלול החיים | פעמונים</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  dir="ltr"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:border-transparent"
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    dir="ltr"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0C4DA2] focus:border-transparent"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0C4DA2] hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    {mode === 'signin' && 'כניסה'}
                    {mode === 'signup' && 'יצירת חשבון'}
                    {mode === 'reset' && 'שלח מייל איפוס'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm text-center">
              {mode === 'signin' && (
                <>
                  <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="text-[#0C4DA2] hover:underline">
                    אין לך חשבון? צור חשבון חדש
                  </button>
                  <button onClick={() => { setMode('reset'); setError(''); setMessage(''); }} className="text-gray-400 hover:text-gray-600 hover:underline text-xs">
                    שכחת סיסמה?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="text-[#0C4DA2] hover:underline">
                  יש לך חשבון? התחבר
                </button>
              )}
              {mode === 'reset' && (
                <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="text-[#0C4DA2] hover:underline">
                  חזרה לכניסה
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200">
        כלי זה פותח על ידי פעמונים | Castro Lab
      </footer>
    </div>
  );
}
