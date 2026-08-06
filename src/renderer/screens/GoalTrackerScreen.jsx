import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { Target, Plus, Check, X, BarChart3, TrendingUp, Trophy, Flag } from 'lucide-react';
import GoalSpreadsheet from '../components/GoalSpreadsheet';
import ChartCard from '../components/ChartCard';
import { useGoalStore } from '../store/goalStore';
import { useProfileStore } from '../store/profileStore';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
export default function GoalTrackerScreen({ onBack }) {
    const { goals, setGoals, addGoal, updateGoal, removeGoal, loadGoals } = useGoalStore();
    const { currentProfile } = useProfileStore();
    const [showForm, setShowForm] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', durationDays: '', startDate: '', endDate: '' });
    useEffect(() => {
        if (currentProfile) {
            loadGoals(currentProfile.id);
        }
    }, [currentProfile, loadGoals]);
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed).length;
    const inProgressGoals = totalGoals - completedGoals;
    const avgProgress = totalGoals > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals) : 0;
    const progressData = goals.map(g => ({
        name: g.title.length > 15 ? g.title.slice(0, 15) + '…' : g.title,
        progress: g.progress,
    }));
    const pieData = [
        { name: 'Completed', value: completedGoals },
        { name: 'In Progress', value: inProgressGoals },
    ];
    const COLORS = ['#22c55e', '#a78bfa'];
    const handleAddGoal = () => {
        if (!formData.title.trim())
            return;
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            alert('End date must be after start date');
            return;
        }
        const now = getTrueDate().toISOString();
        const newGoal = {
            id: crypto.randomUUID(),
            profileId: (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.id) || '',
            title: formData.title,
            description: formData.description || undefined,
            durationDays: formData.durationDays ? Number(formData.durationDays) : undefined,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            checkIns: {},
            progress: 0,
            completed: false,
            createdAt: now,
            updatedAt: now,
        };
        addGoal(newGoal);
        setFormData({ title: '', description: '', durationDays: '', startDate: '', endDate: '' });
        setShowForm(false);
    };
    const toggleComplete = (goalId, completed) => {
        updateGoal(goalId, { completed, progress: completed ? 100 : 0, updatedAt: getTrueDate().toISOString() });
        if (completed) {
            useProfileStore.getState().addXP(100);
        }
    };
    const recalculateProgress = (goal) => {
        if (!goal.startDate || !goal.endDate)
            return 0;
        const totalDays = Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const checkedDays = Object.values(goal.checkIns || {}).filter(Boolean).length;
        return Math.min(100, Math.round((checkedDays / totalDays) * 100));
    };
    const handleCheckIn = (goalId, date, checked) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal)
            return;
        const newCheckIns = { ...(goal.checkIns || {}), [date]: checked };
        const newProgress = recalculateProgress({ ...goal, checkIns: newCheckIns });
        const completed = newProgress === 100;
        updateGoal(goalId, { checkIns: newCheckIns, progress: newProgress, completed, updatedAt: getTrueDate().toISOString() });
        if (checked) {
            useProfileStore.getState().addXP(25);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6", children: [_jsxs("header", { className: "flex items-center gap-4 mb-6", children: [_jsx("button", { onClick: onBack, className: "p-2 rounded-2xl hover:bg-slate-700 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 24, className: "text-slate-300" }) }), _jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [_jsx(Target, { size: 24, className: "text-purple-400" }), "Goal Tracker"] }), _jsxs("button", { onClick: () => setShowStats(!showStats), className: `ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 ${showStats ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`, children: [_jsx(BarChart3, { size: 20 }), showStats ? 'Hide Stats' : 'Show Stats'] }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "New Goal"] })] }), showStats && (_jsxs("div", { className: "mb-8 space-y-4 animate-fade-in", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsx(ChartCard, { title: "Total Goals", value: totalGoals, icon: Target, color: "bg-purple-500" }), _jsx(ChartCard, { title: "Completed", value: completedGoals, icon: Check, color: "bg-green-500" }), _jsx(ChartCard, { title: "In Progress", value: inProgressGoals, icon: TrendingUp, color: "bg-blue-500" }), _jsx(ChartCard, { title: "Avg Progress", value: `${avgProgress}%`, icon: Trophy, color: "bg-yellow-500" })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(ChartCard, { title: "Goal Progress", children: _jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(BarChart, { data: progressData, margin: { top: 20, right: 30, left: 0, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#555" }), _jsx(XAxis, { dataKey: "name", stroke: "#fff", tick: { fontSize: 12 } }), _jsx(YAxis, { stroke: "#fff", domain: [0, 100] }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Bar, { dataKey: "progress", fill: "#a78bfa", name: "Progress %", radius: [4, 4, 0, 0] })] }) }) }), _jsx(ChartCard, { title: "Completion Status", children: _jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 90, label: true, children: pieData.map((_entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Legend, {})] }) }) })] })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [goals.length === 0 && (_jsxs("div", { className: "col-span-full flex flex-col items-center justify-center py-16 text-center", children: [_jsx(Flag, { size: 48, className: "text-purple-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-white mb-2", children: "No goals yet" }), _jsx("p", { className: "text-slate-400 mb-6", children: "Create your first goal to start tracking your progress!" }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "Create Goal"] })] })), goals.map((goal) => (_jsxs("div", { className: "group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: goal.title }), _jsx("button", { onClick: () => { if (window.confirm('Are you sure you want to delete this goal?'))
                                            removeGoal(goal.id); }, className: "p-1 text-slate-400 hover:text-red-400 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 18 }) }), goal.startDate && goal.endDate && (_jsxs("p", { className: "text-slate-400 text-sm", children: [goal.startDate, " \u2192 ", goal.endDate] }))] }), goal.description && (_jsx("p", { className: "text-slate-400 text-sm mb-2", children: goal.description })), _jsxs("div", { className: "flex items-center justify-between text-sm mb-2", children: [_jsxs("span", { children: ["Progress: ", goal.progress, "%"] }), _jsx("span", { children: goal.completed ? '✅ Completed' : '🕒 Ongoing' })] }), _jsx("div", { className: "w-full bg-slate-700 rounded-full h-2 mb-3", children: _jsx("div", { className: "h-2 bg-purple-500 rounded-full transition-all", style: { width: `${goal.progress}%` } }) }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx("button", { onClick: () => toggleComplete(goal.id, !goal.completed), className: `w-full py-2 rounded-2xl text-sm font-medium transition hover:scale-105 active:scale-95 ${goal.completed ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`, children: goal.completed ? 'Mark Incomplete' : 'Mark Complete' }), _jsx("button", { onClick: () => {
                                            const show = goal.showTracker;
                                            goal.showTracker = !show;
                                            updateGoal(goal.id, { showTracker: goal.showTracker });
                                        }, className: "w-full py-2 rounded-2xl bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: goal.showTracker ? 'Hide Tracker' : 'View Tracker' })] }), goal.showTracker && (_jsx(GoalSpreadsheet, { goal: goal, onCheckIn: handleCheckIn }))] }, goal.id)))] }), showForm && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full max-w-md", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Create New Goal" }), _jsx("input", { type: "text", placeholder: "Goal title", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("textarea", { placeholder: "Optional description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("input", { type: "date", placeholder: "Start date", value: formData.startDate || '', onChange: (e) => setFormData({ ...formData, startDate: e.target.value }), className: "w-full mb-2 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("input", { type: "date", placeholder: "End date", value: formData.endDate || '', onChange: (e) => setFormData({ ...formData, endDate: e.target.value }), className: "w-full mb-4 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setShowForm(false), className: "px-4 py-2 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Cancel" }), _jsx("button", { onClick: handleAddGoal, className: "px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-500 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Add Goal" })] })] }) }))] }));
}
