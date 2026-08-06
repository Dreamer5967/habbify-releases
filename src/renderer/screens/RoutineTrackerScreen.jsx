import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Repeat, Plus, X, TrendingUp, Target, Trophy, BarChart3 } from 'lucide-react';
import { useRoutineStore } from '../store/routineStore';
import { useProfileStore } from '../store/profileStore';
import ChartCard from '../components/ChartCard';
export default function RoutineTrackerScreen({ onBack }) {
    const { routines, addRoutine, updateRoutine, removeRoutine, loadRoutines } = useRoutineStore();
    const { currentProfile } = useProfileStore();
    const [showForm, setShowForm] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', frequency: 'daily' });
    // Load routines for the current profile
    useEffect(() => {
        if (currentProfile) {
            loadRoutines(currentProfile.id);
        }
    }, [currentProfile, loadRoutines]);
    // ── Statistics ──
    const totalRoutines = routines.length;
    const activeRoutines = routines.filter((r) => r.streak > 0).length;
    const avgStreak = totalRoutines > 0 ? Math.round(routines.reduce((sum, r) => sum + r.streak, 0) / totalRoutines) : 0;
    const bestStreak = routines.length > 0 ? Math.max(...routines.map((r) => r.streak)) : 0;
    const streakData = routines
        .filter(r => r.lastCompleted)
        .map(r => ({
        name: r.title.length > 12 ? r.title.slice(0, 12) + '…' : r.title,
        streak: r.streak,
    }));
    const routinesPerDay = routines
        .filter(r => r.lastCompleted)
        .reduce((acc, r) => {
        try {
            const day = format(new Date(r.lastCompleted), 'MM-dd');
            const existing = acc.find(d => d.day === day);
            if (existing)
                existing.count += 1;
            else
                acc.push({ day, count: 1 });
        }
        catch (_a) {
            // Skip entries with invalid dates
        }
        return acc;
    }, []);
    const handleAddRoutine = () => {
        if (!formData.title.trim())
            return;
        const now = getTrueDate().toISOString();
        const newRoutine = {
            id: crypto.randomUUID(),
            profileId: (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.id) || '',
            title: formData.title,
            description: formData.description || undefined,
            frequency: formData.frequency,
            lastCompletedDate: undefined,
            streak: 0,
            createdAt: now,
            updatedAt: now,
        };
        addRoutine(newRoutine);
        setFormData({ title: '', description: '', frequency: 'daily' });
        setShowForm(false);
    };
    const toggleComplete = (routineId, completed) => {
        var _a;
        const today = getTrueTodayString();
        const updates = !completed
            ? { lastCompletedDate: today, streak: (((_a = routines.find(r => r.id === routineId)) === null || _a === void 0 ? void 0 : _a.streak) || 0) + 1 }
            : { lastCompletedDate: undefined, streak: 0 };
        updateRoutine(routineId, updates);
        if (!completed) {
            useProfileStore.getState().addXP(50);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6", children: [_jsxs("header", { className: "flex items-center gap-4 mb-6", children: [_jsx("button", { onClick: onBack, className: "p-2 rounded-2xl hover:bg-slate-700 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 24, className: "text-slate-300" }) }), _jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [_jsx(Repeat, { size: 24, className: "text-blue-400" }), "Routine Tracker"] }), _jsxs("button", { onClick: () => setShowStats(!showStats), className: `ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 ${showStats ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`, children: [_jsx(BarChart3, { size: 20 }), showStats ? 'Hide Stats' : 'Show Stats'] }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "New Routine"] })] }), showStats && (_jsxs("div", { className: "mb-8 space-y-4 animate-fade-in", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsx(ChartCard, { title: "Total Routines", value: totalRoutines, icon: Repeat, color: "bg-blue-500" }), _jsx(ChartCard, { title: "Average Streak", value: avgStreak, icon: TrendingUp, color: "bg-purple-500" }), _jsx(ChartCard, { title: "Active Routines", value: activeRoutines, icon: Target, color: "bg-green-500" }), _jsx(ChartCard, { title: "Best Streak", value: bestStreak, icon: Trophy, color: "bg-yellow-500" })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(ChartCard, { title: "Streak per Routine", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: streakData, margin: { top: 20, right: 30, left: 0, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#555" }), _jsx(XAxis, { dataKey: "name", stroke: "#ffffff", tick: { fontSize: 12 } }), _jsx(YAxis, { stroke: "#ffffff" }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Bar, { dataKey: "streak", fill: "#a78bfa", name: "Streak", radius: [4, 4, 0, 0] })] }) }) }), _jsx(ChartCard, { title: "Routines Completed per Day", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: routinesPerDay, margin: { top: 20, right: 30, left: 0, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#555" }), _jsx(XAxis, { dataKey: "day", stroke: "#ffffff" }), _jsx(YAxis, { stroke: "#ffffff" }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "count", fill: "#38bdf8", name: "Count", radius: [4, 4, 0, 0] })] }) }) })] })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [routines.length === 0 && (_jsx("div", { className: "col-span-full flex flex-col items-center justify-center py-20 text-center", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 max-w-sm", children: [_jsx(Repeat, { size: 48, className: "text-blue-400 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-white mb-2", children: "No routines yet" }), _jsx("p", { className: "text-slate-400 text-sm mb-6", children: "Create your first routine and build a streak!" }), _jsxs("button", { onClick: () => setShowForm(true), className: "inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl transition hover:scale-105 active:scale-95 font-medium", children: [_jsx(Plus, { size: 18 }), "Create Routine"] })] }) })), routines.map((routine) => (_jsxs("div", { className: "group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: routine.title }), _jsx("button", { onClick: () => { if (window.confirm('Delete this routine?'))
                                            removeRoutine(routine.id); }, className: "p-1 text-slate-400 hover:text-red-400 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 18 }) })] }), routine.description && (_jsx("p", { className: "text-slate-400 text-sm mb-2", children: routine.description })), _jsxs("div", { className: "flex items-center justify-between text-sm mb-2", children: [_jsxs("span", { children: ["Frequency: ", routine.frequency] }), _jsxs("span", { children: ["Streak: ", routine.streak] })] }), _jsx("button", { onClick: () => toggleComplete(routine.id, !!routine.lastCompletedDate), className: `w-full py-2 rounded-2xl text-sm font-medium transition hover:scale-105 active:scale-95 ${routine.lastCompletedDate ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`, children: routine.lastCompletedDate ? 'Mark Incomplete' : 'Mark Complete Today' })] }, routine.id)))] }), showForm && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full max-w-md", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Create New Routine" }), _jsx("input", { type: "text", placeholder: "Routine title", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("textarea", { placeholder: "Optional description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsxs("select", { value: formData.frequency, onChange: (e) => setFormData({ ...formData, frequency: e.target.value }), className: "w-full mb-4 px-3 py-2 rounded bg-slate-700 text-white", children: [_jsx("option", { value: "daily", children: "Daily" }), _jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "custom", children: "Custom" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setShowForm(false), className: "px-4 py-2 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Cancel" }), _jsx("button", { onClick: handleAddRoutine, className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Add Routine" })] })] }) }))] }));
}
