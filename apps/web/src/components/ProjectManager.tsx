import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Calendar, Briefcase, UserCheck, Sliders } from 'lucide-react';

export const ProjectManager: React.FC = () => {
  const { 
    projects, updateProjectTask, logApiCall, 
    isAdmin, isManager, isEmployee, currentUser, 
    updateProject, addProjectTask, employees
  } = useErp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj-1');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [taskStatus, setTaskStatus] = useState<'Todo' | 'In Progress' | 'Done'>('In Progress');
  const [taskAssignee, setTaskAssignee] = useState<string>('');

  // Edit Project Details State
  const [loadMultiplier, setLoadMultiplier] = useState<number>(35);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjName, setEditProjName] = useState('');
  const [editProjManager, setEditProjManager] = useState('');
  const [editProjBudget, setEditProjBudget] = useState(0);
  const [editProjCost, setEditProjCost] = useState(0);

  // Add Milestone Task State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');

  const handleStartEditProject = (proj: any) => {
    setEditProjName(proj.name);
    setEditProjManager(proj.manager);
    setEditProjBudget(proj.budget);
    setEditProjCost(proj.actualCost);
    setIsEditingProject(true);
  };

  const canEditTask = (task: any) => {
    if (isAdmin || isManager) return true;
    if (!currentUser) return false;
    const nameLower = currentUser.name.toLowerCase();
    const emailLower = currentUser.email.toLowerCase();
    const assigneeLower = task.assignee.toLowerCase();
    return assigneeLower.includes(nameLower) || assigneeLower.includes(emailLower);
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const handleUpdateTask = async () => {
    if (!activeProject || !activeTaskId) return;
    const start = performance.now();
    
    // Auto status alignment
    let newStatus = taskStatus;
    if (taskProgress === 100) newStatus = 'Done';
    else if (taskProgress > 0 && taskStatus === 'Todo') newStatus = 'In Progress';

    await updateProjectTask(selectedProject.id, activeTaskId, taskProgress, newStatus, taskAssignee);
    setActiveTaskId(null);
    logApiCall('PUT', `/api/v1/projects/${selectedProject.id}/tasks/${activeTaskId}`, 200, Math.round(performance.now() - start));
  };

  const selectTaskForEdit = (task: any) => {
    setActiveTaskId(task.id);
    setTaskProgress(task.progress);
    setTaskStatus(task.status);
    setTaskAssignee(task.assignee);
  };

  const selectedProject = activeProject || projects[0];

  // Calculate Resource Load Stats based on active project tasks
  const getResourceLoad = () => {
    const load: Record<string, { tasks: number; progressAvg: number }> = {};
    if (selectedProject) {
      selectedProject.tasks.forEach(t => {
        if (!load[t.assignee]) load[t.assignee] = { tasks: 0, progressAvg: 0 };
        load[t.assignee].tasks += 1;
        load[t.assignee].progressAvg += t.progress;
      });
    }
    return Object.entries(load).map(([name, val]) => ({
      name,
      tasks: val.tasks,
      loadPercentage: Math.min(val.tasks * loadMultiplier, 100), // dynamic simulated load metric
      avgProgress: Math.round(val.progressAvg / val.tasks)
    }));
  };

  const resourceLoad = getResourceLoad();

  if (projects.length === 0 || !selectedProject) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center text-slate-500 flex flex-col justify-center items-center py-20 space-y-3 animate-fade-in">
        <Briefcase className="w-12 h-12 text-slate-600 animate-pulse" />
        <h3 className="text-lg font-display font-semibold text-slate-350">Loading Project Workspace...</h3>
        <p className="text-sm text-slate-500">Establishing database connection and retrieving timeline logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-purple-400" /> Project Management & Allocations (F-07)
          </h2>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Organize project timelines, assign milestones, view Gantt timelines, and check resource allocation loading.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 focus:outline-none focus:border-purple-500 appearance-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>

          {!isEmployee && (
            <button
              onClick={() => handleStartEditProject(selectedProject)}
              className="bg-purple-650/15 hover:bg-purple-600/20 text-purple-300 border border-purple-500/25 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Edit Project
            </button>
          )}

          {!isEmployee && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="bg-emerald-650/15 hover:bg-emerald-650/20 text-emerald-300 border border-emerald-500/25 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* Project Financials & Resource Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress Card */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm text-slate-500 uppercase font-bold tracking-wider">Budget Utilization</h3>
            
            {selectedProject && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-2xl font-bold font-display text-slate-200">
                      ${selectedProject.actualCost.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Actual Cost Incurred</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-450 block">
                      Budget: ${selectedProject.budget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Total Allocated</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full rounded-full ${
                        (selectedProject.actualCost / selectedProject.budget) > 0.85 ? 'bg-rose-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${(selectedProject.actualCost / selectedProject.budget) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Used: {Math.round((selectedProject.actualCost / selectedProject.budget) * 100)}%</span>
                    <span>Remaining: ${((selectedProject.budget - selectedProject.actualCost)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 mt-6 pt-4 border-t border-slate-900">
            Resource expenses are accrued dynamically via HR Payroll entries.
          </div>
        </div>

        {/* Resource Allocation List */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-slate-500 uppercase font-bold tracking-wider">Resource Utilization Load</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Multiplier:</span>
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={loadMultiplier} 
                  onChange={(e) => setLoadMultiplier(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-center w-12 text-purple-400 font-bold focus:outline-none focus:border-purple-500 font-mono" 
                />
                <span className="text-[10px] text-slate-500 uppercase font-bold">% / Task</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resourceLoad.map((res, index) => (
                <div key={index} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-400" /> {res.name}
                    </span>
                    <span className={`font-semibold font-mono ${
                      res.loadPercentage > 80 ? 'text-rose-400' : 'text-blue-400'
                    }`}>
                      {res.loadPercentage}% Load
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        res.loadPercentage > 80 ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${res.loadPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>{res.tasks} Active Tasks</span>
                    <span>Task Progress: {res.avgProgress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Recommended staffing limit: 80% load allocation. Overloaded staff are marked with red warning indicators.
          </div>
        </div>
      </div>

      {/* Task Controller & Gantt Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Task Controller */}
        {activeTaskId ? (
          <div className="glass-card p-6 rounded-2xl xl:col-span-1 flex flex-col justify-between border-purple-500/20">
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" /> Update Task Progress
              </h3>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-xs">
                <span className="text-[10px] text-slate-500 block uppercase">Task Code ID</span>
                <span className="font-mono text-slate-300 mt-1 block">{activeTaskId}</span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-2">
                    Completion Progress ({taskProgress}%)
                  </label>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    step={5} 
                    value={taskProgress}
                    onChange={(e) => setTaskProgress(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>0% (Todo)</span>
                    <span>50%</span>
                    <span>100% (Done)</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">State Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e: any) => setTaskStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-350 focus:outline-none"
                  >
                    {Array.from(new Set([
                      ...employees.map(e => e.name),
                      taskAssignee
                    ])).filter(Boolean).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleUpdateTask}
                className="bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold px-4 py-2 rounded-xl text-xs flex-1 transition-all"
              >
                Save Progress
              </button>
              <button 
                onClick={() => setActiveTaskId(null)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-350 px-4 py-2 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl xl:col-span-1 text-center text-slate-500 text-xs flex flex-col justify-center items-center py-10 space-y-2">
            <Sliders className="w-8 h-8 text-slate-555" />
            <span className="block text-slate-350 font-medium">Select a Task to Edit</span>
            <span>Click the edit button next to any Gantt item to update progress.</span>
          </div>
        )}

        {/* Gantt Timeline */}
        <div className="glass-card p-6 rounded-2xl xl:col-span-2">
          <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" /> Interactive Gantt Timeline
          </h3>

          <div className="space-y-4">
            {selectedProject.tasks.map((task) => (
              <div key={task.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-250 block">{task.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Assignee: {task.assignee} | Ends: {task.endDate}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      task.status === 'Done' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                      task.status === 'In Progress' ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' :
                      'bg-slate-800 border-slate-750 text-slate-450'
                    }`}>
                      {task.status} ({task.progress}%)
                    </span>
                    {canEditTask(task) ? (
                      <button 
                        onClick={() => selectTaskForEdit(task)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-350 px-2 py-1 rounded border border-slate-800 text-[10px] transition-all font-mono cursor-pointer"
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-550 italic font-mono">Restricted</span>
                    )}
                  </div>
                </div>

                {/* Progress bar line representing Gantt Schedule block */}
                <div className="relative w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      task.status === 'Done' ? 'bg-emerald-500/60' : 'bg-purple-500/60'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Project Details Modal */}
      {isEditingProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200">Edit Project Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={editProjName}
                  onChange={(e) => setEditProjName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-550"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Project Manager</label>
                <input 
                  type="text" 
                  value={editProjManager}
                  onChange={(e) => setEditProjManager(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-550"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Budget ($)</label>
                  <input 
                    type="number" 
                    value={editProjBudget}
                    onChange={(e) => setEditProjBudget(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-555 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Actual Cost ($)</label>
                  <input 
                    type="number" 
                    value={editProjCost}
                    onChange={(e) => setEditProjCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-555 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-900">
              <button 
                onClick={async () => {
                  if (!editProjName || !editProjManager) {
                    alert("Please fill out all fields.");
                    return;
                  }
                  await updateProject(selectedProject.id, {
                    name: editProjName,
                    manager: editProjManager,
                    budget: editProjBudget,
                    actualCost: editProjCost
                  });
                  setIsEditingProject(false);
                  alert("Project details updated successfully!");
                }}
                className="bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition"
              >
                Save Changes
              </button>
              
              <button 
                onClick={() => setIsEditingProject(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200">Add New Milestone Task</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Task Title / Milestone</label>
                <input 
                  type="text" 
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g. Optimize SQL Query Performance"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Assignee</label>
                <input 
                  type="text" 
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  placeholder="e.g. Himanshu Devatwal"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Due Date / End Date</label>
                <input 
                  type="date" 
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-900">
              <button 
                onClick={async () => {
                  if (!newTaskName || !newTaskAssignee || !newTaskEndDate) {
                    alert("Please fill out all fields.");
                    return;
                  }
                  await addProjectTask(selectedProject.id, {
                    name: newTaskName,
                    assignee: newTaskAssignee,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: newTaskEndDate
                  });
                  setNewTaskName('');
                  setNewTaskAssignee('');
                  setNewTaskEndDate('');
                  setIsAddingTask(false);
                  alert("Milestone task added successfully!");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition"
              >
                Create Task
              </button>
              
              <button 
                onClick={() => setIsAddingTask(false)}
                className="bg-slate-855 hover:bg-slate-800 text-slate-330 px-4 py-2.5 rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
