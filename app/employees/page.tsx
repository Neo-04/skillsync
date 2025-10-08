'use client';

import { FormEvent, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  department?: string;
  position?: string;
  createdAt?: string;
}

const initialFormState = {
  name: '',
  email: '',
  password: '',
  role: 'employee' as Employee['role'],
  department: '',
  position: '',
};

export default function EmployeesPage() {
  const { user, token, loading } = useAuth({ requireAuth: true, redirectTo: '/login' });
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!token || !isAdmin) return;

    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const response = await fetch('/api/employees', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load employees');
        setEmployees(data.employees || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to fetch employees';
        showToast({ title: 'Employee error', description: message, variant: 'error' });
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [token, showToast, isAdmin]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !isAdmin) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create employee');

      showToast({ title: 'Employee added', variant: 'success', description: `${data.employee.name} has been onboarded.` });
      setForm(initialFormState);
      setEmployees((prev) => [data.employee, ...prev]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add employee';
      showToast({ title: 'Creation failed', description: message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-slate-500">
        Loading employees...
      </div>
    );
  }

  const employeeView = (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add employee</h2>
            <p className="text-sm text-slate-500">Create new accounts for staff members joining your department.</p>
          </div>
          <p className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-slate-600">Admins only</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            type="email"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Email address"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <input
            type="password"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Temporary password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as Employee['role'] }))}
          >
            <option value="employee">Employee</option>
            <option value="admin">Administrator</option>
          </select>
          <input
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Department"
            value={form.department}
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Position"
            value={form.position}
            onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
          />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Team directory</h2>
            <p className="text-sm text-slate-500">Overview of all users across the system.</p>
          </div>
          {isLoadingEmployees && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-slate-500">Loading...</span>
          )}
        </div>
        <div className="mt-5 overflow-auto rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{employee.name}</td>
                  <td className="px-4 py-3 text-slate-500">{employee.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        employee.role === 'admin'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{employee.department || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{employee.position || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {!isLoadingEmployees && employees.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                    No employees yet. Add your first team member above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  return (
    <AppShell
      title="Employee Management"
      description="Onboard new team members, review roles, and maintain the organization directory."
    >
      {isAdmin ? (
        employeeView
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
          You currently have a standard employee role. Please contact an administrator for access to the employee
          directory.
        </div>
      )}
    </AppShell>
  );
}
