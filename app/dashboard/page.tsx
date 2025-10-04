'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface ProjectSummary {
  _id: string;
  name: string;
  description: string;
  status: string;
}

interface DprSummary {
  _id: string;
  date: string;
  content: string;
  summary?: string;
}

interface KpiSummary {
  _id: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  period: string;
}

export default function DashboardPage() {
  const { user, token, loading } = useAuth({ requireAuth: true, redirectTo: '/login' });
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [dprs, setDprs] = useState<DprSummary[]>([]);
  const [kpis, setKpis] = useState<KpiSummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      setIsRefreshing(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [projectsRes, dprsRes, kpisRes] = await Promise.all([
          fetch('/api/projects', { headers }),
          fetch('/api/dpr', { headers }),
          fetch('/api/kpi', { headers }),
        ]);

        const [projectsData, dprsData, kpisData] = await Promise.all([
          projectsRes.json(),
          dprsRes.json(),
          kpisRes.json(),
        ]);

        if (!projectsRes.ok) throw new Error(projectsData.error || 'Failed to load projects');
        if (!dprsRes.ok) throw new Error(dprsData.error || 'Failed to load DPRs');
        if (!kpisRes.ok) throw new Error(kpisData.error || 'Failed to load KPIs');

        setProjects(projectsData.projects || []);
        setDprs(dprsData.dprs || []);
        setKpis(kpisData.kpis || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load dashboard data';
        showToast({ title: 'Dashboard error', description: message, variant: 'error' });
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchDashboardData();
  }, [token, showToast]);

  const metrics = useMemo(
    () => [
      {
        label: 'Active Projects',
        value: projects.filter((project) => project.status === 'active').length,
        accent: 'bg-blue-500',
        link: '/projects',
      },
      {
        label: 'Recent DPRs',
        value: dprs.length,
        accent: 'bg-emerald-500',
        link: '/ai',
      },
      {
        label: 'KPIs Tracked',
        value: kpis.length,
        accent: 'bg-orange-500',
        link: '/profile',
      },
      {
        label: 'Pending Reviews',
        value: dprs.filter((item) => !item.summary).length,
        accent: 'bg-rose-500',
        link: '/ai',
      },
    ],
    [projects, dprs, kpis],
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading workspace...
      </div>
    );
  }

  return (
    <AppShell
      title="Executive Overview"
      description="Track performance highlights, recent updates, and key actions across the organization."
      actions={
        <Link
          href="/projects"
          className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          Manage Projects
        </Link>
      }
    >
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.link}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
              </div>
              <span
                className={`${metric.accent} inline-flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white`}
              >
                {metric.label.charAt(0)}
              </span>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              View details
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
              <p className="text-sm text-slate-500">Latest initiatives across your teams</p>
            </div>
            <Link
              href="/projects"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {projects.slice(0, 5).map((project) => (
              <article key={project._id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{project.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{project.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      project.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </article>
            ))}
            {projects.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No projects yet. Create your first project to get started.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daily Progress Reports</h2>
              <p className="text-sm text-slate-500">Highlights from the last submissions</p>
            </div>
            <Link
              href="/ai"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Generate summary
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {dprs.slice(0, 5).map((dpr) => (
              <article key={dpr._id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {new Date(dpr.date).toLocaleDateString()}
                </p>
                <p className="mt-2 max-h-12 overflow-hidden text-sm text-slate-700 text-ellipsis">
                  {dpr.content}
                </p>
                {dpr.summary && (
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Summary:</span> {dpr.summary}
                  </p>
                )}
              </article>
            ))}
            {dprs.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No DPRs submitted yet. Encourage your team to log their daily progress.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Performance snapshot</h2>
            <p className="text-sm text-slate-500">Quick view of KPI attainment across teams.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {isRefreshing ? 'Refreshing data...' : 'Updated in real-time'}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.slice(0, 6).map((kpi) => {
            const progress = kpi.target > 0 ? Math.min(Math.round((kpi.value / kpi.target) * 100), 100) : 0;
            return (
              <article key={kpi._id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{kpi.metric}</h3>
                    <p className="text-xs text-slate-500">{kpi.period}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {kpi.value}/{kpi.target} {kpi.unit}
                  </span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
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
                <p className="mt-2 text-xs font-medium text-slate-600">{progress}% target achieved</p>
              </article>
            );
          })}
          {kpis.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No KPIs have been recorded yet. Use the Profile page to add your first KPI.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
