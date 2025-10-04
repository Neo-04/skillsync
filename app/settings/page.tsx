'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface PreferenceState {
  notifyDailyReports: boolean;
  notifyProjectUpdates: boolean;
  theme: 'light' | 'dark' | 'system';
  digestFrequency: 'daily' | 'weekly' | 'monthly';
}

const defaultPreferences: PreferenceState = {
  notifyDailyReports: true,
  notifyProjectUpdates: true,
  theme: 'system',
  digestFrequency: 'weekly',
};

const STORAGE_KEY = 'ems_preferences_v1';

export default function SettingsPage() {
  const { user, loading } = useAuth({ requireAuth: true, redirectTo: '/login' });
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PreferenceState;
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persistPreferences = (next: PreferenceState) => {
    setPreferences(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    showToast({ title: 'Settings saved', description: 'Your preferences have been updated.', variant: 'success' });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <AppShell
      title="Workspace Settings"
      description="Configure how you receive updates, notifications, and tailor the interface to your needs."
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Stay informed about the metrics that matter without getting overwhelmed.
          </p>
          <div className="mt-5 space-y-4">
            <label className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Daily progress reports</p>
                <p className="text-xs text-slate-500">
                  Receive a digest whenever your team submits a new DPR summary.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifyDailyReports}
                onChange={(event) =>
                  persistPreferences({
                    ...preferences,
                    notifyDailyReports: event.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
              />
            </label>

            <label className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Project status changes</p>
                <p className="text-xs text-slate-500">
                  Get alerts when projects move between active, on-hold, or completed stages.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifyProjectUpdates}
                onChange={(event) =>
                  persistPreferences({
                    ...preferences,
                    notifyProjectUpdates: event.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
              />
            </label>

            <div>
              <p className="text-sm font-semibold text-slate-800">Email digest frequency</p>
              <p className="text-xs text-slate-500">Choose how often you receive consolidated performance emails.</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['daily', 'weekly', 'monthly'] as PreferenceState['digestFrequency'][]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => persistPreferences({ ...preferences, digestFrequency: option })}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${
                      preferences.digestFrequency === option
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Interface</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customize the appearance of the dashboard to match your working environment.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['light', 'dark', 'system'] as PreferenceState['theme'][]).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => persistPreferences({ ...preferences, theme })}
                className={`rounded-2xl border p-4 text-left text-sm font-semibold capitalize transition ${
                  preferences.theme === theme
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                {theme} mode
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Theme preference is stored locally in your browser. Dark mode support will apply across your session.
          </p>
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Need to deactivate your account or export data? Reach out to your system administrator so that records are
          archived according to policy.
        </section>
      </div>
    </AppShell>
  );
}
