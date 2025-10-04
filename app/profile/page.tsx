'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface KpiItem {
  _id: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  period: string;
}

const emptyKPI: Omit<KpiItem, '_id'> = {
  metric: '',
  value: 0,
  target: 0,
  unit: '',
  period: '',
};

export default function ProfilePage() {
  const { user, token, loading, refresh } = useAuth({ requireAuth: true, redirectTo: '/login' });
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [newKPI, setNewKPI] = useState(emptyKPI);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingKPIs, setIsLoadingKPIs] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    department: user?.department ?? '',
    position: user?.position ?? '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        department: user.department ?? '',
        position: user.position ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;

    const fetchKPIs = async () => {
      setIsLoadingKPIs(true);
      try {
        const response = await fetch('/api/kpi', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load KPIs');
        setKpis(data.kpis || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load KPIs';
        showToast({ title: 'KPI error', description: message, variant: 'error' });
      } finally {
        setIsLoadingKPIs(false);
      }
    };

    fetchKPIs();
  }, [token, showToast]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsProfileSaving(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');

      showToast({ title: 'Profile updated', variant: 'success', description: 'Your details have been saved.' });
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update profile';
      showToast({ title: 'Update failed', description: message, variant: 'error' });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const addKPI = async () => {
    if (!token || !newKPI.metric.trim()) {
      showToast({ title: 'Missing information', description: 'Provide all KPI details before saving.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/kpi', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKPI),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add KPI');

      setNewKPI(emptyKPI);
      showToast({ title: 'KPI added', variant: 'success', description: 'KPI has been saved successfully.' });

      const refreshed = await fetch('/api/kpi', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedData = await refreshed.json();
      setKpis(refreshedData.kpis || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add KPI';
      showToast({ title: 'KPI error', description: message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressCalculator = useMemo(
    () => (value: number, target: number) => (target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0),
    [],
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading profile...
      </div>
    );
  }

  const progressBadges = [
    { label: 'KPIs tracked', value: kpis.length },
    {
      label: 'Average attainment',
      value:
        kpis.length === 0
          ? 0
          : Math.round(
              kpis.reduce((total, current) => total + progressCalculator(current.value, current.target), 0) /
                kpis.length,
            ),
      suffix: '%',
    },
    {
      label: 'High-performing KPIs',
      value: kpis.filter((item) => progressCalculator(item.value, item.target) >= 75).length,
    },
  ];

  return (
    <AppShell
      title="My Profile"
      description="Manage personal information, track your KPIs, and keep your details up to date."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-semibold text-white">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
          <dl className="mt-8 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <dt className="font-medium text-slate-500">Department</dt>
              <dd className="font-semibold text-slate-800">{user.department || 'Not specified'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-500">Position</dt>
              <dd className="font-semibold text-slate-800">{user.position || 'Not specified'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-500">Member since</dt>
              <dd className="font-semibold text-slate-800">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-600">
                Full name
              </label>
              <input
                id="name"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={profileForm.name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="department" className="text-sm font-medium text-slate-600">
                  Department
                </label>
                <input
                  id="department"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={profileForm.department}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, department: event.target.value }))}
                  placeholder="e.g., Public Works"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="position" className="text-sm font-medium text-slate-600">
                  Position
                </label>
                <input
                  id="position"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={profileForm.position}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, position: event.target.value }))}
                  placeholder="e.g., Project Officer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="reset"
                onClick={() =>
                  setProfileForm({
                    name: user.name,
                    department: user.department ?? '',
                    position: user.position ?? '',
                  })
                }
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                disabled={isProfileSaving}
              >
                {isProfileSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-base font-semibold text-slate-900">Performance indicators</h2>
          <p className="mt-1 text-sm text-slate-500">Overview of your personal KPIs and achievements.</p>
          <div className="mt-5 space-y-3">
            {progressBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-500">{badge.label}</span>
                <span className="text-lg font-semibold text-slate-900">
                  {badge.value}
                  {badge.suffix ?? ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Add a KPI</h2>
              <p className="text-sm text-slate-500">Track metrics that matter to your performance plan.</p>
            </div>
            <button
              type="button"
              onClick={addKPI}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:bg-emerald-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Save KPI'}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Metric name"
              value={newKPI.metric}
              onChange={(event) => setNewKPI((prev) => ({ ...prev, metric: event.target.value }))}
            />
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Unit (e.g., hours, %)"
              value={newKPI.unit}
              onChange={(event) => setNewKPI((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <input
              type="number"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Current value"
              value={Number.isNaN(newKPI.value) ? '' : newKPI.value}
              onChange={(event) => setNewKPI((prev) => ({ ...prev, value: Number(event.target.value) || 0 }))}
            />
            <input
              type="number"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Target value"
              value={Number.isNaN(newKPI.target) ? '' : newKPI.target}
              onChange={(event) => setNewKPI((prev) => ({ ...prev, target: Number(event.target.value) || 0 }))}
            />
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 md:col-span-2"
              placeholder="Period (e.g., Q1 2025)"
              value={newKPI.period}
              onChange={(event) => setNewKPI((prev) => ({ ...prev, period: event.target.value }))}
            />
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-700">Recorded KPIs</h3>
            <div className="mt-4 space-y-4">
              {isLoadingKPIs && (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Loading KPIs...
                </div>
              )}
              {!isLoadingKPIs &&
                kpis.map((kpi) => {
                  const progress = progressCalculator(kpi.value, kpi.target);
                  return (
                    <div key={kpi._id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{kpi.metric}</p>
                          <p className="text-xs text-slate-500">{kpi.period}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {kpi.value} / {kpi.target} {kpi.unit}
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            progress >= 100
                              ? 'bg-emerald-500'
                              : progress >= 75
                              ? 'bg-blue-500'
                              : progress >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">{progress}% complete</p>
                    </div>
                  );
                })}
              {!isLoadingKPIs && kpis.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No KPIs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
