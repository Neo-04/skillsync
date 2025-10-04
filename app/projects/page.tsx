'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedTo?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed';
  tasks: ProjectTask[];
  createdAt?: string;
}

const emptyProject = {
  name: '',
  description: '',
  status: 'active' as Project['status'],
};

const emptyTask: Omit<ProjectTask, 'id'> = {
  title: '',
  description: '',
  status: 'todo',
};

export default function ProjectsPage() {
  const { user, token, loading } = useAuth({ requireAuth: true, redirectTo: '/login' });
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newProject, setNewProject] = useState(emptyProject);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newTask, setNewTask] = useState(emptyTask);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (!token) return;

    const fetchProjects = async () => {
      setIsRefreshing(true);
      try {
        const response = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load projects');
        const normalized = (data.projects || []).map((project: Project) => ({
          ...project,
          tasks: project.tasks || [],
        }));
        setProjects(normalized);
        if (!selectedProjectId && normalized.length > 0) {
          setSelectedProjectId(normalized[0]._id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load projects';
        showToast({ title: 'Project error', description: message, variant: 'error' });
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchProjects();
  }, [token, showToast, selectedProjectId]);

  const refreshProjects = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reload projects');
      const normalized = (data.projects || []).map((project: Project) => ({
        ...project,
        tasks: project.tasks || [],
      }));
      setProjects(normalized);
      if (selectedProjectId && !normalized.find((project: Project) => project._id === selectedProjectId)) {
        setSelectedProjectId(normalized[0]?._id ?? '');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh projects';
      showToast({ title: 'Project error', description: message, variant: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const createProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsCreatingProject(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create project');

      showToast({ title: 'Project created', description: `${data.project.name} was added successfully.`, variant: 'success' });
      setNewProject(emptyProject);
      await refreshProjects();
      if (data.project?._id) {
        setSelectedProjectId(data.project._id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create project';
      showToast({ title: 'Project error', description: message, variant: 'error' });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const addTask = async () => {
    if (!token || !selectedProject || !newTask.title.trim()) {
      showToast({
        title: 'Missing information',
        description: 'Provide a title for the task before saving.',
        variant: 'error',
      });
      return;
    }

    setIsAddingTask(true);
    try {
      const task: ProjectTask = {
        id: crypto.randomUUID(),
        ...newTask,
        assignedTo: user?._id || user?.id,
      } as ProjectTask;

      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: [...selectedProject.tasks, task] }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save task');

      showToast({ title: 'Task added', variant: 'success', description: 'The task has been added to the project.' });
      setNewTask(emptyTask);
      await refreshProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add task';
      showToast({ title: 'Task error', description: message, variant: 'error' });
    } finally {
      setIsAddingTask(false);
    }
  };

  const moveTask = async (taskId: string, status: ProjectTask['status']) => {
    if (!token || !selectedProject) return;

    const updatedTasks = selectedProject.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
          }
        : task,
    );

    try {
      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      await refreshProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update task';
      showToast({ title: 'Task error', description: message, variant: 'error' });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!token || !selectedProject) return;

    const updatedTasks = selectedProject.tasks.filter((task) => task.id !== taskId);
    try {
      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      await refreshProjects();
      showToast({ title: 'Task removed', variant: 'info', description: 'The task has been deleted.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete task';
      showToast({ title: 'Task error', description: message, variant: 'error' });
    }
  };

  const getTasks = (status: ProjectTask['status']) => selectedProject?.tasks.filter((task) => task.status === status) ?? [];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading projects...
      </div>
    );
  }

  return (
    <AppShell
      title="Projects & Delivery"
      description="Create, update, and track project execution with a collaborative Kanban board."
      actions={
        <button
          type="button"
          onClick={refreshProjects}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Create a project</h2>
              <p className="text-sm text-slate-500">Define a new initiative and assign tasks to your team.</p>
            </div>
            <form onSubmit={createProject} className="space-y-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Project name"
                value={newProject.name}
                onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <textarea
                className="h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Describe the project objectives"
                value={newProject.description}
                onChange={(event) => setNewProject((prev) => ({ ...prev, description: event.target.value }))}
              />
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={newProject.status}
                onChange={(event) => setNewProject((prev) => ({ ...prev, status: event.target.value as Project['status'] }))}
              >
                <option value="active">Active</option>
                <option value="on-hold">On hold</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                disabled={isCreatingProject}
              >
                {isCreatingProject ? 'Creating...' : 'Create project'}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Project pipeline</h2>
              <p className="text-sm text-slate-500">Select a project to manage its backlog and status.</p>
            </div>
            <div className="flex gap-3">
              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {projects.length} projects
              </div>
            </div>
          </div>

          {selectedProject ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{selectedProject.name}</h3>
                    <p className="text-xs text-slate-500">{selectedProject.description || 'No description provided.'}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedProject.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedProject.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedProject.status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-800">Add task</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <input
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Short description"
                    value={newTask.description}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={newTask.status}
                    onChange={(event) =>
                      setNewTask((prev) => ({ ...prev, status: event.target.value as ProjectTask['status'] }))
                    }
                  >
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addTask}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:bg-emerald-300"
                    disabled={isAddingTask}
                  >
                    {isAddingTask ? 'Saving...' : 'Add task'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {(['todo', 'in-progress', 'done'] as ProjectTask['status'][]).map((status) => (
                  <div key={status} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">{status.replace('-', ' ')}</h4>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                        {getTasks(status).length}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {getTasks(status).map((task) => (
                        <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{task.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                            {status !== 'todo' && (
                              <button
                                type="button"
                                onClick={() =>
                                  moveTask(task.id, status === 'done' ? 'in-progress' : 'todo')
                                }
                                className="rounded-full bg-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-300"
                              >
                                Move backward
                              </button>
                            )}
                            {status !== 'done' && (
                              <button
                                type="button"
                                onClick={() =>
                                  moveTask(task.id, status === 'todo' ? 'in-progress' : 'done')
                                }
                                className="rounded-full bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                              >
                                Advance status
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="rounded-full bg-rose-100 px-3 py-1 text-rose-600 hover:bg-rose-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {getTasks(status).length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                          No tasks in this lane.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Create your first project to start planning tasks.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
