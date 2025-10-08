'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  department?: string;
  role: 'admin' | 'super_admin' | 'hq_staff' | 'field_staff' | 'employee';
}

interface Kpi {
  _id: string;
  kpiName: string;
  metric: string;
  target: number;
  weightage: number;
  achievedValue: number;
  score: number;
  period: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'not_started' | 'in_progress' | 'completed' | 'at_risk';
  progress: number;
  deadline?: string;
  progressNotes?: string;
  assignedTo: User;
  assignedBy?: User;
}

// --- KPI STATUS BADGE ---
const KpiStatusBadge = ({ status }: { status: Kpi['status'] }) => {
  const styles = useMemo(() => {
    switch (status) {
      case 'Completed':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'In Progress':
      case 'in_progress':
        return 'bg-sky-100 text-sky-800';
      case 'Pending':
      case 'not_started':
        return 'bg-amber-100 text-amber-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles}`}>{displayStatus}</span>;
};

// --- PROGRESS BAR ---
const ProgressBar = ({ achieved, target }: { achieved: number; target: number }) => {
  const progress = target === 0 ? 0 : Math.min((achieved / target) * 100, 100);
  const progressColor = progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-sky-500' : 'bg-amber-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">Progress</span>
        <span className="font-bold text-gray-700">{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${progressColor} h-2 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// --- MAIN KPI PAGE ---
export default function KpiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // --- MODAL STATES ---
  const [isAddKpiOpen, setAddKpiOpen] = useState(false);
  const [isViewKpiOpen, setViewKpiOpen] = useState(false);
  const [isEditKpiOpen, setEditKpiOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const isAdmin = useMemo(
    () => currentUser?.role === 'admin' || currentUser?.role === 'super_admin',
    [currentUser]
  );

  useEffect(() => {
    if (currentUser) {
      fetchKpis();
      if (isAdmin) {
        fetchUsers();
      }
    }
  }, [currentUser, isAdmin]);

  const fetchKpis = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isAdmin ? `/api/kpi` : `/api/kpi?userId=${currentUser._id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setKpis(data.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (data.success) setUsers(data.data || data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredKpis = useMemo(() => {
    return kpis.filter(kpi => {
      const matchesSearch =
        kpi.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kpi.kpiName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ||
        kpi.status === statusFilter ||
        kpi.status.toLowerCase().replace(' ', '_') === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [kpis, searchQuery, statusFilter]);

  if (loading || !currentUser) {
    return (
      <AppShell title="KPIs" description="Track and manage Key Performance Indicators">
        <div className="flex h-screen items-center justify-center w-full">
          <p className="animate-pulse text-gray-500">Loading KPIs...</p>
        </div>
      </AppShell>
    );
  }

  // --- HANDLE ADD KPI SUBMIT ---
  const handleAddKpi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      kpiName: form.get('kpiName'),
      metric: form.get('metric'),
      target: Number(form.get('target')),
      weightage: Number(form.get('weightage')),
      assignedTo: form.get('assignedTo'),
      period: form.get('period'),
      deadline: form.get('deadline') || undefined,
      description: form.get('description') || undefined,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        fetchKpis();
        setAddKpiOpen(false);
        alert('KPI added successfully!');
      } else {
        alert(data.error || 'Failed to add KPI');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding KPI');
    }
  };

  // --- HANDLE UPDATE KPI ---
  const handleUpdateKpi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedKpi) return;

    const form = new FormData(e.currentTarget);
    const body = {
      achievedValue: Number(form.get('achievedValue')),
      status: form.get('status'),
      progressNotes: form.get('progressNotes') || undefined,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/kpi/${selectedKpi._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        fetchKpis();
        setEditKpiOpen(false);
        setSelectedKpi(null);
        alert('KPI updated successfully!');
      } else {
        alert(data.error || 'Failed to update KPI');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating KPI');
    }
  };

  // --- HANDLE DELETE KPI ---
  const handleDeleteKpi = async (kpiId: string) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/kpi/${kpiId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchKpis();
        alert('KPI deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete KPI');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting KPI');
    }
  };

  return (
    <AppShell title="">
      <div className="min-h-screen p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Key Performance Indicators</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? 'Manage and track employee KPIs' : 'Track your performance goals'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setAddKpiOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add KPI
            </button>
          )}
        </div>

        {/* SEARCH & FILTER */}
        
        {/* KPI DASHBOARD STATS */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total KPIs */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total KPIs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{kpis.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-600 font-medium">
                  {kpis.filter(k => k.status === 'completed' || k.status === 'Completed').length} Completed
                </span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-sky-600 font-medium">
                  {kpis.filter(k => k.status === 'in_progress' || k.status === 'In Progress').length} In Progress
                </span>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {(kpis.reduce((sum, k) => sum + k.score, 0) / kpis.length).toFixed(1)}
                  </p>
                </div>
                <div className="bg-emerald-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(kpis.reduce((sum, k) => sum + k.score, 0) / kpis.length)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Average Progress */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Average Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {(kpis.reduce((sum, k) => sum + k.progress, 0) / kpis.length).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-sky-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(kpis.reduce((sum, k) => sum + k.progress, 0) / kpis.length)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* At Risk */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">At Risk</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {kpis.filter(k => k.status === 'at_risk').length}
                  </p>
                </div>
                <div className={`${kpis.filter(k => k.status === 'at_risk').length > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-full p-3`}>
                  <svg className={`w-6 h-6 ${kpis.filter(k => k.status === 'at_risk').length > 0 ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">
                  {kpis.filter(k => k.status === 'not_started' || k.status === 'Pending').length} Not Started
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by employee or KPI name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>at_risk</option>
            </select>
          </div>
        </div>

        {/* KPI TABLE */}
        <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
          {filteredKpis.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No KPIs found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Employee</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">KPI</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Progress</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Score</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKpis.map((kpi) => (
                  <tr key={kpi._id} className="border-b hover:bg-gray-50/50">
                    <td className="p-3">
                      <p className="font-semibold text-gray-800">{kpi.assignedTo?.name}</p>
                      <p className="text-xs text-gray-500">{kpi.assignedTo?.department}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-gray-700">{kpi.kpiName}</p>
                      <p className="text-xs text-gray-500">{kpi.period}</p>
                    </td>
                    <td className="p-3 w-48">
                      <ProgressBar achieved={kpi.achievedValue} target={kpi.target} />
                      <p className="text-xs text-gray-500 mt-1">
                        {kpi.achievedValue} / {kpi.target} {kpi.metric}
                      </p>
                    </td>
                    <td className="p-3">
                      <KpiStatusBadge status={kpi.status} />
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-gray-700">{kpi.score.toFixed(1)}</span>
                      <span className="text-xs text-gray-500 ml-1">/100</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedKpi(kpi);
                            setViewKpiOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                        {(isAdmin || kpi.assignedTo._id === currentUser._id) && (
                          <button
                            onClick={() => {
                              setSelectedKpi(kpi);
                              setEditKpiOpen(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            {isAdmin ? 'Edit' : 'Update'}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteKpi(kpi._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* --- ADD KPI MODAL --- */}
        {isAddKpiOpen && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto shadow-xl border-2 border-gray-200">
              <button
                onClick={() => setAddKpiOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4">Add New KPI</h2>
              <form className="space-y-4" onSubmit={handleAddKpi}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
                  <input
                    type="text"
                    name="kpiName"
                    placeholder="e.g., Monthly Sales Target"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                  <input
                    type="text"
                    name="metric"
                    placeholder="e.g., Revenue, Leads, Units"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                  <input
                    type="number"
                    name="target"
                    placeholder="e.g., 100000"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    name="weightage"
                    placeholder="e.g., 30"
                    min="0"
                    max="100"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Employee</label>
                  <select
                    name="assignedTo"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} - {user.department} ({user.designation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <input
                    type="text"
                    name="period"
                    placeholder="e.g., Q4 2025"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
                  <input
                    type="date"
                    name="deadline"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    placeholder="Add any additional details..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add KPI
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- VIEW KPI MODAL --- */}
        {isViewKpiOpen && selectedKpi && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-xl border-2 border-gray-200">
              <button
                onClick={() => {
                  setViewKpiOpen(false);
                  setSelectedKpi(null);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-4">{selectedKpi.kpiName}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-semibold">{selectedKpi.assignedTo?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-semibold">{selectedKpi.assignedTo?.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Period</p>
                    <p className="font-semibold">{selectedKpi.period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <KpiStatusBadge status={selectedKpi.status} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Metric</p>
                    <p className="font-semibold">{selectedKpi.metric}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weightage</p>
                    <p className="font-semibold">{selectedKpi.weightage}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Progress</p>
                  <ProgressBar achieved={selectedKpi.achievedValue} target={selectedKpi.target} />
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedKpi.achievedValue} / {selectedKpi.target} {selectedKpi.metric}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Score</p>
                  <p className="text-2xl font-bold">{selectedKpi.score.toFixed(1)}/100</p>
                </div>
                {selectedKpi.progressNotes && (
                  <div>
                    <p className="text-sm text-gray-500">Progress Notes</p>
                    <p className="text-gray-700">{selectedKpi.progressNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- EDIT KPI MODAL --- */}
        {isEditKpiOpen && selectedKpi && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto shadow-xl border-2 border-gray-200">
              <button
                onClick={() => {
                  setEditKpiOpen(false);
                  setSelectedKpi(null);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4">
                {isAdmin ? 'Update KPI' : 'Submit Progress Update'}
              </h2>
              {!isAdmin && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    📝 Submit your progress update for admin review. Your changes will be recorded and reviewed by management.
                  </p>
                </div>
              )}
              <form className="space-y-4" onSubmit={handleUpdateKpi}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
                  <p className="font-semibold text-gray-900">{selectedKpi.kpiName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Achieved Value (Target: {selectedKpi.target} {selectedKpi.metric})
                  </label>
                  <input
                    type="number"
                    name="achievedValue"
                    defaultValue={selectedKpi.achievedValue}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={selectedKpi.status}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="at_risk">At Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress Notes</label>
                  <textarea
                    name="progressNotes"
                    defaultValue={selectedKpi.progressNotes}
                    placeholder="Add notes about your progress..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {isAdmin ? 'Update KPI' : 'Submit Progress for Review'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}