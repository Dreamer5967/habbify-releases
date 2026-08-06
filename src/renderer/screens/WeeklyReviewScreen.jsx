import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { ChevronLeft, CalendarDays, TrendingUp, DollarSign, Brain, Star, Save, History, Clock } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { useJournalStore } from '../store/journalStore';
import { useWeeklyReviewStore } from '../store/weeklyReviewStore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
export default function WeeklyReviewScreen({ onBack }) {
    var _a;
    const { currentProfile } = useProfileStore();
    const { habits } = useHabitStore();
    const { entries } = useFinanceStore();
    const { entries: journalEntries } = useJournalStore();
    const { reviews, addReview } = useWeeklyReviewStore();
    const [selectedReviewId, setSelectedReviewId] = useState('current');
    const [showHistory, setShowHistory] = useState(false);
    // Calculate dates for current week
    const today = getTrueDate();
    const sevenDaysAgo = getTrueDate();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const currentWeekStart = sevenDaysAgo.toISOString().split('T')[0];
    const currentWeekEnd = today.toISOString().split('T')[0];
    // --- Compute CURRENT Week Stats ---
    const currentStats = useMemo(() => {
        var _a;
        // 1. Habits
        const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
        // Count completions strictly in the last 7 days
        let recentCompletions = 0;
        activeHabits.forEach(habit => {
            recentCompletions += (habit.checkIns || []).filter(date => date >= currentWeekStart && date <= currentWeekEnd).length;
        });
        // 2. Finance
        const recentFinance = entries.filter(e => {
            const eDate = e.date.split('T')[0];
            return eDate >= currentWeekStart && eDate <= currentWeekEnd;
        });
        const recentExpenses = recentFinance.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const recentIncome = recentFinance.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        // 3. Journal Moods
        const recentJournals = journalEntries.filter(e => {
            const eDate = e.createdAt.split('T')[0];
            return eDate >= currentWeekStart && eDate <= currentWeekEnd;
        });
        const moodCounts = {};
        recentJournals.forEach(e => {
            moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        });
        const topMood = ((_a = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]) === null || _a === void 0 ? void 0 : _a[0]) || 'Neutral';
        // 4. XP Gained (Estimate 10 XP per completion)
        const xpGained = recentCompletions * 10;
        return {
            totalCompletions: recentCompletions,
            activeHabits: activeHabits.length,
            income: recentIncome,
            expenses: recentExpenses,
            topMood,
            xpGained
        };
    }, [habits, entries, journalEntries, currentWeekStart, currentWeekEnd]);
    // Get the stats to display (either current or historical)
    const displayStats = useMemo(() => {
        if (selectedReviewId === 'current') {
            return currentStats;
        }
        const historical = reviews.find(r => r.id === selectedReviewId);
        if (historical) {
            return {
                totalCompletions: historical.totalCompletions,
                activeHabits: historical.activeHabits,
                income: historical.income,
                expenses: historical.expenses,
                topMood: historical.topMood,
                xpGained: historical.xpGained
            };
        }
        return currentStats;
    }, [selectedReviewId, currentStats, reviews]);
    const handleSaveSnapshot = () => {
        if (!currentProfile)
            return;
        // Prevent saving if we already saved today (rough check)
        const alreadySaved = reviews.find(r => r.weekEndDate === currentWeekEnd);
        if (alreadySaved) {
            toast.error('You already saved a snapshot for this week!');
            return;
        }
        const newSnapshot = {
            id: uuidv4(),
            profileId: currentProfile.id,
            weekStartDate: currentWeekStart,
            weekEndDate: currentWeekEnd,
            totalCompletions: currentStats.totalCompletions,
            activeHabits: currentStats.activeHabits,
            income: currentStats.income,
            expenses: currentStats.expenses,
            topMood: currentStats.topMood,
            xpGained: currentStats.xpGained,
            createdAt: getTrueDate().toISOString()
        };
        addReview(newSnapshot);
        toast.success('Weekly snapshot saved to vault!');
    };
    // Formatting helpers
    const displayTitle = selectedReviewId === 'current'
        ? 'This Week\'s Performance'
        : `Week of ${(_a = reviews.find(r => r.id === selectedReviewId)) === null || _a === void 0 ? void 0 : _a.weekStartDate}`;
    const displaySubtitle = selectedReviewId === 'current'
        ? 'A fresh, dynamic look at your last 7 days.'
        : 'Viewing historical snapshot from the vault.';
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-slate-700/50", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [_jsx(CalendarDays, { className: "text-blue-400" }), "Weekly Review"] })] }), _jsxs("button", { onClick: () => setShowHistory(!showHistory), className: `flex items-center gap-2 px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 ${showHistory ? 'bg-purple-600 text-white' : 'bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-700'}`, children: [_jsx(History, { size: 20 }), "History Vault"] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("div", { className: "flex-1 overflow-auto p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6 animate-fade-in", children: [_jsx("div", { className: `p-8 rounded-2xl shadow-lg text-white transition-all ${selectedReviewId === 'current' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-700/50'}`, children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-2", children: displayTitle }), _jsx("p", { className: "text-slate-300 text-lg", children: displaySubtitle })] }), selectedReviewId === 'current' && (_jsxs("button", { onClick: handleSaveSnapshot, className: "flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Save, { size: 20 }), "Save Snapshot"] }))] }) }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 transition-transform", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-3 bg-blue-500/20 rounded-2xl", children: _jsx(TrendingUp, { className: "text-blue-400", size: 24 }) }), _jsx("h3", { className: "text-xl font-semibold text-white", children: "Habit Consistency" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center border-b border-slate-700/50 pb-2", children: [_jsx("span", { className: "text-slate-400", children: "Weekly Completions" }), _jsx("span", { className: "text-2xl font-bold text-white", children: displayStats.totalCompletions })] }), _jsxs("div", { className: "flex justify-between items-center border-b border-slate-700/50 pb-2", children: [_jsx("span", { className: "text-slate-400", children: "Active Habits" }), _jsx("span", { className: "text-2xl font-bold text-white", children: displayStats.activeHabits })] })] })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 transition-transform", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-3 bg-emerald-500/20 rounded-2xl", children: _jsx(DollarSign, { className: "text-emerald-400", size: 24 }) }), _jsx("h3", { className: "text-xl font-semibold text-white", children: "Financial Flow" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center border-b border-slate-700/50 pb-2", children: [_jsx("span", { className: "text-slate-400", children: "Income" }), _jsxs("span", { className: "text-2xl font-bold text-emerald-400", children: ["+$", displayStats.income.toFixed(2)] })] }), _jsxs("div", { className: "flex justify-between items-center border-b border-slate-700/50 pb-2", children: [_jsx("span", { className: "text-slate-400", children: "Expenses" }), _jsxs("span", { className: "text-2xl font-bold text-red-400", children: ["-$", displayStats.expenses.toFixed(2)] })] }), _jsxs("div", { className: "flex justify-between items-center border-b border-slate-700/50 pb-2", children: [_jsx("span", { className: "text-slate-400", children: "Net Balance" }), _jsxs("span", { className: `text-2xl font-bold ${displayStats.income - displayStats.expenses >= 0 ? 'text-green-400' : 'text-red-400'}`, children: ["$", (displayStats.income - displayStats.expenses).toFixed(2)] })] })] })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 transition-transform", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-3 bg-purple-500/20 rounded-2xl", children: _jsx(Brain, { className: "text-purple-400", size: 24 }) }), _jsx("h3", { className: "text-xl font-semibold text-white", children: "Mental State" })] }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "flex justify-between items-center border-b border-slate-700/50 pb-2", children: [_jsx("span", { className: "text-slate-400", children: "Dominant Mood" }), _jsx("span", { className: "text-2xl font-bold text-white capitalize", children: displayStats.topMood })] }) })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 transition-transform", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-3 bg-yellow-500/20 rounded-2xl", children: _jsx(Star, { className: "text-yellow-400", size: 24 }) }), _jsx("h3", { className: "text-xl font-semibold text-white", children: "XP Gained" })] }), _jsxs("div", { className: "flex flex-col items-center justify-center py-6", children: [_jsxs("div", { className: "text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2", children: ["+", displayStats.xpGained] }), _jsx("div", { className: "text-slate-400", children: "Estimated XP" })] })] })] })] }) }), showHistory && (_jsxs("div", { className: "w-80 border-l border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in", children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4 flex items-center gap-2", children: [_jsx(Clock, { className: "text-purple-400", size: 20 }), "Vault"] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("button", { onClick: () => setSelectedReviewId('current'), className: `w-full text-left p-3 rounded-2xl border transition hover:scale-105 active:scale-95 ${selectedReviewId === 'current' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800/50 backdrop-blur-sm border-slate-700/50 text-slate-300 hover:bg-slate-700'}`, children: [_jsx("div", { className: "font-semibold", children: "Current Week" }), _jsx("div", { className: "text-xs opacity-70", children: "Live Data" })] }), reviews.length === 0 && (_jsx("div", { className: "p-4 text-center text-slate-500 text-sm italic", children: "No snapshots saved yet. Save this week's progress to start building your history!" })), [...reviews].reverse().map(review => (_jsxs("button", { onClick: () => setSelectedReviewId(review.id), className: `w-full text-left p-3 rounded-2xl border transition hover:scale-105 active:scale-95 ${selectedReviewId === review.id ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-800/50 backdrop-blur-sm border-slate-700/50 text-slate-300 hover:bg-slate-700'}`, children: [_jsx("div", { className: "font-semibold", children: review.weekStartDate }), _jsxs("div", { className: "text-xs opacity-70", children: ["to ", review.weekEndDate] })] }, review.id)))] })] }))] })] }));
}
