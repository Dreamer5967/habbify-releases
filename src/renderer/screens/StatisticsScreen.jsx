import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { TrendingUp, TrendingDown, Zap, Target, Flame, PieChart as PieChartIcon, Calendar, Repeat, BookOpen, BarChart3 } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { useRoutineStore } from '../store/routineStore';
import { useGoalStore } from '../store/goalStore';
import { useFinanceStore } from '../store/financeStore';
import { useJournalStore } from '../store/journalStore';
import { useSettingsStore } from '../store/settingsStore';
import HeatmapGrid from '../components/HeatmapGrid';
export default function StatisticsScreen() {
    const { habits } = useHabitStore();
    const { currentProfile } = useProfileStore();
    const { routines } = useRoutineStore();
    const { goals } = useGoalStore();
    const { entries: financeEntries } = useFinanceStore();
    const { entries: journalEntries } = useJournalStore();
    const { settings } = useSettingsStore();
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [statsTab, setStatsTab] = useState('weekly');
    const [visibleElements, setVisibleElements] = useState(new Set());
    const currency = (settings === null || settings === void 0 ? void 0 : settings.currencySymbol) || '$';
    // Get the current week boundaries based on weekStartsOn setting
    const weekBounds = useMemo(() => {
        const today = getTrueDate();
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
        const startDay = (settings === null || settings === void 0 ? void 0 : settings.weekStartsOn) === 'sunday' ? 0 : 1;
        const diff = (dayOfWeek - startDay + 7) % 7;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd, startStr: weekStart.toISOString().split('T')[0], endStr: weekEnd.toISOString().split('T')[0] };
    }, [settings === null || settings === void 0 ? void 0 : settings.weekStartsOn]);
    const isInCurrentWeek = (dateStr) => {
        return dateStr >= weekBounds.startStr && dateStr <= weekBounds.endStr;
    };
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setVisibleElements((prev) => new Set(prev).add(entry.target.id));
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('[data-animate]').forEach((el) => {
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);
    const habitTrends = useMemo(() => {
        const trends = habits.filter(h => !h.isArchived).map((habit) => {
            const completionRate = habit.totalCompletions > 0
                ? Math.round((habit.totalCompletions / (habit.totalCompletions + 10)) * 100)
                : 0;
            let trend = 'stable';
            if (habit.currentStreak > habit.longestStreak * 0.8) {
                trend = 'up';
            }
            else if (habit.currentStreak < habit.longestStreak * 0.5) {
                trend = 'down';
            }
            return {
                habitId: habit.id,
                habitName: habit.name,
                icon: habit.icon,
                color: habit.color,
                currentStreak: habit.currentStreak,
                longestStreak: habit.longestStreak,
                totalCompletions: habit.totalCompletions,
                completionRate,
                trend,
            };
        });
        return trends.sort((a, b) => b.currentStreak - a.currentStreak);
    }, [habits]);
    const archivedHabitTrends = useMemo(() => {
        const trends = habits.filter(h => h.isArchived).map((habit) => {
            const completionRate = habit.totalCompletions > 0
                ? Math.round((habit.totalCompletions / (habit.totalCompletions + 10)) * 100)
                : 0;
            return {
                habitId: habit.id,
                habitName: habit.name,
                icon: habit.icon,
                color: habit.color,
                currentStreak: habit.currentStreak,
                longestStreak: habit.longestStreak,
                totalCompletions: habit.totalCompletions,
                completionRate,
                trend: 'stable',
            };
        });
        return trends.sort((a, b) => b.totalCompletions - a.totalCompletions);
    }, [habits]);
    const dailyStats = useMemo(() => {
        const stats = [];
        const today = getTrueDate();
        let daysToShow = 7;
        if (selectedPeriod === 'month')
            daysToShow = 30;
        if (selectedPeriod === 'all')
            daysToShow = 90;
        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            let completed = 0;
            habits.forEach((habit) => {
                if (habit.lastCompletedDate === dateStr) {
                    completed++;
                }
            });
            stats.push({
                date: dateStr,
                completed,
                total: habits.length,
                percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
            });
        }
        return stats;
    }, [habits, selectedPeriod]);
    const categoryStats = useMemo(() => {
        const categoryColors = {
            'Health': '#10b981',
            'Fitness': '#f97316',
            'Learning': '#3b82f6',
            'Productivity': '#8b5cf6',
            'Mindfulness': '#06b6d4',
            'Other': '#64748b',
        };
        const categories = {};
        habits.forEach((habit) => {
            if (!categories[habit.category]) {
                categories[habit.category] = { count: 0, completed: 0 };
            }
            categories[habit.category].count++;
            if (habit.currentStreak > 0) {
                categories[habit.category].completed++;
            }
        });
        return Object.entries(categories).map(([category, data]) => ({
            category,
            count: data.count,
            completionRate: data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0,
            color: categoryColors[category] || '#64748b',
        }));
    }, [habits]);
    const difficultyStats = useMemo(() => {
        const difficulties = {
            easy: { count: 0, completed: 0 },
            medium: { count: 0, completed: 0 },
            hard: { count: 0, completed: 0 },
        };
        const difficultyColors = {
            easy: '#22c55e',
            medium: '#eab308',
            hard: '#ef4444',
        };
        habits.forEach((habit) => {
            difficulties[habit.difficulty].count++;
            if (habit.currentStreak > 0) {
                difficulties[habit.difficulty].completed++;
            }
        });
        return Object.entries(difficulties).map(([difficulty, data]) => ({
            difficulty,
            count: data.count,
            completionRate: data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0,
            color: difficultyColors[difficulty],
        }));
    }, [habits]);
    const featureStats = useMemo(() => {
        let habitCompletions = 0;
        if (statsTab === 'weekly') {
            habits.forEach(h => {
                if (h.completionHistory) {
                    h.completionHistory.forEach(date => {
                        if (isInCurrentWeek(date))
                            habitCompletions++;
                    });
                }
                else if (h.lastCompletedDate && isInCurrentWeek(h.lastCompletedDate)) {
                    habitCompletions++;
                }
            });
        }
        else {
            habitCompletions = habitTrends.reduce((sum, h) => sum + h.totalCompletions, 0);
        }
        const avgStreak = habitTrends.length > 0
            ? Math.round(habitTrends.reduce((sum, h) => sum + h.currentStreak, 0) / habitTrends.length)
            : 0;
        const bestStreak = Math.max(0, ...habitTrends.map((h) => h.longestStreak));
        const avgCompletion = habitTrends.length > 0
            ? Math.round(habitTrends.reduce((sum, h) => sum + h.completionRate, 0) / habitTrends.length)
            : 0;
        const totalRoutines = routines.length;
        const activeRoutines = routines.filter(r => r.streak > 0).length;
        const totalRoutineStreak = routines.reduce((sum, r) => sum + r.streak, 0);
        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.completed).length;
        const avgGoalProgress = totalGoals > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals) : 0;
        const relevantFinance = statsTab === 'weekly'
            ? financeEntries.filter(e => isInCurrentWeek(e.date))
            : financeEntries;
        const totalIncome = relevantFinance.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = relevantFinance.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const netBalance = totalIncome - totalExpenses;
        const relevantJournal = statsTab === 'weekly'
            ? journalEntries.filter(e => isInCurrentWeek(e.date))
            : journalEntries;
        const journalCount = relevantJournal.length;
        const moodCounts = { excellent: 0, good: 0, okay: 0, bad: 0, terrible: 0 };
        relevantJournal.forEach(e => {
            if (moodCounts[e.mood] !== undefined)
                moodCounts[e.mood]++;
        });
        return {
            habitCompletions,
            avgStreak,
            bestStreak,
            avgCompletion,
            totalRoutines,
            activeRoutines,
            totalRoutineStreak,
            totalGoals,
            completedGoals,
            avgGoalProgress,
            totalIncome,
            totalExpenses,
            netBalance,
            journalCount,
            moodCounts
        };
    }, [statsTab, habits, habitTrends, routines, goals, financeEntries, journalEntries, weekBounds]);
    const stats = featureStats;
    const heatmapData = useMemo(() => {
        const data = {};
        habits.forEach(h => {
            // Assuming completionHistory is an array of dates 'YYYY-MM-DD'
            if (h.completionHistory) {
                h.completionHistory.forEach(date => {
                    data[date] = (data[date] || 0) + 1;
                });
            }
        });
        return data;
    }, [habits]);
    const LineChart = () => {
        if (dailyStats.length === 0) {
            return _jsx("div", { className: "w-full h-80 flex items-center justify-center text-slate-400", children: _jsx("p", { children: "No data" }) });
        }
        const maxPercentage = 100;
        const chartHeight = 200;
        const points = dailyStats.map((stat, index) => {
            const x = (index / Math.max(1, dailyStats.length - 1)) * 400;
            const y = chartHeight - (stat.percentage / maxPercentage) * chartHeight;
            return { x, y, ...stat };
        });
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (_jsxs("svg", { width: "100%", height: "280", viewBox: "0 0 450 280", className: "drop-shadow-xl", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "chartGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: "#3b82f6", stopOpacity: "0.5" }), _jsx("stop", { offset: "100%", stopColor: "#3b82f6", stopOpacity: "0.05" })] }) }), _jsx("path", { d: `${pathData} L ${points[points.length - 1].x} 200 L 40 200 Z`, fill: "url(#chartGradient)" }), _jsx("path", { d: pathData, stroke: "#3b82f6", strokeWidth: "3", fill: "none", strokeLinecap: "round" }), points.map((p, i) => (_jsx("circle", { cx: p.x, cy: p.y, r: "4", fill: "#3b82f6", stroke: "#1e293b", strokeWidth: "2" }, i))), _jsx("line", { x1: "40", y1: "200", x2: "450", y2: "200", stroke: "#475569", strokeWidth: "2" })] }));
    };
    const PieChart = ({ data, chartId }) => {
        if (data.length === 0 || data.every((d) => d.count === 0)) {
            return _jsx("div", { className: "h-80 flex items-center justify-center text-slate-400", children: _jsx("p", { children: "No data" }) });
        }
        const total = data.reduce((sum, d) => sum + d.count, 0);
        const circumference = 2 * Math.PI * 80;
        let currentOffset = 0;
        return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("svg", { width: "300", height: "300", viewBox: "0 0 300 300", className: "drop-shadow-xl", children: [_jsx("defs", { children: data.map((item) => (_jsxs("linearGradient", { id: `pie-gradient-${item.category || item.difficulty}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: item.color, stopOpacity: "1" }), _jsx("stop", { offset: "100%", stopColor: item.color, stopOpacity: "0.6" })] }, `grad-${item.category || item.difficulty}`))) }), data.map((item, index) => {
                            const percentage = (item.count / total) * 100;
                            const sliceLength = (percentage / 100) * circumference;
                            const offset = currentOffset;
                            currentOffset += sliceLength;
                            return (_jsx("circle", { cx: "150", cy: "150", r: "80", fill: "none", stroke: `url(#pie-gradient-${item.category || item.difficulty})`, strokeWidth: "50", strokeDasharray: sliceLength, strokeDashoffset: -offset, strokeLinecap: "round", transform: "rotate(-90 150 150)" }, item.category || item.difficulty));
                        }), _jsx("circle", { cx: "150", cy: "150", r: "40", fill: "#1e293b" }), _jsx("text", { x: "150", y: "155", textAnchor: "middle", fontSize: "28", fontWeight: "bold", fill: "#3b82f6", children: total })] }), _jsx("div", { className: "mt-6 w-full space-y-2", children: data.map((item) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.color } }), _jsx("span", { className: "text-slate-300 capitalize", children: item.category || item.difficulty })] }), _jsx("span", { className: "text-slate-400 font-semibold", children: item.count })] }, item.category || item.difficulty))) })] }));
    };
    const DonutChart = ({ data }) => {
        if (data.length === 0)
            return _jsx("div", { className: "h-80 flex items-center justify-center text-slate-400", children: _jsx("p", { children: "No data" }) });
        const circumference = 2 * Math.PI * 70;
        let currentOffset = 0;
        return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("svg", { width: "300", height: "300", viewBox: "0 0 300 300", className: "drop-shadow-xl", children: [_jsx("defs", { children: data.map((item) => (_jsxs("linearGradient", { id: `donut-gradient-${item.category}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: item.color, stopOpacity: "1" }), _jsx("stop", { offset: "100%", stopColor: item.color, stopOpacity: "0.6" })] }, `donut-grad-${item.category}`))) }), data.map((item) => {
                            const sliceLength = (item.completionRate / 100) * circumference;
                            const offset = currentOffset;
                            currentOffset += sliceLength;
                            return (_jsx("circle", { cx: "150", cy: "150", r: "70", fill: "none", stroke: `url(#donut-gradient-${item.category})`, strokeWidth: "40", strokeDasharray: sliceLength, strokeDashoffset: -offset, strokeLinecap: "round", transform: "rotate(-90 150 150)" }, item.category));
                        }), _jsx("circle", { cx: "150", cy: "150", r: "35", fill: "#1e293b" }), _jsxs("text", { x: "150", y: "155", textAnchor: "middle", fontSize: "24", fontWeight: "bold", fill: "#10b981", children: [Math.round(data.reduce((sum, d) => sum + d.completionRate, 0) / data.length), "%"] })] }), _jsx("div", { className: "mt-6 w-full space-y-2", children: data.map((item) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.color } }), _jsx("span", { className: "text-slate-300 capitalize", children: item.category })] }), _jsxs("span", { className: "text-slate-400 font-semibold", children: [item.completionRate, "%"] })] }, item.category))) })] }));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", children: [_jsx("header", { className: "bg-slate-800/50 border-b border-slate-700/50 sticky top-0 z-10", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Statistics & Insights" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Comprehensive analytics across habits, routines, goals, finance & journal" })] }), _jsxs("div", { className: "flex bg-slate-900/60 p-1 rounded-2xl border border-slate-700/50 self-start sm:self-auto", children: [_jsxs("button", { onClick: () => setStatsTab('weekly'), className: `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${statsTab === 'weekly'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-slate-400 hover:text-white'}`, children: [_jsx(Calendar, { size: 16 }), "This Week"] }), _jsxs("button", { onClick: () => setStatsTab('overall'), className: `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${statsTab === 'overall'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-slate-400 hover:text-white'}`, children: [_jsx(BarChart3, { size: 16 }), "Overall Progress"] })] })] }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-6 py-8", children: [statsTab === 'weekly' && (_jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-blue-300", children: [_jsxs("span", { children: ["Showing stats for the current week (", weekBounds.startStr, " to ", weekBounds.endStr, ")"] }), _jsxs("span", { className: "font-semibold capitalize", children: ["Week starts: ", (settings === null || settings === void 0 ? void 0 : settings.weekStartsOn) || 'monday'] })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8", children: [_jsxs("div", { className: "bg-slate-800/50 border border-yellow-500/30 rounded-2xl p-5 hover:shadow-xl transition-all", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wider", children: "Habit Completions" }), _jsx(Zap, { size: 18, className: "text-yellow-400" })] }), _jsx("p", { className: "text-3xl font-bold text-white", children: featureStats.habitCompletions }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: statsTab === 'weekly' ? 'Completed this week' : 'All-time total' })] }), _jsxs("div", { className: "bg-slate-800/50 border border-purple-500/30 rounded-2xl p-5 hover:shadow-xl transition-all", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wider", children: "Active Routines" }), _jsx(Repeat, { size: 18, className: "text-purple-400" })] }), _jsxs("p", { className: "text-3xl font-bold text-white", children: [featureStats.activeRoutines, " / ", featureStats.totalRoutines] }), _jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [featureStats.totalRoutineStreak, " total streak days"] })] }), _jsxs("div", { className: "bg-slate-800/50 border border-blue-500/30 rounded-2xl p-5 hover:shadow-xl transition-all", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wider", children: "Goal Progress" }), _jsx(Target, { size: 18, className: "text-blue-400" })] }), _jsxs("p", { className: "text-3xl font-bold text-white", children: [featureStats.avgGoalProgress, "%"] }), _jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [featureStats.completedGoals, " of ", featureStats.totalGoals, " goals finished"] })] }), _jsxs("div", { className: "bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-5 hover:shadow-xl transition-all", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wider", children: "Net Balance" }), _jsx("span", { className: "text-emerald-400 font-bold text-sm", children: currency })] }), _jsxs("p", { className: "text-3xl font-bold text-white", children: [currency, featureStats.netBalance.toLocaleString()] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: statsTab === 'weekly' ? 'This week\'s cashflow' : 'Total tracked balance' })] }), _jsxs("div", { className: "bg-slate-800/50 border border-pink-500/30 rounded-2xl p-5 hover:shadow-xl transition-all", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-semibold uppercase tracking-wider", children: "Journal Entries" }), _jsx(BookOpen, { size: 18, className: "text-pink-400" })] }), _jsx("p", { className: "text-3xl font-bold text-white", children: featureStats.journalCount }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: statsTab === 'weekly' ? 'Logged this week' : 'Total memories written' })] })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30 mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4 flex items-center gap-2", children: [_jsx(Flame, { size: 20, className: "text-green-400" }), "Activity Heatmap"] }), _jsx("p", { className: "text-slate-400 text-sm mb-4", children: "Your daily habit completions over the past year" }), _jsx(HeatmapGrid, { data: heatmapData })] }), _jsxs("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Completion Trend" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Daily completion percentage" })] }), _jsx("div", { className: "flex gap-2", children: ['week', 'month', 'all'].map((period) => (_jsx("button", { onClick: () => setSelectedPeriod(period), className: `px-4 py-2 rounded-2xl text-sm font-medium transition hover:scale-105 active:scale-95 ${selectedPeriod === period ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`, children: period === 'week' ? '7D' : period === 'month' ? '30D' : '90D' }, period))) })] }), _jsx(LineChart, {})] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8", children: [_jsxs("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8", children: [_jsxs("h2", { className: "text-xl font-bold text-white mb-6 flex items-center gap-2", children: [_jsx(PieChartIcon, { size: 20, className: "text-blue-400" }), "Category Distribution"] }), _jsx(PieChart, { data: categoryStats, chartId: "category-pie" })] }), _jsxs("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8", children: [_jsxs("h2", { className: "text-xl font-bold text-white mb-6 flex items-center gap-2", children: [_jsx(Flame, { size: 20, className: "text-orange-400" }), "Difficulty Distribution"] }), _jsx(PieChart, { data: difficultyStats, chartId: "difficulty-pie" })] }), _jsxs("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8", children: [_jsxs("h2", { className: "text-xl font-bold text-white mb-6 flex items-center gap-2", children: [_jsx(Target, { size: 20, className: "text-green-400" }), "Completion Rate"] }), _jsx(DonutChart, { data: categoryStats })] })] }), _jsxs("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Habit Performance" }), _jsx("div", { className: "space-y-4", children: habitTrends.length === 0 ? (_jsx("p", { className: "text-slate-400 text-center py-12", children: "No habits to display yet. Keep going!" })) : (habitTrends.map((habit, index) => (_jsxs("div", { className: "group relative overflow-hidden bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1", children: [_jsx("div", { className: "absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none", style: { backgroundColor: habit.color } }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/5 shrink-0", style: { backgroundColor: `${habit.color}20` }, children: habit.icon }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xs font-bold px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300", children: ["#", index + 1] }), _jsx("h3", { className: "text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300", children: habit.habitName })] }), _jsxs("p", { className: "text-slate-400 text-sm mt-1", children: [habit.currentStreak, " day streak ", _jsx("span", { className: "mx-2 opacity-50", children: "\u2022" }), " ", habit.totalCompletions, " total completions"] })] })] }), _jsx("div", { className: "flex items-center gap-2 self-start md:self-auto bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700/50", children: habit.trend === 'up' ? (_jsxs(_Fragment, { children: [_jsx(TrendingUp, { size: 16, className: "text-emerald-400" }), _jsx("span", { className: "text-emerald-400 text-sm font-medium", children: "On Track" })] })) : habit.trend === 'down' ? (_jsxs(_Fragment, { children: [_jsx(TrendingDown, { size: 16, className: "text-rose-400" }), _jsx("span", { className: "text-rose-400 text-sm font-medium", children: "Slipping" })] })) : (_jsx("span", { className: "text-slate-400 text-sm font-medium px-2", children: "Stable" })) })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex justify-between text-sm font-medium mb-2", children: [_jsx("span", { className: "text-slate-400", children: "Completion Rate" }), _jsxs("span", { style: { color: habit.color }, children: [habit.completionRate, "%"] })] }), _jsx("div", { className: "w-full bg-slate-900/80 rounded-full h-3 shadow-inner border border-slate-700/30 overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-1000 ease-out", style: {
                                                                     width: `${habit.completionRate}%`,
                                                                     backgroundColor: habit.color,
                                                                 } }) })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
                                                        { label: 'Current', value: habit.currentStreak, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                                        { label: 'Best', value: habit.longestStreak, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                                                        { label: 'Total', value: habit.totalCompletions, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                                        { label: 'Win Rate', value: `${habit.completionRate}%`, color: 'text-amber-400', bg: 'bg-amber-400/10' }
                                                    ].map((stat, i) => (_jsxs("div", { className: "bg-slate-900/40 border border-slate-700/30 rounded-2xl p-3 flex flex-col items-center justify-center group-hover:bg-slate-800/60 transition-colors", children: [_jsx("span", { className: "text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider", children: stat.label }), _jsx("span", { className: `text-xl font-bold ${stat.color} drop-shadow-sm`, children: stat.value })] }, i))) })] })] }, habit.habitId)))) })] }), archivedHabitTrends.length > 0 && (_jsxs("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 mt-8", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-6 opacity-75", children: "Archived Habits (Hall of Fame)" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: archivedHabitTrends.map((habit) => (_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/30 rounded-2xl p-5 flex flex-col opacity-80 hover:opacity-100 transition-opacity", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/5 shrink-0", style: { backgroundColor: `${habit.color}15`, color: habit.color }, children: habit.icon }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-bold text-white line-through decoration-slate-600 decoration-2", children: habit.habitName }), _jsx("p", { className: "text-slate-400 text-xs", children: "Archived" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mt-auto", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2 text-center", children: [_jsx("span", { className: "text-[10px] text-slate-400 uppercase tracking-wider block", children: "Best Streak" }), _jsx("span", { className: "text-sm font-bold text-purple-400", children: habit.longestStreak })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-lg p-2 text-center", children: [_jsx("span", { className: "text-[10px] text-slate-400 uppercase tracking-wider block", children: "Completions" }), _jsx("span", { className: "text-sm font-bold text-blue-400", children: habit.totalCompletions })] })] })] }, habit.habitId))) })] }))] })] }));
}

