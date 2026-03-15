import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserPlans } from '@/lib/db';
import Header from '@/components/Header';
import NewPlanButton from '@/components/NewPlanButton';
import DeletePlanButton from '@/components/DeletePlanButton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const plans = await getUserPlans(user.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">התכניות שלי</h1>
            <p className="text-gray-500 text-sm mt-0.5">{plans.length} תכניות</p>
          </div>
          <NewPlanButton />
        </div>

        {plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <svg className="w-8 h-8 text-[#0C4DA2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">אין תכניות עדיין</h2>
            <p className="text-gray-500 text-sm mb-6">צור את התכנית הראשונה שלך</p>
            <NewPlanButton large />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <a
                key={plan.id}
                href={`/plan/${plan.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0C4DA2] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 group-hover:text-[#0C4DA2] transition-colors leading-snug">
                    {plan.title}
                  </h3>
                  <DeletePlanButton planId={plan.id} />
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <div>{plan.events.length} אירועים</div>
                  <div>עודכן {formatDate(plan.updatedAt)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200">
        כלי זה פותח על ידי פעמונים | Castro Lab
      </footer>
    </div>
  );
}
