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
  const deleteKPI = async (kpiId: string) => {
  if (!token) {
    showToast({ title: 'Authentication error', description: 'No token available. Please log in again.', variant: 'error' });
    return;
  }
  const confirmDelete = window.confirm('Are you sure you want to delete this KPI? This action cannot be undone.');
  if (!confirmDelete) return;
  try {
    const response = await fetch(`/api/kpi/${kpiId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      // Check if the response is JSON
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete KPI (Status: ${response.status})`);
      } else {
        throw new Error(`Unexpected response from server (Status: ${response.status})`);
      }
    }
    showToast({ title: 'KPI deleted', variant: 'success', description: 'KPI has been removed.' });
    const refreshed = await fetch('/api/kpi', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!refreshed.ok) {
      const contentType = refreshed.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = await refreshed.json();
        throw new Error(data.error || 'Failed to refresh KPIs');
      } else {
        throw new Error('Unexpected response while refreshing KPIs');
      }
    }
    const refreshedData = await refreshed.json();
    setKpis(refreshedData.kpis || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete KPI';
    showToast({ title: 'Delete error', description: message, variant: 'error' });
  }
};
  const progressCalculator = useMemo(
    () => (value: number, target: number) => (target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0),
    [],
  );
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  const progressBadges = [
    { label: 'KPIs tracked', value: kpis.length, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
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
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    },
    {
      label: 'High-performing KPIs',
      value: kpis.filter((item) => progressCalculator(item.value, item.target) >= 75).length,
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
    },
  ];
  return (
    <AppShell
      title="My Profile"
      description="Manage personal information, track your KPIs, and keep your details up to date."
    >
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-white px-6 py-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-lg">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{user.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  user.role === 'admin' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.role === 'admin' ? 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'} />
                  </svg>
                  {user.role}
                </span>
              </div>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Department
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900">{user.department || 'Not set'}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Position
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900">{user.position || 'Not set'}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          {/* Edit Profile Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Edit Profile</h2>
                <p className="mt-1 text-sm text-slate-600">Update your personal information</p>
              </div>
              <div className="p-6">
                <form onSubmit={saveProfile} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="name"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="department" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Department
                      </label>
                      <input
                        id="department"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))}
                        placeholder="e.g., Public Works"
                      />
                    </div>
                    <div>
                      <label htmlFor="position" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Position
                      </label>
                      <input
                        id="position"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        value={profileForm.position}
                        onChange={(e) => setProfileForm((p) => ({ ...p, position: e.target.value }))}
                        placeholder="e.g., Project Officer"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm({
                          name: user.name,
                          department: user.department ?? '',
                          position: user.position ?? '',
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-blue-300"
                      disabled={isProfileSaving}
                    >
                      {isProfileSaving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* KPI Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Performance Stats */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Performance Overview</h2>
              <p className="mt-1 text-sm text-slate-600">Your KPI achievements</p>
            </div>
            <div className="p-6 space-y-4">
              {progressBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-blue-100 p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badge.icon} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-600">{badge.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {badge.value}
                        {badge.suffix ?? ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* KPI Management */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">KPI Tracker</h2>
                <p className="mt-1 text-sm text-slate-600">Add and monitor your key performance indicators</p>
              </div>
              <div className="p-6">
                {/* Add KPI Form */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Add New KPI</h3>
                    <button
                      type="button"
                      onClick={addKPI}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:bg-emerald-300"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add KPI
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                      placeholder="Metric name"
                      value={newKPI.metric}
                      onChange={(e) => setNewKPI((p) => ({ ...p, metric: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                      placeholder="Unit (e.g., hours, %)"
                      value={newKPI.unit}
                      onChange={(e) => setNewKPI((p) => ({ ...p, unit: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                      placeholder="Current value"
                      value={Number.isNaN(newKPI.value) ? '' : newKPI.value}
                      onChange={(e) => setNewKPI((p) => ({ ...p, value: Number(e.target.value) || 0 }))}
                    />
                    <input
                      type="number"
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                      placeholder="Target value"
                      value={Number.isNaN(newKPI.target) ? '' : newKPI.target}
                      onChange={(e) => setNewKPI((p) => ({ ...p, target: Number(e.target.value) || 0 }))}
                    />
                    <input
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 md:col-span-2"
                      placeholder="Period (e.g., Q1 2025)"
                      value={newKPI.period}
                      onChange={(e) => setNewKPI((p) => ({ ...p, period: e.target.value }))}
                    />
                  </div>
                </div>
                {/* KPI List */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Your KPIs</h3>
                  <div className="space-y-3">
                    {isLoadingKPIs && (
                      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-4 text-sm font-medium text-slate-600">Loading KPIs...</p>
                      </div>
                    )}
                    {!isLoadingKPIs &&
                      kpis.map((kpi) => {
                        const progress = progressCalculator(kpi.value, kpi.target);
                        return (
                          <div key={kpi._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-900">{kpi.metric}</h4>
                                <p className="mt-1 text-xs text-slate-600">{kpi.period}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                                  {kpi.value} / {kpi.target} {kpi.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteKPI(kpi._id)}
                                  className="rounded-md bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100"
                                  title="Delete KPI"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all ${
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
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-semibold ${
                                    progress >= 100
                                      ? 'text-emerald-700'
                                      : progress >= 75
                                      ? 'text-blue-700'
                                      : progress >= 50
                                      ? 'text-amber-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {progress}% Complete
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}