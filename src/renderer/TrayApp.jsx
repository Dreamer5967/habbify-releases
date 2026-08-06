import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Check, Target } from 'lucide-react';
import { useHabitStore } from './store/habitStore';
import { useProfileStore } from './store/profileStore';
export default function TrayApp() {
    const { habits, loadHabits, toggleHabit } = useHabitStore();
    const { currentProfile } = useProfileStore();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        var _a, _b, _c;
        // Hide body scrollbar in tray mode
        document.body.style.overflow = 'hidden';
        document.body.style.background = 'transparent';
        if (currentProfile) {
            loadHabits(currentProfile.id).finally(() => setLoading(false));
        }
        else {
            setLoading(false);
        }
        // Optional: listen to IPC events to sync from main window if needed
        const handleSync = (_, syncedHabits) => {
            // For now we rely on Zustand store, but this is a hook for future IPC
        };
        (_c = (_b = (_a = window.electron) === null || _a === void 0 ? void 0 : _a.ipcRenderer) === null || _b === void 0 ? void 0 : _b.on) === null || _c === void 0 ? void 0 : _c.call(_b, 'sync-habits', handleSync);
        return () => {
            var _a, _b, _c;
            (_c = (_b = (_a = window.electron) === null || _a === void 0 ? void 0 : _a.ipcRenderer) === null || _b === void 0 ? void 0 : _b.removeListener) === null || _c === void 0 ? void 0 : _c.call(_b, 'sync-habits', handleSync);
        };
    }, [currentProfile, loadHabits]);
    if (loading) {
        return (_jsx("div", { className: "w-full h-screen bg-slate-900 backdrop-blur-md text-white flex items-center justify-center rounded-2xl border border-slate-700/50", children: "Loading..." }));
    }
    const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
    const completedCount = activeHabits.filter(h => h.completed).length;
    return (_jsxs("div", { className: "w-full h-screen bg-slate-900 backdrop-blur-md text-white flex flex-col rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl", children: [_jsxs("div", { className: "p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50 backdrop-blur-sm", children: [_jsxs("h2", { className: "font-semibold text-lg flex items-center gap-2", children: [_jsx(Target, { size: 18, className: "text-purple-400" }), "Today's Habits"] }), _jsxs("span", { className: "text-sm text-slate-400 font-medium", children: [completedCount, " / ", activeHabits.length] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar", children: activeHabits.length === 0 ? (_jsx("div", { className: "text-center text-slate-400 py-8 text-sm", children: "No active habits today!" })) : (activeHabits.map(habit => (_jsxs("div", { onClick: () => toggleHabit(habit.id, !habit.completed), className: `p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${habit.completed
                        ? 'bg-green-500/10 border-green-500/30 border'
                        : 'bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700 border-transparent border'}`, children: [_jsx("span", { className: `font-medium ${habit.completed ? 'text-green-400 line-through opacity-70' : 'text-slate-200'}`, children: habit.name }), habit.completed ? (_jsx("div", { className: "w-6 h-6 rounded-full bg-green-500 flex items-center justify-center", children: _jsx(Check, { size: 14, className: "text-white" }) })) : (_jsx("div", { className: "w-6 h-6 rounded-full border-2 border-slate-700/50 flex items-center justify-center" }))] }, habit.id)))) }), _jsx("div", { className: "h-1.5 w-full bg-slate-800/50 backdrop-blur-sm", children: _jsx("div", { className: "h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500", style: { width: `${activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0}%` } }) })] }));
}
