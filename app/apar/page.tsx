'use client';

import { FormEvent, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface AparItem {
  _id: string;
  year: number;
  period: string;
  achievements: string;
  challenges: string;
  goals: string;
  draft?: string;
  status: 'draft' | 'submitted' | 'reviewed';
}

const defaultApar = {
  year: new Date().getFullYear(),
  period: 'Annual',
  achievements: '',
  challenges: '',
  goals: '',
};

export default function APARPage() {
  const { token, loading } = useAuth({ requireAuth: true, redirectTo: '/login' });
  const { showToast } = useToast();
  const [apars, setApars] = useState<AparItem[]>([]);
  const [form, setForm] = useState(defaultApar);
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchAPARs = async () => {
      try {
        const response = await fetch('/api/apar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load APAR records');
        setApars(data.apars || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load APARs';
        showToast({ title: 'APAR error', description: message, variant: 'error' });
      }
    };

    fetchAPARs();
  }, [token, showToast]);

  const generateDraft = async () => {
    if (!token) return;
    if (!form.achievements.trim() || !form.challenges.trim() || !form.goals.trim()) {
      showToast({
        title: 'Missing information',
        description: 'Provide achievements, challenges, and goals before generating.',
        variant: 'error',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/apar-draft', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate draft');

      setDraft(data.draft || '');
      setIsDraftModalOpen(true);
      showToast({ title: 'Draft ready', description: 'Review the AI-generated draft before submitting.', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate draft';
      showToast({ title: 'AI error', description: message, variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAPAR = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (!draft.trim()) {
      showToast({ title: 'Draft missing', description: 'Generate or paste a draft before submitting.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/apar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          draft,
          status: 'submitted',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit APAR');

      showToast({ title: 'APAR submitted', description: 'Your report has been submitted for review.', variant: 'success' });
      setForm({ ...defaultApar, year: new Date().getFullYear() });
      setDraft('');

      const refreshed = await fetch('/api/apar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedData = await refreshed.json();
      setApars(refreshedData.apars || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit APAR';
      showToast({ title: 'Submission failed', description: message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      showToast({ title: 'Copied', description: 'Draft copied to clipboard.', variant: 'success' });
    } catch {
      showToast({ title: 'Copy failed', description: 'Unable to copy draft text.', variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading APAR workspace...
      </div>
    );
  }

  return (
    <AppShell
      title="APAR Management"
      description="Capture performance insights, craft AI-assisted drafts, and submit reports for review."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <form onSubmit={submitAPAR} className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-slate-900">Create APAR</h2>
              <p className="text-sm text-slate-500">Fill out the performance details and generate a high-quality draft.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="apar-year" className="text-sm font-medium text-slate-600">
                  Year
                </label>
                <input
                  id="apar-year"
                  type="number"
                  value={form.year}
                  onChange={(event) => setForm((prev) => ({ ...prev, year: Number(event.target.value) || new Date().getFullYear() }))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="apar-period" className="text-sm font-medium text-slate-600">
                  Period
                </label>
                <select
                  id="apar-period"
                  value={form.period}
                  onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Annual">Annual</option>
                  <option value="Mid-Year">Mid-Year</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label htmlFor="apar-achievements" className="text-sm font-medium text-slate-600">
                  Achievements
                </label>
                <textarea
                  id="apar-achievements"
                  rows={6}
                  value={form.achievements}
                  onChange={(event) => setForm((prev) => ({ ...prev, achievements: event.target.value }))}
                  className="mt-2 h-full w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Summarize key wins, outcomes, and recognitions."
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="apar-challenges" className="text-sm font-medium text-slate-600">
                  Challenges
                </label>
                <textarea
                  id="apar-challenges"
                  rows={6}
                  value={form.challenges}
                  onChange={(event) => setForm((prev) => ({ ...prev, challenges: event.target.value }))}
                  className="mt-2 h-full w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Highlight any blockers, resource constraints, or lessons learned."
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="apar-goals" className="text-sm font-medium text-slate-600">
                  Goals
                </label>
                <textarea
                  id="apar-goals"
                  rows={6}
                  value={form.goals}
                  onChange={(event) => setForm((prev) => ({ ...prev, goals: event.target.value }))}
                  className="mt-2 h-full w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Explain planned objectives and focus areas for the next cycle."
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateDraft}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating draft...' : 'Generate AI draft'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit APAR'}
              </button>
            </div>
            {draft && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-800">Current draft</p>
                <p className="mt-1 max-h-20 overflow-hidden text-sm text-slate-600 text-ellipsis">{draft}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDraftModalOpen(true)}
                    className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                  >
                    Expand in modal
                  </button>
                  <button
                    type="button"
                    onClick={copyDraft}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                  >
                    Copy draft
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Previous submissions</h2>
              <p className="text-sm text-slate-500">Review earlier reports and track their status.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {apars.length} records
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {apars.map((apar) => (
              <article key={apar._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {apar.period} {apar.year}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {apar.achievements.substring(0, 120)}{apar.achievements.length > 120 ? '…' : ''}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      apar.status === 'submitted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : apar.status === 'reviewed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {apar.status}
                  </span>
                </div>
                {apar.draft && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(apar.draft || '');
                      setIsDraftModalOpen(true);
                    }}
                    className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View draft
                  </button>
                )}
              </article>
            ))}
            {apars.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No APAR submissions yet. Generate your first report using the form.
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title="APAR draft"
        description="Review and edit the AI-generated draft before submission."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDraftModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copyDraft}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Copy draft
            </button>
          </>
        }
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={12}
          className="h-64 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </Modal>
    </AppShell>
  );
}
